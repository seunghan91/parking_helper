// 메시지 타입 정의

export interface PlaceInfo {
  id: string;
  name: string;
  address: string;
  buildingName?: string; // 빌딩명 추가
  buildingId?: string; // 빌딩 고유 ID (주소 기반 생성)
  floor?: string; // 층 정보
  unit?: string; // 호수 정보
  reviewCount: number;
  tipCount: number;
  rating: string;
  service?: 'naver' | 'kakao' | 'google';
  url?: string;
}

export interface ParkingData {
  reviews: Array<{
    id: string;
    author: string;
    content: string;
    rating: number;
    date: string;
  }>;
  tips: Array<{
    id: string;
    author: string;
    content: string;
    date: string;
  }>;
  summary?: {
    averageRating: number;
    totalReviews: number;
    totalTips: number;
  };
}

// Content Script -> Popup 메시지
export interface GetCurrentPlaceMessage {
  type: 'GET_CURRENT_PLACE';
}

export interface GetCurrentPlaceResponse {
  place: PlaceInfo | null;
}

// Popup -> Content Script 메시지
export interface ShowParkingDetailsMessage {
  type: 'SHOW_PARKING_DETAILS';
}

export interface SearchParkingMessage {
  type: 'SEARCH_PARKING';
  action: 'nearby';
}

// Content Script -> Background 메시지
export interface PlaceDetectedMessage {
  type: 'PLACE_DETECTED';
  place: {
    id: string;
    service: string;
    url: string;
  };
}

export interface GetDataMessage {
  type: 'GET_DATA';
  placeId: string;
}

export interface GetDataResponse {
  success: boolean;
  data?: ParkingData;
  error?: string;
}

// Background -> Content Script 메시지
export interface MapDetectedMessage {
  type: 'MAP_DETECTED';
}

export interface FetchPlaceDataMessage {
  type: 'FETCH_PLACE_DATA';
  place: {
    id: string;
  };
}

// Union type for all message types
export type Message = 
  | GetCurrentPlaceMessage 
  | ShowParkingDetailsMessage 
  | SearchParkingMessage
  | PlaceDetectedMessage 
  | GetDataMessage
  | MapDetectedMessage
  | FetchPlaceDataMessage;