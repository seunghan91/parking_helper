import { vi } from 'vitest'

// 환경변수 모킹
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'

// fetch 모킹
global.fetch = vi.fn()

// chrome API 모킹 (확장 프로그램 테스트용)
;(global as any).chrome = {
  tabs: {
    create: vi.fn()
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn()
    }
  }
} as any