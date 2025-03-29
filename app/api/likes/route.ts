import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/utils/supabase/server';
import { likeStory, unlikeStory } from '@/lib/database';

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
  
  // Check if like already exists
  const { data: existingLike } = await supabase
    .from('likes')
    .select('*')
    .eq('user_id', userId)
    .eq('story_id', storyId)
    .single();
  
  if (existingLike) {
    return NextResponse.json({ message: 'Already liked' }, { status: 200 });
  }
  
  // Create new like
  const result = await likeStory(userId, storyId);
  
  if (!result) {
    return NextResponse.json({ error: 'Failed to like story' }, { status: 500 });
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
  
  // Delete like
  const success = await unlikeStory(userId, storyId);
  
  if (!success) {
    return NextResponse.json({ error: 'Failed to unlike story' }, { status: 500 });
  }
  
  return NextResponse.json({ message: 'Like removed successfully' });
}
