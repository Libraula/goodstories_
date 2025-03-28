import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Bookmark a story
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { storyId } = await request.json()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if already bookmarked
  const { data: existingBookmark } = await supabase
    .from('bookmarks')
    .select()
    .eq('user_id', user.id)
    .eq('story_id', storyId)
    .single()

  if (existingBookmark) {
    return NextResponse.json({ error: 'Already bookmarked this story' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .insert([
      {
        user_id: user.id,
        story_id: storyId,
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

// Get bookmarks for a user
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      *,
      stories(
        id, 
        title, 
        content, 
        author_id, 
        is_published, 
        cover_image_url,
        read_time,
        created_at,
        profiles(display_name, avatar_url)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

// Remove a bookmark
export async function DELETE(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const storyId = searchParams.get('storyId')

  if (!storyId) {
    return NextResponse.json({ error: 'Missing storyId parameter' }, { status: 400 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', user.id)
    .eq('story_id', storyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
