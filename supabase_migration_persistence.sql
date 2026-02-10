-- Create Quizzes Table
create table if not exists quizzes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  material_id uuid references materials(id) on delete set null,
  title text not null,
  questions jsonb not null,
  created_at bigint not null
);

-- Create Flashcard Decks Table
create table if not exists flashcard_decks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  material_id uuid references materials(id) on delete set null,
  title text not null,
  cards jsonb not null,
  created_at bigint not null
);

-- RLS Policies (Enable Row Level Security)
alter table quizzes enable row level security;
alter table flashcard_decks enable row level security;

-- Policy: Users can only see their own quizzes
create policy "Users can see own quizzes"
on quizzes for select
using (auth.uid() = user_id);

create policy "Users can insert own quizzes"
on quizzes for insert
with check (auth.uid() = user_id);

create policy "Users can delete own quizzes"
on quizzes for delete
using (auth.uid() = user_id);

-- Policy: Users can only see their own flashcard decks
create policy "Users can see own decks"
on flashcard_decks for select
using (auth.uid() = user_id);

create policy "Users can insert own decks"
on flashcard_decks for insert
with check (auth.uid() = user_id);

create policy "Users can delete own decks"
on flashcard_decks for delete
using (auth.uid() = user_id);
