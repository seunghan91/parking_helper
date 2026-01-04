import { createClient } from '@/lib/supabase/client'

// 세션 ID 생성 및 관리
function getSessionId(): string {
  const SESSION_KEY = 'parking_helper_session_id'
  let sessionId = sessionStorage.getItem(SESSION_KEY)
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem(SESSION_KEY, sessionId)
  }
  
  return sessionId
}

// 이벤트 타입 정의
export type AnalyticsEvent = 
  | { name: 'page_view'; payload: { path: string; referrer?: string } }
  | { name: 'view_place'; payload: { provider: string; external_place_id?: string; place_id?: string } }
  | { name: 'search_parking'; payload: { query?: string; lat?: number; lng?: number } }
  | { name: 'review_created'; payload: { subject_type: string; target_id: string; rating?: number } }
  | { name: 'review_helpful'; payload: { review_id: string; action: 'add' | 'remove' } }
  | { name: 'tip_created'; payload: { parking_lot_id: string } }
  | { name: 'extension_installed'; payload: { version: string } }
  | { name: 'extension_panel_opened'; payload: { domain: string } }

// 이벤트 추적 함수
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  try {
    // 개발 중에는 콘솔에만 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event.name, event.payload)
      return
    }
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const eventData = {
      user_id: user?.id || null,
      session_id: getSessionId(),
      name: event.name,
      payload: event.payload,
      created_at: new Date().toISOString()
    }
    
    // Supabase에 이벤트 저장
    const { error } = await supabase
      .from('events')
      .insert([eventData])
    
    if (error) {
      console.error('Failed to track event:', error)
      // 실패 시에도 앱이 멈추지 않도록 함
    }
    
    // Google Analytics 호출 (옵션)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.name, {
        ...event.payload,
        user_id: user?.id,
        session_id: getSessionId()
      })
    }
  } catch (error) {
    console.error('Analytics error:', error)
  }
}

// 페이지 뷰 추적 헬퍼
export function trackPageView(path: string): void {
  trackEvent({
    name: 'page_view',
    payload: {
      path,
      referrer: document.referrer
    }
  })
}

// React Hook for analytics
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function useAnalytics() {
  const pathname = usePathname()
  
  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])
}

// 분석 데이터 조회 함수 (관리자용)
export async function getAnalytics(metric: 'dau' | 'events' | 'funnel') {
  const supabase = createClient()
  
  switch (metric) {
    case 'dau':
      return supabase.from('analytics_dau').select('*')
    case 'events':
      return supabase.from('analytics_events').select('*')
    case 'funnel':
      return supabase.from('analytics_funnel').select('*')
    default:
      throw new Error(`Unknown metric: ${metric}`)
  }
}