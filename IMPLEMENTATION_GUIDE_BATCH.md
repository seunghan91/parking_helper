# 배치 파이프라인 구현 가이드
**대상**: Parking Helper - Supabase pg_cron 기반 배치 처리
**예상 소요 시간**: 2-3시간

---

## 📋 구현 체크리스트

### Phase 1: 데이터베이스 설정 (30분)

- [ ] Supabase 대시보드 접근
- [ ] pg_cron 확장 활성화
- [ ] pg_net 확장 활성화
- [ ] 모니터링 테이블 생성

### Phase 2: Edge Function 개발 (60분)

- [ ] parking-ingest Edge Function 작성
- [ ] 환경변수 설정
- [ ] 로컬 테스트
- [ ] 배포

### Phase 3: pg_cron 스케줄 등록 (30분)

- [ ] 일일 배치 스케줄 생성 (03:00)
- [ ] 실시간 배치 스케줄 생성 (10분마다)
- [ ] 스케줄 실행 확인

### Phase 4: 모니터링 및 테스트 (60분)

- [ ] 수동 테스트 (함수 호출)
- [ ] 로그 확인
- [ ] 에러 처리 검증
- [ ] 모니터링 대시보드 구성

---

## Phase 1: 데이터베이스 설정

### Step 1.1: Supabase에서 SQL Editor 열기

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. 좌측 메뉴 → "SQL Editor"
4. "New Query" 클릭

### Step 1.2: 확장 프로그램 활성화

```sql
-- pg_cron 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA cron;

-- pg_net 확장 활성화 (HTTP 요청용)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 확장 프로그램 확인
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
```

✅ 결과: 2개의 행이 반환되면 성공

### Step 1.3: 모니터링 테이블 생성

```sql
-- 배치 작업 실행 기록 테이블
CREATE TABLE IF NOT EXISTS batch_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name VARCHAR(255) NOT NULL,
  batch_type VARCHAR(50) NOT NULL, -- 'daily' or 'realtime'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed'
  record_count INTEGER,
  error_message TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (빠른 조회)
CREATE INDEX IF NOT EXISTS idx_batch_execution_job_name ON batch_execution_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_batch_execution_created_at ON batch_execution_logs(created_at DESC);

-- 최근 10개 기록만 유지하는 정책 (선택사항)
ALTER TABLE batch_execution_logs SET (fillfactor = 70);
```

### Step 1.4: 실시간 주차장 데이터 테이블 확인

```sql
-- 기존 parking_lot_data 테이블 구조 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'parking_lot_data'
ORDER BY ordinal_position;

-- 만약 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS parking_lot_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  capacity INTEGER,
  available INTEGER,
  occupied INTEGER,
  occupancy_rate DECIMAL(5,2),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  batch_type VARCHAR(50), -- 'daily' or 'realtime'
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_parking_updated ON parking_lot_data(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_parking_batch ON parking_lot_data(batch_type);
```

---

## Phase 2: Edge Function 개발

### Step 2.1: Edge Function 생성

```bash
# 프로젝트 루트에서 실행
cd parking-helper-web

# Edge Function 생성
supabase functions new parking-ingest
```

### Step 2.2: Function 코드 작성

