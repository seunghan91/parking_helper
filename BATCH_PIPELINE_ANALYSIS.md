# 배치 파이프라인 서비스 비교 분석
**작성일**: 2026-01-04
**대상**: Parking Helper 프로젝트 (한국교통안전공단 API 배치 처리)

---

## 📋 개요

프로젝트 요구사항:
- **API 호출**: 한국교통안전공단 API (매일 03:00 AM + 매 10분마다)
- **데이터량**: 약 5-10KB (실시간 주차장 정보)
- **작업 유형**: 단순 (API 호출 → DB 저장)
- **신뢰성**: 높음 (데이터 누락 방지 필수)
- **비용 목표**: 최소화

---

## 1. Render.com 배치 파이프라인 지원 현황

### ✅ 지원 여부
**완전 지원** - Cron Job 서비스 공식 제공

### 📊 주요 사항

| 항목 | 내용 |
|------|------|
| **서비스 유형** | Cron Job (전용 서비스) |
| **스케줄 방식** | Cron expression (표준 형식) |
| **실행 보장** | Single-run guarantee (동시 실행 방지) |
| **최대 실행 시간** | 12시간 |
| **최소 구간** | 1분 (분 단위 정확도) |
| **디스크 지원** | ❌ Persistent disk 미지원 |
| **로깅** | ✅ 실시간 로그 확인 가능 |
| **실패 알림** | ✅ 이메일, 웹훅 지원 |

### 💰 가격

**최소 월 비용**: $1/크론 잡
- 초 단위로 청구 (프로레이트 방식)
- 인스턴스 타입별로 상이
- Starter (512MB, 0.5CPU): $0.016/분 ≈ $23/월 (24시간 실행 기준)

### 장점
✅ 공식 지원, 안정적
✅ 간단한 설정 (GitHub 연결 후 cron expression 입력)
✅ 상세한 로그 제공
✅ Single-run guarantee로 중복 실행 방지

### 단점
❌ 최소 $1/월 (저비용이 아님)
❌ Persistent disk 미지원 (상태 저장 필요 시 외부 DB 의존)
❌ 12시간 제한 (일반적인 배치 작업에는 충분하나 장시간 작업 불가)

---

## 2. 배치 처리 서비스 비교

### 2.1 AWS Lambda + EventBridge

#### 📊 가격

| 항목 | 비용 |
|------|------|
| **EventBridge Scheduler** | 프리티어: 14M 호출/월 (무료) |
| **추가 비용** | $1 / 100만 호출/월 |
| **Lambda 함수** | 프리티어: 100만 요청/월 + 400,000 GB-s (무료) |
| **예상 월 비용** | **$0 ~ $1** (프리티어 범위 내) |

#### ✅ 지원 기능
- ✅ Cron 표현식 지원
- ✅ 최소 1분 단위 스케줄링
- ✅ 자동 재시도 옵션
- ✅ CloudWatch 로그

#### 장점
✅ **완전 무료** (프리티어 범위 내)
✅ 스케일링 자동화
✅ 상세 모니터링

#### 단점
❌ 초기 AWS 학습 곡선 높음
❌ Cold start (5-10초) 가능
❌ 설정 복잡

---

### 2.2 Google Cloud Scheduler + Cloud Functions

#### 📊 가격

| 항목 | 비용 |
|------|------|
| **Cloud Scheduler** | $0.10/잡/31일 (최대 3개 무료) |
| **Cloud Functions** | 프리티어: 200만 호출/월 (무료) |
| **예상 월 비용** | **$0** (3개 잡 이내 + 프리티어) |

#### ✅ 지원 기능
- ✅ Cron 표현식 지원
- ✅ 최소 1분 단위
- ✅ HTTP 트리거

#### 장점
✅ **완전 무료** (3개 잡까지)
✅ 매우 간단한 설정
✅ Google의 신뢰성

#### 단점
❌ 프로젝트당 3개 잡만 무료 (우리는 2개 필요하므로 OK)
❌ 초과 시 $0.10/잡/월

---

### 2.3 Railway

#### 📊 가격

