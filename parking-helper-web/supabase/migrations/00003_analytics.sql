-- 이벤트 추적 테이블
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  name text not null,
  payload jsonb,
  created_at timestamptz default now()
);

-- 인덱스
create index if not exists idx_events_name_created on public.events(name, created_at desc);
create index if not exists idx_events_user_created on public.events(user_id, created_at desc);
create index if not exists idx_events_session on public.events(session_id);

-- RLS 정책
alter table public.events enable row level security;

-- 모든 사용자가 자신의 이벤트를 생성할 수 있음
create policy "events_insert_all" on public.events 
  for insert 
  with check (true);

-- 관리자만 조회 가능 (일반 사용자는 조회 불가)
create policy "events_select_admin" on public.events 
  for select 
  using (
    auth.jwt() ->> 'role' = 'service_role' OR
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and (raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- 분석용 뷰: DAU (Daily Active Users)
create or replace view public.analytics_dau as
select 
  date_trunc('day', created_at) as date,
  count(distinct coalesce(user_id::text, session_id)) as active_users
from public.events
where created_at > now() - interval '30 days'
group by 1
order by 1 desc;

-- 분석용 뷰: 이벤트별 통계
create or replace view public.analytics_events as
select 
  name as event_name,
  date_trunc('day', created_at) as date,
  count(*) as event_count,
  count(distinct coalesce(user_id::text, session_id)) as unique_users
from public.events
where created_at > now() - interval '30 days'
group by 1, 2
order by 2 desc, 3 desc;

-- 분석용 뷰: 전환 깔때기
create or replace view public.analytics_funnel as
with daily_events as (
  select 
    date_trunc('day', created_at) as date,
    coalesce(user_id::text, session_id) as user_identifier,
    name
  from public.events
  where created_at > now() - interval '7 days'
)
select 
  date,
  count(distinct case when name = 'view_place' then user_identifier end) as viewed_place,
  count(distinct case when name = 'search_parking' then user_identifier end) as searched_parking,
  count(distinct case when name = 'review_created' then user_identifier end) as created_review
from daily_events
group by 1
order by 1 desc;