**파일**: `supabase/functions/parking-ingest/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// 환경변수
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const korApiKey = Deno.env.get("KOREAN_PARKING_API_KEY")!; // 한국교통안전공단 API 키

if (!supabaseUrl || !supabaseServiceKey || !korApiKey) {
  throw new Error("Missing required environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface IngestRequest {
  batchType?: "daily" | "realtime";
  timestamp?: string;
}

interface ParkingRecord {
  OID: string;
  PKLT_NM: string;
  ADDR: string;
  TPKCT: string;
  NOW_PRK_VHCL_CNT: string;
  NOW_PRK_VHCL_UPDT_TM: string;
  PAY_YN_NM: string;
  WD_OPER_BGNG_TM: string;
  WD_OPER_END_TM: string;
  BSC_PRK_CRG: string;
  BSC_PRK_HR: string;
  [key: string]: string;
}

interface ParkingInfoResponse {
  GetParkingInfo?: {
    list_total_count: number;
    RESULT?: { CODE: string; MESSAGE: string };
    row: ParkingRecord[];
  };
}

serve(async (req) => {
  // CORS 처리
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const requestBody =
      req.method === "POST" ? await req.json() : {} as IngestRequest;
    const batchType = requestBody.batchType || "realtime";
    const timestamp = requestBody.timestamp || new Date().toISOString();

    console.log(`[${timestamp}] Starting ${batchType} batch...`);

    // 한국교통안전공단 API 호출
    const apiUrl = `http://openapi.seoul.go.kr:8088/${korApiKey}/json/GetParkingInfo/1/1000/`;

    console.log(`[${timestamp}] Calling Korean Parking API...`);
    const apiResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Parking-Helper-Bot/1.0",
      },
    });

    if (!apiResponse.ok) {
      throw new Error(
        `API error: ${apiResponse.status} ${apiResponse.statusText}`
      );
    }

    const apiData = (await apiResponse.json()) as ParkingInfoResponse;

    if (!apiData.GetParkingInfo || !apiData.GetParkingInfo.row) {
      throw new Error("Invalid API response format");
    }

    const parkingRecords = apiData.GetParkingInfo.row;
    console.log(
      `[${timestamp}] Retrieved ${parkingRecords.length} records from API`
    );

    // 데이터 변환 및 저장
    const transformedRecords = parkingRecords.map((record) => {
      const capacity = parseInt(record.TPKCT || "0", 10);
      const occupied = parseInt(record.NOW_PRK_VHCL_CNT || "0", 10);
      const available = Math.max(0, capacity - occupied);

      return {
        parking_id: record.OID,
        name: record.PKLT_NM,
        address: record.ADDR,
        capacity: capacity,
        available: available,
        occupied: occupied,
        occupancy_rate: capacity > 0 ? (occupied / capacity) * 100 : 0,
        last_updated: new Date(timestamp),
        batch_type: batchType,
        raw_data: record,
      };
    });

    console.log(`[${timestamp}] Transformed ${transformedRecords.length} records`);

    // Supabase에 upsert
    const { error: upsertError, count } = await supabase
      .from("parking_lot_data")
      .upsert(transformedRecords, {
        onConflict: "parking_id",
        ignoreDuplicates: false,
      })
      .select("id");

    if (upsertError) {
      throw new Error(`Upsert error: ${upsertError.message}`);
    }

    console.log(`[${timestamp}] Successfully upserted records`);

    // 실행 로그 저장
    const { error: logError } = await supabase
      .from("batch_execution_logs")
      .insert({
        job_name: `parking-ingest-${batchType}`,
        batch_type: batchType,
        status: "success",
        record_count: transformedRecords.length,
        completed_at: new Date().toISOString(),
      });

    if (logError) {
      console.error(`[${timestamp}] Log insertion error:`, logError);
    }

    // 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully ingested ${transformedRecords.length} records`,
        batchType: batchType,
        timestamp: timestamp,
        recordCount: transformedRecords.length,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("ERROR:", errorMessage);

    // 에러 로그 저장 시도
    const { batchType = "unknown" } = req.method === "POST"
      ? await req.json().catch(() => ({}))
      : {};

    await supabase.from("batch_execution_logs").insert({
      job_name: `parking-ingest-${batchType}`,
      batch_type: batchType as string,
      status: "failed",
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    }).catch((err) => console.error("Log save failed:", err));

    // 에러 응답
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 500,
      }
    );
  }
});
```

### Step 2.3: 환경변수 설정

**파일**: `supabase/.env.local`

```bash
# Korean Parking API Key
KOREAN_PARKING_API_KEY=5a414e69727468653836444b6f6949

# 또는 Supabase 대시보드에서 설정
```

**Supabase 대시보드에서 설정하는 방법**:
1. Project Settings → Functions
2. "Add Variable" 클릭
3. Name: `KOREAN_PARKING_API_KEY`
4. Value: `5a414e69727468653836444b6f6949`

### Step 2.4: 로컬 테스트

```bash
# Edge Function 시작
supabase functions serve

# 다른 터미널에서 테스트
curl -X POST http://localhost:54321/functions/v1/parking-ingest \
  -H "Content-Type: application/json" \
  -d '{"batchType":"daily","timestamp":"2026-01-04T03:00:00Z"}'
```

**예상 응답**:
```json
{
  "success": true,
  "message": "Successfully ingested 1234 records",
  "batchType": "daily",
  "recordCount": 1234
}
```

### Step 2.5: 배포

```bash
# Edge Function 배포
supabase functions deploy parking-ingest

# 배포 확인
supabase functions list
```

---

## Phase 3: pg_cron 스케줄 등록

### Step 3.1: 일일 배치 스케줄 생성

**Supabase SQL Editor에서 실행**:

```sql
-- 기존 스케줄 삭제 (있는 경우)
SELECT cron.unschedule('parking-ingest-daily');

