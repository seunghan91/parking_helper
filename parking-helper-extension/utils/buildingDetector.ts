// 빌딩 정보 추출 및 관리 유틸리티

/**
 * 주소에서 빌딩 정보 추출
 */
export function extractBuildingInfo(address: string): {
  buildingName: string | null;
  buildingId: string | null;
  floor: string | null;
  unit: string | null;
  baseAddress: string;
} {
  // 빌딩명 패턴: ~빌딩, ~타워, ~센터, ~아파트, ~플라자, ~오피스텔 등
  const buildingPattern = /([가-힣A-Z0-9]+(?:빌딩|타워|센터|아파트|플라자|오피스텔|스퀘어|타운|프라자|하우스|빌|관|동))/;
  
  // 층 정보 패턴: 1층, B1층, 지하1층 등
  const floorPattern = /(?:지하\s*)?([B0-9]+)층/;
  
  // 호수 정보 패턴: 101호, 3층 301호 등
  const unitPattern = /([0-9]+호)/;
  
  const buildingMatch = address.match(buildingPattern);
  const floorMatch = address.match(floorPattern);
  const unitMatch = address.match(unitPattern);
  
  let buildingName = buildingMatch ? buildingMatch[1] : null;
  let floor = floorMatch ? floorMatch[0] : null;
  let unit = unitMatch ? unitMatch[1] : null;
  
  // 기본 주소 생성 (빌딩까지만)
  let baseAddress = address;
  if (buildingName) {
    const buildingIndex = address.indexOf(buildingName);
    if (buildingIndex !== -1) {
      baseAddress = address.substring(0, buildingIndex + buildingName.length);
    }
  }
  
  // 빌딩 ID 생성: 기본 주소를 해시화
  let buildingId = null;
  if (buildingName) {
    // 간단한 해시: 빌딩명과 주소 조합
    buildingId = generateBuildingId(baseAddress);
  }
  
  return {
    buildingName,
    buildingId,
    floor,
    unit,
    baseAddress
  };
}

/**
 * 빌딩 ID 생성 (주소 기반)
 */
export function generateBuildingId(baseAddress: string): string {
  // 주소에서 불필요한 공백 제거 및 정규화
  const normalized = baseAddress.trim().replace(/\s+/g, ' ').toLowerCase();
  
  // 간단한 해시 함수 (실제로는 더 복잡한 해시를 사용할 수 있음)
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `building_${Math.abs(hash).toString(36)}`;
}

/**
 * 두 주소가 같은 빌딩인지 확인
 */
export function isSameBuilding(address1: string, address2: string): boolean {
  const info1 = extractBuildingInfo(address1);
  const info2 = extractBuildingInfo(address2);
  
  // 빌딩 ID가 같으면 같은 빌딩
  if (info1.buildingId && info2.buildingId && info1.buildingId === info2.buildingId) {
    return true;
  }
  
  // 빌딩명과 기본 주소가 비슷하면 같은 빌딩으로 판단
  if (info1.buildingName && info2.buildingName) {
    const sameBuildingName = info1.buildingName === info2.buildingName;
    const sameStreet = info1.baseAddress.includes(info2.baseAddress.split(' ')[2]) || 
                       info2.baseAddress.includes(info1.baseAddress.split(' ')[2]);
    
    return sameBuildingName && sameStreet;
  }
  
  return false;
}

/**
 * 샘플 빌딩별 주차 데이터
 */
export const BUILDING_PARKING_DATA: Record<string, any> = {
  // 백상빌딩
  '백상빌딩': {
    buildingName: '백상빌딩',
    address: '서울 영등포구 국제금융로6길 30',
    parkingInfo: {
      reviews: [
        {
          author: '이용자A',
          rating: 4,
          content: '백상빌딩 지하주차장 넓고 좋아요. 1시간 무료주차 가능하고, 식당 이용시 2시간 추가 무료입니다.',
          timestamp: '2025-08-27',
          businessName: '전체 빌딩'
        },
        {
          author: '방문객B',
          rating: 3,
          content: '점심시간에는 주차하기 어려워요. 맛뜸이나 고려호프 가실 분들은 11시 30분 전에 오시는 걸 추천합니다.',
          timestamp: '2025-08-26',
          businessName: '맛뜸'
        },
        {
          author: '단골손님',
          rating: 5,
          content: '고려호프 이용하면서 주차했는데, 빌딩 지하주차장 깨끗하고 관리 잘 되어 있어요. 엘리베이터도 바로 연결되어 편리합니다.',
          timestamp: '2025-08-25',
          businessName: '고려호프'
        }
      ],
      tips: [
        {
          content: '💡 지하 1층~3층까지 주차 가능, 총 150대 주차 공간'
        },
        {
          content: '💡 평일 첫 1시간 무료, 이후 10분당 1000원'
        },
        {
          content: '💡 식당 이용 시 2시간 추가 무료 (영수증 지참)'
        },
        {
          content: '💡 월정기권 15만원 (평일 주간)'
        }
      ]
    }
  },
  
  // 다른 빌딩들도 추가 가능
};