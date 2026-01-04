-- ========================================
-- 주차장 배치 처리 인프라 (한국교통안전공단 API)
-- ========================================

-- 1. pg_cron 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. parking_sources: 데이터 소스별 ID 매핑
-- 한국교통안전공단, 서울시 API, 카카오맵 등 여러 소스에서 같은 주차장 식별
CREATE TABLE IF NOT EXISTS public.parking_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_lot_id UUID NOT NULL REFERENCES public.parking_lots(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('koroads', 'seoul', 'kakao', 'naver')),
  external_id TEXT NOT NULL,
  external_name TEXT,
  raw_data JSONB, -- 원본 API 응답 저장 (디버깅/감사용)
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_type, external_id) -- 소스별 중복 제거
);
CREATE INDEX IF NOT EXISTS idx_parking_sources_parking_lot ON public.parking_sources(parking_lot_id);
CREATE INDEX IF NOT EXISTS idx_parking_sources_external_id ON public.parking_sources(source_type, external_id);

-- 3. parking_realtime: 실시간 주차 현황
-- 매 10분마다 업데이트되는 변동성 데이터
CREATE TABLE IF NOT EXISTS public.parking_realtime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_lot_id UUID NOT NULL REFERENCES public.parking_lots(id) ON DELETE CASCADE,
  available_spaces INT, -- 가능 주차면 수
  total_spaces INT, -- 전체 주차면 수
  occupancy_rate DECIMAL(5, 2), -- 점유율 (0-100%)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parking_realtime_parking_lot ON public.parking_realtime(parking_lot_id);
CREATE INDEX IF NOT EXISTS idx_parking_realtime_updated_at ON public.parking_realtime(updated_at DESC);

-- 최근 데이터만 유지하는 정책: 최대 365일 보관
-- (시계열 데이터이므로 오래된 데이터는 자동 삭제)
CREATE OR REPLACE FUNCTION public.cleanup_old_parking_realtime()
RETURNS void AS $$
BEGIN
  DELETE FROM public.parking_realtime
  WHERE created_at < NOW() - INTERVAL '365 days';
END;
$$ LANGUAGE plpgsql;

-- 4. batch_execution_logs: 배치 작업 실행 로그
-- 각 배치 실행의 성공/실패 상태, 처리된 레코드 수 등 기록
CREATE TABLE IF NOT EXISTS public.batch_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_type TEXT NOT NULL CHECK (batch_type IN ('daily_full_sync', 'hourly_realtime', 'weekly_new_parking')),
  source_type TEXT NOT NULL, -- 'koroads', 'seoul', 'kakao' 등
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'partial', 'failed')),

  -- 처리 통계
  total_records INT DEFAULT 0, -- 수신한 전체 레코드 수
  inserted_count INT DEFAULT 0, -- 새로 삽입된 레코드
  updated_count INT DEFAULT 0, -- 업데이트된 레코드
  failed_count INT DEFAULT 0, -- 실패한 레코드

  -- 실행 정보
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INT, -- 실행 시간 (밀리초)

  -- 에러 정보
  error_message TEXT,
  error_details JSONB, -- 상세 에러 스택/정보

  -- 메타데이터
  api_request_id TEXT, -- API 요청 ID (재시도 추적용)
  next_retry_at TIMESTAMPTZ,
  retry_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_batch_logs_batch_type ON public.batch_execution_logs(batch_type);
CREATE INDEX IF NOT EXISTS idx_batch_logs_status ON public.batch_execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_batch_logs_created_at ON public.batch_execution_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_logs_next_retry ON public.batch_execution_logs(next_retry_at)
  WHERE status IN ('pending', 'failed') AND next_retry_at IS NOT NULL;

-- 5. parking_batch_config: 배치 설정 및 상태 추적
CREATE TABLE IF NOT EXISTS public.parking_batch_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_type TEXT NOT NULL UNIQUE CHECK (batch_type IN ('daily_full_sync', 'hourly_realtime', 'weekly_new_parking')),
  is_enabled BOOLEAN DEFAULT TRUE,
  schedule_cron TEXT NOT NULL, -- Cron expression (예: '0 3 * * *')
  last_run_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  consecutive_failures INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  retry_delay_minutes INT DEFAULT 5,

  -- 알림 설정
  alert_on_failure BOOLEAN DEFAULT TRUE,
  alert_email TEXT,

  -- 정보
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 배치 설정 초기화 데이터
INSERT INTO public.parking_batch_config (batch_type, schedule_cron, description)
VALUES
  ('daily_full_sync', '0 3 * * *', '매일 03:00 AM 주차장 기본정보 동기화'),
  ('hourly_realtime', '*/10 * * * *', '매 10분마다 실시간 주차 현황 업데이트'),
  ('weekly_new_parking', '0 12 * * 5', '매주 금요일 정오 신규 주차장 검색')
ON CONFLICT (batch_type) DO NOTHING;

-- 6. parking_lots 테이블 확장 (기존 테이블에 칼럼 추가)
-- 다음 칼럼들을 추가하여 배치 처리 메타데이터 관리
ALTER TABLE public.parking_lots
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'koroads',
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS external_data JSONB; -- 원본 API 응답 저장

