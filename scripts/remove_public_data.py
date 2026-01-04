import os
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker

# --- 설정 ---
# 데이터베이스 파일의 절대 경로를 계산합니다.
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'parking_helper.db')}"

def remove_public_data():
    """데이터베이스에서 data_source가 'public_api'인 모든 주차장 정보를 삭제합니다."""
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # SQLAlchemy의 reflection을 사용하여 테이블 정보를 동적으로 로드합니다.
        meta = MetaData()
        meta.reflect(bind=engine)
        parking_lots_table = meta.tables.get('parking_lots')

        if parking_lots_table is None:
            print("오류: 'parking_lots' 테이블을 찾을 수 없습니다.")
            return

        # 삭제할 데이터 수 확인
        public_data_count = session.query(parking_lots_table).filter_by(data_source='public_api').count()

        if public_data_count == 0:
            print("삭제할 공공 데이터가 없습니다.")
            return

        print(f"총 {public_data_count}개의 공공 데이터(더미 데이터)를 발견했습니다.")
        
        # 사용자 확인
        confirm = input("정말로 이 데이터들을 모두 삭제하시겠습니까? (y/n): ")
        if confirm.lower() != 'y':
            print("삭제 작업이 취소되었습니다.")
            return

        # 데이터 삭제 실행
        delete_query = parking_lots_table.delete().where(parking_lots_table.c.data_source == 'public_api')
        result = session.execute(delete_query)
        session.commit()

        print(f"\n--- 삭제 완료 ---")
        print(f"{result.rowcount}개의 레코드가 성공적으로 삭제되었습니다.")

    except Exception as e:
        session.rollback()
        print(f"오류가 발생하여 작업을 롤백했습니다: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    remove_public_data()
