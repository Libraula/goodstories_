import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createClient, isAuthenticated } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');
    
    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }
    
    // Get comments for the story with profile information
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        user_id,
        story_id,
        content,
        created_at,
        updated_at,
        profiles (
          id,
          name,
          username,
          avatar_url
        )
      `)
      .eq('story_id', storyId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in comments GET endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const { isAuthenticated: userIsAuthenticated, userId, supabase } = await isAuthenticated();
    
    if (!userIsAuthenticated || !userId) {
      return NextResponse.json({ error: 'Please log in to post comments', message: 'authentication_required' }, { status: 401 });
    }
    
    const requestData = await request.json().catch(() => ({}));
    const { storyId, content } = requestData;
    
    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }
    
    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }
    
    // Get user profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }
    
    // Create comment
    const { data: commentData, error: commentError } = await supabase
      .from('comments')
      .insert({
        id: uuidv4(),
        user_id: userId,
        story_id: storyId,
        content: content.trim(),
        created_at: new Date().toISOString()
      })
      .select();
    
    if (commentError) {
      console.error('Error creating comment:', commentError);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
    
    // Format the response to include profile data
    const comment = commentData[0];
    const formattedComment = {
      ...comment,
      profiles: {
        id: profileData.id,
        name: profileData.name,
        username: profileData.username,
        avatar_url: profileData.avatar_url
      }
    };
    
    return NextResponse.json({ data: formattedComment }, { status: 201 });
  } catch (error) {
    console.error('Error in comments POST endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Check if user is authenticated
    const { isAuthenticated: userIsAuthenticated, userId, supabase } = await isAuthenticated();
    
    if (!userIsAuthenticated || !userId) {
      return NextResponse.json({ error: 'Please log in to delete comments', message: 'authentication_required' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    
    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }
    
    // Check if the comment belongs to the user
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single();
    
    if (commentError) {
      console.error('Error fetching comment:', commentError);
      return NextResponse.json({ error: 'Failed to fetch comment' }, { status: 500 });
    }
    
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    
    if (comment.user_id !== userId) {
      return NextResponse.json({ error: 'You can only delete your own comments' }, { status: 403 });
    }
    
    // Delete the comment
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
    
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

export async function PATCH(request: Request) {
  try {
    // Check if user is authenticated
    const { isAuthenticated: userIsAuthenticated, userId, supabase } = await isAuthenticated();
    
    if (!userIsAuthenticated || !userId) {
      return NextResponse.json({ error: 'Please log in to edit comments', message: 'authentication_required' }, { status: 401 });
    }
    
    const requestData = await request.json().catch(() => ({}));
    const { commentId, content } = requestData;
    
    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }
    
    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }
    
    // Check if the comment belongs to the user
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single();
    
    if (commentError) {
      console.error('Error fetching comment:', commentError);
      return NextResponse.json({ error: 'Failed to fetch comment' }, { status: 500 });
    }
    
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    
    if (comment.user_id !== userId) {
      return NextResponse.json({ error: 'You can only edit your own comments' }, { status: 403 });
    }
    
    // Update the comment
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
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
