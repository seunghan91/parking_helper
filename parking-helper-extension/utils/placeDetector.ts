import { PlaceInfo } from './types';

export async function detectPlaceInfo(): Promise<PlaceInfo | null> {
  const hostname = window.location.hostname;
  
  if (hostname.includes('map.naver.com')) {
    return detectNaverPlace();
  } else if (hostname.includes('map.kakao.com')) {
    return detectKakaoPlace();
  } else if (hostname.includes('google.com/maps')) {
    return detectGooglePlace();
  }
  
  return null;
}

function detectNaverPlace(): PlaceInfo | null {
  try {
    // 네이버 지도에서 장소 정보 추출
    // 1. URL에서 장소 ID 추출
    const url = window.location.href;
    const placeMatch = url.match(/place\/(\d+)/);
    
    if (placeMatch) {
      const placeId = placeMatch[1];
      
      // 2. DOM에서 장소 이름 추출
      const nameEl = document.querySelector('.place_bluelink') || 
                     document.querySelector('.YouOG span') ||
                     document.querySelector('[class*="place_name"]');
      
      // 3. 주소 추출
      const addressEl = document.querySelector('.YouOG + div span') ||
                        document.querySelector('[class*="place_address"]');
      
      if (nameEl) {
        return {
          name: nameEl.textContent?.trim() || '',
          address: addressEl?.textContent?.trim(),
          provider: 'naver',
          externalId: placeId
        };
      }
    }
  } catch (error) {
    console.error('Failed to detect Naver place:', error);
  }
  
  return null;
}

function detectKakaoPlace(): PlaceInfo | null {
  try {
    // 카카오맵에서 장소 정보 추출
    const url = window.location.href;
    const placeMatch = url.match(/place\/(\d+)/);
    
    if (placeMatch) {
      const placeId = placeMatch[1];
      
      // DOM에서 장소 정보 추출
      const nameEl = document.querySelector('.link_name') ||
                     document.querySelector('[class*="place_name"]');
      
      const addressEl = document.querySelector('.txt_address') ||
                        document.querySelector('[class*="place_address"]');
      
      if (nameEl) {
        return {
          name: nameEl.textContent?.trim() || '',
          address: addressEl?.textContent?.trim(),
          provider: 'kakao',
          externalId: placeId
        };
      }
    }
  } catch (error) {
    console.error('Failed to detect Kakao place:', error);
  }
  
  return null;
}

function detectGooglePlace(): PlaceInfo | null {
  try {
    // Google Maps에서 장소 정보 추출
    const url = window.location.href;
    const placeMatch = url.match(/place\/([^/]+)/);
    
    if (placeMatch) {
      const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      
      // DOM에서 추가 정보 추출
      const nameEl = document.querySelector('h1[class*="fontHeadlineLarge"]') ||
                     document.querySelector('[aria-label*="정보"]');
      
      const addressEl = document.querySelector('[data-item-id*="address"]') ||
                        document.querySelector('[aria-label*="주소"]');
      
      // 좌표 추출 (URL에서)
      const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      
      return {
        name: nameEl?.textContent?.trim() || placeName,
        address: addressEl?.textContent?.trim(),
        provider: 'google',
        externalId: placeName,
        latitude: coordMatch ? parseFloat(coordMatch[1]) : undefined,
        longitude: coordMatch ? parseFloat(coordMatch[2]) : undefined
      };
    }
  } catch (error) {
    console.error('Failed to detect Google place:', error);
  }
  
  return null;
}