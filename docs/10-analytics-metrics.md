# 10. Analytics / Metrics

## 상단 체크리스트
- [ ] 핵심 지표 정의(DAU, 리뷰 수 등)
- [ ] 이벤트 스키마 정의
- [ ] 대시보드 초안(쿼리) 마련

## 성공 지표(초기)
- 확장 DAU, 리뷰 주간 합, 검색→리뷰 작성 전환율

## 이벤트 테이블 설계(간단)
```sql
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  payload jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_events_name_created on public.events(name, created_at desc);
```

## 이벤트(예시)
- view_place: { provider, external_place_id, place_id }
- search_result_click: { query, place_id }
- review_created: { subject_type, target_id }

## 샘플 쿼리
- DAU(최근 7일):
```sql
select date_trunc('day', created_at) d, count(distinct coalesce(user_id::text, payload->>'client_id')) dau
from public.events
where created_at > now() - interval '7 days'
group by 1 order by 1;
```
- 검색→리뷰 전환율(최근 7일):
```sql
with s as (
  select distinct user_id from public.events where name='search_result_click' and created_at>now()-interval '7 days'
), r as (
  select distinct user_id from public.events where name='review_created' and created_at>now()-interval '7 days'
)
select (select count(*) from r)::float / nullif((select count(*) from s),0) as conversion_rate;
```

## 구현 메모
- 초기엔 Supabase 테이블 로깅으로 시작 → 이후 3rd party 고려
