-- Create profiles table for user information
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  full_name text,
  google_drive_folder_id text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  primary key (id)
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Create work_days table
create table public.work_days (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  shift_type text not null check (shift_type in ('diurno_am', 'tarde_pm', 'trasnocho')),
  regular_hours numeric not null default 0,
  extra_hours numeric not null default 0,
  is_holiday boolean not null default false,
  notes text,
  synced_to_drive boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  primary key (id)
);

-- Enable RLS on work_days
alter table public.work_days enable row level security;

-- Work days policies
create policy "Users can view their own work days"
  on public.work_days
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own work days"
  on public.work_days
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own work days"
  on public.work_days
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own work days"
  on public.work_days
  for delete
  using (auth.uid() = user_id);

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  );
  return new;
end;
$$;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers for updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_work_days_updated_at
  before update on public.work_days
  for each row execute function public.update_updated_at_column();