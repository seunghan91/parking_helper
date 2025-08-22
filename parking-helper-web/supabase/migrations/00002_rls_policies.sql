-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.tips enable row level security;
alter table public.parking_lots enable row level security;
alter table public.places enable row level security;
alter table public.place_aliases enable row level security;
alter table public.place_links enable row level security;
alter table public.review_helpfuls enable row level security;

-- profiles: 모두 읽기, 본인만 수정
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_modify_own" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- reviews: 모두 읽기, 본인만 작성/수정/삭제
create policy "reviews_select_all" on public.reviews for select using (true);
create policy "reviews_insert_own" on public.reviews for insert with check (auth.uid() = user_id);
create policy "reviews_update_delete_own" on public.reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reviews_delete_own" on public.reviews for delete using (auth.uid() = user_id);

-- tips: 모두 읽기, 본인만 작성/수정/삭제
create policy "tips_select_all" on public.tips for select using (true);
create policy "tips_insert_own" on public.tips for insert with check (auth.uid() = user_id);
create policy "tips_update_delete_own" on public.tips for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tips_delete_own" on public.tips for delete using (auth.uid() = user_id);

-- parking_lots: 모두 읽기, 운영자만 쓰기(초기엔 공개 쓰기 비활성 권장)
create policy "parking_lots_select_all" on public.parking_lots for select using (true);

-- places/aliases/links: 모두 읽기, 운영자만 쓰기(초기 수집은 Edge Function 경유)
create policy "places_select_all" on public.places for select using (true);
create policy "place_aliases_select_all" on public.place_aliases for select using (true);
create policy "place_links_select_all" on public.place_links for select using (true);

-- review_helpfuls: 본인만 추가/삭제, 모두 읽기
create policy "review_helpfuls_select_all" on public.review_helpfuls for select using (true);
create policy "review_helpfuls_modify_own" on public.review_helpfuls for all using (auth.uid() = user_id) with check (auth.uid() = user_id);