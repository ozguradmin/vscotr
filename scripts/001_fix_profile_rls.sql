-- Fix RLS policies for profiles table to allow profile creation on signup

-- Drop existing policies
drop policy if exists "Kullanıcılar kendi profilini oluşturabilir" on public.profiles;
drop policy if exists "Kullanıcılar kendi profilini güncelleyebilir" on public.profiles;
drop policy if exists "Herkes profilleri görebilir" on public.profiles;

-- Recreate policies with correct logic
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);
