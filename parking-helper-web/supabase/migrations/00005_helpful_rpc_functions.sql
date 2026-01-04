-- helpful_count 증가 RPC 함수
create or replace function increment_helpful_count(review_id uuid)
returns void as $$
begin
  update reviews 
  set helpful_count = helpful_count + 1
  where id = review_id;
end;
$$ language plpgsql security definer;

-- helpful_count 감소 RPC 함수
create or replace function decrement_helpful_count(review_id uuid)
returns void as $$
begin
  update reviews 
  set helpful_count = greatest(helpful_count - 1, 0)
  where id = review_id;
end;
$$ language plpgsql security definer;

-- 평균 평점 계산 함수 (성능 개선용)
create or replace function get_average_rating(target_id uuid, target_type text)
returns table(
  average_rating numeric,
  rating_count bigint
) as $$
begin
  if target_type = 'parking_lot' then
    return query
    select 
      avg(rating)::numeric as average_rating,
      count(*)::bigint as rating_count
    from reviews
    where parking_lot_id = target_id
    and rating is not null;
  elsif target_type = 'place' then
    return query
    select 
      avg(rating)::numeric as average_rating,
      count(*)::bigint as rating_count
    from reviews
    where place_id = target_id
    and rating is not null;
  else
    return query
    select null::numeric, 0::bigint;
  end if;
end;
$$ language plpgsql security definer;

-- 지오쿼리 성능 개선을 위한 인덱스
create index if not exists idx_parking_lots_location 
on parking_lots(latitude, longitude);

create index if not exists idx_reviews_location 
on reviews(latitude, longitude) 
where subject_type = 'location';

-- 커서 페이지네이션을 위한 복합 인덱스
create index if not exists idx_reviews_created_at_id 
on reviews(created_at desc, id);

create index if not exists idx_parking_lots_created_at_id 
on parking_lots(created_at desc, id);