| 항목 | 비용 |
|------|------|
| **사용 모델** | 기본요금 + 사용료 |
| **최소 스케일** | $5/월 (기본 구독) |
| **무료 체험** | $5 크레딧 |
| **예상 월 비용** | **$5~15** |

#### ✅ 지원 기능
- ✅ Cron jobs (5분 최소 간격)
- ✅ 백그라운드 워커

#### 단점
❌ 최소 $5/월 (비용 높음)
❌ 5분 최소 간격 (매 10분은 가능하나 매 3시간은?)

---

### 2.4 Fly.io

#### 📊 가격

| 항목 | 비용 |
|------|------|
| **가격 모델** | 머신 시간 기반 |
| **무료 가용** | 3대의 shared-cpu-1x 256MB (월간) |
| **초과 비용** | $0.01344/시간 (작은 머신) |
| **예상 월 비용** | **$0** (경량 크론) or **$1~5** |

#### ✅ 지원 기능
- ✅ Cron Manager (전용 기능)
- ✅ Supercronic
- ✅ 프로세스 그룹

#### 장점
✅ 무료 머신 가용
✅ 유연한 구성

#### 단점
❌ Volume snapshots 2026년 1월부터 유료화
❌ IPv4 할당 시 $2/월 추가 비용

---

### 2.5 Vercel (현재 사용 중)

#### 📊 가격

| 항목 | 비용 |
|------|------|
| **Hobby 플랜** | 무료 |
| **Pro 플랜** | $20/월 (크레딧 포함) |
| **Cron Jobs** | 모든 플랜에 포함 |
| **제한 사항** | Hobby: 2 크론/일, 시간 단위 정확도 |
| **예상 월 비용** | **$0 (Hobby 유지 시)** |

#### ⚠️ Hobby 플랜 제약
- 2개 크론 잡/일만 가능 (매일 03:00 AM + 매 10분은 불가)
- 시간 단위 정확도만 지원 (분 단위 불가)

#### Pro 플랜 필요
- Pro로 업그레이드 필요 ($20/월)
- 분 단위 정확도 지원

---

### 2.6 Supabase (현재 사용 중)

#### 📊 가격

| 항목 | 비용 |
|------|------|
| **pg_cron** | Free 플랜에 포함 |
| **Edge Functions** | Free: 125,000 호출/월 |
| **예상 월 비용** | **$0 (프리티어 범위)** |

#### ✅ 지원 기능
- ✅ pg_cron (표준 Postgres 확장)
- ✅ Edge Functions와 통합
- ✅ 최소 1초 단위 스케줄링
- ✅ SQL 스니펫 또는 HTTP 요청 지원

#### 장점
✅ **완전 무료** (현재 사용 DB와 통합)
✅ 분 단위 정확도 (최소 1초)
✅ 추가 서비스 불필요

#### 단점
❌ Supabase 종속성
❌ pg_cron 설정 SQL 필요

---

### 2.7 무료 서비스 (EasyCron, cron-job.org)

#### 📊 가격

| 서비스 | 가격 | 정확도 | 신뢰성 |
|--------|------|--------|--------|
| **cron-job.org** | 무료 | 분 단위 | ⚠️ 4-40초 지연 |
| **EasyCron** | 무료 (기본) | 분 단위 | ⚠️ 미지정 |
| **FastCron** | 무료 (기본) | 분 단위 | ⚠️ 미지정 |

#### 장점
✅ 완전 무료

#### 단점
❌ **신뢰성 미보장** (4-40초 지연)
❌ **데이터 누락 위험** (우리 요구사항 위배)
❌ 모니터링 부족

---

## 3. 최종 추천

### 🏆 **최우선 추천: Supabase pg_cron + Edge Functions**

#### 선택 이유

1. **비용**: $0 (현재 이미 사용하고 있음)
2. **신뢰성**: Postgres 기본 기능, 안정성 높음
3. **정확도**: 최소 1초 단위 (한국교통안전공단 API에 충분)
4. **통합성**: 기존 Supabase 인프라와 완벽 통합
5. **구현 난이도**: 낮음 (SQL + Edge Function)

