-- ========================================
-- Supabase pg_cron 배치 스케줄 설정
-- ========================================

-- 주의: 이 파일은 Supabase Dashboard에서 수동으로 실행해야 합니다
-- SQL Editor → New Query → 이 파일의 내용을 복사 → Run

-- ========================================
-- 1. 매일 03:00 AM - 한국교통안전공단 전체 동기화
-- ========================================

-- 기존 스케줄 삭제 (있는 경우)
SELECT cron.unschedule('parking-koroads-daily') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'parking-koroads-daily'
);

-- 새 스케줄 생성
SELECT cron.schedule(
  'parking-koroads-daily',
  '0 3 * * *', -- 매일 03:00 AM (UTC)
  'SELECT net.http_post(
    url := concat(
      current_setting(''app.supabase_url''),
      ''/functions/v1/parking-batch-daily''
    ),
    headers := jsonb_build_object(
      ''Content-Type'', ''application/json'',
      ''Authorization'', ''Bearer '' || current_setting(''app.service_role_key'')
    ),
    body := ''{}''
  ) AS result;'
);

-- ========================================
-- 2. 매 10분마다 - 실시간 주차 현황 업데이트
-- ========================================

SELECT cron.schedule(
  'parking-realtime-sync',
  '*/10 * * * *', -- 매 10분마다
  'SELECT net.http_post(
    url := concat(
      current_setting(''app.supabase_url''),
      ''/functions/v1/parking-batch-realtime''
    ),
    headers := jsonb_build_object(
      ''Content-Type'', ''application/json'',
      ''Authorization'', ''Bearer '' || current_setting(''app.service_role_key'')
    ),
    body := ''{}''
  ) AS result;'
);

-- ========================================
-- 3. 매주 금요일 정오 - 신규 주차장 검색 (카카오맵)
-- ========================================

SELECT cron.schedule(
  'parking-kakao-weekly',
  '0 12 * * 5', -- 매주 금요일 12:00 PM
  'SELECT net.http_post(
    url := concat(
      current_setting(''app.supabase_url''),
      ''/functions/v1/parking-batch-kakao''
    ),
    headers := jsonb_build_object(
      ''Content-Type'', ''application/json'',
      ''Authorization'', ''Bearer '' || current_setting(''app.service_role_key'')
    ),
    body := ''{}''
  ) AS result;'
);

-- ========================================
-- 4. 매일 04:00 AM - 배치 실행 로그 정리
-- ========================================

SELECT cron.schedule(
  'parking-cleanup-logs',
  '0 4 * * *', -- 매일 04:00 AM
  'DELETE FROM public.batch_execution_logs
   WHERE created_at < NOW() - INTERVAL ''90 days'';'
);

-- ========================================
-- 5. 매일 04:30 AM - 오래된 실시간 데이터 정리
-- ========================================

SELECT cron.schedule(
  'parking-cleanup-realtime',
  '30 4 * * *', -- 매일 04:30 AM
  'DELETE FROM public.parking_realtime
   WHERE created_at < NOW() - INTERVAL ''365 days'';'
);

-- ========================================
-- 스케줄 상태 확인
-- ========================================

-- 등록된 모든 주차 관련 스케줄 확인
SELECT
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  next_run AT TIME ZONE 'Asia/Seoul' as next_run_kst
FROM cron.job
WHERE jobname LIKE 'parking-%'
ORDER BY jobname;

-- 최근 실행 결과 확인
SELECT
  jobid,
  jobname,
  start_time AT TIME ZONE 'Asia/Seoul' as start_time_kst,
  end_time AT TIME ZONE 'Asia/Seoul' as end_time_kst,
  succeeded,
  return_message
FROM cron.job_run_details
WHERE jobname LIKE 'parking-%'
ORDER BY jobid DESC, start_time DESC
LIMIT 20;
