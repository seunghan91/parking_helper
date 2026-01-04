# 주차장 데이터 동기화 구현 가이드

## 📚 목차
1. [빠른 시작 (Quick Start)](#빠른-시작)
2. [완전한 구현 예제](#완전한-구현-예제)
3. [트러블슈팅](#트러블슈팅)
4. [성능 최적화](#성능-최적화)

---

## 빠른 시작

### 1단계: 환경 설정

```bash
# 1. .env.local 파일 생성
cat > parking-helper-web/.env.local << 'EOF'
# 공공 API
PUBLIC_API_KEY=your_key_from_data_go_kr
SEOUL_API_KEY=5a414e69727468653836444b6f6949

# Kakao API (선택사항)
KAKAO_REST_API_KEY=your_kakao_key

# 배치 작업
CRON_SECRET=your_secret_for_cron

# Redis (실시간 캐시)
UPSTASH_REDIS_REST_URL=https://us1-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# 알림
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
EOF

# 2. 패키지 설치
cd parking-helper-web
npm install node-cron axios zod
npm install -D @types/node-cron
```

### 2단계: 데이터베이스 마이그레이션

```bash
# supabase CLI를 사용하여 마이그레이션 생성
npx supabase migration new add_parking_realtime

# 마이그레이션 파일 생성 후:
npx supabase db push
```

마이그레이션 파일 (`supabase/migrations/00006_add_parking_realtime.sql`):

```sql
-- parking_lot_realtime 테이블
CREATE TABLE parking_lot_realtime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_lot_id BIGINT NOT NULL REFERENCES parking_lots(id),
  current_vehicles INT,
  available_spaces INT,
  occupancy_rate DECIMAL(5, 2),
  status TEXT CHECK (status IN ('available', 'busy', 'full', 'unknown')),
  data_source VARCHAR(50),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (parking_lot_id) REFERENCES parking_lots(id) ON DELETE CASCADE
);

CREATE INDEX idx_parking_lot_realtime ON parking_lot_realtime(parking_lot_id);
CREATE INDEX idx_recorded_at ON parking_lot_realtime(recorded_at DESC);

-- 외부 ID 매핑 테이블
CREATE TABLE parking_lot_external_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_lot_id BIGINT NOT NULL REFERENCES parking_lots(id),
  source VARCHAR(50) NOT NULL,
  external_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(source, external_id),
  FOREIGN KEY (parking_lot_id) REFERENCES parking_lots(id) ON DELETE CASCADE
);

CREATE INDEX idx_external_id ON parking_lot_external_ids(source, external_id);
```

### 3단계: 배치 작업 구현

```bash
# 디렉토리 구조
mkdir -p parking-helper-web/jobs/parking
mkdir -p parking-helper-web/lib/parking-api
```

`parking-helper-web/jobs/parking/daily-sync.ts`:

```typescript
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY
const PUBLIC_API_URL = 'http://apis.data.go.kr/B553881/Parking'

interface ApiResponse {
  prk_center_id: string
  prk_plce_nm: string
  prk_plce_adres: string
  prk_plce_entrc_la: number
  prk_plce_entrc_lo: number
  prk_cmprt_co?: number
  bsc_prk_crg?: number
  bsc_prk_hr?: number
  add_prk_crg?: number
  add_prk_hr?: number
  day_max_crg?: number
  tel_no?: string
  crnt_prk_vhcl_co?: number
  avbl_rate?: number
}

export async function syncParkingDaily() {
  console.log('🔄 Starting daily parking sync...')

  const startTime = Date.now()
  let totalCount = 0

  try {
    // 페이징으로 전체 데이터 조회
    let pageNo = 1
    let hasMore = true

    while (hasMore) {
      try {
        const response = await axios.get(PUBLIC_API_URL, {
          params: {
            key: PUBLIC_API_KEY,
            type: 'json',
            pageNo,
            numOfRows: 1000,
          },
          timeout: 30000,
        })

        const items = response.data?.response?.body?.items || []

        if (!items || items.length === 0) {
          hasMore = false
          break
        }

        // 데이터 변환
        const parkingLots = items
          .filter((item: ApiResponse) => item.prk_plce_entrc_la && item.prk_plce_entrc_lo)
          .map((item: ApiResponse) => ({
            name: item.prk_plce_nm,
            address: item.prk_plce_adres,
            latitude: item.prk_plce_entrc_la,
            longitude: item.prk_plce_entrc_lo,
            total_spaces: item.prk_cmprt_co || null,
            basic_rate_won: item.bsc_prk_crg || null,
            basic_rate_minutes: item.bsc_prk_hr || null,
            additional_rate_won: item.add_prk_crg || null,
            additional_rate_minutes: item.add_prk_hr || null,
            daily_max_won: item.day_max_crg || null,
            phone_number: item.tel_no,
            public_api_id: item.prk_center_id,
            data_source: 'public_api',
            last_synced_at: new Date().toISOString(),
          }))

        // Upsert 처리 (중복 제거)
        const { error } = await supabase
          .from('parking_lots')
          .upsert(parkingLots, {
            onConflict: 'public_api_id',
          })

        if (error) {
          console.error(`❌ Upsert error on page ${pageNo}:`, error)
          // 계속 진행하거나 별도 처리
        }

        totalCount += parkingLots.length
        console.log(`✅ Page ${pageNo}: ${parkingLots.length} items synced`)

        pageNo++

        // API 호출 제한 회피
        await new Promise((resolve) => setTimeout(resolve, 500))

      } catch (pageError) {
        console.error(`⚠️ Error on page ${pageNo}:`, pageError)
        // 페이지 재시도 로직 가능
        pageNo++
        if (pageNo > 150) break // 안전 장치
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(
      `✅ Daily sync completed: ${totalCount} parking lots in ${duration}s`
    )

    // Slack 알림
    await notifySlack(
      `✅ Daily Parking Sync Complete\n• Items: ${totalCount}\n• Duration: ${duration}s`,
      'good'
    )

    return { success: true, count: totalCount }
  } catch (error) {
    console.error('❌ Daily sync failed:', error)

    // Slack 알림
    await notifySlack(
      `❌ Daily Parking Sync Failed\n• Error: ${error instanceof Error ? error.message : 'Unknown'}`,
      'danger'
    )

    throw error
  }
}

async function notifySlack(message: string, color: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return

  try {
    await axios.post(webhookUrl, {
      attachments: [
        {
          color,
          text: message,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    })
  } catch (error) {
    console.error('Failed to send Slack notification:', error)
  }
}
```

### 4단계: Cron 작업 설정 (Vercel)

`parking-helper-web/app/api/cron/parking-sync/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { syncParkingDaily } from '@/jobs/parking/daily-sync'

export async function GET(request: NextRequest) {
  // Vercel의 Cron Secret으로 보안 확인
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await syncParkingDaily()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

`vercel.json` 추가:

```json
{
  "crons": [
    {
      "path": "/api/cron/parking-sync",
      "schedule": "0 3 * * *"
    }
  ]
}
```

### 5단계: 검색 API 구현

`parking-helper-web/app/api/parking/search/route.ts` 업데이트:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius') || '1000'

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'lat and lng are required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const latNum = parseFloat(lat)
  const lngNum = parseFloat(lng)
  const radiusNum = parseFloat(radius) / 1000 // m → km

  try {
    // 위도/경도 범위 계산 (대략적)
    const latDelta = radiusNum / 111
    const lngDelta = radiusNum / (111 * Math.cos((latNum * Math.PI) / 180))

    // 주차장 조회
    const { data: parkingLots, error } = await supabase
      .from('parking_lots')
      .select(
        `
        id,
        name,
        address,
        latitude,
        longitude,
        total_spaces,
        basic_rate_won,
        basic_rate_minutes,
        daily_max_won,
        phone_number,
        parking_lot_realtime (
          current_vehicles,
          available_spaces,
          occupancy_rate,
          status,
          recorded_at
        )
      `
      )
      .gte('latitude', latNum - latDelta)
      .lte('latitude', latNum + latDelta)
      .gte('longitude', lngNum - lngDelta)
      .lte('longitude', lngNum + lngDelta)
      .limit(20)

    if (error) throw error

    // 거리 계산 및 정렬
    const enrichedLots = parkingLots
      .map((lot) => {
        const distance = calculateDistance(
          latNum,
          lngNum,
          lot.latitude,
          lot.longitude
        )
        return {
          ...lot,
          distance_m: Math.round(distance),
          realtime: lot.parking_lot_realtime[0] || null,
        }
      })
      .sort((a, b) => a.distance_m - b.distance_m)

    return NextResponse.json({
      data: enrichedLots,
      count: enrichedLots.length,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search parking lots' },
      { status: 500 }
    )
  }
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
```

---

## 완전한 구현 예제

### 실시간 캐시 시스템

`lib/parking-api/cache.ts`:

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export interface CachedRealtime {
  parking_lot_id: number
  current_vehicles: number
  available_spaces: number
  occupancy_rate: number
  status: 'available' | 'busy' | 'full' | 'unknown'
  cached_at: number
}

const REALTIME_CACHE_TTL = 10 * 60 // 10분

export async function getRealTimeData(
  parkingLotId: number
): Promise<CachedRealtime | null> {
  const cacheKey = `parking:realtime:${parkingLotId}`

  try {
    // 캐시 조회
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached as string)
    }

    // 캐시 미스 → API 호출
    const data = await fetchRealtimeFromAPI(parkingLotId)
    if (data) {
      // 캐시 저장
      await redis.setex(cacheKey, REALTIME_CACHE_TTL, JSON.stringify(data))
    }

    return data
  } catch (error) {
    console.error(`Cache error for parking lot ${parkingLotId}:`, error)
    return null
  }
}

async function fetchRealtimeFromAPI(
  parkingLotId: number
): Promise<CachedRealtime | null> {
  // 한국교통안전공단 API 호출
  const response = await fetch(
    `http://apis.data.go.kr/B553881/Parking/get?key=${process.env.PUBLIC_API_KEY}&prk_center_id=${parkingLotId}`
  )

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()
  const item = data.response?.body?.items[0]

  if (!item) return null

  return {
    parking_lot_id: parkingLotId,
    current_vehicles: item.crnt_prk_vhcl_co || 0,
    available_spaces: item.avbl_prk_space_co || 0,
    occupancy_rate: item.avbl_rate || 0,
    status: calculateStatus(item.avbl_rate),
    cached_at: Date.now(),
  }
}

function calculateStatus(rate: number): 'available' | 'busy' | 'full' | 'unknown' {
  if (rate >= 80) return 'full'
  if (rate >= 50) return 'busy'
  if (rate >= 0) return 'available'
  return 'unknown'
}

export async function invalidateCache(parkingLotId: number) {
  const cacheKey = `parking:realtime:${parkingLotId}`
  await redis.del(cacheKey)
}

export async function invalidateAllCache() {
  // 모든 주차장 캐시 무효화 (배치 후)
  const keys = await redis.keys('parking:realtime:*')
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}
```

### 데이터 동기화 매니저

`lib/parking-api/sync-manager.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import { invalidateAllCache } from './cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface SyncResult {
  success: boolean
  inserted: number
  updated: number
  failed: number
  duration_ms: number
  error?: string
}

export async function syncAndInvalidateCache(): Promise<SyncResult> {
  const startTime = Date.now()

  try {
    // 1. 메인 동기화 실행
    const syncResult = await syncParkingLots()

    // 2. 성공 시 캐시 전체 무효화
    await invalidateAllCache()

    const duration_ms = Date.now() - startTime

    return {
      success: true,
      ...syncResult,
      duration_ms,
    }
  } catch (error) {
    return {
      success: false,
      inserted: 0,
      updated: 0,
      failed: 0,
      duration_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function syncParkingLots(): Promise<{
  inserted: number
  updated: number
  failed: number
}> {
  // 실제 동기화 로직
  return {
    inserted: 0,
    updated: 0,
    failed: 0,
  }
}

export async function getLastSyncStatus() {
  const { data } = await supabase
    .from('parking_lots')
    .select('last_synced_at')
    .order('last_synced_at', { ascending: false })
    .limit(1)
    .single()

  return data?.last_synced_at || null
}
```

---

## 트러블슈팅

### 문제 1: API 응답이 느림 (>5초)

**증상**: `/api/parking/search` 응답이 5초 이상 소요

**원인**:
1. 데이터베이스 인덱스 부족
2. 위치 기반 검색이 비효율적

**해결책**:

```sql
-- PostGIS 인덱스 추가 (더 효율적)
CREATE INDEX idx_parking_location ON parking_lots
USING GIST (ll_to_earth(latitude, longitude));

-- 또는 기본 인덱스 (PostGIS 없을 경우)
CREATE INDEX idx_parking_coords ON parking_lots(latitude, longitude);

-- 쿼리 최적화
EXPLAIN ANALYZE
SELECT * FROM parking_lots
WHERE latitude BETWEEN ? AND ?
  AND longitude BETWEEN ? AND ?
LIMIT 20;
```

### 문제 2: 배치 작업이 실패함

**증상**: 일일 동기화 크론 작업이 실패

**원인**:
1. API 인증 키 만료
2. 네트워크 타임아웃
3. 데이터베이스 연결 실패

**해결책**:

```typescript
// 재시도 로직 추가
async function syncWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await syncParkingDaily()
    } catch (error) {
      if (i === maxRetries - 1) throw error

      const backoff = Math.pow(2, i) * 1000 // 1s, 2s, 4s
      console.log(`Retry ${i + 1} after ${backoff}ms...`)
      await new Promise(resolve => setTimeout(resolve, backoff))
    }
  }
}
```

### 문제 3: 캐시 히트율이 낮음 (<50%)

**증상**: Redis 캐시가 효율적으로 작동하지 않음

**원인**:
1. TTL이 너무 짧음 (5분 → 10분 권장)
2. 사용자 접근 패턴이 불규칙

**해결책**:

```typescript
// 캐시 통계 모니터링
import { Redis } from '@upstash/redis'

async function getRedisStats() {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })

  const keys = await redis.keys('parking:realtime:*')
  const info = await redis.info()

  return {
    cached_items: keys.length,
    memory_usage: info.used_memory_human,
    hit_rate: info.keyspace_hits / (info.keyspace_hits + info.keyspace_misses),
  }
}
```

### 문제 4: 중복된 주차장 데이터

**증상**: 같은 주차장이 여러 번 저장됨

**원인**: 다중 소스 (한국교통안전공단 + 서울시) 통합 시 매칭 미흡

**해결책**:

```sql
-- 외부 ID로 중복 제거
WITH dedup AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY public_api_id
      ORDER BY last_synced_at DESC
    ) as rn
  FROM parking_lots
  WHERE public_api_id IS NOT NULL
)
DELETE FROM parking_lots
WHERE id IN (SELECT id FROM dedup WHERE rn > 1);

