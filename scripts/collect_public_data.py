import requests
import json
import os

# --- 설정 ---
# 서울 열린데이터 광장에서 발급받은 API 인증키입니다.
# 환경 변수 사용을 권장합니다. 예: SEOUL_API_KEY = os.getenv('SEOUL_DATA_API_KEY')
SEOUL_API_KEY = "5a414e69727468653836444b6f6949"

API_ENDPOINT_BASE = "http://openapi.seoul.go.kr:8088"
OUTPUT_FILENAME = "seoul_realtime_parking_data.json"
REQUEST_CHUNK_SIZE = 1000 # 한 번에 1000개씩 요청

def fetch_seoul_parking_data():
    """서울 열린데이터 광장 API를 통해 모든 시영주차장 실시간 정보를 수집합니다."""
    if SEOUL_API_KEY == "여기에_서울시_API_인증키를_입력하세요":
        print("오류: 서울 열린데이터 광장 API 키를 설정해야 합니다.")
        return None

    all_data = []
    start_index = 1
    
    print("서울시 시영주차장 실시간 데이터 수집을 시작합니다...")

    while True:
        end_index = start_index + REQUEST_CHUNK_SIZE - 1
        url = f"{API_ENDPOINT_BASE}/{SEOUL_API_KEY}/json/GetParkingInfo/{start_index}/{end_index}/"

        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()  # HTTP 오류 발생 시 예외 처리
            data = response.json()

            # 유효한 응답인지 확인
            if 'GetParkingInfo' not in data:
                print(f"API 오류: 예상치 못한 응답 형식입니다. {data}")
                break
            
            result_info = data['GetParkingInfo']
            result_code = result_info.get('RESULT', {}).get('CODE')

            if result_code != 'INFO-000':
                # INFO-200은 데이터가 없는 경우이므로 오류가 아님
                if result_code == 'INFO-200':
                    print("더 이상 데이터가 없습니다.")
                else:
                    print(f"API 오류: {result_info.get('RESULT', {}).get('MESSAGE')}")
                break

            items = result_info.get('row', [])
            if not items:
                print("더 이상 데이터가 없습니다.")
                break

            all_data.extend(items)
            print(f"{start_index}~{end_index} 위치에서 {len(items)}개의 데이터를 수집했습니다. (누적: {len(all_data)}개)")
            
            total_count = result_info.get('list_total_count', 0)
            if len(all_data) >= total_count:
                print("모든 데이터를 수집했습니다.")
                break

            start_index += REQUEST_CHUNK_SIZE

        except requests.exceptions.RequestException as e:
            print(f"API 요청 중 오류가 발생했습니다: {e}")
            break
        except json.JSONDecodeError:
            print(f"응답이 유효한 JSON 형식이 아닙니다. 응답 내용: {response.text}")
            break

    return all_data

if __name__ == "__main__":
    parking_data = fetch_seoul_parking_data()

    if parking_data:
        print(f"\n--- 데이터 수집 완료 ---")
        print(f"총 {len(parking_data)}개의 주차장 정보를 수집했습니다.")

        # 결과를 파일로 저장
        with open(OUTPUT_FILENAME, 'w', encoding='utf-8') as f:
            json.dump(parking_data, f, ensure_ascii=False, indent=4)
        print(f"수집된 데이터가 '{OUTPUT_FILENAME}' 파일에 저장되었습니다.")
    else:
        print("수집된 데이터가 없습니다.")