#### 구현 방식

```sql
-- 1. pg_cron 설정 (아침 3시)
SELECT cron.schedule(
  'parking-batch-daily',
  '0 3 * * *',
  'SELECT net.http_post(
    url:=''https://your-domain.com/api/parking/ingest'',
    headers:=jsonb_build_object(''Content-Type'', ''application/json''),
    body:=jsonb_build_object(''batchType'', ''daily'')
  );'
);

-- 2. pg_cron 설정 (10분마다)
SELECT cron.schedule(
  'parking-batch-10min',
  '*/10 * * * *',
  'SELECT net.http_post(
    url:=''https://your-domain.com/api/parking/ingest'',
    headers:=jsonb_build_object(''Content-Type'', ''application/json''),
    body:=jsonb_build_object(''batchType'', ''realtime'')
  );'
);
```

#### 주의사항
- Supabase Free 플랜에서 Edge Functions 호출 125,000/월 제한 (충분)
- 실제로는 2 + 4320 = 4,322 호출/월 필요 (프리티어 내)
- 모니터링을 위해 `cron_jobs` 테이블 추가 권장

---

### 🥈 **차선책: Google Cloud Scheduler + Cloud Functions**

프리티어 한계 도달 시 또는 Google 생태계 활용 시

| 기준 | 평가 |
|------|------|
| 비용 | ⭐⭐⭐⭐⭐ ($0 with 3 free jobs) |
| 신뢰성 | ⭐⭐⭐⭐⭐ |
| 정확도 | ⭐⭐⭐⭐⭐ (분 단위) |
| 설정 난이도 | ⭐⭐⭐⭐ (매우 간단) |
| 통합성 | ⭐⭐⭐ (외부 서비스) |

---

### 🥉 **3순위: AWS Lambda + EventBridge**

기존 AWS 사용 중이거나 복잡한 배치 처리 필요 시

| 기준 | 평가 |
|------|------|
| 비용 | ⭐⭐⭐⭐⭐ ($0 with free tier) |
| 신뢰성 | ⭐⭐⭐⭐⭐ |
| 정확도 | ⭐⭐⭐⭐⭐ (분 단위) |
| 설정 난이도 | ⭐⭐ (복잡함) |
| 통합성 | ⭐⭐ (별도 계정 필요) |

---

## 4. 비용 비교 표

### 월 예상 비용 (우리 사용 패턴: 일일 1회 + 10분마다)

| 서비스 | 기본 비용 | 초과 비용 | 총 월 비용 | 비고 |
|--------|----------|----------|-----------|------|
| **Supabase** | $0 | $0 | **$0** ✅ |  pg_cron 포함 |
| **Google Cloud** | $0 | $0 | **$0** ✅ | 3개 잡 무료 |
| **AWS Lambda** | $0 | $0~1 | **$0~1** ✅ | 프리티어 충분 |
| **Vercel Pro** | $20 | 포함 | **$20** ⚠️ | Hobby 불가 |
| **Render** | $1 | 사용료 | **$1+** ⚠️ | 최소 $1 |
| **Railway** | $5+ | 사용료 | **$5+** ❌ | 기본 구독료 |
| **Fly.io** | $0 | $0-5 | **$0-5** ⚠️ | 무료 머신 사용 시 |

---

## 5. 신뢰성 평가

### 각 서비스의 신뢰성 점수

| 서비스 | 가용성 | 재시도 | 모니터링 | 지연 시간 | 종합 |
|--------|--------|--------|----------|----------|------|
| **Supabase** | ✅⭐⭐⭐⭐ | ❌ | ✅⭐⭐⭐ | ⭐⭐⭐⭐ | 95% |
| **Google Cloud** | ✅⭐⭐⭐⭐⭐ | ✅ | ✅⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 99% |
| **AWS Lambda** | ✅⭐⭐⭐⭐⭐ | ✅ | ✅⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 99% |
| **Render** | ✅⭐⭐⭐⭐ | ✅ | ✅⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 98% |
| **Vercel** | ✅⭐⭐⭐⭐ | ❌ | ✅⭐⭐⭐ | ⭐⭐⭐⭐ | 95% |
| **cron-job.org** | ⚠️⭐⭐ | ❌ | ❌ | ⭐⭐ | 60% |