-- Fuzzy matching으로 서울시 데이터 매칭
SELECT
  p1.id,
  p2.id,
  similarity(p1.name, p2.name) as name_similarity,
  ST_Distance(
    ST_MakePoint(p1.longitude, p1.latitude),
    ST_MakePoint(p2.longitude, p2.latitude)
  ) * 111000 as distance_m
FROM parking_lots p1
INNER JOIN parking_lots p2
  ON p1.data_source = 'public_api'
  AND p2.data_source = 'seoul_api'
WHERE similarity(p1.name, p2.name) > 0.7
  AND ST_Distance(...) < 100; -- 100m 이내
```

---

## 성능 최적화

### 최적화 1: 데이터베이스 쿼리

```typescript
// ❌ 나쁜 예 (N+1 문제)
const lots = await supabase.from('parking_lots').select('*')
const results = lots.map(async (lot) => {
  const realtime = await supabase
    .from('parking_lot_realtime')
    .select('*')
    .eq('parking_lot_id', lot.id)
  return { ...lot, realtime }
})

// ✅ 좋은 예 (Join 사용)
const results = await supabase
  .from('parking_lots')
  .select(`
    *,
    parking_lot_realtime (*)
  `)
```

### 최적화 2: 캐시 전략

```typescript
// 계층적 캐시
// L1: 브라우저 캐시 (IndexedDB, 1시간)
// L2: Redis 캐시 (10분)
// L3: 데이터베이스

