// Content Script - 지도 서비스에서 장소 정보 추출
interface PlaceInfo {
  id?: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  mapProvider: 'naver' | 'kakao' | 'google';
}

interface MessageRequest {
  action: string;
  data?: any;
}

interface MessageResponse {
  success: boolean;
  place?: PlaceInfo;
  error?: string;
}

class MapContentScript {
  private currentPlace: PlaceInfo | null = null;
  private mapProvider: 'naver' | 'kakao' | 'google';
  private observer: MutationObserver | null = null;

  constructor() {
    this.mapProvider = this.detectMapProvider();
    this.init();
  }

  private detectMapProvider(): 'naver' | 'kakao' | 'google' {
    const hostname = window.location.hostname;
    
    if (hostname.includes('naver.com')) return 'naver';
    if (hostname.includes('kakao.com')) return 'kakao';
    if (hostname.includes('google.com')) return 'google';
    
    return 'google'; // 기본값
  }

  private init() {
    console.log(`파킹 헬퍼 활성화됨 - ${this.mapProvider} 지도`);
    
    // 메시지 리스너 설정
    this.setupMessageListener();
    
    // 초기 장소 정보 추출
    this.extractPlaceInfo();
    
    // DOM 변경 감지 설정
    this.setupObserver();
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener(
      (request: MessageRequest, sender, sendResponse) => {
        if (request.action === 'getCurrentPlace') {
          sendResponse({
            success: true,
            place: this.currentPlace
          } as MessageResponse);
        }
        return true;
      }
    );
  }

  private setupObserver() {
    // DOM 변경 감지로 장소 변경 캐치
    this.observer = new MutationObserver(() => {
      this.extractPlaceInfo();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }

  private extractPlaceInfo() {
    let place: PlaceInfo | null = null;

    try {
      switch (this.mapProvider) {
        case 'naver':
          place = this.extractNaverPlace();
          break;
        case 'kakao':
          place = this.extractKakaoPlace();
          break;
        case 'google':
          place = this.extractGooglePlace();
          break;
      }

      if (place && place.name && place.address) {
        this.currentPlace = place;
        console.log('장소 정보 추출됨:', place);
        
        // 백엔드에 장소 정보 전송 (필요시)
        this.sendPlaceToBackend(place);
      }
    } catch (error) {
      console.error('장소 정보 추출 오류:', error);
    }
  }

  private extractNaverPlace(): PlaceInfo | null {
    // 네이버 지도 장소 정보 추출
    const placePanel = document.querySelector('.place_section_content, .place_detail_content');
    
    if (!placePanel) return null;

    const nameEl = placePanel.querySelector('.place_section_header .place_name, .place_detail_header .place_name, h1.GHAhO, h2.GHAhO');
    const addressEl = placePanel.querySelector('.place_section_address, .place_detail_address, .LDgIH, .place_address');

    if (!nameEl || !addressEl) return null;

    const name = nameEl.textContent?.trim();
    const address = addressEl.textContent?.trim();

    if (!name || !address) return null;

    return {
      name,
      address,
      mapProvider: 'naver'
    };
  }

  private extractKakaoPlace(): PlaceInfo | null {
    // 카카오 지도 장소 정보 추출
    const detailPanel = document.querySelector('.info_detail, .place_details');
    
    if (!detailPanel) return null;

    const nameEl = detailPanel.querySelector('.place_name, .tit_location, .name_place');
    const addressEl = detailPanel.querySelector('.txt_address, .desc_address, .address_detail');

    if (!nameEl || !addressEl) return null;

    const name = nameEl.textContent?.trim();
    const address = addressEl.textContent?.trim();

    if (!name || !address) return null;

    return {
      name,
      address,
      mapProvider: 'kakao'
    };
  }

  private extractGooglePlace(): PlaceInfo | null {
    // 구글 지도 장소 정보 추출
    const placePanel = document.querySelector('[data-value="Place"], .place-result, .section-result');
    
    if (!placePanel) return null;

    // 여러 가능한 셀렉터 시도
    let nameEl = placePanel.querySelector('h1[data-value="Place name"], .section-hero-header-title-title, .x3AX1-LfntMc-header-title-title');
    if (!nameEl) {
      nameEl = document.querySelector('h1[data-value="Place name"], .section-hero-header-title-title');
    }

    let addressEl = placePanel.querySelector('[data-value="Address"], .section-info-line, .rogA2c');
    if (!addressEl) {
      addressEl = document.querySelector('[data-value="Address"], .section-info-line');
    }

    if (!nameEl || !addressEl) return null;

    const name = nameEl.textContent?.trim();
    const address = addressEl.textContent?.trim();

    if (!name || !address) return null;

    return {
      name,
      address,
      mapProvider: 'google'
    };
  }

  private async sendPlaceToBackend(place: PlaceInfo) {
    try {
      // TODO: 실제 API 엔드포인트 연결
      const apiUrl = 'https://your-app-url.vercel.app';
      
      const response = await fetch(`${apiUrl}/api/place/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: place.name,
          address: place.address,
          map_provider: place.mapProvider,
          coordinates: place.latitude && place.longitude ? {
            lat: place.latitude,
            lng: place.longitude
          } : null
        })
      });

      if (!response.ok) {
        console.warn('백엔드 전송 실패:', response.status);
      }
    } catch (error) {
      console.warn('백엔드 전송 오류:', error);
      // 개발 중이므로 오류를 무시하고 계속 진행
    }
  }
}

// Content Script 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new MapContentScript();
  });
} else {
  new MapContentScript();
}