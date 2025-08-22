-- Enable UUID extension
create extension if not exists "uuid-ossp";

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

-- reviews: 사용자 리뷰/평점 (업체/주차장/좌표 대상 지원)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_type text not null check (subject_type in ('parking_lot','place','location')),
  parking_lot_id uuid references public.parking_lots(id) on delete cascade,
  place_id uuid references public.places(id) on delete set null,
  latitude double precision,
  longitude double precision,
  rating int check (rating between 1 and 5),
  comment text,
  helpful_count int default 0,
  created_at timestamptz default now(),
  -- one-of 보장: subject_type에 따른 필수 대상 제약
  constraint reviews_subject_one_of check (
    (subject_type = 'parking_lot' and parking_lot_id is not null and place_id is null and latitude is null and longitude is null)
    or (subject_type = 'place' and place_id is not null and parking_lot_id is null and latitude is null and longitude is null)
    or (subject_type = 'location' and latitude is not null and longitude is not null and parking_lot_id is null and place_id is null)
  )
);

-- 인덱스
create index if not exists idx_reviews_parking_lot on public.reviews(parking_lot_id) where subject_type='parking_lot';
create index if not exists idx_reviews_place on public.reviews(place_id) where subject_type='place';

-- review_helpfuls: 도움돼요(멱등)
create table if not exists public.review_helpfuls (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(review_id, user_id)
);
create index if not exists idx_review_helpfuls_review on public.review_helpfuls(review_id);

-- tips: 꿀팁/할인 정보
create table if not exists public.tips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parking_lot_id uuid not null references public.parking_lots(id) on delete cascade,
  content text not null,
  discount_info text,
  created_at timestamptz default now()
);