-- 7. parking_realtime 뷰: 최신 주차 현황 조회용
CREATE OR REPLACE VIEW public.parking_realtime_current AS
SELECT
  pl.id as parking_lot_id,
  pl.name,
  pl.address,
  pl.latitude,
  pl.longitude,
  pr.available_spaces,
  pr.total_spaces,
  pr.occupancy_rate,
  pr.updated_at,
  EXTRACT(EPOCH FROM (NOW() - pr.updated_at))/60 as minutes_ago
FROM public.parking_lots pl
LEFT JOIN LATERAL (
  SELECT * FROM public.parking_realtime
  WHERE parking_lot_id = pl.id
  ORDER BY created_at DESC
  LIMIT 1
) pr ON TRUE
WHERE pl.is_active = TRUE
ORDER BY pl.latitude, pl.longitude;

-- 8. RLS 정책 설정
ALTER TABLE public.parking_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_realtime ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_batch_config ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 읽기 가능
CREATE POLICY "Users can read parking sources" ON public.parking_sources
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Users can read parking realtime" ON public.parking_realtime
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Users can read batch logs" ON public.batch_execution_logs
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Users can read batch config" ON public.parking_batch_config
  FOR SELECT TO authenticated USING (TRUE);

-- 서비스 롤 (배치 작업용)이 쓰기 권한 갖도록 설정
-- 참고: service_role은 RLS를 무시하므로 별도 정책 불필요

-- 9. 유용한 함수들

-- 함수: 주차장 중복 제거 및 병합
CREATE OR REPLACE FUNCTION public.merge_parking_lots(
  p_primary_id UUID,
  p_secondary_id UUID
)
RETURNS void AS $$
BEGIN
  -- 보조 주차장의 source 데이터를 주 주차장으로 병합
  UPDATE public.parking_sources
  SET parking_lot_id = p_primary_id
  WHERE parking_lot_id = p_secondary_id;

  -- 보조 주차장의 reviews를 주 주차장으로 병합
  UPDATE public.reviews
  SET parking_lot_id = p_primary_id
  WHERE parking_lot_id = p_secondary_id;

  -- 보조 주차장의 realtime 데이터를 주 주차장으로 병합
  UPDATE public.parking_realtime
  SET parking_lot_id = p_primary_id
  WHERE parking_lot_id = p_secondary_id;

  -- 보조 주차장 삭제
  DELETE FROM public.parking_lots WHERE id = p_secondary_id;

  -- 로그 기록
  INSERT INTO public.batch_execution_logs
    (batch_type, source_type, status, total_records, inserted_count, error_message)
  VALUES
    ('daily_full_sync', 'manual', 'success', 1, 0, 'Merged parking lot ' || p_secondary_id || ' into ' || p_primary_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수: 배치 실행 기록
CREATE OR REPLACE FUNCTION public.log_batch_execution(
  p_batch_type TEXT,
  p_source_type TEXT,
  p_status TEXT,
  p_total_records INT DEFAULT 0,
  p_inserted_count INT DEFAULT 0,
  p_updated_count INT DEFAULT 0,
  p_failed_count INT DEFAULT 0,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_duration_ms INT;
  v_started_at TIMESTAMPTZ;
BEGIN
  v_started_at := NOW();
  v_duration_ms := EXTRACT(EPOCH FROM (NOW() - v_started_at)) * 1000;

  INSERT INTO public.batch_execution_logs (
    batch_type, source_type, status, total_records, inserted_count, updated_count, failed_count,
    error_message, completed_at, duration_ms
  )
  VALUES (
    p_batch_type, p_source_type, p_status, p_total_records, p_inserted_count, p_updated_count, p_failed_count,
    p_error_message, NOW(), v_duration_ms
  )
  RETURNING id INTO v_log_id;

  -- 성공 시 배치 설정의 상태 업데이트
  IF p_status = 'success' THEN
    UPDATE public.parking_batch_config
    SET
      last_success_at = NOW(),
      last_run_at = NOW(),
      consecutive_failures = 0
    WHERE batch_type = p_batch_type;
  ELSIF p_status IN ('failed', 'partial') THEN
    UPDATE public.parking_batch_config
    SET
      last_run_at = NOW(),
      consecutive_failures = consecutive_failures + 1
    WHERE batch_type = p_batch_type;
  END IF;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_parking_lots_coordinates
  ON public.parking_lots USING gist(ll_to_earth(latitude, longitude))
  WHERE is_active = TRUE;

-- 11. 테이블 코멘트 (문서화)
COMMENT ON TABLE public.parking_sources IS '주차장 데이터 소스별 ID 매핑 (한국교통안전공단, 서울시 등)';
COMMENT ON TABLE public.parking_realtime IS '실시간 주차 현황 (매 10분마다 업데이트)';
COMMENT ON TABLE public.batch_execution_logs IS '배치 작업 실행 로그 및 모니터링';
COMMENT ON TABLE public.parking_batch_config IS '배치 설정 및 스케줄 관리';

COMMENT ON COLUMN public.parking_sources.raw_data IS '원본 API 응답 (디버깅/감사용)';
COMMENT ON COLUMN public.parking_realtime.occupancy_rate IS '점유율 (0-100%, NULL=데이터 없음)';
COMMENT ON COLUMN public.batch_execution_logs.error_details IS 'API 에러, 네트워크 에러 등 상세 정보';
