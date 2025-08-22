export interface PlaceInfo {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  provider: 'naver' | 'kakao' | 'google';
  externalId?: string;
}

export interface ParkingLot {
  id: string;
  name: string;
  type: 'public' | 'private';
  distance?: string;
  base_fee_info?: string;
  operating_hours?: string;
  total_spaces?: number;
}

export interface Review {
  id: string;
  content: string;
  rating: number;
  display_name?: string;
  created_at: string;
  helpful_count?: number;
}

export interface Tip {
  id: string;
  content: string;
  created_at: string;
}

export interface ParkingInfo {
  parkingLots?: ParkingLot[];
  reviews?: Review[];
  tips?: Tip[];
}