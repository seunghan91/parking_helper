# 06. DB 스키마 & RLS (Supabase)

## 상단 체크리스트
- [ ] 핵심 테이블 생성(profiles/parking_lots/reviews/tips)
- [ ] 장소 테이블(place/aliases/links) 생성
- [ ] RLS 정책 적용 및 검증
- [ ] 시드 데이터 주입

# DB 스키마 & RLS (Supabase)

## 목표
- MVP를 위한 최소 테이블과 RLS 정책을 정의한다.

## 테이블 설계
```sql
-- profiles: auth.users(id)와 1:1 확장
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  car_number text,
  phone_number text,
  created_at timestamptz default now()
);

-- places: 내부 장소 엔티티(건물/업체 단위)
create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz default now()
);

-- place_aliases: 중복/이명 관리(키워드/명칭)
create table if not exists public.place_aliases (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  alias text not null,
  provider text, -- optional
  created_at timestamptz default now()
);

-- place_links: 외부 지도 공급자 식별자 매핑
create table if not exists public.place_links (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  provider text not null, -- naver/kakao/google
  external_place_id text not null,
  unique(provider, external_place_id)
);

-- parking_lots: 주차장 기본 정보
create table if not exists public.parking_lots (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references public.places(id) on delete set null,
  name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  type text, -- public/private/affiliate 등
  price_info jsonb, -- { unit:"10m", price:500 } 등
  created_at timestamptz default now()
);

-- reviews: 사용자 리뷰/평점
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parking_lot_id uuid not null references public.parking_lots(id) on delete cascade,
  rating int check (rating between 1 and 5),
  comment text,
  helpful_count int default 0,
  created_at timestamptz default now()
);

-- tips: 꿀팁/할인 정보
create table if not exists public.tips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parking_lot_id uuid not null references public.parking_lots(id) on delete cascade,
  content text not null,
  discount_info text,
  created_at timestamptz default now()
);
```

## RLS 정책
```sql
-- enable RLS
alter table public.profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.tips enable row level security;
alter table public.parking_lots enable row level security;
alter table public.places enable row level security;
alter table public.place_aliases enable row level security;
alter table public.place_links enable row level security;

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
```

## 시드 데이터(예시)
```sql
insert into public.places (name, address, latitude, longitude)
values ('A 빌딩', '서울 강남구 ...', 37.4979, 127.0276);

insert into public.parking_lots (place_id, name, address, latitude, longitude, type, price_info)
select id, 'B 공영주차장', '서울 강남구 ...', 37.4979, 127.0276, 'public', '{"unit":"10m","price":500}'::jsonb
from public.places where name='A 빌딩' limit 1;
```
