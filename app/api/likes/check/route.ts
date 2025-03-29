import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Get the storyId from the query parameters
  const { searchParams } = new URL(request.url);
  const storyId = searchParams.get('storyId');
  
  if (!storyId) {
    return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
  }
  
  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // If user is not authenticated, return false for isLiked
      return NextResponse.json({ isLiked: false }, { status: 200 });
    }
    
    const userId = session.user.id;
    
    // Check if the user has liked the story
    const { data, error } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', userId)
      .eq('story_id', storyId);
    
    if (error) {
      console.error('Error checking like status:', error);
      return NextResponse.json({ error: 'Failed to check like status' }, { status: 500 });
    }
    
    // Return whether the user has liked the story (data.length > 0)
    return NextResponse.json({ isLiked: data && data.length > 0 }, { status: 200 });
  } catch (error) {
    console.error('Error in likes/check endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