---

## 6. 구현 가이드

### Supabase 구현 (추천)

#### Step 1: SQL 설정
```sql
-- Edge Function HTTP 헬퍼 테이블
CREATE TABLE IF NOT EXISTS cron_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- pg_cron 확장 활성화 (Supabase 관리자에서 수행)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 일일 배치 (오전 3시)
SELECT cron.schedule(
  'parking-ingest-daily',
  '0 3 * * *',
  'SELECT net.http_post(
    url := current_setting(''parking.api_url'') || ''/api/parking/ingest?type=daily'',
    headers := jsonb_build_object(
      ''Content-Type'', ''application/json'',
      ''Authorization'', ''Bearer '' || current_setting(''parking.api_key'')
    ),
    body := jsonb_build_object(
      ''timestamp'', NOW(),
      ''batch_type'', ''daily''
    )
  ) AS request_id;'
);

-- 실시간 배치 (10분마다)
SELECT cron.schedule(
  'parking-ingest-realtime',
  '*/10 * * * *',
  'SELECT net.http_post(
    url := current_setting(''parking.api_url'') || ''/api/parking/ingest?type=realtime'',
    headers := jsonb_build_object(
      ''Content-Type'', ''application/json'',
      ''Authorization'', ''Bearer '' || current_setting(''parking.api_key'')
    ),
    body := jsonb_build_object(
      ''timestamp'', NOW(),
      ''batch_type'', ''realtime''
    )
  ) AS request_id;'
);
```

#### Step 2: Edge Function (한국교통안전공단 API 호출)
```typescript
// supabase/functions/parking-ingest/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.30.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const korMobilityApiKey = Deno.env.get("KOR_MOBILITY_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface IngestRequest {
  timestamp: string;
  batch_type: 'daily' | 'realtime';
}

serve(async (req) => {
  try {
    const { timestamp, batch_type } = await req.json() as IngestRequest;

    // 한국교통안전공단 API 호출
    const response = await fetch(
      `http://openapi.seoul.go.kr:8088/${korMobilityApiKey}/json/GetParkingInfo/1/1000/`,
      { method: "GET" }
    );

    const data = await response.json();

    // 데이터 저장
    const { error } = await supabase
      .from("parking_lot_data")
      .upsert(
        data.GetParkingInfo.row.map((lot: any) => ({
          parking_id: lot.OID,
          name: lot.PKLT_NM,
          address: lot.ADDR,
          capacity: parseInt(lot.TPKCT),
          available: parseInt(lot.TPKCT) - parseInt(lot.NOW_PRK_VHCL_CNT),
          last_updated: new Date(timestamp),
          batch_type: batch_type,
          raw_data: lot,
        })),
        { onConflict: "parking_id" }
      );

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Ingested ${data.GetParkingInfo.row.length} records`,
        batch_type: batch_type,
        timestamp: timestamp,
      }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Ingest error:", error);
    return new Response(
      JSON.stringify({
        error: String(error),
        timestamp: new Date().toISOString(),
      }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
```

