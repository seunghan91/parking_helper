import { createClient } from '@supabase/supabase-js'

// 테스트용 Supabase 클라이언트 생성
export function createTestClient(options?: { asUser?: string }) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  if (options?.asUser) {
    // 테스트용 사용자로 로그인
    client.auth.setSession({
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: options.asUser,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      }
    })
  }

  return client
}

// 테스트 데이터 생성 헬퍼
export const testData = {
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    nickname: '테스트사용자'
  },
  place: {
    id: 'test-place-123',
    name: '테스트 빌딩',
    address: '서울 강남구 테스트로 123',
    latitude: 37.4979,
    longitude: 127.0276
  },
  parkingLot: {
    id: 'test-parking-123',
    name: '테스트 주차장',
    type: 'public',
    price_info: { unit: '10분', price: 500 }
  },
  review: {
    rating: 4,
    comment: '테스트 리뷰입니다'
  }
}

// API 응답 모킹
export function mockApiResponse(data: any, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

// 에러 응답 모킹
export function mockApiError(code: string, message: string, status = 400) {
  return new Response(
    JSON.stringify({ error: { code, message } }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}