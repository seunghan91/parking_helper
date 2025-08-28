// 지도 서비스 감지 유틸리티

export const MAP_DOMAINS = {
  naver: 'map.naver.com',
  kakao: 'map.kakao.com',
  googleMain: 'maps.google.com',
  googleSub: 'www.google.com/maps'
} as const;

export type MapService = 'naver' | 'kakao' | 'google' | null;

/**
 * URL이 지도 사이트인지 확인
 */
export function isMapSite(url: string): boolean {
  return Object.values(MAP_DOMAINS).some(domain => url.includes(domain));
}

/**
 * 지도 서비스 유형 감지
 */
export function detectMapService(url: string): MapService {
  if (url.includes(MAP_DOMAINS.naver)) return 'naver';
  if (url.includes(MAP_DOMAINS.kakao)) return 'kakao';
  if (url.includes(MAP_DOMAINS.googleMain) || url.includes(MAP_DOMAINS.googleSub)) return 'google';
  return null;
}

/**
 * 현재 활성 탭의 지도 서비스 확인
 */
export async function getCurrentMapService(): Promise<MapService> {
  try {
    const { browser } = await import('wxt/browser');
    const [tab] = await browser.tabs.query({ 
      active: true, 
      currentWindow: true 
    });
    
    if (tab?.url) {
      return detectMapService(tab.url);
    }
  } catch (error) {
    console.error('Failed to get current map service:', error);
  }
  
  return null;
}