#### Step 3: 모니터링 대시보드 (다음 페이지 추가)
```typescript
// parking-helper-web/src/app/admin/cron-monitoring/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function CronMonitoringPage() {
  const supabase = createClient();

  // 최근 cron 실행 기록 조회
  const { data: cronJobs } = await supabase
    .from('cron_jobs')
    .select('*')
    .order('last_run_at', { ascending: false })
    .limit(10);

  // 데이터 수집 통계
  const { data: stats } = await supabase
    .from('parking_lot_data')
    .select('batch_type, COUNT(*) as count, MAX(last_updated) as latest', {
      count: 'exact',
    })
    .group_by('batch_type');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Cron Job Monitoring</h1>

      {/* 실행 기록 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Recent Executions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th>Job Name</th>
                <th>Last Run</th>
                <th>Next Run</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {cronJobs?.map(job => (
                <tr key={job.id} className="border-t">
                  <td className="py-2">{job.name}</td>
                  <td>{new Date(job.last_run_at).toLocaleString('ko-KR')}</td>
                  <td>{new Date(job.next_run_at).toLocaleString('ko-KR')}</td>
                  <td>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      job.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 데이터 통계 */}
      <div className="grid grid-cols-2 gap-4">
        {stats?.map(stat => (
          <div key={stat.batch_type} className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">{stat.batch_type}</p>
            <p className="text-2xl font-bold">{stat.count}</p>
            <p className="text-xs text-gray-500">
              Latest: {new Date(stat.latest).toLocaleString('ko-KR')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 7. 마이그레이션 전략

### 현재 상태
- Vercel + Supabase 사용 중
- Cron 작업: 미구현

### 마이그레이션 경로

**선택안 1: Supabase pg_cron 사용 (권장)**
```
현재 상태 → pg_cron 활성화 → Edge Function 생성 → 테스트 → 프로덕션 배포
소요 시간: 2-3일
비용: $0
위험도: 낮음
```

**선택안 2: Google Cloud로 마이그레이션**
```
GCP 계정 생성 → Cloud Scheduler + Functions 설정 → 테스트 → 전환
소요 시간: 3-5일
비용: $0
위험도: 중간 (외부 서비스 추가)
```

**선택안 3: 이중화 (최고 신뢰성)**
```
Supabase pg_cron (주) + Google Cloud Scheduler (백업)
- 매일 03:00: Supabase만 실행
- 매 10분: Supabase가 먼저 시도, 실패 시 Google Cloud가 보충
비용: $0
위험도: 매우 낮음 (권장)
```

---

## 결론

### 🎯 최종 추천안

**Supabase pg_cron + Edge Functions (이중화 고려)**

| 기준 | 평가 |
|------|------|
| **비용** | **$0/월** ✅ |
| **신뢰성** | **95%+** (이중화 시 99%+) ✅ |
| **정확도** | **초 단위** ✅ |
| **구현 난이도** | **낮음** ✅ |
| **유지보수** | **쉬움** (기존 인프라 활용) ✅ |
| **확장성** | **높음** (Supabase 기본 기능) ✅ |

### 이유

1. **기존 투자 활용**: 이미 Supabase 사용 중
2. **제로 추가 비용**: pg_cron은 포함 기능
3. **높은 신뢰성**: Postgres 기본 기능
4. **간단한 구현**: SQL 기반
5. **모니터링**: 기존 대시보드와 통합 가능

### 다음 단계

1. Supabase 관리자에 pg_cron 활성화 요청
2. 모니터링 테이블 생성 SQL 작성
3. Edge Function 코드 구현
4. 스테이징 환경에서 테스트
5. 프로덕션 배포 (이중화 고려)

---

## 참고자료

### Render.com
- [Cron Jobs Documentation](https://render.com/docs/cronjobs)
- [Render Pricing](https://render.com/pricing)

### Google Cloud
- [Cloud Scheduler Pricing](https://cloud.google.com/scheduler/pricing)
- [Cloud Scheduler Documentation](https://cloud.google.com/scheduler/docs)

### AWS
- [Lambda + EventBridge](https://docs.aws.amazon.com/lambda/latest/dg/with-eventbridge-scheduler.html)
- [AWS Lambda Pricing](https://aws.amazon.com/lambda/pricing/)

### Railway
- [Cron Jobs on Railway](https://docs.railway.com/reference/cron-jobs)
- [Railway Pricing](https://railway.com/pricing)

### Fly.io
- [Task Scheduling Guide](https://fly.io/docs/blueprints/task-scheduling/)
- [Fly.io Pricing](https://fly.io/pricing/)

### Vercel
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Vercel Pricing](https://vercel.com/pricing)

### Supabase
- [Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions)
- [pg_cron Guide](https://supabase.com/docs/guides/cron)
- [Supabase Pricing](https://supabase.com/pricing)
