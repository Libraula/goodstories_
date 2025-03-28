-- Create profiles table (if not already created)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Create stories table (if not already created)
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  cover_image_url TEXT,
  read_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create story tags table
CREATE TABLE IF NOT EXISTS story_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  story_id UUID REFERENCES stories ON DELETE CASCADE NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(story_id, tag_name)
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  story_id UUID REFERENCES stories ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, story_id)
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  story_id UUID REFERENCES stories ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, story_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  story_id UUID REFERENCES stories ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(follower_id, following_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE
  USING ( auth.uid() = user_id );

-- Stories policies
CREATE POLICY "Published stories are viewable by everyone."
  ON stories FOR SELECT
  USING ( is_published = true );

CREATE POLICY "Users can view their own stories."
  ON stories FOR SELECT
  USING ( auth.uid() = author_id );

CREATE POLICY "Users can create their own stories."
  ON stories FOR INSERT
  WITH CHECK ( auth.uid() = author_id );

CREATE POLICY "Users can update their own stories."
  ON stories FOR UPDATE
  USING ( auth.uid() = author_id );

CREATE POLICY "Users can delete their own stories."
  ON stories FOR DELETE
  USING ( auth.uid() = author_id );

-- Story tags policies
CREATE POLICY "Story tags are viewable by everyone."
  ON story_tags FOR SELECT
  USING ( true );

CREATE POLICY "Story authors can manage tags."
  ON story_tags FOR ALL
  USING ( 
    auth.uid() IN (
      SELECT author_id FROM stories WHERE id = story_id
    )
  );

-- Likes policies
CREATE POLICY "Likes are viewable by everyone."
  ON likes FOR SELECT
  USING ( true );

CREATE POLICY "Users can like stories."
  ON likes FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can unlike stories."
  ON likes FOR DELETE
  USING ( auth.uid() = user_id );

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks."
  ON bookmarks FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can bookmark stories."
  ON bookmarks FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can remove bookmarks."
  ON bookmarks FOR DELETE
  USING ( auth.uid() = user_id );

-- Comments policies
CREATE POLICY "Comments are viewable by everyone."
  ON comments FOR SELECT
  USING ( true );

CREATE POLICY "Users can create comments."
  ON comments FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own comments."
  ON comments FOR UPDATE
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own comments."
  ON comments FOR DELETE
  USING ( auth.uid() = user_id );

-- Follows policies
CREATE POLICY "Follows are viewable by everyone."
  ON follows FOR SELECT
  USING ( true );

CREATE POLICY "Users can follow others."
  ON follows FOR INSERT
  WITH CHECK ( auth.uid() = follower_id );

CREATE POLICY "Users can unfollow."
  ON follows FOR DELETE
  USING ( auth.uid() = follower_id );

-- Create function to handle user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_profiles_timestamp ON profiles;
CREATE TRIGGER update_profiles_timestamp
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

DROP TRIGGER IF EXISTS update_stories_timestamp ON stories;
CREATE TRIGGER update_stories_timestamp
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

DROP TRIGGER IF EXISTS update_comments_timestamp ON comments;
CREATE TRIGGER update_comments_timestamp
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
