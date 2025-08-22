import { describe, test, expect, vi } from 'vitest'
import { POST } from '@/app/api/reviews/route'
import { testData } from '@/lib/test-utils'

// Supabase 클라이언트 모킹
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: () => ({
        data: { user: { id: testData.user.id } },
        error: null
      })
    },
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => ({
            data: {
              id: 'new-review-123',
              ...testData.review,
              user_id: testData.user.id,
              created_at: new Date().toISOString()
            },
            error: null
          })
        })
      })
    })
  })
}))

describe('리뷰 작성 API', () => {
  test('인증된 사용자는 리뷰를 작성할 수 있다', async () => {
    const request = new Request('http://localhost:3000/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject_type: 'parking_lot',
        parking_lot_id: testData.parkingLot.id,
        rating: testData.review.rating,
        comment: testData.review.comment
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.data).toBeDefined()
    expect(data.data.rating).toBe(testData.review.rating)
  })

  test('인증되지 않은 사용자는 401 에러를 받는다', async () => {
    // 인증 실패를 모킹
    vi.mocked(createClient).mockReturnValueOnce({
      auth: {
        getUser: () => ({
          data: { user: null },
          error: new Error('Not authenticated')
        })
      }
    } as any)

    const request = new Request('http://localhost:3000/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject_type: 'parking_lot',
        parking_lot_id: testData.parkingLot.id,
        rating: 5,
        comment: '좋아요'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  test('잘못된 평점값은 400 에러를 반환한다', async () => {
    const request = new Request('http://localhost:3000/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject_type: 'parking_lot',
        parking_lot_id: testData.parkingLot.id,
        rating: 6, // 1-5 범위를 벗어남
        comment: '테스트'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('BAD_REQUEST')
  })

  test('subject_type에 따른 필수 필드 검증이 작동한다', async () => {
    // parking_lot_id 없이 요청
    const request = new Request('http://localhost:3000/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject_type: 'parking_lot',
        rating: 4,
        comment: '테스트'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.message).toContain('parking_lot_id')
  })
})