import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { bookmarkStory, unbookmarkStory } from '@/lib/database';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  const { storyId } = await request.json();
  
  if (!storyId) {
    return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
  }
  
  // Check if bookmark already exists
  const { data: existingBookmark } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .eq('story_id', storyId)
    .single();
  
  if (existingBookmark) {
    return NextResponse.json({ message: 'Already bookmarked' }, { status: 200 });
  }
  
  // Create new bookmark
  const result = await bookmarkStory(userId, storyId);
  
  if (!result) {
    return NextResponse.json({ error: 'Failed to bookmark story' }, { status: 500 });
  }
  
  return NextResponse.json({ data: result });
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
  const storyId = url.searchParams.get('storyId');
  
  if (!storyId) {
    return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
  }
  
  // Delete bookmark
  const success = await unbookmarkStory(userId, storyId);
  
  if (!success) {
    return NextResponse.json({ error: 'Failed to unbookmark story' }, { status: 500 });
  }
  
  return NextResponse.json({ message: 'Bookmark removed successfully' });
}
