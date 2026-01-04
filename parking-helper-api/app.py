from flask import Flask, jsonify, request
from sqlalchemy import create_engine, Column, String, Integer, Numeric, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
import os
import math
from datetime import datetime

# --- 설정 ---
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'parking_helper.db')}"

# Flask 앱 초기화
app = Flask(__name__)

# SQLAlchemy 설정
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
Base = declarative_base()

# 데이터베이스 모델 정의 (seed_database.py와 동일하게 유지)
class ParkingLot(Base):
    __tablename__ = 'parking_lots'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    address = Column(String(255), unique=True)
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)
    
    # 실시간 정보
    total_spaces = Column(Integer)
    available_spaces = Column(Integer)
    realtime_updated_at = Column(DateTime)
    
    # 추가 정보
    fee_info = Column(String(255))
    operating_hours = Column(String(255))
    
    # 메타 정보
    data_source = Column(String(50))
    seoul_api_id = Column(String(50), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

def to_dict(lot):
    """ParkingLot 객체를 딕셔너리로 변환합니다."""
    return {
        'id': lot.id,
        'name': lot.name,
        'address': lot.address,
        'latitude': float(lot.latitude) if lot.latitude else None,
        'longitude': float(lot.longitude) if lot.longitude else None,
        'total_spaces': lot.total_spaces,
        'available_spaces': lot.available_spaces,
        'fee_info': lot.fee_info,
        'operating_hours': lot.operating_hours,
        'realtime_updated_at': lot.realtime_updated_at.isoformat() if lot.realtime_updated_at else None,
        'data_source': lot.data_source
    }

# API 라우트 정의
@app.route('/api/parking-lots', methods=['GET'])
def get_parking_lots():
    """데이터베이스에 저장된 모든 주차장 목록을 반환합니다."""
    session = Session()
    try:
        lots = session.query(ParkingLot).all()
        result = [to_dict(lot) for lot in lots]
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

def haversine(lat1, lon1, lat2, lon2):
    """두 지점 간의 거리를 킬로미터 단위로 계산합니다 (Haversine 공식)."""
    R = 6371  # 지구의 반경 (km)

    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad

    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = R * c
    return distance

@app.route('/api/parking-lots/nearby', methods=['GET'])
def get_nearby_parking_lots():
    """주어진 좌표 근처의 주차장 목록을 거리순으로 반환합니다."""
    try:
        lat = float(request.args.get('lat'))
        lon = float(request.args.get('lon'))
        radius = float(request.args.get('radius', 1.0))  # 기본 반경 1km
    except (TypeError, ValueError):
        return jsonify({'error': 'lat, lon 파라미터는 필수이며 숫자여야 합니다.'}), 400

    session = Session()
    try:
        # 좌표 정보가 있는 주차장만 필터링합니다.
        all_lots = session.query(ParkingLot).filter(
            ParkingLot.latitude.isnot(None),
            ParkingLot.longitude.isnot(None)
        ).all()
        
        nearby_lots = []

        for lot in all_lots:
            distance = haversine(lat, lon, float(lot.latitude), float(lot.longitude))
            if distance <= radius:
                lot_data = to_dict(lot)
                lot_data['distance_km'] = round(distance, 2)
                nearby_lots.append(lot_data)
        
        # 거리순으로 정렬
        sorted_lots = sorted(nearby_lots, key=lambda x: x['distance_km'])
        return jsonify(sorted_lots)

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

if __name__ == '__main__':
    # python parking-helper-api/app.py 로 실행
    app.run(debug=True, port=5001)
