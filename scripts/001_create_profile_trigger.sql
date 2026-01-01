-- Create trigger to auto-create profile on signup
-- This avoids RLS issues since the trigger runs as the database owner

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, bio, avatar_url, location, member_badge, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', lower(split_part(new.email, '@', 1))),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    null,
    null,
    null,
    null,
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
