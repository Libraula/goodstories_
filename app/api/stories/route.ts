import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { title, content, isPublished = false, tags = [], coverImageUrl, readTime } = await request.json()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Start a transaction
  const { data: story, error: storyError } = await supabase
    .from('stories')
    .insert([
      {
        title,
        content,
        author_id: user.id,
        is_published: isPublished,
        cover_image_url: coverImageUrl,
        read_time: readTime || Math.ceil(content.split(' ').length / 200), // Estimate read time based on word count
      },
    ])
    .select()
    .single()

  if (storyError) {
    return NextResponse.json({ error: storyError.message }, { status: 400 })
  }

  // Add tags if provided
  if (tags.length > 0) {
    const tagInserts = tags.map(tag => ({
      story_id: story.id,
      tag_name: tag.toLowerCase().trim()
    }))

    const { error: tagError } = await supabase
      .from('story_tags')
      .insert(tagInserts)

    if (tagError) {
      console.error('Error adding tags:', tagError)
      // We don't want to fail the whole request if just tags fail
    }
  }

  return NextResponse.json(story)
}

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const isPublished = searchParams.get('isPublished')
  const tag = searchParams.get('tag')
  const limit = parseInt(searchParams.get('limit') || '10')
  const page = parseInt(searchParams.get('page') || '0')
  
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  let query = supabase
    .from('stories')
    .select(`
      *,
      profiles(display_name, avatar_url),
      story_tags(tag_name)
    `)

  if (userId) {
    query = query.eq('author_id', userId)
  }

  if (isPublished !== null) {
    query = query.eq('is_published', isPublished === 'true')
  } else {
    // By default, only show published stories unless viewing own stories
    if (!userId || (currentUser && userId !== currentUser.id)) {
      query = query.eq('is_published', true)
    }
  }

  if (tag) {
    query = query.eq('story_tags.tag_name', tag.toLowerCase().trim())
  }

  // Add pagination
  query = query
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  const { data: stories, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Get additional data for each story
  const enhancedStories = await Promise.all(stories.map(async (story) => {
    // Format tags
    const tags = story.story_tags ? story.story_tags.map((t: any) => t.tag_name) : []
    
    // Get like count
    const { count: likeCount } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', story.id)
    
    // Get comment count
    const { count: commentCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', story.id)
    
    // Check if bookmarked by current user
    let isBookmarked = false
    if (currentUser) {
      const { data: bookmark } = await supabase
        .from('bookmarks')
        .select()
        .eq('user_id', currentUser.id)
        .eq('story_id', story.id)
        .single()
      
      isBookmarked = !!bookmark
    }

    return {
      ...story,
      tags,
      like_count: likeCount,
      comment_count: commentCount,
      is_bookmarked: isBookmarked
    }
  }))

  return NextResponse.json(enhancedStories)
}

export async function PATCH(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { id, title, content, isPublished, tags, coverImageUrl, readTime } = await request.json()

  if (!id) {
    return NextResponse.json({ error: 'Missing story id' }, { status: 400 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if the user owns the story
  const { data: story } = await supabase
    .from('stories')
    .select()
    .eq('id', id)
    .eq('author_id', user.id)
    .single()

  if (!story) {
    return NextResponse.json({ error: 'Story not found or not authorized to edit' }, { status: 404 })
  }

  const updates: any = {}
  if (title !== undefined) updates.title = title
  if (content !== undefined) updates.content = content
  if (isPublished !== undefined) updates.is_published = isPublished
  if (coverImageUrl !== undefined) updates.cover_image_url = coverImageUrl
  if (readTime !== undefined) {
    updates.read_time = readTime
  } else if (content !== undefined) {
    updates.read_time = Math.ceil(content.split(' ').length / 200)
  }

  const { data: updatedStory, error: updateError } = await supabase
    .from('stories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  // Update tags if provided
  if (tags !== undefined) {
    // First delete existing tags
    await supabase
      .from('story_tags')
      .delete()
      .eq('story_id', id)

    // Then add new tags
    if (tags.length > 0) {
      const tagInserts = tags.map((tag: string) => ({
        story_id: id,
        tag_name: tag.toLowerCase().trim()
      }))

      await supabase
        .from('story_tags')
        .insert(tagInserts)
    }
  }

  return NextResponse.json(updatedStory)
}

export async function DELETE(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing story id' }, { status: 400 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if the user owns the story
  const { data: story } = await supabase
    .from('stories')
    .select()
    .eq('id', id)
    .eq('author_id', user.id)
    .single()

  if (!story) {
    return NextResponse.json({ error: 'Story not found or not authorized to delete' }, { status: 404 })
  }

  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
