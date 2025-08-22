# 13. Apple-Style 디자인 가이드 (초안)

## 상단 체크리스트
- [ ] 컬러/타입/간격 토큰 확정
- [ ] 컴포넌트 기본/상태 규칙 확정
- [ ] 모션/피드백 원칙 확정

## 철학
- 단정하고 절제된 대비, 여백 중심, 정보 위계 명확성
- 크롬/장식 최소화, 실내용(타이포/레이아웃) 강화

## 컬러(라이트 모드 기준)
- 배경: Base(#FFFFFF), Subtle(#F5F5F7)
- 텍스트: Primary(#1D1D1F), Secondary(#6E6E73), Tertiary(#A1A1A6)
- 액센트: Blue(#007AFF), Green(#34C759), Orange(#FF9500), Red(#FF3B30)
- 경계/분리: Separator(#E5E5EA)
- 상태: Info(#64D2FF), Warning(#FFD60A), Error(#FF3B30)

다크 모드는 후속 단계에서 정의

## 타이포그래피
- 기본: SF Pro(Text/Display) 또는 Pretendard 대체
- 스케일(웹 기준)
  - Large Title: 28/34, Title1: 22/28, Title2: 20/26
  - Headline: 17/22 Semibold, Body: 17/24 Regular
  - Callout: 16/22, Subhead: 15/20, Footnote: 13/18, Caption2: 11/16
- 자간: 기본 0~0.2% (과도한 트래킹 지양)

## 간격/그리드
- 기본 스페이싱: 4pt 스케일(4,8,12,16,20,24,32)
- 컨테이너 패딩: 16, 섹션 간격: 12, 카드 간격: 8
- 코너: 12(패널), 10(카드), 8(버튼)
- 라인/구분선: 1px Separator, 섀도우 최소화

## 컴포넌트 규칙
- 버튼(Primary)
  - 높이 36, 패딩 12/16, Radius 8, 배경 Blue(#007AFF), 텍스트 #FFF
  - Hover: #0A84FF, Active: #0063D1, Disabled: bg #D1D1D6, text #FFFFFF80
- 버튼(Secondary)
  - 높이 36, 테두리 1px #D1D1D6, 텍스트 Blue, Hover: 배경 Subtle
- 카드
  - 배경 #FFF, Radius 10, 보더 1px Separator, 내부 패딩 12
- 입력
  - 높이 36, 배경 Subtle, 보더 1px #D1D1D6, Focus: 보더 Blue, Shadow 없음
- 토스트
  - 배경 #1D1D1FCC, 텍스트 #FFF, Radius 12, 2.4s 후 사라짐

## 상태/피드백
- 성공: Green, 실패: Red, 경고: Orange. 아이콘 + 짧은 문장
- 로딩: iOS 스타일 스피너(회전), 스켈레톤은 연한 그레이
- 모션: 150~200ms, 자연스러운 ease-in-out, 과도한 축소/확대 금지

## 아이콘
- iOS SF Symbols 레퍼런스 스타일 추종(두께 Regular)
- 사이즈 16/20/24 3단계, 선 두께 일관성 유지

## 접근성
- 텍스트 대비 AA 준수, 포커스 상태 명확히
- 모션 감소 설정 준수(reduce motion)

## 카피 톤
- 간결/정확/예의 바른 문장, 불필요한 감탄/장식 배제
- 버튼은 동사 중심("리뷰 남기기", "다시 시도")

## 적용 노트
- 확장 패널 폭 360 내 가독성 우선, 요소 밀도 과도 금지
- 그래디언트/글로시 효과 지양, 평면적 레이어 우선
