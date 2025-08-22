import { PlaceInfo, ParkingInfo } from './types';

// 캐시 관리
const cache = new Map<string, { data: ParkingInfo; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5분

// Mock 데이터 생성 함수
function getMockData(): ParkingInfo {
  return {
    tips: [
      { id: '1', content: '주말에는 2시간 무료 주차 가능합니다', created_at: new Date().toISOString() },
      { id: '2', content: '지하 3층이 가장 여유롭습니다', created_at: new Date().toISOString() }
    ],
    parkingLots: [
      {
        id: '1',
        name: '중앙 공영주차장',
        type: 'public',
        distance: '도보 3분',
        base_fee_info: '10분당 500원',
        operating_hours: '24시간',
        total_spaces: 150
      },
      {
        id: '2',
        name: '빌딩 지하주차장',
        type: 'private',
        distance: '도보 5분',
        base_fee_info: '30분당 2,000원',
        operating_hours: '08:00 - 22:00',
        total_spaces: 80
      }
    ],
    reviews: [
      {
        id: '1',
        content: '주차 공간이 넓고 깨끗해요',
        rating: 5,
        display_name: '김**',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        helpful_count: 3
      },
      {
        id: '2',
        content: '주말에는 자리 찾기가 어려워요',
        rating: 3,
        display_name: '이**',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        helpful_count: 1
      }
    ]
  };
}

export async function fetchParkingInfo(place: PlaceInfo): Promise<ParkingInfo> {
  // 캐시 확인
  const cacheKey = `${place.provider}-${place.externalId || place.name}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  try {
    // TODO: 실제 API 엔드포인트로 교체
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    // 실제 API 호출
    const searchParams = new URLSearchParams({
      lat: place.latitude?.toString() || '',
      lng: place.longitude?.toString() || '',
      radius: '1000', // 1km 반경
      limit: '10'
    });

    // 장소 정보 수집 API 호출 (ingest)
    if (place.externalId) {
      await fetch(`${API_URL}/api/place/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: place.name,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          provider: place.provider,
          external_id: place.externalId
        })
      }).catch(err => console.error('Failed to ingest place:', err));
    }

    // 주차 정보 검색
    const response = await fetch(`${API_URL}/api/parking/search?${searchParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      // 개발 환경에서는 Mock 데이터 반환
      if (API_URL.includes('localhost')) {
        const mockData = getMockData();
        cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
        return mockData;
      }
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    const data = result.data || result;
    
    // 캐시 저장
    cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  } catch (error) {
    console.error('Failed to fetch parking info:', error);
    throw error;
  }
}