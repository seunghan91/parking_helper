# 🚀 마이그레이션 실행 가이드 (지금 바로 실행!)

**상태**: 배포 단계 진행 중
**소요 시간**: 약 10분
**난이도**: ⭐⭐ (매우 쉬움)

---

## ⚠️ 선행 작업

### 1단계: Supabase 프로젝트 활성화

Supabase 프로젝트가 일시 중지되어 있으므로 **먼저 활성화**해야 합니다:

1. **Supabase 대시보드** 접속: https://supabase.com/dashboard
2. **parking-helper** 프로젝트 클릭
3. **Project Settings** → **General** 클릭
4. **Unpause Project** 버튼 클릭 (있으면)
   - 또는 자동으로 활성화됨

**확인**: 프로젝트 상태가 "Active" 표시 될 때까지 대기

---

## 📋 마이그레이션 실행 방법

### 🔄 Migration 1: 데이터베이스 테이블 생성

**파일**: `MIGRATION_SQL_PART1.sql`

#### 실행 단계:

**1단계**: Supabase 대시보드에서 SQL Editor 열기
```
1. https://app.supabase.com 접속
2. parking-helper 프로젝트 선택
3. 왼쪽 메뉴 → SQL Editor 클릭
4. New Query 클릭
```

**2단계**: SQL 파일 복사

```bash
# 터미널에서 실행 (선택사항 - 파일 확인용)
cat /Users/seunghan/parking_helper/MIGRATION_SQL_PART1.sql | head -50
```

**3단계**: SQL Editor에 붙여넣기

```
1. MIGRATION_SQL_PART1.sql 파일 전체 열기
2. 내용 전체 선택 (Cmd + A)
3. 복사 (Cmd + C)
4. Supabase SQL Editor에 붙여넣기 (Cmd + V)
5. Run 버튼 클릭 (오른쪽 상단)
```

**4단계**: 실행 결과 확인

```
✅ 성공 메시지:
- CREATE EXTENSION
- CREATE TABLE
- CREATE INDEX
- CREATE POLICY
- INSERT INTO parking_batch_config
```

**⚠️ 에러 발생 시**:
- "Relation already exists" → 이미 생성됨 (무시 가능)
- "Permission denied" → 문제 (지원팀 문의)

---

### 🔄 Migration 2: pg_cron 스케줄 설정

**파일**: `MIGRATION_SQL_PART2.sql`

#### 실행 단계:

**1단계**: SQL Editor에서 New Query 클릭

```
1. SQL Editor 상단에 New Query 버튼 클릭
2. 기존 쿼리는 자동 저장됨
```

**2단계**: SQL 파일 복사

```bash
# 터미널에서 실행 (선택사항)
cat /Users/seunghan/parking_helper/MIGRATION_SQL_PART2.sql
```

**3단계**: SQL Editor에 붙여넣기

```
1. MIGRATION_SQL_PART2.sql 파일 전체 열기
2. 내용 전체 선택
3. 복사
4. Supabase SQL Editor에 붙여넣기
5. Run 버튼 클릭
```

**4단계**: 실행 결과 확인

```
✅ 성공 메시지:
- cron.schedule (5개의 스케줄 설정)
- 마지막에 스케줄 목록 조회 결과 표시

예상 결과 테이블:
┌────────────────────────┬─────────────────┬──────────┐
│ jobname                │ schedule        │ active   │
├────────────────────────┼─────────────────┼──────────┤
│ parking-cleanup-logs   │ 0 4 * * *       │ true     │
│ parking-cleanup-realtime│ 30 4 * * *     │ true     │
│ parking-kakao-weekly   │ 0 12 * * 5      │ true     │
│ parking-koroads-daily  │ 0 3 * * *       │ true     │
│ parking-realtime-sync  │ */10 * * * *    │ true     │
└────────────────────────┴─────────────────┴──────────┘
```

---

## ✅ 마이그레이션 검증

두 마이그레이션 모두 완료 후, **검증 쿼리**를 실행하세요:

### 테이블 생성 확인

```sql
-- SQL Editor에서 실행
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND (tablename LIKE 'parking%' OR tablename = 'batch_execution_logs')
ORDER BY tablename;
```

**예상 결과** (5개):
```
batch_execution_logs
parking_batch_config
parking_lots
parking_realtime
parking_sources
```

### 스케줄 생성 확인