-- 일일 배치: 매일 오전 3시
SELECT cron.schedule(
  'parking-ingest-daily',
  '0 3 * * *',
  $$
  SELECT
    CASE
      WHEN net.http_post(
        url := 'https://YOUR_PROJECT.supabase.co/functions/v1/parking-ingest',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
        ),
        body := jsonb_build_object(
          'batchType', 'daily',
          'timestamp', NOW()::text
        ),
        timeout_milliseconds := 30000
      ).status_code = 200 THEN 'success'
      ELSE 'failed'
    END as result;
  $$
);

-- 스케줄 확인
SELECT * FROM cron.job WHERE jobname LIKE 'parking-ingest%';
```

### Step 3.2: 실시간 배치 스케줄 생성

```sql
-- 기존 스케줄 삭제 (있는 경우)
SELECT cron.unschedule('parking-ingest-realtime');

-- 실시간 배치: 매 10분마다
SELECT cron.schedule(
  'parking-ingest-realtime',
  '*/10 * * * *',
  $$
  SELECT
    CASE
      WHEN net.http_post(
        url := 'https://YOUR_PROJECT.supabase.co/functions/v1/parking-ingest',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
        ),
        body := jsonb_build_object(
          'batchType', 'realtime',
          'timestamp', NOW()::text
        ),
        timeout_milliseconds := 30000
      ).status_code = 200 THEN 'success'
      ELSE 'failed'
    END as result;
  $$
);

-- 스케줄 확인
SELECT jobname, schedule, last_successful_run FROM cron.job
WHERE jobname LIKE 'parking-ingest%';
```

### Step 3.3: 스케줄 조정 (한국 시간대)

```sql
-- 한국 시간대로 설정
-- UTC 기준: 한국은 UTC+9이므로 03:00 KST = 18:00 UTC (전날)
SELECT cron.schedule(
  'parking-ingest-daily',
  '0 18 * * *',  -- UTC 18:00 = KST 03:00+1day
  $$...$$
);
```

⚠️ **주의**: Supabase 서버의 시간대 확인 필요

```sql
-- 현재 서버 시간 확인
SELECT NOW(), NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'Asia/Seoul';
```

---

## Phase 4: 모니터링 및 테스트

### Step 4.1: 수동 테스트

```bash
# Edge Function 직접 호출 (테스트)
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/parking-ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"batchType":"daily"}'
```

### Step 4.2: 실행 로그 확인

**Supabase SQL Editor**:

```sql
-- 최근 실행 기록 조회
SELECT
  job_name,
  batch_type,
  status,
  record_count,
  error_message,
  completed_at
FROM batch_execution_logs
ORDER BY created_at DESC
LIMIT 20;

-- 오늘의 실행 통계
SELECT
  batch_type,
  status,
  COUNT(*) as execution_count,
  SUM(record_count) as total_records,
  MAX(completed_at) as last_run
FROM batch_execution_logs
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY batch_type, status;

-- 실패한 작업 조회
SELECT
  job_name,
  batch_type,
  error_message,
  completed_at
FROM batch_execution_logs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

### Step 4.3: pg_cron 실행 기록 확인

```sql
-- cron 작업 상태 확인
SELECT
  jobid,
  jobname,
  schedule,
  last_successful_run,
  last_run_duration
FROM cron.job
WHERE jobname LIKE 'parking-ingest%';

-- 모든 작업 로그 조회 (pg_cron 확장에서 자동 생성)
SELECT
  jobid,
  jobname,
  started,
  finished,
  command
FROM cron.job_run_details
ORDER BY started DESC
LIMIT 20;
```

### Step 4.4: 모니터링 대시보드 구축 (선택사항)

**파일**: `parking-helper-web/src/app/admin/batch-monitoring/page.tsx`

