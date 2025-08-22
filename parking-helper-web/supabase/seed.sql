-- 샘플 장소 데이터
insert into public.places (id, name, address, latitude, longitude)
values 
  ('a1234567-8901-2345-6789-012345678901', 'A 빌딩', '서울 강남구 테헤란로 123', 37.4979, 127.0276),
  ('b1234567-8901-2345-6789-012345678901', '강남역 스타벅스', '서울 강남구 강남대로 456', 37.4988, 127.0285),
  ('c1234567-8901-2345-6789-012345678901', '삼성동 코엑스몰', '서울 강남구 영동대로 513', 37.5111, 127.0590);

-- 샘플 주차장 데이터
insert into public.parking_lots (id, place_id, name, address, latitude, longitude, type, price_info)
values
  ('d1234567-8901-2345-6789-012345678901', 'a1234567-8901-2345-6789-012345678901', 'A 빌딩 지하주차장', '서울 강남구 테헤란로 123 지하', 37.4979, 127.0276, 'private', '{"unit":"10분","price":1000}'::jsonb),
  ('e1234567-8901-2345-6789-012345678901', null, 'B 공영주차장', '서울 강남구 테헤란로 125', 37.4980, 127.0278, 'public', '{"unit":"10분","price":500}'::jsonb),
  ('f1234567-8901-2345-6789-012345678901', 'c1234567-8901-2345-6789-012345678901', '코엑스 주차장', '서울 강남구 영동대로 513 지하', 37.5111, 127.0590, 'private', '{"unit":"10분","price":1200}'::jsonb);

-- 장소 별칭 데이터
insert into public.place_aliases (place_id, alias, provider)
values
  ('a1234567-8901-2345-6789-012345678901', 'A빌딩', null),
  ('a1234567-8901-2345-6789-012345678901', '에이빌딩', null),
  ('c1234567-8901-2345-6789-012345678901', 'COEX', null),
  ('c1234567-8901-2345-6789-012345678901', '코엑스', null);

-- 외부 지도 링크
insert into public.place_links (place_id, provider, external_place_id)
values
  ('a1234567-8901-2345-6789-012345678901', 'naver', '11572271'),
  ('a1234567-8901-2345-6789-012345678901', 'kakao', '26338953'),
  ('b1234567-8901-2345-6789-012345678901', 'naver', '11579949'),
  ('c1234567-8901-2345-6789-012345678901', 'naver', '13479910'),
  ('c1234567-8901-2345-6789-012345678901', 'kakao', '7859892'),
  ('c1234567-8901-2345-6789-012345678901', 'google', 'ChIJgUSIrJqjfDUREvGX-HCKUAM');

-- 프로필 자동 생성 트리거 (새 사용자 가입 시)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

-- 트리거 생성
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();