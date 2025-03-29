import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { createComment, getComments } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const url = new URL(request.url);
  const storyId = url.searchParams.get('storyId');
  
  if (!storyId) {
    return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
  }
  
  // Get comments for the story with user profiles
  const comments = await getComments(storyId);
  
  if (!comments) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
  
  return NextResponse.json({ data: comments });
}

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  const { storyId, content } = await request.json();
  
  if (!storyId || !content) {
    return NextResponse.json({ error: 'Story ID and content are required' }, { status: 400 });
  }
  
  // Create new comment
  const comment = await createComment(userId, storyId, content);
  
  if (!comment) {
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
  
  return NextResponse.json({ data: comment });
}

export async function DELETE(request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  const url = new URL(request.url);
  const commentId = url.searchParams.get('commentId');
  const storyId = url.searchParams.get('storyId');
  
  if (!commentId || !storyId) {
    return NextResponse.json({ error: 'Comment ID and Story ID are required' }, { status: 400 });
  }
  
  // Check if user is the comment author
  const { data: comment } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .single();
  
  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }
  
  if (comment.user_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized to delete this comment' }, { status: 403 });
  }
  
  // Delete comment
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);
  
  if (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
  
  return NextResponse.json({ message: 'Comment deleted successfully' });
}

export async function PATCH(request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  const { commentId, content } = await request.json();
  
  if (!commentId || !content) {
    return NextResponse.json({ error: 'Comment ID and content are required' }, { status: 400 });
  }
  
  // Check if user is the comment author
  const { data: comment } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .single();
  
  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }
  
  if (comment.user_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized to edit this comment' }, { status: 403 });
  }
  
  // Update comment
  const { data, error } = await supabase
    .from('comments')
    .update({
      content,
      updated_at: new Date().toISOString()
    })
    .eq('id', commentId)
    .select(`
      *,
      profiles:profiles(id, name, username, avatar_url)
    `)
    .single();
  
  if (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}
