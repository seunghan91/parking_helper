import json
import os
import time
import requests
from datetime import datetime

from sqlalchemy import create_engine, Column, BigInteger, String, Integer, Numeric, DateTime, Float
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# --- 설정 ---
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'parking_helper.db')}"
KAKAO_DATA_FILE = os.path.join(BASE_DIR, "kakaomap_parking_data.json")
SEOUL_REALTIME_DATA_FILE = os.path.join(BASE_DIR, "seoul_realtime_parking_data.json")
API_INFO_FILE = os.path.join(BASE_DIR, "API_INFO.md")

# --- 카카오맵 API 설정 ---
def get_kakao_api_key():
    """API_INFO.md 파일에서 카카오맵 REST API 키를 읽어옵니다."""
    in_kakao_section = False
    try:
        with open(API_INFO_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip() == '## 1. 카카오맵 API':
                    in_kakao_section = True
                elif in_kakao_section and line.startswith('##'): # 다른 섹션 시작
                    in_kakao_section = False
                    break
                
                if in_kakao_section and '**인증키**:' in line and '여기에_카카오맵_REST_API_키를_입력하세요' not in line:
                    key = line.split('`')[1].strip()
                    if key:
                        return key
    except FileNotFoundError:
        return None
    return None

KAKAO_API_KEY = get_kakao_api_key()

def geocode_address(address):
    """카카오맵 API를 사용해 주소를 위경도 좌표로 변환합니다."""
    if not KAKAO_API_KEY:
        return None, None

    url = f"https://dapi.kakao.com/v2/local/search/address.json?query={address}"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status() # 오류 발생 시 예외 처리
        data = response.json()
        
        if data['documents']:
            location = data['documents'][0]
            return float(location['y']), float(location['x']) # 위도(y), 경도(x)
    except requests.exceptions.RequestException as e:
        print(f"[API 오류] 주소 변환 중 오류 발생: {address} ({e})")
    except (KeyError, IndexError):
        print(f"[데이터 오류] 주소로부터 좌표를 찾을 수 없습니다: {address}")
        
    return None, None

# SQLAlchemy 모델 정의
Base = declarative_base()

class ParkingLot(Base):
    __tablename__ = 'parking_lots'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    address = Column(String(255), unique=True)
    latitude = Column(Numeric(10, 8), nullable=True)  # 카카오 데이터에는 좌표 없음
    longitude = Column(Numeric(11, 8), nullable=True)
    
    # 실시간 정보
    total_spaces = Column(Integer)
    available_spaces = Column(Integer)
    realtime_updated_at = Column(DateTime)

    # 부가 정보
    fee_info = Column(String(255))
    operating_hours = Column(String(255))
    
    data_source = Column(String(50), nullable=False)
    seoul_api_id = Column(String(100), unique=True, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<ParkingLot(name='{self.name}', address='{self.address}')>"


def seed_data():
    """JSON 파일들을 읽어 데이터베이스에 시딩합니다."""
    engine = create_engine(DATABASE_URL)
    # 기존 DB 파일 삭제
    if os.path.exists(DATABASE_URL.split('///')[1]):
        os.remove(DATABASE_URL.split('///')[1])
        print("기존 데이터베이스 파일을 삭제했습니다.")

    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # 1. 카카오맵 데이터로 기본 정보 채우기
    try:
        with open(KAKAO_DATA_FILE, 'r', encoding='utf-8') as f:
            kakao_data = json.load(f)
    except FileNotFoundError:
        print(f"오류: '{KAKAO_DATA_FILE}' 파일을 찾을 수 없습니다.")
        return

    print(f"\n--- 1. 카카오맵 데이터 시딩 시작 ---")
    added_addresses = set()
    new_records = 0
    skipped_records = 0
    for item in kakao_data:
        address = item.get('address')
        if address in added_addresses:
            skipped_records += 1
            continue
        
        print(f"'{address}' 주소의 좌표를 조회합니다...")
        latitude, longitude = geocode_address(address)
        
        if latitude and longitude:
            new_lot = ParkingLot(
                name=item.get('name'),
                address=address,
                latitude=latitude,
                longitude=longitude,
                data_source='kakaomap'
            )
            session.add(new_lot)
            added_addresses.add(address)
            new_records += 1
            print(f"  -> 좌표: ({latitude}, {longitude})")
        else:
            print(f"  -> 좌표를 찾지 못해 추가하지 않습니다.")
            skipped_records += 1

        time.sleep(0.1) # API 호출 제한을 피하기 위한 딜레이

    session.commit()
    print(f"{new_records}개의 기본 주차장 정보가 추가되었습니다. (중복 {skipped_records}개 제외)")

    # 2. 서울시 실시간 데이터로 정보 보강하기
    try:
        with open(SEOUL_REALTIME_DATA_FILE, 'r', encoding='utf-8') as f:
            seoul_data = json.load(f)
    except FileNotFoundError:
        print(f"\n오류: '{SEOUL_REALTIME_DATA_FILE}' 파일을 찾을 수 없습니다.")
        print("먼저 'collect_public_data.py'를 실행하여 데이터를 수집하세요.")
        session.close()
        return

    print(f"\n--- 2. 서울시 실시간 데이터로 업데이트 시작 ---")
    updated_count = 0
    for item in seoul_data:
        # 주소를 기준으로 기존 데이터 검색
        # 서울시 데이터의 주소 형식(예: '종로구 세종로 80-1')에 맞춰 검색
        lot_to_update = session.query(ParkingLot).filter(ParkingLot.address.like(f"%{item['ADDR']}")).first()

        if lot_to_update:
            total_spaces = int(item.get('TPKCT', 0))
            parked_cars = int(item.get('NOW_PRK_VHCL_CNT', 0))
            
            lot_to_update.total_spaces = total_spaces
            lot_to_update.available_spaces = total_spaces - parked_cars
            lot_to_update.seoul_api_id = item.get('PKLT_CD')
            lot_to_update.fee_info = f"{item.get('BSC_PRK_HR')}분당 {item.get('BSC_PRK_CRG')}원"
            lot_to_update.operating_hours = f"평일 {item.get('WD_OPER_BGNG_TM')}~{item.get('WD_OPER_END_TM')}"
            lot_to_update.data_source = 'kakaomap_seoul_api'
            
            update_time_str = item.get('NOW_PRK_VHCL_UPDT_TM')
            if update_time_str:
                lot_to_update.realtime_updated_at = datetime.strptime(update_time_str, '%Y-%m-%d %H:%M:%S')
            
            updated_count += 1

    session.commit()
    print(f"{updated_count}개의 주차장 정보가 실시간 데이터로 업데이트되었습니다.")
    
    print("\n--- 시딩 완료 ---")
    session.close()

if __name__ == "__main__":
    seed_data()