```typescript
import { createClient } from "@/lib/supabase/server";

export default async function BatchMonitoringPage() {
  const supabase = createClient();

  // 최근 실행 기록
  const { data: logs } = await supabase
    .from("batch_execution_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  // 통계
  const { data: stats } = await supabase
    .from("batch_execution_logs")
    .select("batch_type, status, COUNT(*) as count", { count: "exact" })
    .group_by("batch_type", "status");

  // 최근 데이터
  const { data: recentData } = await supabase
    .from("parking_lot_data")
    .select("batch_type, COUNT(*) as count, MAX(last_updated) as latest")
    .group_by("batch_type");

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Batch Processing Monitor</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        {recentData?.map((data) => (
          <div
            key={data.batch_type}
            className="bg-white rounded-lg shadow p-4"
          >
            <h3 className="text-sm font-medium text-gray-600">
              {data.batch_type}
            </h3>
            <p className="text-2xl font-bold">{data.count}</p>
            <p className="text-xs text-gray-500">
              Latest: {new Date(data.latest).toLocaleString("ko-KR")}
            </p>
          </div>
        ))}
      </div>

      {/* 실행 로그 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Execution Logs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Job Name</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Records</th>
                <th className="px-6 py-3 text-left">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs?.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{log.job_name}</td>
                  <td className="px-6 py-3">{log.batch_type}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.status === "success"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">{log.record_count || "N/A"}</td>
                  <td className="px-6 py-3 text-gray-500">
                    {log.completed_at
                      ? new Date(log.completed_at).toLocaleString("ko-KR")
                      : "In Progress"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 에러 알림 */}
      {logs?.some((l) => l.status === "failed") && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-2">⚠️ Recent Failures</h3>
          {logs
            .filter((l) => l.status === "failed")
            .slice(0, 5)
            .map((log) => (
              <div key={log.id} className="text-sm text-red-700 mb-2">
                <strong>{log.job_name}</strong>: {log.error_message}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 테스트 시나리오

### 테스트 1: 즉시 실행

```sql
-- pg_cron 없이 직접 Edge Function 호출 테스트
SELECT net.http_post(
  url := 'https://YOUR_PROJECT.supabase.co/functions/v1/parking-ingest',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
  ),
  body := jsonb_build_object(
    'batchType', 'daily',
    'timestamp', NOW()::text
  )
);
```

### 테스트 2: 스케줄 동작 확인

```bash
# 3분 뒤에 작동하는 임시 스케줄로 테스트
SELECT cron.schedule(
  'test-parking-ingest',
  '*/1 * * * *',  -- 1분마다
  'SELECT net.http_post(...);'
);

# 1분 후 확인
SELECT * FROM batch_execution_logs ORDER BY created_at DESC LIMIT 1;

# 테스트 완료 후 삭제
SELECT cron.unschedule('test-parking-ingest');
```

### 테스트 3: 에러 처리

```bash
# API 키 오류 시뮬레이션
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/parking-ingest \
  -H "Content-Type: application/json" \
  -d '{"batchType":"daily","invalidKey":true}'

# 로그 확인
SELECT * FROM batch_execution_logs
WHERE status = 'failed'
ORDER BY created_at DESC LIMIT 1;
```

---

## 🐛 문제 해결

### 문제 1: 스케줄이 실행되지 않음

```sql
-- pg_cron 상태 확인
SELECT * FROM pg_stat_statements WHERE query LIKE '%cron%';

-- 권한 확인
SELECT * FROM information_schema.schemata WHERE schema_name = 'cron';

-- 로그 확인
SELECT * FROM cron.job_run_details ORDER BY started DESC LIMIT 10;
```

### 문제 2: Edge Function 실패

```bash
# Supabase 로그 확인
supabase functions logs parking-ingest

# 또는 Web Dashboard → Functions → parking-ingest → Logs
```

### 문제 3: API 호출 실패

```sql
-- URL 확인
SELECT net.http_post(
  url := 'http://openapi.seoul.go.kr:8088/5a414e69727468653836444b6f6949/json/GetParkingInfo/1/10/',
  body := '{}'
);
```

---

## 📊 성능 최적화 (선택사항)

### 인덱스 추가

```sql
-- 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_parking_occupancy
ON parking_lot_data(occupancy_rate DESC);

CREATE INDEX IF NOT EXISTS idx_parking_address
ON parking_lot_data USING gin(to_tsvector('korean', address));
```

### 파티셔닝 (대용량 처리 필요 시)

```sql
-- 월별 파티셔닝 (선택사항)
CREATE TABLE parking_lot_data_2026_01 PARTITION OF parking_lot_data
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

---

## ✅ 최종 체크리스트

- [x] pg_cron, pg_net 확장 활성화
- [x] 모니터링 테이블 생성
- [x] Edge Function 작성 및 배포
- [x] 환경변수 설정
- [x] 일일 스케줄 생성
- [x] 실시간 스케줄 생성
- [x] 수동 테스트 완료
- [x] 로그 확인 가능
- [x] 모니터링 대시보드 구축 (선택)

---

## 📞 지원 및 문서

- [Supabase pg_cron 문서](https://supabase.com/docs/guides/cron)
- [Supabase Edge Functions 문서](https://supabase.com/docs/guides/functions)
- [한국교통안전공단 API](http://data.seoul.go.kr/dataList/datasetDetail/S_02220200601110410E0052383/fileSummary.do)

---

**완료!** 이제 배치 파이프라인이 자동으로 작동합니다. 🚀
