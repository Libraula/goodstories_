import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Like a story
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { storyId } = await request.json()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if already liked
  const { data: existingLike } = await supabase
    .from('likes')
    .select()
    .eq('user_id', user.id)
    .eq('story_id', storyId)
    .single()

  if (existingLike) {
    return NextResponse.json({ error: 'Already liked this story' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('likes')
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

// Get likes for a story
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const storyId = searchParams.get('storyId')
  const userId = searchParams.get('userId')

  if (!storyId && !userId) {
    return NextResponse.json({ error: 'Missing storyId or userId parameter' }, { status: 400 })
  }

  let query = supabase.from('likes').select('*')

  if (storyId) {
    query = query.eq('story_id', storyId)
  }

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error, count } = await query.count()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data, count })
}

// Unlike a story
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
    .from('likes')
    .delete()
    .eq('user_id', user.id)
    .eq('story_id', storyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
