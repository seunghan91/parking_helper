# API 정보

## 1. 카카오맵 API

- **API 이름**: 카카오맵 주소 검색 API
- **설명**: 주소를 위경도 좌표로 변환(지오코딩)하거나, 좌표를 주소로 변환(리버스 지오코딩)하는 기능을 제공합니다.
- **인증 방식**: REST API 키 (Authorization 헤더에 `KakaoAK {REST_API_KEY}` 형식으로 전송)
- **인증키**: `여기에_카카오맵_REST_API_키를_입력하세요`
- **발급 방법**:
  1. [카카오 개발자 사이트](https://developers.kakao.com/)에 로그인합니다.
  2. '내 애플리케이션'에서 애플리케이션을 만들거나 선택합니다.
  3. '앱 설정 > 플랫폼'에서 'Web' 플랫폼을 추가하고, `http://localhost:5001`과 같이 API를 사용할 도메인을 등록합니다.
  4. '앱 키' 메뉴에서 'REST API 키'를 복사하여 위 인증키 부분에 붙여넣습니다.

### 샘플 URL (주소 검색)

- `https://dapi.kakao.com/v2/local/search/address.json?query={주소}`

---

## 2. 서울시 공공데이터 API 정보

### 2.1. 서울시 시영주차장 실시간 주차대수 정보

- **API 이름**: 서울시 시영주차장 실시간 주차대수 정보
- **설명**: 서울시 시영주차장의 실시간 주차가능대수 정보 및 주차장 상세정보(위치, 요금, 운영정보)를 제공합니다.
- **데이터 갱신 주기**: 비정기 (자료 변경 시)
- **주의사항**: 실제 데이터와 5분 이상 차이가 날 수 있습니다.
- **인증키**: `5a414e69727468653836444b6f6949`

### 샘플 URL

- **전체 조회**: `http://openapi.seoul.go.kr:8088/(인증키)/json/GetParkingInfo/1/1000/`
- **자치구별 조회 (예: 구로구)**: `http://openapi.seoul.go.kr:8088/(인증키)/json/GetParkingInfo/1/1000/구로구`

### 요청 인자 (Request Parameters)

| 변수명 | 타입 | 필수 여부 | 설명 |
| --- | --- | --- | --- |
| `KEY` | String | 필수 | 발급받은 인증키 |
| `TYPE` | String | 필수 | 요청 파일 타입 (json, xml, xls) |
| `SERVICE` | String | 필수 | 서비스명 (`GetParkingInfo`) |
| `START_INDEX` | INTEGER | 필수 | 요청 시작 위치 (페이징) |
| `END_INDEX` | INTEGER | 필수 | 요청 종료 위치 (페이징, 최대 1000건) |
| `ADDR` | STRING | 선택 | 주소 (자치구명) |

### 주요 출력값 (Response Fields)

| 출력명 | 설명 |
| --- | --- |
| `PKLT_NM` | 주차장명 |
| `ADDR` | 주소 |
| `TPKCT` | 총 주차면 |
| `NOW_PRK_VHCL_CNT` | 현재 주차 차량수 |
| `NOW_PRK_VHCL_UPDT_TM` | 현재 주차 차량수 업데이트 시간 |
| `PAY_YN_NM` | 유무료구분명 |
| `WD_OPER_BGNG_TM` | 평일 운영 시작시각 (HHMM) |
| `WD_OPER_END_TM` | 평일 운영 종료시각 (HHMM) |
| `WE_OPER_BGNG_TM` | 주말 운영 시작시각 (HHMM) |
| `WE_OPER_END_TM` | 주말 운영 종료시각 (HHMM) |
| `BSC_PRK_CRG` | 기본 주차 요금 |
| `BSC_PRK_HR` | 기본 주차 시간 (분) |
| `ADD_PRK_CRG` | 추가 단위 요금 |
| `ADD_PRK_HR` | 추가 단위 시간 (분) |
| `DAY_MAX_CRG` | 일 최대 요금 |
