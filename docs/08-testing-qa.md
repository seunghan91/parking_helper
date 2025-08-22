# 08. Testing / QA

## 상단 체크리스트
- [ ] 단위/통합/E2E 범위 확정
- [ ] 수용 기준 체크리스트 정의
- [ ] 더미 데이터/시드 준비

## 범위
- 단위: 유틸/파서/쿼리 함수
- 통합: API↔DB(RLS) 동작
- E2E: 확장 패널 렌더링, 검색→상세→리뷰 작성 흐름

## RLS 테스트 매트릭스(샘플)
| 리소스 | 액션 | 익명 | 로그인(타인) | 소유자 |
|---|---|---|---|---|
| profiles | select | 허용 | 허용 | 허용 |
| profiles | insert/update/delete | 불가 | 불가 | 본인만 |
| reviews | select | 허용 | 허용 | 허용 |
| reviews | insert | 불가 | 허용 | 허용 |
| reviews | update/delete | 불가 | 본인만 | 본인만 |
| review_photos | insert/delete | 불가 | 본인 리뷰만 | 본인 리뷰만 |
| review_helpfuls | insert/delete | 불가 | 본인만 | 본인만 |

## E2E 체크리스트(핵심 시나리오)
- [ ] 로그인 → 프로필 조회 성공
- [ ] 장소 전환 시 패널 데이터 1s 내 갱신
- [ ] 리뷰 작성(주차장/업체/좌표) 각각 1건 성공
- [ ] 리뷰 helpful 토글(추가/취소) 동작
- [ ] 빈 상태/오류 상태 UI 노출

## 수용 기준(샘플)
- 로그인 후 리뷰 작성/조회 가능, 비로그인 작성 불가
- 장소 전환 시 데이터 새로고침, 오류 시 사용자 안내

## 도구(권장)
- Vitest/Jest, Playwright, GitHub Actions(옵션)