```sql
-- SQL Editor에서 실행
SELECT
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobname LIKE 'parking-%'
ORDER BY jobname;
```

**예상 결과** (5개):
```
parking-cleanup-logs        | 0 4 * * *      | true
parking-cleanup-realtime    | 30 4 * * *     | true
parking-kakao-weekly        | 0 12 * * 5     | true
parking-koroads-daily       | 0 3 * * *      | true
parking-realtime-sync       | */10 * * * *   | true
```

### 배치 설정 확인

```sql
-- SQL Editor에서 실행
SELECT
  batch_type,
  is_enabled,
  schedule_cron,
  description
FROM parking_batch_config
ORDER BY batch_type;
```

**예상 결과** (3개):
```
daily_full_sync     | true  | 0 3 * * *  | 매일 03:00 AM 주차장 기본정보 동기화
hourly_realtime     | true  | */10 * * * | 매 10분마다 실시간 주차 현황 업데이트
weekly_new_parking  | true  | 0 12 * * 5 | 매주 금요일 정오 신규 주차장 검색
```

---

## 📂 사용할 파일 위치

마이그레이션 SQL 파일들:

```
/Users/seunghan/parking_helper/
├── MIGRATION_SQL_PART1.sql      ← Migration 1 (279줄)
├── MIGRATION_SQL_PART2.sql      ← Migration 2 (140줄)
├── MIGRATION_SQL_PART1_BACKUP.sql (백업)
└── MIGRATION_SQL_PART2_BACKUP.sql (백업)
```

**파일 확인**:
```bash
ls -lh MIGRATION_SQL_PART*.sql
```

---

## 🎯 다음 단계 (마이그레이션 후)

마이그레이션 완료 후:

1. ✅ **마이그레이션 검증** (위의 검증 쿼리 실행)
2. ⏳ **Edge Functions 배포** (다음 단계)
3. ⏳ **배치 수동 테스트**
4. ⏳ **데이터 검증**

---

## 🆘 문제 해결

### 문제 1: "Access Denied" 에러

**원인**: 권한 부족

**해결**:
```
1. Supabase 프로젝트 설정 확인
2. 계정이 Owner 권한인지 확인
3. 다시 시도
```

### 문제 2: "Relation already exists"

**원인**: 이미 생성된 테이블

**해결**:
```
- 무시하고 진행 가능
- 또는 기존 테이블 삭제 후 재실행
```

### 문제 3: pg_cron 스케줄이 생성되지 않음

**원인**: pg_cron 확장이 활성화되지 않음

**해결**:
```sql
-- SQL Editor에서 먼저 실행
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 그 후 Migration 2 다시 실행
```

---

## 📊 예상 소요 시간

| 작업 | 시간 | 상태 |
|------|------|------|
| Migration 1 실행 | 2-3분 | ⏳ |
| Migration 2 실행 | 1-2분 | ⏳ |
| 검증 쿼리 실행 | 1분 | ⏳ |
| **총 소요 시간** | **약 5분** | ⏳ |

---

## 🚀 빠른 실행 체크리스트

```
⬜ Supabase 프로젝트 활성화
⬜ SQL Editor 열기
⬜ Migration 1 복사 → 붙여넣기 → Run
⬜ Migration 2 복사 → 붙여넣기 → Run
⬜ 검증 쿼리 실행 (3개)
✅ 마이그레이션 완료!
```

---

## 💡 팁

- **복사 쉽게**: 파일을 IDE에서 열고 전체 복사
- **한 번에 실행**: 각 Migration SQL을 한 번의 Run으로 실행
- **오류 무시**: "already exists" 메시지는 무시 가능
- **검증 필수**: 마이그레이션 후 반드시 검증 쿼리 실행

---

## ✨ 완료 시

마이그레이션이 모두 완료되면:

✅ **5개의 테이블 생성**
- parking_sources
- parking_realtime
- batch_execution_logs
- parking_batch_config
- parking_lots (확장)

✅ **5개의 자동 스케줄 설정**
- 매일 03:00 AM: 전체 동기화
- 매 10분: 실시간 업데이트
- 매주 금요일: 신규 주차장 검색
- 매일 04:00 AM: 로그 정리
- 매일 04:30 AM: 데이터 정리

✅ **배치 시스템 준비 완료** 🎉

---

**이제 Edge Functions 배포로 진행하세요!**

