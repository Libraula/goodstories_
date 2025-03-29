-- Create function to increment story comment count
CREATE OR REPLACE FUNCTION increment_story_comments(story_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE stories
  SET comment_count = COALESCE(comment_count, 0) + 1
  WHERE id = story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to decrement story comment count
CREATE OR REPLACE FUNCTION decrement_story_comments(story_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE stories
  SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0)
  WHERE id = story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment story bookmark count
CREATE OR REPLACE FUNCTION increment_story_bookmarks(story_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE stories
  SET bookmark_count = COALESCE(bookmark_count, 0) + 1
  WHERE id = story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to decrement story bookmark count
CREATE OR REPLACE FUNCTION decrement_story_bookmarks(story_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE stories
  SET bookmark_count = GREATEST(COALESCE(bookmark_count, 0) - 1, 0)
  WHERE id = story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
