# 데이터베이스 스키마 설계

## `parking_lots` 테이블

주차장 정보를 저장하는 메인 테이블입니다.

| Column Name         | Data Type          | Constraints | Description                                                  |
| ------------------- | ------------------ | ----------- | ------------------------------------------------------------ |
| `id`                | `BIGINT`           | `PK`, `AI`  | 고유 식별자 (Primary Key, Auto Increment)                      |
| `name`              | `VARCHAR(255)`     | `NOT NULL`  | 주차장 이름 (`prk_plce_nm`)                                  |
| `address`           | `VARCHAR(255)`     |             | 도로명 또는 지번 주소 (`prk_plce_adres`)                     |
| `latitude`          | `DECIMAL(10, 8)`   | `NOT NULL`  | 위도 (`prk_plce_entrc_la`)                                   |
| `longitude`         | `DECIMAL(11, 8)`   | `NOT NULL`  | 경도 (`prk_plce_entrc_lo`)                                   |
| `total_spaces`      | `INT`              |             | 총 주차 구획 수 (`prk_cmprt_co`)                             |
| `data_source`       | `VARCHAR(50)`      | `NOT NULL`  | 데이터 출처. 예: 'public_api', 'user_generated'              |
| `public_data_id`    | `VARCHAR(100)`     | `UNIQUE`    | 공공데이터의 고유 ID (`prk_center_id`). 중복 수집 방지용.    |
| `created_at`        | `DATETIME`         |             | 레코드 생성 시각                                             |
| `updated_at`        | `DATETIME`         |             | 레코드 마지막 수정 시각                                      |

### 주요 컬럼 설명

- **`data_source`**: 이 컬럼은 데이터의 출처를 명확히 구분하는 핵심적인 역할을 합니다. 공공 API를 통해 수집된 데이터는 'public_api'로, 사용자가 직접 등록한 데이터는 'user_generated'로 저장합니다. 이 값을 기준으로 더미 데이터를 필터링하거나 일괄 삭제할 수 있습니다.
- **`public_data_id`**: 공공데이터 API에서 제공하는 `prk_center_id`를 저장하여, 동일한 데이터를 중복해서 데이터베이스에 삽입하는 것을 방지합니다.
