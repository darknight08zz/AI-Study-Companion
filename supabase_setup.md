# ⚡ Supabase Setup Guide

To switch to a real cloud backend, follow these exact steps. This will take about **5 minutes**.

### 1. Create Project
1.  Go to [database.new](https://database.new) (redirects to Supabase).
2.  Sign in with GitHub.
3.  Click **"New Project"**.
4.  **Name**: `StudyCompanion`
5.  **Password**: Generate a strong password (save it if you want, but we won't strictly need it for the code).
6.  **Region**: Choose one close to you (e.g., Mumbai, Singapore).
7.  Click **"Create new project"**.

### 2. Get API Keys
Wait about 1 minute for the database to start. Then:
1.  Go to **Project Settings** (Cogwheel icon at bottom left).
2.  Click **"API"**.
3.  Copy the **Project URL**.
4.  Copy the **anon public** Key.

### 3. Create Tables (SQL Editor)
1.  Click the **SQL Editor** icon (Paper with terminal symbol) on the left sidebar.
2.  Paste the following SQL code into the editor and click **Run** (bottom right).

```sql
-- 1. Profiles Table
create table profiles (
  id uuid references auth.users not null primary key,
  display_name text,
  xp bigint default 0,
  level int default 1,
  daily_streak int default 0,
  last_activity_date bigint,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tasks Table
create table tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  due_date bigint,
  subject_tags text[],
  status text default 'notStarted',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Materials Table
create table materials (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  content text,
  file_type text default 'text',
  created_at bigint, -- Keeping as bigint for compatibility with your app
  created_at_ts timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Enable Row Level Security (RLS) - "My Data is Mine"
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table materials enable row level security;

-- 5. Policies (Who can see what?)
-- Profiles: Users can see/edit their own profile
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Tasks: Users can CRUD their own tasks
create policy "Users can crud own tasks" on tasks for all using (auth.uid() = user_id);

-- Materials: Users can CRUD their own materials
create policy "Users can crud own materials" on materials for all using (auth.uid() = user_id);

-- 6. Auto-Create Profile Trigger
-- When a user signs up, automatically create an entry in 'profiles'
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 4. Connect Config
Let me know when you have the **Project URL** and **Anon Key**. We will add them to a `.env` file.
