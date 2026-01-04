-- profiles 테이블에 is_admin 필드 추가
alter table public.profiles 
add column if not exists is_admin boolean default false;

-- places, place_links에 관리자 쓰기 권한 추가
create policy "places_insert_admin" on public.places 
for insert 
with check (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and is_admin = true
  )
);

create policy "places_update_admin" on public.places 
for update 
using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and is_admin = true
  )
);

create policy "places_delete_admin" on public.places 
for delete 
using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and is_admin = true
  )
);

create policy "place_links_insert_admin" on public.place_links 
for insert 
with check (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and is_admin = true
  )
);

create policy "place_links_update_admin" on public.place_links 
for update 
using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and is_admin = true
  )
);

create policy "place_links_delete_admin" on public.place_links 
for delete 
using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and is_admin = true
  )
);

create policy "place_aliases_insert_admin" on public.place_aliases 
for insert 
with check (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and is_admin = true
  )
);

-- parking_lots에 관리자 쓰기 권한 추가
create policy "parking_lots_insert_admin" on public.parking_lots 
for insert 
with check (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and is_admin = true
  )
);

create policy "parking_lots_update_admin" on public.parking_lots 
for update 
using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and is_admin = true
  )
);

create policy "parking_lots_delete_admin" on public.parking_lots 
for delete 
using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and is_admin = true
  )
);