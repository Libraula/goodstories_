import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createClient, isAuthenticated } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const { isAuthenticated: userIsAuthenticated, userId, supabase } = await isAuthenticated();
    
    if (!userIsAuthenticated || !userId) {
      return NextResponse.json({ error: 'Please log in to like stories', message: 'authentication_required' }, { status: 401 });
    }
    
    const requestData = await request.json().catch(() => ({}));
    const { storyId } = requestData;
    
    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }
    
    // Check if like already exists
    const { data: existingLike, error: likeError } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', userId)
      .eq('story_id', storyId);
    
    if (likeError) {
      console.error('Error checking existing like:', likeError);
      return NextResponse.json({ error: 'Failed to check existing like' }, { status: 500 });
    }
    
    if (existingLike && existingLike.length > 0) {
      return NextResponse.json({ message: 'Already liked' }, { status: 200 });
    }
    
    // Create new like directly with Supabase
    const { data: likeData, error: insertError } = await supabase
      .from('likes')
      .insert({
        id: uuidv4(),
        user_id: userId,
        story_id: storyId,
        created_at: new Date().toISOString()
      })
      .select();
    
    if (insertError) {
      console.error('Error creating like:', insertError);
      return NextResponse.json({ error: 'Failed to like story' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Story liked successfully', data: likeData }, { status: 201 });
  } catch (error) {
    console.error('Error in likes POST endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Check if user is authenticated
    const { isAuthenticated: userIsAuthenticated, userId, supabase } = await isAuthenticated();
    
    if (!userIsAuthenticated || !userId) {
      return NextResponse.json({ error: 'Please log in to unlike stories', message: 'authentication_required' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');
    
    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }
    
    // Delete the like directly with Supabase
    const { error: deleteError } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('story_id', storyId);
    
    if (deleteError) {
      console.error('Error deleting like:', deleteError);
      return NextResponse.json({ error: 'Failed to unlike story' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Story unliked successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error in likes DELETE endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