async function getParkingLot(id: number) {
  // L1 체크
  const browserCached = await idb.get('parking', id)
  if (browserCached && isRecent(browserCached)) {
    return browserCached
  }

  // L2 체크
  const redisCached = await redis.get(`parking:${id}`)
  if (redisCached) {
    await idb.put('parking', redisCached)
    return redisCached
  }

  // L3 조회
  const data = await supabase
    .from('parking_lots')
    .select('*')
    .eq('id', id)
    .single()

  // 캐시 저장
  await redis.setex(`parking:${id}`, 600, JSON.stringify(data))
  await idb.put('parking', data)

  return data
}
```

### 최적화 3: API 응답 압축

```typescript
// gzip 압축 자동화 (Next.js)
// next.config.js
module.exports = {
  compress: true, // 기본값
  experimental: {
    optimizePackageImports: ["lodash-es", "date-fns"],
  },
}
```

### 최적화 4: 배치 작업 병렬화

```typescript
// ❌ 순차 처리 (너무 느림)
for (const page of pages) {
  await fetchAndSync(page)
}

// ✅ 병렬 처리 (5개 동시)
const batchSize = 5
for (let i = 0; i < pages.length; i += batchSize) {
  const batch = pages.slice(i, i + batchSize)
  await Promise.all(batch.map(page => fetchAndSync(page)))
}
```

---

## 모니터링 대시보드 (선택사항)

```typescript
// /app/api/admin/monitoring/route.ts
export async function GET() {
  const supabase = await createClient()

  // 1. 동기화 상태
  const { data: lastSync } = await supabase
    .from('parking_lots')
    .select('last_synced_at')
    .order('last_synced_at', { ascending: false })
    .limit(1)
    .single()

  // 2. 데이터 통계
  const { count: totalLots } = await supabase
    .from('parking_lots')
    .select('id', { count: 'exact' })

  // 3. 캐시 통계
  const redisStats = await getRedisStats()

  return new Response(
    JSON.stringify({
      last_sync: lastSync?.last_synced_at,
      total_parking_lots: totalLots,
      cache_stats: redisStats,
      timestamp: new Date().toISOString(),
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
```

---

## 다음 단계

1. ✅ 기본 동기화 (1주)
2. ⏳ 실시간 캐시 추가 (1주)
3. ⏳ 다중소스 통합 (2주)
4. ⏳ 지역 확장 (월 1회)

더 궁금한 점이 있으면 PARKING_DATA_SOURCES_ANALYSIS.md를 참고하세요!
