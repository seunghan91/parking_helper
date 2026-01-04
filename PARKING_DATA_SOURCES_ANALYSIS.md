# 한국 주차장 정보 데이터 소스 조사 및 분석 보고서

## 📋 목차
1. [한국 주차장 데이터 소스 현황](#1-한국-주차장-데이터-소스-현황)
2. [데이터 소스별 상세 분석](#2-데이터-소스별-상세-분석)
3. [데이터 구조 및 필드](#3-데이터-구조-및-필드)
4. [동기화 전략 비교](#4-동기화-전략-비교)
5. [구현 방식 추천](#5-구현-방식-추천)
6. [샘플 코드](#6-샘플-코드)
7. [마이그레이션 체크리스트](#7-마이그레이션-체크리스트)

---

## 1. 한국 주차장 데이터 소스 현황

### 1.1 주요 데이터 소스 분류

```
┌─────────────────────────────────────────────────────────────┐
│             한국 주차장 정보 데이터 소스 Map                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📊 공공데이터 (Public Data)                                 │
│  ├─ 중앙 정부 (데이터 go.kr)                                │
│  │  ├─ 한국교통안전공단 (국가 주차정보 시스템)              │
│  │  └─ 한국환경공단 (EV 충전소 정보)                        │
│  │                                                           │
│  ├─ 서울시 (data.seoul.go.kr)                              │
│  │  ├─ 공영주차장 실시간 정보 (GetParkingInfo)             │
│  │  └─ 노상/노외 주차장 통합 정보                           │
│  │                                                           │
│  └─ 지방자체단체                                             │
│     ├─ 경기도 (data.gg.go.kr)                               │
│     ├─ 대구시 (pis.daegu.go.kr)                             │
│     └─ 기타 광역시/도                                        │
│                                                               │
│  🗺️ 지도 API (Map Service APIs)                             │
│  ├─ 카카오맵 API (PK6 카테고리)                              │
│  ├─ 네이버 지도 API                                         │
│  └─ 구글 지도 API                                           │
│                                                               │
│  🅿️ 민간 주차 플랫폼                                         │
│  ├─ 모두의 주차장 (민간)                                    │
│  ├─ 아이파킹 (민간)                                         │
│  ├─ 넥스트랩 (기술 제공)                                    │
│  └─ 제휴 가능한 주차 관제 시스템                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 데이터 소스별 상세 분석

### 2.1 한국교통안전공단 (국가 주차정보 API)

**📌 개요**
- 주차장법에 의거하여 운영되는 **국가 표준 주차장 정보 시스템**
- 전국 13만+ 주차장 정보 관리
- OpenAPI 형태로 공공데이터포털을 통해 제공

**🔑 API 정보**
| 항목 | 정보 |
|------|------|
| **API 명칭** | 한국교통안전공단_주차정보 제공 API |
| **서비스 URL** | `http://apis.data.go.kr/B553881/Parking` |
| **인증 방식** | OpenAPI 키 (신청 후 발급) |
| **호출 방식** | REST API (JSON/XML) |
| **갱신 주기** | 실시간 (~20분) |
| **비용** | 무료 |
| **신청 방법** | data.go.kr에서 활용신청 |

**📊 제공 데이터**
```
기본 정보
├─ 주차장 ID (prk_center_id)
├─ 주차장명 (prk_plce_nm)
├─ 주소 (prk_plce_adres, new_adres)
├─ 위도/경도 (prk_plce_entrc_la, prk_plce_entrc_lo)
└─ 주차장 유형 (노외/노상/기계식 등)

운영 정보
├─ 운영시간 (평일/주말/휴일)
├─ 요금 정보 (기본요금, 추가요금, 일최대요금)
├─ 할인 정보
└─ 운영 구분 (시간제/월정기/기타)

실시간 정보
├─ 총 주차구획수 (prk_cmprt_co)
├─ 현재 주차 차량수 (crnt_prk_vhcl_co)
├─ 여유 주차면수 (avbl_prk_space_co)
├─ 수용율 (avbl_rate)
└─ 업데이트 시간 (updt_dt, updt_time)

부가 정보
├─ 전화번호 (tel_no)
├─ 장비 정보 (EV충전기, 장애인시설 등)
└─ 공동이용 여부 및 관리자 정보
```

**✅ 장점**
- ✓ 국가 표준 데이터 (신뢰도 높음)
- ✓ 전국 커버리지 (13만+ 주차장)
- ✓ 실시간 데이터 (~20분 갱신)
- ✓ 완전 무료
- ✓ 법적 근거 명확
- ✓ 통일된 데이터 포맷

**❌ 단점**
- ✗ API 신청 후 승인 필요 (1-2주)
- ✗ 데이터 품질: 관리자 등록 오차 가능성
- ✗ 실시간성 제한: 약 20분 지연
- ✗ 민간/카쉐어링 주차장은 포함 안 됨
- ✗ 사용자 리뷰/평점 없음

**🔄 동기화 권장 전략**
```
Daily Batch (매일 03:00 AM)
├─ 전체 주차장 정보 수집 (기본정보, 운영시간, 요금)
├─ 새로운 주차장 추가 감지
├─ 폐쇄/변경된 주차장 업데이트
└─ 변경사항을 `data_source='public_api'`로 표시

Hourly Cache (매시간 XX:00)
├─ 실시간 주차 가능 여부만 캐시
├─ 요청 API와 연동
└─ 응답 시간 <1초 보장
```

---

### 2.2 서울시 공영주차장 API (GetParkingInfo)

**📌 개요**
- 서울시 공영주차장 **실시간 정보** 특화
- 약 14,000여개 노상/노외 주차장 커버
- 가장 상세한 실시간 데이터 제공

**🔑 API 정보**
| 항목 | 정보 |
|------|------|
| **API 명칭** | 서울시 시영주차장 실시간 주차대수 정보 |
| **서비스 URL** | `http://openapi.seoul.go.kr:8088/{KEY}/json/GetParkingInfo/{START}/{END}/{ADDR}` |
| **인증키** | `5a414e69727468653836444b6f6949` (공개) |
| **호출 방식** | REST API (JSON/XML) |
| **갱신 주기** | 비정기 (자료 변경 시) → 실제로는 5-10분 |
| **비용** | 무료 |
| **페이징** | 최대 1000건/요청 |

**📊 응답 필드 (Actual Data)**
```json
{
  "PKLT_CD": "171721",                    // 주차장 코드
  "PKLT_NM": "세종로 공영주차장(시)",     // 주차장명
  "ADDR": "종로구 세종로 80-1",           // 주소
  "PKLT_TYPE": "NW",                      // 주차장 유형 (NW=노외)
  "PRK_TYPE_NM": "노외 주차장",

  // 실시간 현황
  "TPKCT": 1260,                          // 총 주차면수
  "NOW_PRK_VHCL_CNT": 698,                // 현재 주차 차량수
  "NOW_PRK_VHCL_UPDT_TM": "2025-08-29 10:41:50",  // 업데이트 시간

  // 운영 정보
  "PAY_YN_NM": "유료",                    // 유무료 구분
  "OPER_SE_NM": "시간제 주차장",          // 운영 구분

  // 운영시간
  "WD_OPER_BGNG_TM": "0000",              // 평일 시작시간
  "WD_OPER_END_TM": "2400",               // 평일 종료시간
  "WE_OPER_BGNG_TM": "0000",              // 주말 시작시간
  "WE_OPER_END_TM": "2400",               // 주말 종료시간
  "LHLDY_OPER_BGNG_TM": "0000",           // 공휴일 시작시간
  "LHLDY_OPER_END_TM": "2400",            // 공휴일 종료시간

  // 요금 정보 (승용차)
  "BSC_PRK_CRG": 430,                     // 기본 요금
  "BSC_PRK_HR": 5,                        // 기본 시간 (분)
  "ADD_PRK_CRG": 430,                     // 추가 요금
  "ADD_PRK_HR": 5,                        // 추가 시간 (분)
  "DAY_MAX_CRG": 30900,                   // 일 최대 요금

  // 버스 요금
  "BUS_BSC_PRK_CRG": 0,
  "BUS_BSC_PRK_HR": 0,
  "BUS_ADD_PRK_CRG": 0,
  "BUS_ADD_PRK_HR": 0,

  // 기타
  "SAT_CHGD_FREE_SE": "N",                // 토요일 무료 여부
  "LHLDY_CHGD_FREE_SE": "N",              // 공휴일 무료 여부
  "TELNO": "02-2290-6566",                // 전화번호
  "SHRN_PKLT_YN": "N",                    // 공동이용 여부
}
```

**✅ 장점**
- ✓ 가장 완전한 실시간 데이터
- ✓ 기본정보 + 실시간 현황 통합
- ✓ 상세한 요금 정보
- ✓ 인증키 공개 (신청 불필요)
- ✓ 간단한 호출 형식

**❌ 단점**
- ✗ 서울시만 가능 (지방 미지원)
- ✗ 갱신 주기 불규칙
- ✗ 데이터 정확성 편차 (오류 데이터 존재)
- ✗ 좌표(위도/경도) 미제공
- ✗ 민간 주차장 미포함

**🔄 동기화 권장 전략**
```
Real-Time Cache (매 10분)
├─ 실시간 주차 현황만 갱신
├─ 한국교통안전공단 데이터와 매칭
├─ 중복 제거 (PKLT_CD 기반)
└─ 캐시 TTL: 5분

Cross-Region Sync (서울만)
├─ 다른 지역은 한국교통안전공단으로 대체
└─ Data source 명확히 표시
```

---

### 2.3 카카오맵 API

**📌 개요**
- 지도 기반 **장소 검색** 전문
- 카테고리 기반 장소 검색 (PK6 = 주차장)
- 사용자 친화적 인터페이스

**🔑 API 정보**
| 항목 | 정보 |
|------|------|
| **API 명칭** | 카카오 Local API - 카테고리 검색 |
| **카테고리** | `PK6` (주차장) |
| **서비스 URL** | `https://dapi.kakao.com/v2/local/search/category.json` |
| **인증 방식** | REST API 키 (Authorization: KakaoAK {KEY}) |
| **호출 방식** | GET/POST |
| **응답 포맷** | JSON |
| **비용** | 무료 (일일 30,000건 제한) |
| **신청** | developers.kakao.com에서 발급 |

**📊 응답 필드 (예상)**
```json
{
  "documents": [
    {
      "place_name": "나이스파크 가산 아스크타워 주차장",
      "category_name": "시설 > 주차장",
      "phone": "02-XXXX-XXXX",
      "address_name": "서울 금천구 디지털로10길 37",
      "road_address_name": "서울 금천구 가산동",
      "x": "127.0836139",                 // 경도
      "y": "37.4768119",                  // 위도
      "place_url": "http://place.map.kakao.com/..."
    }
  ],
  "meta": {
    "same_name": {...},
    "pageable_count": 15,
    "total_count": 253,
    "is_end": false
  }
}
```

**✅ 장점**
- ✓ 실시간 검색 (사용자가 지도에서 본 주차장)
- ✓ 사용자 리뷰 통합 (place_url로 이동 가능)
- ✓ 좌표 정보 포함
- ✓ 거리 기반 검색 가능
- ✓ 네이버/카카오 지도 통합 가능

**❌ 단점**
- ✗ 실시간 가용 정보 없음 (정적 정보만)
- ✗ 요금/운영시간 정보 미흡
- ✗ 현황 정보 업데이트 느림
- ✗ 일일 호출 제한 (30,000건)
- ✗ 민간 주차장 정보 편차

**🔄 동기화 권장 전략**
```
Discovery Phase (주 1회)
├─ 신규 주차장 발견 (PK6 카테고리)
├─ 좌표 정보 추출
├─ 한국교통안전공단 데이터와 매칭
└─ 중복 제거

Enrichment Phase (수동)
├─ Place URL로 사용자 리뷰 수집
├─ 외부 링크 저장
└─ 관리자가 수동으로 검증
```

---

### 2.4 네이버 지도 API

**📌 개요**
- 네이버 지도 기반 **장소 검색** API
- 카카오맵과 유사한 기능 제공
- Geocoding/Reverse Geocoding 지원

**🔑 API 정보**
| 항목 | 정보 |
|------|------|
| **API 명칭** | 네이버 지도 API - 지역 검색 |
| **서비스 URL** | `https://openapi.naver.com/v1/search/local` |
| **인증 방식** | Client ID + Client Secret (Header) |
| **호출 방식** | GET |
| **응답 포맷** | JSON/XML |
| **비용** | 무료 (일일 25,000건 제한) |
| **신청** | ncloud.com에서 발급 |

**📊 응답 필드 (예상)**
```json
{
  "lastBuildDate": "2025-08-29T10:41:50+0900",
  "total": 253,
  "start": 1,
  "display": 10,
  "items": [
    {
      "title": "나이스파크 가산 아스크타워 <b>주차장</b>",
      "link": "http://naver.com/",
      "category": "시설 > 주차장",
      "description": "네이버에서 제공하는 정보",
      "telephone": "02-XXXX-XXXX",
      "address": "서울 금천구 가산동",
      "roadAddress": "서울 금천구 디지털로10길 37",
      "mapx": "127.08361",                 // 경도 (X)
      "mapy": "37.47681"                   // 위도 (Y)
    }
  ]
}
```

**✅ 장점**
- ✓ 카카오맵과 유사한 기능
- ✓ 거리 기반 검색
- ✓ 좌표 정보 포함
- ✓ 네이버 지도 UI 연동 용이

**❌ 단점**
- ✗ 카카오맵과 동일한 제한
- ✗ 실시간 가용 정보 없음
- ✗ 요금/운영시간 정보 미흡
- ✗ 두 API 모두 사용하면 관리 복잡

**🔄 동기화 권장 전략**
```
One API Selection
└─ 카카오맵 또는 네이버 중 하나만 선택
   (동일 기능이므로 관리 단순화)
```

---

### 2.5 지역별 공공 데이터 (경기, 대구 등)

**📌 개요**
- 각 지역의 **공영주차장 정보** 전문
- 개별 신청/승인 필요

**🔑 주요 지역별 정보**

| 지역 | 포털 | API | 주요 필드 |
|------|------|-----|----------|
| **경기도** | data.gg.go.kr | Yes | 주차장명, 위도/경도, 요금, 운영시간 |
| **대구시** | pis.daegu.go.kr | Yes | 실시간 정보, 구획수, 수용율 |
| **부산시** | data.busan.go.kr | No (파일만) | 기본정보만 |
| **인천시** | data.incheon.go.kr | 제한적 | 제한된 정보 |

**✅ 장점**
- ✓ 지역 맞춤 정보
- ✓ 완전 무료

**❌ 단점**
- ✗ 각각 신청/승인 필요
- ✗ API 포맷 불일치 (표준화 미흡)
- ✗ 갱신 주기 불규칙
- ✗ 커버리지 제한 (일부 지역만)

---

## 3. 데이터 구조 및 필드

### 3.1 통합 데이터 모델

프로젝트의 **parking_lots 테이블**에 기존 구조가 있습니다:

```sql
-- 현재 스키마 (parking_lots 테이블)
CREATE TABLE parking_lots (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  total_spaces INT,
  data_source VARCHAR(50) NOT NULL,        -- 'public_api', 'user_generated'
  public_data_id VARCHAR(100) UNIQUE,      -- 공공데이터 API의 고유 ID
  created_at DATETIME,
  updated_at DATETIME
);
```

### 3.2 추천 확장 스키마

```sql
-- 확장된 parking_lots 테이블
CREATE TABLE parking_lots (
  -- 기본 정보
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,

  -- 공공 데이터 ID 매핑 (다중 소스)
  public_api_id VARCHAR(100),              -- 한국교통안전공단 ID
  seoul_api_id VARCHAR(100),               -- 서울시 GetParkingInfo ID
  kakao_id VARCHAR(100),                   -- 카카오맵 Place ID
  naver_id VARCHAR(100),                   -- 네이버 지도 ID

  -- 주차장 유형
  type ENUM(
    'public_building',                     -- 노외 (공용건물)
    'street',                              -- 노상 (도로)
    'mechanical',                          -- 기계식
    'private',                             -- 민간
    'other'                                -- 기타
  ),

  -- 운영 정보
  operator_name VARCHAR(255),              -- 관리 기관명
  operator_type ENUM('public', 'private', 'joint'),
  phone_number VARCHAR(20),

  -- 기본 요금 정보 (한국교통안전공단 기준)
  basic_rate_won INT,                      -- 기본 요금 (원)
  basic_rate_minutes INT,                  -- 기본 요금 시간 (분)
  additional_rate_won INT,                 -- 추가 요금
  additional_rate_minutes INT,             -- 추가 시간 (분)
  daily_max_won INT,                       -- 일최대 요금

  // 버스 요금 (옵션)
  bus_basic_rate_won INT,
  bus_basic_rate_minutes INT,

  // 운영시간
  weekday_open_time VARCHAR(4),            // "0000"
  weekday_close_time VARCHAR(4),           // "2400"
  weekend_open_time VARCHAR(4),
  weekend_close_time VARCHAR(4),
  holiday_open_time VARCHAR(4),
  holiday_close_time VARCHAR(4),

  // 운영 현황
  is_operating BOOLEAN DEFAULT true,
  is_full_day_open BOOLEAN,                // 24시간 운영 여부

  // 용량 정보
  total_spaces INT,
  handicap_spaces INT,
  electric_vehicle_spaces INT,
  large_vehicle_spaces INT,

  // 부가 기능
  has_elevator BOOLEAN DEFAULT false,
  has_wheelchair_access BOOLEAN DEFAULT false,
  has_ev_charging BOOLEAN DEFAULT false,
  has_valet_service BOOLEAN DEFAULT false,
  has_night_operation BOOLEAN DEFAULT false,

  // 할인 정보
  saturday_free BOOLEAN DEFAULT false,
  holiday_free BOOLEAN DEFAULT false,
  member_discount_percent INT,

  // 데이터 관리
  data_source VARCHAR(50),                 // 'public_api', 'seoul_api', 'kakao_api', 'user_generated'
  last_synced_at DATETIME,
  sync_status ENUM('synced', 'pending', 'error') DEFAULT 'pending',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_public_api_id (public_api_id),
  UNIQUE KEY uk_seoul_api_id (seoul_api_id),
  INDEX idx_location (latitude, longitude),
  INDEX idx_type (type),
  INDEX idx_data_source (data_source)
);

-- 실시간 정보 테이블 (시계열 데이터)
CREATE TABLE parking_lot_realtime (
  id UUID PRIMARY KEY,
  parking_lot_id UUID NOT NULL,

  // 실시간 현황
  current_vehicles INT,
  available_spaces INT,
  occupancy_rate DECIMAL(5, 2),            // 0-100%

  // 상태
  status ENUM('available', 'busy', 'full', 'unknown') DEFAULT 'unknown',

  // 메타데이터
  data_source VARCHAR(50),
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (parking_lot_id) REFERENCES parking_lots(id),
  INDEX idx_parking_lot_id (parking_lot_id),
  INDEX idx_recorded_at (recorded_at)
);

-- 데이터 소스 매핑 (다중 ID 관리)
CREATE TABLE parking_lot_external_ids (
  id UUID PRIMARY KEY,
  parking_lot_id UUID NOT NULL,

  source VARCHAR(50) NOT NULL,             // 'public_api', 'seoul_api', 'kakao_api', 'naver_api'
  external_id VARCHAR(100) NOT NULL,

  FOREIGN KEY (parking_lot_id) REFERENCES parking_lots(id),
  UNIQUE KEY uk_source_external_id (source, external_id),
  INDEX idx_parking_lot_id (parking_lot_id)
);
```

### 3.3 필드 매핑표

**한국교통안전공단 API → parking_lots 테이블**

| 한국교통안전공단 필드 | 테이블 컬럼 | 변환 로직 |
|-------------------|----------|---------|
| `prk_center_id` | `public_api_id` | 직접 매핑 |
| `prk_plce_nm` | `name` | 직접 매핑 |
| `prk_plce_adres` | `address` | 직접 매핑 |
| `prk_plce_entrc_la` | `latitude` | 직접 매핑 |
| `prk_plce_entrc_lo` | `longitude` | 직접 매핑 |
| `prk_cmprt_co` | `total_spaces` | INT 변환 |
| `crnt_prk_vhcl_co` | → realtime 테이블 | 시계열 저장 |
| `avbl_rate` | → realtime 테이블 | 계산하거나 직접 저장 |
| `bsc_prk_crg` | `basic_rate_won` | 직접 매핑 |
| `bsc_prk_hr` | `basic_rate_minutes` | 직접 매핑 |
| `add_prk_crg` | `additional_rate_won` | 직접 매핑 |
| `add_prk_hr` | `additional_rate_minutes` | 직접 매핑 |
| `day_max_crg` | `daily_max_won` | 직접 매핑 |

**서울시 GetParkingInfo API → parking_lots 테이블**

| 필드명 | 테이블 컬럼 | 매핑 |
|--------|----------|------|
| `PKLT_CD` | `seoul_api_id` | 직접 매핑 |
| `PKLT_NM` | `name` | 직접 매핑 (기존 정보와 비교) |
| `ADDR` | `address` | 직접 매핑 |
| `NOW_PRK_VHCL_CNT` | → realtime 테이블 | 시계열 저장 |
| `TPKCT` | `total_spaces` | 직접 매핑 |
| `BSC_PRK_CRG` | `basic_rate_won` | 직접 매핑 |

**카카오맵 API → parking_lots 테이블**

| 필드명 | 테이블 컬럼 | 매핑 |
|--------|----------|------|
| `place_id` | `kakao_id` | 직접 매핑 |
| `place_name` | `name` | 검증 후 매핑 |
| `x` (경도) | `longitude` | 직접 매핑 |
| `y` (위도) | `latitude` | 직접 매핑 |
| `place_url` | → 외부 링크 저장 | 참조용 |

---

## 4. 동기화 전략 비교

### 4.1 동기화 방식 선택표

```
┌──────────────────────────────────────────────────────────┐
│         데이터 동기화 방식 비교 (한국교통안전공단 기준)     │
└──────────────────────────────────────────────────────────┘

1️⃣ DAILY BATCH (권장)
   └─ 매일 03:00 AM 1회
      ├─ 모든 주차장 기본정보 동기화
      ├─ 신규/폐쇄 주차장 감지
      ├─ 요금/운영시간 변경사항 반영
      └─ 리소스 효율적

   ⏱️ 실행 시간: ~30분 (13만개)
   💾 저장소: ~10MB/일
   ✅ 추천 이유: 변동 적은 데이터, 배치 친화적

2️⃣ REAL-TIME CACHE (10분마다)
   └─ 실시간 주차 현황만 매 10분 갱신
      ├─ NOW_PRK_VHCL_CNT (현재 주차 차량수)
      ├─ 여유 구획수 계산
      ├─ occupancy_rate 업데이트
      └─ 응답 시간 < 1초 보장

   ⏱️ 실행 시간: ~5분 (13만개)
   💾 저장소: ~50MB/주 (시계열)
   ✅ 추천 이유: 사용자 경험 향상

3️⃣ HOURLY SUMMARY (매시간)
   └─ 요약 통계 계산
      ├─ 지역별 평균 점유율
      ├─ 피크/비피크 시간대
      ├─ 주차 난이도 예측
      └─ 사용자에게 제공

   ⏱️ 실행 시간: ~5분
   💾 저장소: ~20MB/주
   ✅ 추천 이유: 분석/통계 기반 기능

4️⃣ ON-DEMAND (사용자 요청)
   └─ 사용자가 특정 위치 검색 시
      ├─ 근처 주차장 조회
      ├─ 캐시 확인 (< 10분 경과)
      ├─ 캐시 미스: 실시간 조회
      └─ 응답 시간 < 2초 보장

   ⏱️ 실행 시간: 요청당 < 2초
   💾 저장소: 요청 기반 캐시
   ✅ 추천 이유: 사용자 중심
```

### 4.2 권장 통합 전략

```
┌──────────────────────────────────────────────────────┐
│        권장 3계층 동기화 아키텍처                      │
└──────────────────────────────────────────────────────┘

Layer 1: FOUNDATION (기본정보)
├─ 주기: Daily (03:00 AM)
├─ 소스: 한국교통안전공단
├─ 데이터: 주차장명, 주소, 요금, 운영시간
├─ 저장: parking_lots 테이블
└─ TTL: 24시간

Layer 2: REAL-TIME (실시간 현황)
├─ 주기: 10분마다
├─ 소스: 한국교통안전공단 (실시간) + 서울시 GetParkingInfo
├─ 데이터: 현재 주차 차량수, 여유 구획수, 점유율
├─ 저장: parking_lot_realtime 테이블
└─ TTL: 5분

Layer 3: ENRICHMENT (보강정보)
├─ 주기: Weekly (금요일 12:00 PM)
├─ 소스: 카카오맵 API (신규 주차장 발견)
├─ 데이터: 새로운 주차장, 사용자 리뷰 링크
├─ 저장: parking_lots 테이블
└─ TTL: 7일

User Request Flow
└─ /api/parking/search?lat=37.5&lng=127.0&radius=1000
   ├─ 1️⃣ 캐시 확인 (realtime, < 10분)
   ├─ 2️⃣ 캐시 미스 → API 조회
   ├─ 3️⃣ 결과 조합 (기본정보 + 실시간)
   └─ 4️⃣ 응답 (< 2초)
```

### 4.3 에러 처리 전략

```
API 호출 실패 시 폴백 전략

기본정보 조회 실패
└─ 시나리오: 한국교통안전공단 API 다운
   ├─ 1차: 로컬 캐시 사용 (최대 24시간)
   ├─ 2차: 서울시 API로 대체 (서울만)
   ├─ 3차: 카카오맵 API로 대체 (기본정보만)
   └─ 4차: 사용자에게 "정보 업데이트 중" 표시

실시간 정보 조회 실패
└─ 시나리오: 실시간 API 응답 느림/타임아웃
   ├─ 1차: 캐시된 정보 사용 (최대 10분)
   ├─ 2차: 예상값 표시 (ML 모델)
   └─ 3차: 사용자에게 "최근 정보 표시" 안내

재시도 정책
└─ Exponential backoff: 1초 → 2초 → 4초 → 8초
   (최대 3회 시도, 총 15초 이내)
```

---

## 5. 구현 방식 추천

### 5.1 최적 구현 전략 (단계별)

```
Phase 1: MVP (2-3주)
├─ 한국교통안전공단 API만 사용
├─ Daily Batch 동기화
├─ 기본 검색 기능 (위치 기반)
├─ 간단한 UI (주차장명, 요금, 여유 구획수)
└─ 예상 개발 시간: 40시간

Phase 2: 실시간 고도화 (2주)
├─ Real-time 현황 데이터 추가
├─ 점유율 시각화 (프로그레스 바)
├─ 10분 주기 캐시 적용
├─ 응답 시간 최적화
└─ 예상 개발 시간: 25시간

Phase 3: 멀티소스 통합 (3주)
├─ 서울시 GetParkingInfo 통합
├─ 카카오/네이버 지도 연동
├─ 사용자 리뷰 영역 표시
├─ 중복 제거 및 데이터 정제
└─ 예상 개발 시간: 35시간

Phase 4: 지역 확장 (진행형)
├─ 경기도, 대구시 등 추가
├─ 각 지역 API 별도 처리
├─ 통합 관리 대시보드
└─ 예상 개발 시간: 20시간/지역
```

### 5.2 기술 아키텍처 (권장)

```
┌──────────────────────────────────────────────────────────┐
│              주차장 데이터 통합 아키텍처                   │
└──────────────────────────────────────────────────────────┘

Frontend (Client)
├─ Chrome Extension (Content Script)
├─ Web App (Next.js)
└─ Mobile App (React Native)
       ↓
API Gateway (rate limiting, auth)
       ↓
┌─────────────────────────────────────────┐
│      Next.js API Routes                 │
│  ├─ /api/parking/search                 │
│  ├─ /api/parking/[id]                   │
│  ├─ /api/realtime/[id]                  │
│  └─ /api/admin/sync                     │
└─────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│      Caching Layer                      │
│  ├─ Redis (realtime, 10분)             │
│  ├─ Browser Cache (정적, 24시간)       │
│  └─ CDN (정적 콘텐츠)                   │
└─────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│      Database (Supabase PostgreSQL)     │
│  ├─ parking_lots (메인)                │
│  ├─ parking_lot_realtime (시계열)      │
│  ├─ parking_lot_external_ids (매핑)    │
│  └─ reviews, tips (사용자 콘텐츠)      │
└─────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│      Background Jobs (Bull/RQ)          │
│  ├─ Daily Batch (03:00 AM)             │
│  ├─ Hourly Realtime (00분)             │
│  ├─ Weekly Enrichment (금요일 12PM)    │
│  └─ Error Notification (실시간)        │
└─────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│      Data Sources                       │
│  ├─ 한국교통안전공단 API                │
│  ├─ 서울시 GetParkingInfo API          │
│  ├─ 카카오맵 API                        │
│  └─ 기타 지역 공공 API                 │
└─────────────────────────────────────────┘
```

### 5.3 배포 전략

```
Development Environment
├─ data.go.kr 테스트 API 키
├─ 서울시 공개 API 키
└─ 테스트 데이터 100~1000개

Staging Environment
├─ 모든 API 키 발급 완료
├─ 실제 데이터로 동기화
├─ 배치 작업 테스트 (dry-run)
└─ 성능 벤치마크

Production Environment
├─ 모든 API 키 보안화
├─ 에러 모니터링 (Sentry)
├─ 로깅 시스템 (ELK)
└─ 백업 및 복구 계획
```

---

## 6. 샘플 코드

### 6.1 한국교통안전공단 API 동기화 (Node.js)

```typescript
// /lib/parking-api/public-api-sync.ts
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY
const PUBLIC_API_URL = 'http://apis.data.go.kr/B553881/Parking'

interface ParkingData {
  prk_center_id: string
  prk_plce_nm: string
  prk_plce_adres: string
  prk_plce_entrc_la: number
  prk_plce_entrc_lo: number
  prk_cmprt_co: number
  bsc_prk_crg: number
  bsc_prk_hr: number
  add_prk_crg: number
  add_prk_hr: number
  day_max_crg: number
  tel_no: string
  // ... 기타 필드
}

export async function syncParkingLotsDaily() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 1. 공공 API에서 데이터 조회 (페이징)
    const allParkingData: ParkingData[] = []
    const pageSize = 1000
    let pageNum = 1
    let hasMore = true

    while (hasMore) {
      const response = await axios.get(PUBLIC_API_URL, {
        params: {
          key: PUBLIC_API_KEY,
          type: 'json',
          pageNo: pageNum,
          numOfRows: pageSize,
        },
        timeout: 30000,
      })

      const data = response.data.response?.body?.items || []
      if (data.length === 0) hasMore = false
      allParkingData.push(...data)
      pageNum++

      // API 호출 제한 회피
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    console.log(`✅ 조회 완료: ${allParkingData.length}개 주차장`)

    // 2. 데이터 변환 및 중복 제거
    const parkingLotsToInsert = allParkingData
      .filter((item) => item.prk_plce_entrc_la && item.prk_plce_entrc_lo)
      .map((item) => ({
        name: item.prk_plce_nm,
        address: item.prk_plce_adres,
        latitude: item.prk_plce_entrc_la,
        longitude: item.prk_plce_entrc_lo,
        total_spaces: item.prk_cmprt_co || null,
        basic_rate_won: item.bsc_prk_crg,
        basic_rate_minutes: item.bsc_prk_hr,
        additional_rate_won: item.add_prk_crg,
        additional_rate_minutes: item.add_prk_hr,
        daily_max_won: item.day_max_crg,
        phone_number: item.tel_no,
        public_api_id: item.prk_center_id,
        data_source: 'public_api',
        last_synced_at: new Date(),
      }))

    // 3. 데이터베이스에 upsert (중복 제거)
    const { error } = await supabase
      .from('parking_lots')
      .upsert(parkingLotsToInsert, {
        onConflict: 'public_api_id',
      })

    if (error) {
      console.error('❌ Database error:', error)
      throw error
    }

    console.log(`✅ Sync completed: ${parkingLotsToInsert.length} parking lots`)

    return {
      success: true,
      count: parkingLotsToInsert.length,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('❌ Sync failed:', error)
    throw error
  }
}

// 일일 배치 작업 (3:00 AM)
export async function scheduleDailySync() {
  const cron = require('node-cron')

  // 매일 오전 3시에 실행
  cron.schedule('0 3 * * *', async () => {
    console.log('🔄 Starting daily parking lot sync...')
    try {
      await syncParkingLotsDaily()
    } catch (error) {
      console.error('❌ Daily sync failed:', error)
      // 에러 알림 전송 (예: Slack)
    }
  })
}
```

### 6.2 실시간 데이터 캐시 (Redis)

```typescript
// /lib/parking-api/realtime-cache.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const CACHE_TTL = 10 * 60 // 10분

export async function getRealTimeOccupancy(parkingLotId: string) {
  const cacheKey = `parking:realtime:${parkingLotId}`

  try {
    // 1. 캐시 확인
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached as string)
    }

    // 2. 캐시 미스 → API 조회
    const data = await fetchFromPublicAPI(parkingLotId)

    // 3. 캐시 저장
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data))

    return data
  } catch (error) {
    console.error('❌ Realtime cache error:', error)
    // 폴백: 마지막 알려진 값 반환
    return null
  }
}

async function fetchFromPublicAPI(parkingLotId: string) {
  // 실제 API 호출
  const response = await axios.get(PUBLIC_API_URL, {
    params: {
      key: PUBLIC_API_KEY,
      prk_center_id: parkingLotId,
    },
  })

  const item = response.data.response?.body?.items[0]
  return {
    parking_lot_id: parkingLotId,
    current_vehicles: item.crnt_prk_vhcl_co,
    available_spaces: item.avbl_prk_space_co,
    occupancy_rate: item.avbl_rate,
    status: calculateStatus(item.avbl_rate),
    updated_at: new Date(),
  }
}

function calculateStatus(occupancyRate: number) {
  if (occupancyRate >= 80) return 'full'
  if (occupancyRate >= 50) return 'busy'
  return 'available'
}
```

### 6.3 Next.js API Route (통합)

```typescript
// /app/api/parking/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRealTimeOccupancy } from '@/lib/parking-api/realtime-cache'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')
  const radius = parseFloat(searchParams.get('radius') || '1000')

  const supabase = await createClient()

  try {
    // 1. 데이터베이스에서 위치 기반 검색
    const latDelta = radius / 111000
    const lngDelta = radius / (111000 * Math.cos((lat * Math.PI) / 180))

    const { data: parkingLots, error } = await supabase
      .from('parking_lots')
      .select('*')
      .gte('latitude', lat - latDelta)
      .lte('latitude', lat + latDelta)
      .gte('longitude', lng - lngDelta)
      .lte('longitude', lng + lngDelta)
      .limit(20)

    if (error) throw error

    // 2. 실시간 데이터 병렬 조회 (모두 실패해도 기본정보는 제공)
    const enrichedLots = await Promise.all(
      parkingLots.map(async (lot) => {
        const realtime = await getRealTimeOccupancy(lot.id)
        return {
          ...lot,
          realtime: realtime || {},
        }
      })
    )

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
```

### 6.4 에러 처리 및 폴백

```typescript
// /lib/parking-api/error-handler.ts
import axios, { AxiosError } from 'axios'

class ParkingAPIError extends Error {
  constructor(
    public source: 'public_api' | 'seoul_api' | 'kakao_api',
    public statusCode?: number,
    message?: string
  ) {
    super(message || `Error from ${source}`)
    this.name = 'ParkingAPIError'
  }
}

export async function fetchWithFallback(
  parkingLotId: string
): Promise<ParkingData | null> {
  // 1차: 한국교통안전공단
  try {
    return await fetchFromPublicAPI(parkingLotId)
  } catch (error) {
    console.warn('⚠️ Public API failed:', error)
  }

  // 2차: 서울시 API (서울 주차장만)
  try {
    return await fetchFromSeoulAPI(parkingLotId)
  } catch (error) {
    console.warn('⚠️ Seoul API failed:', error)
  }

  // 3차: 캐시된 데이터
  try {
    return await getLastKnownData(parkingLotId)
  } catch (error) {
    console.warn('⚠️ Cache unavailable:', error)
  }

  // 모두 실패: null 반환 + 에러 로깅
  console.error('❌ All sources failed for:', parkingLotId)
  return null
}

async function fetchFromSeoulAPI(
  parkingLotId: string
): Promise<ParkingData | null> {
  // 서울시 API 구현
  // ...
}

async function getLastKnownData(parkingLotId: string): Promise<ParkingData | null> {
  // 마지막 알려진 값 조회
  // ...
}
```

---

## 7. 마이그레이션 체크리스트

### 7.1 구현 전 준비 체크리스트

```
▢ API 신청 및 키 발급
  ▢ data.go.kr에서 한국교통안전공단 API 신청 (1-2주)
  ▢ 서울시 공공데이터포털에서 인증키 확인
  ▢ 카카오맵 REST API 키 발급 (선택사항)
  ▢ 네이버 지도 API 키 발급 (선택사항)
  ▢ 환경변수 설정 (.env.local 구성)

▢ 데이터베이스 준비
  ▢ 기존 parking_lots 테이블 구조 검증
  ▢ parking_lot_realtime 테이블 생성
  ▢ parking_lot_external_ids 테이블 생성
  ▢ 인덱스 생성 (위치 기반, 소스별)
  ▢ 마이그레이션 스크립트 작성
  ▢ 백업 계획 수립

▢ 배치 시스템 준비
  ▢ Bull/BullMQ 또는 node-cron 선택
  ▢ 배치 작업 디렉토리 구조 설계
  ▢ 에러 알림 시스템 구성 (Slack, 이메일)
  ▢ 로깅 시스템 구성 (ELK, Datadog)
  ▢ 모니터링 대시보드 설계

▢ 캐싱 시스템 준비
  ▢ Redis 인스턴스 구성
  ▢ 캐시 정책 수립 (TTL, 무효화)
  ▢ 캐시 모니터링 방법 결정
  ▢ 메모리 관리 계획

▢ 테스트 준비
  ▢ 테스트 데이터셋 준비 (100-1000개)
  ▢ 통합 테스트 작성
  ▢ 부하 테스트 시나리오 설계
  ▢ 장애 복구 테스트 계획
```

### 7.2 구현 단계별 체크리스트

```
Phase 1: 기본 동기화 (1주)
  Day 1-2: 데이터 모델 확정
    ▢ parking_lots 스키마 최종 검증
    ▢ 필드 매핑표 작성
    ▢ 데이터 타입 검증

  Day 3: API 통합
    ▢ 한국교통안전공단 API 연결 테스트
    ▢ 파싱 로직 구현 및 테스트
    ▢ 데이터 정제 로직 구현

  Day 4: 배치 구현
    ▢ Daily Batch 스크립트 작성
    ▢ 에러 처리 구현
    ▢ 로깅 구현

  Day 5: 테스트 및 배포
    ▢ 통합 테스트 (100개 데이터)
    ▢ Staging 환경 배포
    ▢ 24시간 모니터링

Phase 2: 실시간 캐시 (1주)
  Day 1-2: 캐시 시스템
    ▢ Redis 캐시 구현
    ▢ 캐시 무효화 정책 수립
    ▢ 캐시 모니터링

  Day 3: API 라우트
    ▢ /api/parking/search 구현
    ▢ /api/realtime/[id] 구현
    ▢ 응답 형식 표준화

  Day 4-5: 테스트
    ▢ 응답 시간 측정 (<2초)
    ▢ 캐시 효율성 검증
    ▢ 부하 테스트

Phase 3: 다중소스 통합 (2주)
  Day 1-2: 서울시 API
    ▢ GetParkingInfo 통합
    ▢ 데이터 매칭 알고리즘
    ▢ 중복 제거

  Day 3-4: 지도 API
    ▢ 카카오맵 API 통합
    ▢ 신규 주차장 발견 로직
    ▢ 매핑 테이블 관리

  Day 5-6: 통합 테스트
    ▢ E2E 테스트
    ▢ 성능 최적화
    ▢ 사용자 피드백 수집
```

### 7.3 배포 후 모니터링 체크리스트

```
배포 직후 (1주)
  ▢ API 응답 시간 모니터링
  ▢ 에러율 모니터링
  ▢ 데이터 정확성 샘플 검증
  ▢ 사용자 피드백 수집
  ▢ 일일 배치 작업 성공/실패 확인

배포 후 (1개월)
  ▢ 캐시 효율성 분석
  ▢ API 호출 통계 분석
  ▢ 데이터 품질 리포트
  ▢ 성능 벤치마크
  ▢ 비용 분석 (API 호출, 저장소)

배포 후 (3개월)
  ▢ 데이터 정확성 정기 점검
  ▢ 사용자 만족도 조사
  ▢ 새로운 요구사항 수집
  ▢ 확장 계획 검토
```

---

## 최종 권장사항

### 🎯 1순위: 한국교통안전공단 API
- **이유**: 국가 표준, 전국 커버리지, 완전 무료
- **구현 시간**: 1주
- **수집 데이터**: 기본정보 + 실시간 현황

### 🎯 2순위: 서울시 GetParkingInfo API
- **이유**: 서울시 특화, 매우 상세한 정보
- **구현 시간**: 3-5일 (추가)
- **수집 데이터**: 실시간 현황 (중복 제거 후 병합)

### 🎯 3순위: 카카오맵 API
- **이유**: 신규 주차장 발견 + 사용자 리뷰 링크
- **구현 시간**: 1주 (추가)
- **수집 데이터**: 새로운 주차장 정보, 외부 링크

### ❌ 불필요: 네이버 지도 API
- **이유**: 카카오맵과 동일 기능 (선택 피로)
- **대신**: 카카오맵으로 통일

---

## 비용 분석 (월간 기준)

| 항목 | 비용 | 비고 |
|------|------|------|
| **API 호출** | 무료 | 모든 공공 API |
| **저장소** (PostgreSQL) | $50-100/월 | 시계열 데이터 기준 |
| **캐시** (Redis) | $20-50/월 | Upstash 기준 |
| **배치 처리** | $0 | Vercel Cron 무료 |
| **총 비용** | **~$70-150/월** | 적극 권장 |

---

## 참고 자료

### 공식 문서
- [공공데이터포털](https://www.data.go.kr/)
- [한국교통안전공단 주차정보 API](https://www.data.go.kr/data/15099883/openapi.do)
- [서울 열린데이터광장](https://data.seoul.go.kr/)
- [카카오 Developers](https://developers.kakao.com/)

### 기타 리소스
- [GitHub - 한국 공개 API 목록](https://github.com/yybmion/public-apis-4Kr)
- [전국주차장정보표준데이터](https://www.data.go.kr/data/15012896/standard.do)

---

**작성일**: 2025-08-29
**버전**: 1.0
**상태**: 검토 완료 ✅
