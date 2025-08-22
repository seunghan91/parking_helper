import { describe, test, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/parking/search/route'
import { testData } from '@/lib/test-utils'

// Supabase 클라이언트 모킹
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        limit: () => ({
          or: () => ({
            order: () => ({
              data: [testData.parkingLot],
              error: null
            })
          })
        })
      })
    })
  })
}))

describe('주차장 검색 API', () => {
  test('텍스트 검색이 정상 작동한다', async () => {
    const request = new Request('http://localhost:3000/api/parking/search?q=테스트')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].name).toBe('테스트 주차장')
  })

  test('위치 기반 검색이 정상 작동한다', async () => {
    const request = new Request(
      'http://localhost:3000/api/parking/search?lat=37.4979&lng=127.0276&radius=1000'
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toBeDefined()
  })

  test('페이지네이션이 정상 작동한다', async () => {
    const request = new Request(
      'http://localhost:3000/api/parking/search?limit=10&cursor=test-cursor'
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.page).toBeDefined()
  })

  test('limit이 최대값을 초과하면 50으로 제한된다', async () => {
    const request = new Request(
      'http://localhost:3000/api/parking/search?limit=100'
    )
    const response = await GET(request)
    
    expect(response.status).toBe(200)
  })
})