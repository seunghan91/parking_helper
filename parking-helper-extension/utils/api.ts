// API 클라이언트 유틸리티
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003' 
  : process.env.PRODUCTION_API_URL || 'https://your-production-url.com'

interface ApiResponse<T> {
  data?: T
  error?: {
    code: string
    message: string
  }
}

export async function fetchParkingLot(id: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/parking/${id}`)
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch parking lot:', error)
    return { error: { code: 'NETWORK_ERROR', message: 'Failed to fetch data' } }
  }
}

export async function searchParkingLots(params: {
  q?: string
  lat?: number
  lng?: number
  radius?: number
  limit?: number
}): Promise<ApiResponse<any>> {
  try {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value))
      }
    })
    
    const response = await fetch(`${API_BASE_URL}/api/parking/search?${queryParams}`)
    return await response.json()
  } catch (error) {
    console.error('Failed to search parking lots:', error)
    return { error: { code: 'NETWORK_ERROR', message: 'Failed to search' } }
  }
}

export async function fetchReviews(params: {
  parking_lot_id?: string
  place_id?: string
  lat?: number
  lng?: number
  radius?: number
  limit?: number
}): Promise<ApiResponse<any>> {
  try {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value))
      }
    })
    
    const response = await fetch(`${API_BASE_URL}/api/reviews?${queryParams}`)
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    return { error: { code: 'NETWORK_ERROR', message: 'Failed to fetch reviews' } }
  }
}

export async function ingestPlace(data: {
  provider: 'naver' | 'kakao' | 'google'
  external_place_id: string
  name: string
  address?: string
  latitude?: number
  longitude?: number
}): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/place/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return await response.json()
  } catch (error) {
    console.error('Failed to ingest place:', error)
    return { error: { code: 'NETWORK_ERROR', message: 'Failed to ingest place' } }
  }
}