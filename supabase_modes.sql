-- Run this in your Supabase SQL Editor to create the Modes table
create table public.modes (
    id text primary key,
    user_id uuid references auth.users null, -- null for system/base modes, filled for custom user modes
    name text not null,
    description text not null,
    role text,
    law text,
    json_template text,
    reference_image_ids text[] default array[]::text[],
    is_base_mode boolean default false not null,
    is_hidden boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.modes enable row level security;

-- Policies
create policy "Anyone can read system base modes" 
on public.modes for select 
using (is_base_mode = true);

create policy "Users can read their own custom modes" 
on public.modes for select 
using (auth.uid() = user_id);

create policy "Users can insert their own modes" 
on public.modes for insert 
with check (auth.uid() = user_id);

create policy "Users can update their own modes" 
on public.modes for update 
using (auth.uid() = user_id);

create policy "Users can delete their own modes" 
on public.modes for delete 
using (auth.uid() = user_id);
