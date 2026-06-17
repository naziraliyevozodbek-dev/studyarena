-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users table
create table public.users (
    id uuid references auth.users on delete cascade not null primary key,
    telegram_id bigint unique not null,
    full_name text,
    username text,
    avatar_url text,
    role text check (role in ('mentor', 'student')) default 'student',
    xp integer default 0,
    level integer default 1,
    streak integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Courses table
create table public.courses (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text,
    mentor_id uuid references public.users(id) on delete cascade not null,
    course_code text unique not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Course members table
create table public.course_members (
    id uuid default uuid_generate_v4() primary key,
    course_id uuid references public.courses(id) on delete cascade not null,
    student_id uuid references public.users(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(course_id, student_id)
);

-- Vocabularies table
create table public.vocabularies (
    id uuid default uuid_generate_v4() primary key,
    course_id uuid references public.courses(id) on delete cascade not null,
    lesson_number integer not null,
    german_word text not null,
    translation text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Homeworks table
create table public.homeworks (
    id uuid default uuid_generate_v4() primary key,
    course_id uuid references public.courses(id) on delete cascade not null,
    title text not null,
    description text,
    xp_reward integer default 0,
    deadline timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Homework submissions table
create table public.homework_submissions (
    id uuid default uuid_generate_v4() primary key,
    homework_id uuid references public.homeworks(id) on delete cascade not null,
    student_id uuid references public.users(id) on delete cascade not null,
    content text,
    status text check (status in ('submitted', 'graded')) default 'submitted',
    score integer,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(homework_id, student_id)
);

-- Challenges table
create table public.challenges (
    id uuid default uuid_generate_v4() primary key,
    course_id uuid references public.courses(id) on delete cascade not null,
    title text not null,
    description text,
    xp_reward integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Resources table
create table public.resources (
    id uuid default uuid_generate_v4() primary key,
    course_id uuid references public.courses(id) on delete cascade not null,
    title text not null,
    file_url text not null,
    type text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Leaderboard view
create or replace view public.leaderboard as
select
    id as user_id,
    xp as total_xp,
    level,
    full_name,
    username,
    avatar_url,
    rank() over (order by xp desc) as rank
from
    public.users
where
    role = 'student';

-- Set up Row Level Security (RLS)

alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.course_members enable row level security;
alter table public.vocabularies enable row level security;
alter table public.homeworks enable row level security;
alter table public.homework_submissions enable row level security;
alter table public.challenges enable row level security;
alter table public.resources enable row level security;

-- Users policies
create policy "Users can view their own profile." on public.users for select using (auth.uid() = id);
create policy "Users can update their own profile." on public.users for update using (auth.uid() = id);

-- Courses policies
create policy "Mentors can manage their own courses." on public.courses for all using (auth.uid() = mentor_id);
create policy "Students can view courses they are enrolled in." on public.courses for select using (
    exists (select 1 from public.course_members where course_id = id and student_id = auth.uid())
);
-- Allow viewing course by course_code to enroll
create policy "Anyone can view course by code." on public.courses for select using (true);

-- Course members policies
create policy "Mentors can manage members in their courses." on public.course_members for all using (
    exists (select 1 from public.courses where id = course_id and mentor_id = auth.uid())
);
create policy "Students can view their own memberships." on public.course_members for select using (auth.uid() = student_id);
create policy "Students can join a course." on public.course_members for insert with check (auth.uid() = student_id);
create policy "Students can leave a course." on public.course_members for delete using (auth.uid() = student_id);

-- Vocabularies policies
create policy "Mentors can manage vocabularies for their courses." on public.vocabularies for all using (
    exists (select 1 from public.courses where id = course_id and mentor_id = auth.uid())
);
create policy "Students can view vocabularies for their courses." on public.vocabularies for select using (
    exists (select 1 from public.course_members where course_id = vocabularies.course_id and student_id = auth.uid())
);

-- Homeworks policies
create policy "Mentors can manage homeworks for their courses." on public.homeworks for all using (
    exists (select 1 from public.courses where id = course_id and mentor_id = auth.uid())
);
create policy "Students can view homeworks for their courses." on public.homeworks for select using (
    exists (select 1 from public.course_members where course_id = homeworks.course_id and student_id = auth.uid())
);

-- Homework submissions policies
create policy "Mentors can view and grade submissions for their courses." on public.homework_submissions for all using (
    exists (
        select 1 from public.homeworks h
        join public.courses c on c.id = h.course_id
        where h.id = homework_id and c.mentor_id = auth.uid()
    )
);
create policy "Students can view, insert, update their own submissions." on public.homework_submissions for all using (
    auth.uid() = student_id
);

-- Challenges policies
create policy "Mentors can manage challenges for their courses." on public.challenges for all using (
    exists (select 1 from public.courses where id = course_id and mentor_id = auth.uid())
);
create policy "Students can view challenges for their courses." on public.challenges for select using (
    exists (select 1 from public.course_members where course_id = challenges.course_id and student_id = auth.uid())
);

-- Resources policies
create policy "Mentors can manage resources for their courses." on public.resources for all using (
    exists (select 1 from public.courses where id = course_id and mentor_id = auth.uid())
);
create policy "Students can view resources for their courses." on public.resources for select using (
    exists (select 1 from public.course_members where course_id = resources.course_id and student_id = auth.uid())
);
