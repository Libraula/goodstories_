import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { isAuthenticated } from '@/utils/supabase/server'; // Keep user auth check
import { createServerClient } from '@supabase/ssr'; // Import for service client
import { cookies } from 'next/headers'; // Import cookies for service client

// POST: Like a comment
export async function POST(request: Request) {
  try {
    // --- User Auth Check (for user context) ---
    const { isAuthenticated: userIsAuthenticated, userId, supabase } = await isAuthenticated();
    console.log('[API Comment Likes POST] Auth check:', { userIsAuthenticated, userId });

    // --- Create Service Role Client (for RLS bypass on check) ---
    const cookieStore = await cookies();
    const supabaseService = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use Service Role Key!
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: any) { /* No-op */ },
          remove(name: string, options: any) { /* No-op */ }
        }
      }
    );
    console.log('[API Comment Likes POST] Service client created for check.');

    if (!userIsAuthenticated || !userId) {
      console.error('[API Comment Likes POST] User not authenticated.');
      return NextResponse.json({ error: 'Please log in to like comments', message: 'authentication_required' }, { status: 401 });
    }

    const { commentId } = await request.json().catch(() => ({}));
    console.log('[API Comment Likes POST] Received commentId:', commentId);

    if (!commentId) {
      console.error('[API Comment Likes POST] Comment ID is missing.');
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    // Check if the like already exists using the service client (bypasses RLS for SELECT)
    const { data: existingLike, error: checkError } = await supabaseService
      .from('comment_likes')
      .select('id')
      .eq('user_id', userId) // Still check against the authenticated user ID
      .eq('comment_id', commentId)
      .maybeSingle(); // Use maybeSingle to handle 0 or 1 result

    if (checkError) {
      console.error('[API Comment Likes POST] Error checking for existing like:', checkError);
      return NextResponse.json({ error: 'Failed to check like status' }, { status: 500 });
    }

    if (existingLike) {
      console.log('[API Comment Likes POST] User already liked this comment.');
      // Optionally return the existing like or a specific message
      return NextResponse.json({ message: 'Comment already liked' }, { status: 200 }); // Or 409 Conflict
    }

    // Insert the like
    console.log('[API Comment Likes POST] Inserting like for commentId:', commentId);
    const { error: insertError } = await supabase
      .from('comment_likes')
      .insert({
        id: uuidv4(),
        user_id: userId,
        comment_id: commentId,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('[API Comment Likes POST] Error inserting like:', insertError);
      return NextResponse.json({ error: 'Failed to like comment' }, { status: 500 });
    }

    // Increment the comment's like count using the Supabase function
    console.log('[API Comment Likes POST] Incrementing like count for commentId:', commentId);
    const { error: rpcError } = await supabase.rpc('increment_comment_likes', { comment_id: commentId });

    if (rpcError) {
      console.error('[API Comment Likes POST] Error incrementing like count:', rpcError);
      // Log the error but proceed, the like was inserted
    } else {
      console.log('[API Comment Likes POST] Successfully incremented like count.');
    }

    return NextResponse.json({ message: 'Comment liked successfully' }, { status: 201 });

  } catch (error) {
    console.error('Error in comment likes POST endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Unlike a comment
export async function DELETE(request: Request) {
  try {
    const { isAuthenticated: userIsAuthenticated, userId, supabase } = await isAuthenticated();
    console.log('[API Comment Likes DELETE] Auth check:', { userIsAuthenticated, userId });

    if (!userIsAuthenticated || !userId) {
      console.error('[API Comment Likes DELETE] User not authenticated.');
      return NextResponse.json({ error: 'Please log in to unlike comments', message: 'authentication_required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    console.log('[API Comment Likes DELETE] Received commentId:', commentId);

    if (!commentId) {
      console.error('[API Comment Likes DELETE] Comment ID is missing.');
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    // Delete the like
    console.log('[API Comment Likes DELETE] Deleting like for commentId:', commentId);
    const { error: deleteError, count } = await supabase
      .from('comment_likes')
      .delete({ count: 'exact' }) // Ensure we know if a row was deleted
      .eq('user_id', userId)
      .eq('comment_id', commentId);

    if (deleteError) {
      console.error('[API Comment Likes DELETE] Error deleting like:', deleteError);
      return NextResponse.json({ error: 'Failed to unlike comment' }, { status: 500 });
    }

    // Only decrement if a like was actually deleted
    if (count && count > 0) {
      console.log('[API Comment Likes DELETE] Decrementing like count for commentId:', commentId);
      const { error: rpcError } = await supabase.rpc('decrement_comment_likes', { comment_id: commentId });

      if (rpcError) {
        console.error('[API Comment Likes DELETE] Error decrementing like count:', rpcError);
        // Log the error but proceed, the like was deleted
      } else {
        console.log('[API Comment Likes DELETE] Successfully decremented like count.');
      }
      return NextResponse.json({ message: 'Comment unliked successfully' }, { status: 200 });
    } else {
      console.log('[API Comment Likes DELETE] Like not found or already deleted.');
      return NextResponse.json({ message: 'Like not found' }, { status: 404 }); // Or 200 if idempotency is desired
    }

  } catch (error) {
    console.error('Error in comment likes DELETE endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}