import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createServerClient } from '@supabase/ssr'; // Import directly for service client
import { cookies } from 'next/headers'; // Import cookies for service client
import { isAuthenticated } from '@/utils/supabase/server'; // Keep using this for auth check

// Define the expected structure for comments returned by the GET request
interface CommentWithProfile {
  id: string;
  author_id: string;
  story_id: string;
  content: string;
  created_at: string;
  updated_at: string | null; // Keep for type consistency
  likes_count: number | null;
  profiles: {
    id: string;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null; // Profile might be null
}

// Define the structure returned by the main query
interface FetchedComment {
    id: string;
    author_id: string;
    story_id: string;
    content: string;
    created_at: string;
    likes_count: number | null;
    profiles: {
      id: string;
      name: string | null;
      username: string | null;
      avatar_url: string | null;
    } | null;
}

export async function GET(request: Request) {
  console.log('[API Comments GET] Request received.');

  try {
    // --- Create Service Role Client for Data Fetching ---
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
    console.log('[API Comments GET] Service client created.');

    // --- Auth Check (uses anon client via helper) ---
    const { userId, isAuthenticated: userIsAuthenticated, supabase } = await isAuthenticated();
    console.log('[API Comments GET] Authentication check:', { userIsAuthenticated, userId });

    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');
    console.log('[API Comments GET] Received storyId:', storyId);

    if (!storyId) {
      console.error('[API Comments GET] Story ID is missing');
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    // --- Fetch comments with specific error logging ---
    let fetchedData: any = null; // Use 'any' temporarily for debugging
    let queryError: any = null;

    try {
      console.log('[API Comments GET] Attempting to fetch comments for storyId:', storyId);
      // Correct select string with profiles and like_count
      const query = supabaseService
        .from('comments')
        // Temporarily remove profiles join for debugging
        // Add backticks for template literal, remove type assertion
        .select<string, FetchedComment>(`
          id,
          author_id,
          story_id,
          content,
          created_at,
          profiles (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('story_id', storyId)
        .order('created_at', { ascending: false });

      const result = await query;
      fetchedData = result.data;
      queryError = result.error;

      if (queryError) {
        console.error('[API Comments GET] Supabase query failed:', queryError);
        throw queryError; // Re-throw to be caught below
      } else {
        console.log('[API Comments GET] Supabase query successful. Comments fetched:', fetchedData ? `${fetchedData.length}` : '0');
      }

    } catch (err: any) {
      console.error('[API Comments GET] EXCEPTION during Supabase query:', err);
      return NextResponse.json({
        error: 'Database query failed',
        details: err.message
      }, { status: 500 });
    }
    // --- End specific query block ---

    const fetchedComments = Array.isArray(fetchedData) ? fetchedData : [];

    // --- Temporarily disable user like fetching ---
    // let userLikes = new Set<string>();
    // if (userIsAuthenticated && userId && fetchedComments.length > 0) {
    //   try {
    //     const commentIds = fetchedComments.map(c => c.id);
    //     console.log('[API Comments GET] Fetching likes for comment IDs:', commentIds);
    //     const { data: likesData, error: likesError } = await supabase // Use anon client for user-specific data
    //       .from('comment_likes')
    //       .select('comment_id')
    //       .eq('user_id', userId)
    //       .in('comment_id', commentIds);
    //
    //     if (likesError) {
    //       console.error('[API Comments GET] Supabase error fetching comment likes:', likesError);
    //     } else if (Array.isArray(likesData)) {
    //       console.log('[API Comments GET] Fetched user comment likes:', likesData);
    //       userLikes = new Set(likesData.filter(like => like && like.comment_id).map(like => like.comment_id));
    //     } else {
    //        console.warn('[API Comments GET] likesData is not an array:', likesData);
    //     }
    //   } catch (likeFetchError) {
    //      console.error('[API Comments GET] Error processing comment likes:', likeFetchError);
    //   }
    // }
    // --- End like fetching ---

    // --- Map final response (with profiles, without user likes) ---
    console.log('[API Comments GET] Mapping comments with profiles (user likes disabled)...');
    const commentsWithProfiles = fetchedComments.map(comment => {
      if (!comment || typeof comment.id === 'undefined' || typeof comment.author_id === 'undefined') {
        console.warn('[API Comments GET] Skipping malformed comment object:', comment);
        return null;
      }
      // Ensure profiles is an object, provide defaults if null/missing
      const profileData = comment.profiles || { id: comment.author_id, name: 'Unknown User', username: 'unknown', avatar_url: null };

      return {
        ...comment,
        user_has_liked: false, // Default to false as like fetching is disabled
        profiles: profileData, // Use fetched or default profile data
      };
    }).filter(Boolean); // Remove any null entries from malformed data

    console.log('[API Comments GET] Successfully processed comments with profiles.');
    return NextResponse.json({ data: commentsWithProfiles });

  } catch (error: any) { // Outer catch
    console.error('[API Comments GET] UNHANDLED Error in GET endpoint:', error);
    return NextResponse.json({
        error: 'Internal server error',
        details: error.message
    }, { status: 500 });
  }
}

// POST handler (no changes needed from previous state)
export async function POST(request: Request) {
  try {
    const { isAuthenticated: userIsAuthenticated, userId, supabase } = await isAuthenticated();
    if (!userIsAuthenticated || !userId) {
      return NextResponse.json({ error: 'Please log in to post comments', message: 'authentication_required' }, { status: 401 });
    }
    const requestData = await request.json().catch(() => ({}));
    const { storyId, content } = requestData;
    if (!storyId || !content || content.trim() === '') {
      return NextResponse.json({ error: 'Story ID and content are required' }, { status: 400 });
    }
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (profileError) {
      console.error('[API Comments POST] Supabase error fetching profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }
    const { data: commentData, error: commentError } = await supabase
      .from('comments')
      .insert({ id: uuidv4(), author_id: userId, story_id: storyId, content: content.trim(), created_at: new Date().toISOString() })
      .select();
    if (commentError) {
      console.error('[API Comments POST] Supabase error creating comment:', commentError);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
    const comment = commentData[0];
    const formattedComment = { ...comment, profiles: { id: profileData.id, name: profileData.name, username: profileData.username, avatar_url: profileData.avatar_url } };
    return NextResponse.json({ data: formattedComment }, { status: 201 });
  } catch (error) {
    console.error('Error in comments POST endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE handler (no changes needed from previous state)
export async function DELETE(request: Request) {
  try {
    const { isAuthenticated: userIsAuthenticated, userId, supabase } = await isAuthenticated();
    if (!userIsAuthenticated || !userId) {
      return NextResponse.json({ error: 'Please log in to delete comments', message: 'authentication_required' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }
    const { data: comment, error: commentError } = await supabase.from('comments').select('*').eq('id', commentId).single();
    if (commentError || !comment) {
      console.error('Error fetching comment for delete:', commentError);
      return NextResponse.json({ error: comment ? 'Failed to fetch comment' : 'Comment not found' }, { status: comment ? 500 : 404 });
    }
    if (comment.author_id !== userId) {
      return NextResponse.json({ error: 'You can only delete your own comments' }, { status: 403 });
    }
    const { error: deleteError } = await supabase.from('comments').delete().eq('id', commentId);
    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Comment deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error in comments DELETE endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH handler (no changes needed from previous state)
export async function PATCH(request: Request) {
  try {
    const { isAuthenticated: userIsAuthenticated, userId, supabase } = await isAuthenticated();
    if (!userIsAuthenticated || !userId) {
      return NextResponse.json({ error: 'Please log in to edit comments', message: 'authentication_required' }, { status: 401 });
    }
    const requestData = await request.json().catch(() => ({}));
    const { commentId, content } = requestData;
    if (!commentId || !content || content.trim() === '') {
      return NextResponse.json({ error: 'Comment ID and content are required' }, { status: 400 });
    }
    const { data: comment, error: commentError } = await supabase.from('comments').select('*').eq('id', commentId).single();
    if (commentError || !comment) {
      console.error('Error fetching comment for patch:', commentError);
      return NextResponse.json({ error: comment ? 'Failed to fetch comment' : 'Comment not found' }, { status: comment ? 500 : 404 });
    }
    if (comment.author_id !== userId) {
      return NextResponse.json({ error: 'You can only edit your own comments' }, { status: 403 });
    }
    // Note: Assuming 'updated_at' exists and is handled by DB triggers or needed here
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({ content: content.trim(), updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .select();
    if (updateError) {
      console.error('Error updating comment:', updateError);
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Comment updated successfully', data: updatedComment[0] }, { status: 200 });
  } catch (error) {
    console.error('Error in comments PATCH endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
