import { NextResponse } from 'next/server';
import { createClient, isAuthenticated } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const { userId, supabase } = await isAuthenticated();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    // Check if the user has already liked the comment
    const { data: existingLike, error: existingLikeError } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('user_id', userId)
      .eq('comment_id', commentId)
      .single();

    if (existingLikeError && existingLikeError.code !== 'PGRST116') { // PGRST116: no rows found
      console.error('Error checking existing like:', existingLikeError);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    if (existingLike) {
      return NextResponse.json({ error: 'You have already liked this comment' }, { status: 400 });
    }

    // Insert the like
    const { error: insertError } = await supabase
      .from('comment_likes')
      .insert({ user_id: userId, comment_id: commentId });

    if (insertError) {
      console.error('Error liking comment:', insertError);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    // Increment the like count on the comments table
    const { error: incrementError } = await supabase
      .from('comments')
      .update({ likes_count: () => 'likes_count + 1' })
      .eq('id', commentId);

    if (incrementError) {
      console.error('Error incrementing like count:', incrementError);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Comment liked successfully' });
  } catch (error) {
    console.error('Error in POST /api/likes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId, supabase } = await isAuthenticated();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    // Delete the like
    const { error: deleteError } = await supabase
      .from('comment_likes')
      .delete()
      .eq('user_id', userId)
      .eq('comment_id', commentId);

    if (deleteError) {
      console.error('Error unliking comment:', deleteError);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    // Decrement the like count on the comments table
    const { error: decrementError } = await supabase
      .from('comments')
      .update({ likes_count: () => 'likes_count - 1' })
      .eq('id', commentId);

    if (decrementError) {
      console.error('Error decrementing like count:', decrementError);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Comment unliked successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/likes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
