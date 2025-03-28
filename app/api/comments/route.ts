import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Add a comment to a story
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { storyId, content } = await request.json()

  if (!content || content.trim() === '') {
    return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('comments')
    .insert([
      {
        user_id: user.id,
        story_id: storyId,
        content,
      },
    ])
    .select(`
      *,
      profiles(display_name, avatar_url)
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

// Get comments for a story
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const storyId = searchParams.get('storyId')

  if (!storyId) {
    return NextResponse.json({ error: 'Missing storyId parameter' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles(display_name, avatar_url)
    `)
    .eq('story_id', storyId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

// Update a comment
export async function PATCH(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { commentId, content } = await request.json()

  if (!content || content.trim() === '') {
    return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if the user owns the comment
  const { data: comment } = await supabase
    .from('comments')
    .select()
    .eq('id', commentId)
    .eq('user_id', user.id)
    .single()

  if (!comment) {
    return NextResponse.json({ error: 'Comment not found or not authorized to edit' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('comments')
    .update({ content })
    .eq('id', commentId)
    .select(`
      *,
      profiles(display_name, avatar_url)
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

// Delete a comment
export async function DELETE(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const commentId = searchParams.get('commentId')

  if (!commentId) {
    return NextResponse.json({ error: 'Missing commentId parameter' }, { status: 400 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if the user owns the comment
  const { data: comment } = await supabase
    .from('comments')
    .select()
    .eq('id', commentId)
    .eq('user_id', user.id)
    .single()

  if (!comment) {
    return NextResponse.json({ error: 'Comment not found or not authorized to delete' }, { status: 404 })
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
