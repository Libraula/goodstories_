import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Get a user profile
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  let query = supabase
    .from('profiles')
    .select('*')

  if (userId) {
    query = query.eq('id', userId).single()
  } else if (currentUser) {
    query = query.eq('id', currentUser.id).single()
  } else {
    return NextResponse.json({ error: 'Missing userId parameter and not authenticated' }, { status: 400 })
  }

  const { data: profile, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Get follower count
  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id)

  // Get following count
  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id)

  // Check if the current user is following this profile
  let isFollowing = false
  if (currentUser && currentUser.id !== profile.id) {
    const { data: followData } = await supabase
      .from('follows')
      .select()
      .eq('follower_id', currentUser.id)
      .eq('following_id', profile.id)
      .single()
    
    isFollowing = !!followData
  }

  return NextResponse.json({
    ...profile,
    follower_count: followerCount,
    following_count: followingCount,
    is_following: isFollowing
  })
}

// Update a user profile
export async function PATCH(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { displayName, avatarUrl, bio } = await request.json()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const updates = {
    ...(displayName && { display_name: displayName }),
    ...(avatarUrl && { avatar_url: avatarUrl }),
    ...(bio !== undefined && { bio }),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
