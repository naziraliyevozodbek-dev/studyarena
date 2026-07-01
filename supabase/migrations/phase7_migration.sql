-- Notifications table
create table public.notifications (
    id uuid default uuid_generate_v4() primary key,
    student_id uuid references public.users(id) on delete cascade not null,
    title text not null,
    message text,
    type text check (type in ('vocabulary', 'homework', 'challenge', 'resource', 'system')) not null,
    related_id uuid,
    is_read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for faster queries
create index idx_notifications_student_id on public.notifications(student_id);
create index idx_notifications_is_read on public.notifications(is_read);

-- Ensure RLS is enabled if needed (assuming service role uses admin, we can just leave it public for admin access, but good practice to enable RLS)
-- Since we mainly use supabaseAdmin in backend, RLS on table is not strictly required for operations, but let's be safe.
-- Currently all access is through server actions.
