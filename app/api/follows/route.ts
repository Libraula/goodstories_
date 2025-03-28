import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Follow a user
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { followingId } = await request.json()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if already following
  const { data: existingFollow } = await supabase
    .from('follows')
    .select()
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .single()

  if (existingFollow) {
    return NextResponse.json({ error: 'Already following this user' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('follows')
    .insert([
      {
        follower_id: user.id,
        following_id: followingId,
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

// Get followers or following
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const type = searchParams.get('type') // 'followers' or 'following'

  if (!userId || !type || (type !== 'followers' && type !== 'following')) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  }

  let query;

  if (type === 'followers') {
    // Get users who follow the specified user
    query = supabase
      .from('follows')
      .select('follower_id, profiles!follows_follower_id_fkey(id, display_name, avatar_url)')
      .eq('following_id', userId)
  } else {
    // Get users who the specified user follows
    query = supabase
      .from('follows')
      .select('following_id, profiles!follows_following_id_fkey(id, display_name, avatar_url)')
      .eq('follower_id', userId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

// Unfollow a user
export async function DELETE(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const followingId = searchParams.get('followingId')

  if (!followingId) {
    return NextResponse.json({ error: 'Missing followingId parameter' }, { status: 400 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
