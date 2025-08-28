// 위치 기반 주차장 검색 및 거리 계산 유틸리티

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ParkingLocation {
  id: string;
  name: string;
  type: 'building' | 'public' | 'private' | 'street';
  coordinates: Coordinates;
  address: string;
  distance?: number; // meters
  parkingInfo: {
    totalSpaces?: number;
    hourlyRate?: string;
    monthlyRate?: string;
    freeHours?: number;
    operatingHours?: string;
    reviews?: any[];
    tips?: any[];
    rating?: number;
  };
}

/**
 * 두 지점 간 거리 계산 (Haversine formula)
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // 지구 반경 (미터)
  const φ1 = coord1.lat * Math.PI / 180;
  const φ2 = coord2.lat * Math.PI / 180;
  const Δφ = (coord2.lat - coord1.lat) * Math.PI / 180;
  const Δλ = (coord2.lng - coord1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // 미터 단위
}

/**
 * 거리를 읽기 쉬운 형식으로 변환
 */
export function formatDistance(meters: number): string {
  if (meters < 100) {
    return `${Math.round(meters)}m`;
  } else if (meters < 1000) {
    return `${Math.round(meters / 10) * 10}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}

/**
 * 근처 주차장 검색 (거리순 정렬)
 */
export function findNearbyParking(
  currentLocation: Coordinates,
  parkingLocations: ParkingLocation[],
  maxDistance: number = 500 // 기본 500m 이내
): ParkingLocation[] {
  return parkingLocations
    .map(parking => ({
      ...parking,
      distance: calculateDistance(currentLocation, parking.coordinates)
    }))
    .filter(parking => parking.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * 여의도 지역 공영/민영 주차장 샘플 데이터
 */
export const YEOUIDO_PARKING_DATA: ParkingLocation[] = [
  {
    id: 'public_yeouido_park',
    name: '여의도공원 지하주차장',
    type: 'public',
    coordinates: { lat: 37.5283, lng: 126.9294 },
    address: '서울 영등포구 여의공원로 68',
    parkingInfo: {
      totalSpaces: 1400,
      hourlyRate: '1,500원/30분',
      monthlyRate: '150,000원',
      freeHours: 0,
      operatingHours: '24시간',
      rating: 4.2,
      reviews: [
        {
          author: '공원방문객',
          rating: 4,
          content: '주차공간 넓고 깨끗해요. 주말엔 한강공원 가는 사람들로 붐빕니다.',
          timestamp: '2025-08-27'
        }
      ],
      tips: [
        { content: '💡 주말 오전 10시 이후는 만차 가능성 높음' },
        { content: '💡 B2, B3층이 상대적으로 여유있음' }
      ]
    }
  },
  {
    id: 'public_yeouido_station',
    name: '여의도역 공영주차장',
    type: 'public',
    coordinates: { lat: 37.5219, lng: 126.9245 },
    address: '서울 영등포구 여의나루로 40',
    parkingInfo: {
      totalSpaces: 280,
      hourlyRate: '1,200원/30분',
      monthlyRate: '120,000원',
      freeHours: 0,
      operatingHours: '05:00-24:00',
      rating: 3.8,
      reviews: [
        {
          author: '지하철이용객',
          rating: 4,
          content: '역 연결되어 있어서 환승 편리. 출퇴근 시간엔 자리 없어요.',
          timestamp: '2025-08-26'
        }
      ],
      tips: [
        { content: '💡 지하철 환승 시 편리한 위치' },
        { content: '💡 평일 9시 이후 주차 어려움' }
      ]
    }
  },
  {
    id: 'private_ifc_mall',
    name: 'IFC몰 주차장',
    type: 'private',
    coordinates: { lat: 37.5251, lng: 126.9255 },
    address: '서울 영등포구 국제금융로 10',
    parkingInfo: {
      totalSpaces: 3000,
      hourlyRate: '4,000원/30분',
      monthlyRate: '300,000원',
      freeHours: 2, // 구매 시
      operatingHours: '24시간',
      rating: 4.5,
      reviews: [
        {
          author: 'IFC방문객',
          rating: 5,
          content: '시설 최고! 주차공간도 넓고 깨끗. 영화관/쇼핑 시 3시간 무료.',
          timestamp: '2025-08-25'
        }
      ],
      tips: [
        { content: '💡 구매 영수증으로 2-3시간 무료주차' },
        { content: '💡 주말에도 여유있는 편' },
        { content: '💡 CGV 영화 관람 시 3시간 무료' }
      ]
    }
  },
  {
    id: 'street_parking_yeouido',
    name: '국제금융로 노상주차장',
    type: 'street',
    coordinates: { lat: 37.5264, lng: 126.9284 },
    address: '서울 영등포구 국제금융로 일대',
    parkingInfo: {
      totalSpaces: 50,
      hourlyRate: '1,000원/30분',
      freeHours: 0,
      operatingHours: '09:00-21:00 (주말 무료)',
      rating: 3.5,
      reviews: [
        {
          author: '노상주차이용자',
          rating: 3,
          content: '저렴하지만 자리 찾기 어려워요. 주말 무료라 좋음.',
          timestamp: '2025-08-24'
        }
      ],
      tips: [
        { content: '💡 평일 낮에는 거의 만차' },
        { content: '💡 주말/공휴일 무료 개방' }
      ]
    }
  },
  {
    id: 'building_parking_krx',
    name: '한국거래소 주차장',
    type: 'building',
    coordinates: { lat: 37.5265, lng: 126.9285 },
    address: '서울 영등포구 여의나루로 76',
    parkingInfo: {
      totalSpaces: 28,
      hourlyRate: '500원/5분 (6,000원/시간)',
      monthlyRate: '200,000원',
      freeHours: 1,
      operatingHours: '07:00-22:00 (주말 무료)',
      rating: 3.8
    }
  }
];

/**
 * 현재 위치 주변 주차장 추천
 */
export function recommendParking(
  currentCoords: Coordinates,
  options: {
    maxDistance?: number;
    preferredType?: ParkingLocation['type'][];
    minRating?: number;
    requireMonthly?: boolean;
  } = {}
): ParkingLocation[] {
  const {
    maxDistance = 500,
    preferredType,
    minRating = 0,
    requireMonthly = false
  } = options;

  let parkingList = findNearbyParking(currentCoords, YEOUIDO_PARKING_DATA, maxDistance);

  // 필터링
  if (preferredType && preferredType.length > 0) {
    parkingList = parkingList.filter(p => preferredType.includes(p.type));
  }

  if (minRating > 0) {
    parkingList = parkingList.filter(p => (p.parkingInfo.rating || 0) >= minRating);
  }

  if (requireMonthly) {
    parkingList = parkingList.filter(p => p.parkingInfo.monthlyRate);
  }

  return parkingList;
}

/**
 * 도보 시간 계산 (평균 도보 속도: 4km/h)
 */
export function calculateWalkingTime(meters: number): string {
  const minutes = Math.ceil(meters / 66.67); // 4km/h = 66.67m/min
  if (minutes < 1) return '1분 이내';
  return `도보 ${minutes}분`;
}