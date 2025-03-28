// This file contains the schema for the Supabase database
// You can use this to create the tables in the Supabase dashboard

/*
-- Create users table
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default now() not null,
  last_login timestamp with time zone default now(),
  bio text
);

-- Create RLS policies
alter table public.users enable row level security;

-- Create policy to allow users to read all users
create policy "Users are viewable by everyone" on public.users
  for select using (true);

-- Create policy to allow users to update their own data
create policy "Users can update their own data" on public.users
  for update using (auth.uid() = id);

-- Create policy to allow the service role to create users
create policy "Service role can create users" on public.users
  for insert using (auth.role() = 'service_role');

-- Create bookmarks table
create table public.bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  story_id text not null,
  created_at timestamp with time zone default now() not null
);

-- Create RLS policies for bookmarks
alter table public.bookmarks enable row level security;

-- Create policy to allow users to read their own bookmarks
create policy "Users can view their own bookmarks" on public.bookmarks
  for select using (auth.uid() = user_id);

-- Create policy to allow users to create their own bookmarks
create policy "Users can create their own bookmarks" on public.bookmarks
  for insert with check (auth.uid() = user_id);

-- Create policy to allow users to delete their own bookmarks
create policy "Users can delete their own bookmarks" on public.bookmarks
  for delete using (auth.uid() = user_id);

-- Create likes table
create table public.likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  story_id text not null,
  created_at timestamp with time zone default now() not null
);

-- Create RLS policies for likes
alter table public.likes enable row level security;

-- Create policy to allow users to read their own likes
create policy "Users can view their own likes" on public.likes
  for select using (auth.uid() = user_id);

-- Create policy to allow users to create their own likes
create policy "Users can create their own likes" on public.likes
  for insert with check (auth.uid() = user_id);

-- Create policy to allow users to delete their own likes
create policy "Users can delete their own likes" on public.likes
  for delete using (auth.uid() = user_id);

-- Create comments table
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  story_id text not null,
  content text not null,
  created_at timestamp with time zone default now() not null
);

-- Create RLS policies for comments
alter table public.comments enable row level security;

-- Create policy to allow everyone to read comments
create policy "Comments are viewable by everyone" on public.comments
  for select using (true);

-- Create policy to allow users to create their own comments
create policy "Users can create their own comments" on public.comments
  for insert with check (auth.uid() = user_id);

-- Create policy to allow users to update their own comments
create policy "Users can update their own comments" on public.comments
  for update using (auth.uid() = user_id);

-- Create policy to allow users to delete their own comments
create policy "Users can delete their own comments" on public.comments
  for delete using (auth.uid() = user_id);
*/

// This is a TypeScript file that defines the types for the Supabase tables
export interface UserProfile {
  id: string
  email: string
  display_name: string
  avatar_url: string
  created_at: string
  last_login: string
  bio?: string
}

export interface Bookmark {
  id: string
  user_id: string
  story_id: string
  created_at: string
}

export interface Like {
  id: string
  user_id: string
  story_id: string
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  story_id: string
  content: string
  created_at: string
}

