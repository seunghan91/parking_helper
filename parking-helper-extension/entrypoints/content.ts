import { defineContentScript } from 'wxt/sandbox';
import { browser } from 'wxt/browser';
import { fetchParkingLot, searchParkingLots, fetchReviews, ingestPlace } from '@/utils/api';

export default defineContentScript({
  matches: [
    'https://map.naver.com/*',
    'https://map.kakao.com/*',
    'https://www.google.com/maps/*',
    'https://maps.google.com/*'
  ],
  runAt: 'document_idle',
  main() {
    console.log('파킹 헬퍼 콘텐츠 스크립트 로드됨');

    let currentMapService: string = '';
    let currentPlaceId: string | null = null;
    let currentPlaceData: any = null;
    let uiInjected = false;

    // 현재 지도 서비스 감지
    function detectMapService(): string {
      const hostname = window.location.hostname;
      
      if (hostname.includes('map.naver.com')) {
        return 'naver';
      } else if (hostname.includes('map.kakao.com')) {
        return 'kakao';
      } else if (hostname.includes('google.com')) {
        return 'google';
      }
      
      return '';
    }

    // 네이버 지도에서 장소 ID 추출
    function extractNaverPlaceId(): string | null {
      console.log('네이버 지도 URL:', window.location.href);
      
      // URL에서 place ID 추출 시도
      // 예: https://map.naver.com/p/search/주차장/place/1234567890
      const pathMatch = window.location.pathname.match(/\/place\/(\d+)/);
      if (pathMatch) {
        console.log('네이버 장소 ID 발견 (경로):', pathMatch[1]);
        return pathMatch[1];
      }
      
      // entry 패턴 확인
      // 예: https://map.naver.com/p/entry/place/1234567890
      const entryMatch = window.location.pathname.match(/\/entry\/place\/(\d+)/);
      if (entryMatch) {
        console.log('네이버 장소 ID 발견 (entry):', entryMatch[1]);
        return entryMatch[1];
      }
      
      // search 패턴 확인
      const searchMatch = window.location.pathname.match(/\/search\/[^\/]+\/place\/(\d+)/);
      if (searchMatch) {
        console.log('네이버 장소 ID 발견 (search):', searchMatch[1]);
        return searchMatch[1];
      }
      
      console.log('네이버 장소 ID를 찾을 수 없음');
      return null;
    }

    // 카카오 지도에서 장소 ID 추출 (URL 기반이 아닌 콘텐츠 기반으로 변경)
    function extractKakaoPlaceId(): string | null {
      const placeName = extractPlaceName();
      const placeAddress = extractPlaceAddress();

      if (placeName && placeAddress) {
        // 장소명과 주소를 조합하여 고유 ID 생성
        return `kakao-${placeName}-${placeAddress}`;
      }
      
      return null;
    }

    // 구글 지도에서 장소 ID 추출
    function extractGooglePlaceId(): string | null {
      const pathMatch = window.location.pathname.match(/place\/([^\/]+)/);
      if (pathMatch) {
        return pathMatch[1];
      }
      
      // 데이터 속성에서 추출 시도
      const placeElement = document.querySelector('[data-placeid]');
      if (placeElement) {
        return placeElement.getAttribute('data-placeid');
      }
      
      return null;
    }

    // 현재 장소 ID 추출
    function extractPlaceId(): string | null {
      switch (currentMapService) {
        case 'naver':
          return extractNaverPlaceId();
        case 'kakao':
          return extractKakaoPlaceId();
        case 'google':
          return extractGooglePlaceId();
        default:
          return null;
      }
    }
    
    // 디버깅 헬퍼 함수
    function debugNaverMap() {
      console.log('🔍 네이버맵 DOM 디버깅 시작...');
      
      // iframe 확인
      const iframe = document.querySelector('iframe#entryIframe') as HTMLIFrameElement;
      console.log('iframe 존재:', !!iframe);
      
      // GHAhO 클래스 요소들 확인
      const allGHAhO = document.querySelectorAll('.GHAhO');
      console.log(`GHAhO 요소 개수: ${allGHAhO.length}`);
      allGHAhO.forEach((el, i) => {
        const text = el.textContent?.trim();
        const parent = el.parentElement;
        console.log(`  [${i}] "${text}" (parent: ${parent?.id || parent?.className})`);
      });
      
      // LDgIH 클래스 요소들 확인 (주소)
      const allLDgIH = document.querySelectorAll('.LDgIH');
      console.log(`LDgIH 요소 개수: ${allLDgIH.length}`);
      allLDgIH.forEach((el, i) => {
        const text = el.textContent?.trim();
        const parent = el.parentElement;
        if (text && text.length < 100) {
          console.log(`  [${i}] "${text}" (parent: ${parent?.className})`);
        }
      });
    }
    
    // 장소명 추출
    function extractPlaceName(): string {
      if (currentMapService === 'naver') {
        // 디버깅 정보 출력
        debugNaverMap();
        
        // 네이버 지도에서 장소명 추출 - iframe 내부도 확인
        const selectors = [
          // 장소 상세 패널 내의 장소명 (가장 정확)
          'iframe#entryIframe',  // 먼저 iframe 확인
          '#_title span.GHAhO:not(.place_blind)',  // 정확한 장소명 선택자
          '.place_section .zD5Nm span.GHAhO',      // 장소 섹션 내
          '#_title .GHAhO:first-of-type',          // 첫 번째 GHAhO만
          '.LylZZ span.GHAhO',                     // LylZZ 클래스 내
        ];
        
        // iframe 내부 확인
        const iframe = document.querySelector('iframe#entryIframe') as HTMLIFrameElement;
        if (iframe && iframe.contentDocument) {
          try {
            const iframeDoc = iframe.contentDocument;
            const iframePlaceName = iframeDoc.querySelector('#_title span.GHAhO') ||
                                    iframeDoc.querySelector('.zD5Nm span.GHAhO');
            if (iframePlaceName?.textContent?.trim()) {
              const name = iframePlaceName.textContent.trim();
              if (name && !name.includes('@') && !name.includes('네이버')) {
                console.log(`✅ iframe에서 장소명 찾음:`, name);
                return name;
              }
            }
          } catch (e) {
            console.log('iframe 접근 불가:', e);
          }
        }
        
        // 제외할 텍스트 패턴
        const excludePatterns = [
          '네이버 지도',
          '네이버지도',
          'NAVER Map',
          '로딩',
          '...',
          '내 장소',
          '저장',
          '로그인',
          '@',  // 이메일/계정 정보 제외
          '.com',
          '.kr',
          '님',  // 계정 닉네임 제외
        ];
        
        // 일반 DOM에서 찾기
        for (const selector of selectors.slice(1)) {  // iframe 선택자 제외
          try {
            const elements = document.querySelectorAll(selector);
            for (const nameEl of elements) {
              const placeName = nameEl?.textContent?.trim();
              if (!placeName) continue;
              
              // 제외 패턴 체크
              let shouldExclude = false;
              for (const pattern of excludePatterns) {
                if (placeName.includes(pattern)) {
                  console.log(`❌ 제외됨: "${placeName}" - "${pattern}" 포함`);
                  shouldExclude = true;
                  break;
                }
              }
              
              if (!shouldExclude && placeName.length > 1 && placeName.length < 100) {
                console.log(`✅ 네이버 장소명 찾음 (${selector}):`, placeName);
                return placeName;
              }
            }
          } catch (e) {
            // 선택자 에러 무시
          }
        }
        
        console.log('⚠️ 네이버 지도에서 장소명을 찾을 수 없음');
        return '';
      } else if (currentMapService === 'kakao') {
        // 카카오맵에서 장소명 추출 (2024년 기준)
        const selectors = [
          '.place_details .tit_location',
          '.placename',
          '.link_name'
        ];
        for (const selector of selectors) {
          const nameEl = document.querySelector(selector);
          if (nameEl?.textContent?.trim()) {
            return nameEl.textContent.trim();
          }
        }
        return '';
      } else if (currentMapService === 'google') {
        // 구글 지도에서 장소명 추출
        const nameEl = document.querySelector('h1[class*="fontHeadlineLarge"]') ||
                       document.querySelector('[class*="place-name"]');
        return nameEl?.textContent?.trim() || '';
      }
      return '';
    }
    
    // 좌표 추출 (카카오맵)
    function extractKakaoCoordinates(): { lat: number | null, lng: number | null } {
      try {
        // 1. "길찾기" 버튼의 data-coord 속성에서 추출 시도
        const findwayBtn = document.querySelector('a.findway-btn');
        if (findwayBtn) {
          const coords = findwayBtn.getAttribute('data-coord')?.split(',');
          if (coords && coords.length === 2) {
            const [lng, lat] = coords.map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
              return { lat, lng };
            }
          }
        }

        // 2. 공유하기 URL에서 추출 시도
        const shareUrlInput = document.querySelector<HTMLInputElement>('input.inp_url');
        if (shareUrlInput) {
          const url = new URL(shareUrlInput.value);
          const wpoint = url.searchParams.get('wpoint');
          if (wpoint) {
            const [lng, lat] = wpoint.split(',').map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
              return { lat, lng };
            }
          }
        }
      } catch (e) {
        console.error('좌표 추출 중 오류:', e);
      }

      return { lat: null, lng: null };
    }

    // 주소 추출
    function extractPlaceAddress(): string {
      if (currentMapService === 'naver') {
        // iframe 내부 확인
        const iframe = document.querySelector('iframe#entryIframe') as HTMLIFrameElement;
        if (iframe && iframe.contentDocument) {
          try {
            const iframeDoc = iframe.contentDocument;
            const iframeAddr = iframeDoc.querySelector('.O8qbU.tQY7D .LDgIH') ||
                              iframeDoc.querySelector('.PkgBl .LDgIH');
            if (iframeAddr?.textContent?.trim()) {
              const addr = iframeAddr.textContent.trim();
              if (addr && (addr.includes('구') || addr.includes('시') || addr.includes('로') || addr.includes('길'))) {
                console.log(`✅ iframe에서 주소 찾음:`, addr);
                return addr;
              }
            }
          } catch (e) {
            console.log('iframe 주소 접근 불가:', e);
          }
        }
        
        // 네이버 지도에서 주소 추출 - 더 정확한 선택자 사용
        const selectors = [
          '.O8qbU.tQY7D .LDgIH:not(.place_blind)',  // 주소 섹션, blind 텍스트 제외
          '.PkgBl > .LDgIH',                        // 주소 버튼 직계 자식
          '.place_section_content .O8qbU .LDgIH',   // 장소 섹션 내 주소
        ];
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          for (const addrEl of elements) {
            const address = addrEl?.textContent?.trim();
            if (!address) continue;
            
            // 주소가 아닌 텍스트 필터링
            if (!address.includes('@') && 
                !address.includes('내 장소') && 
                !address.includes('영업시간') && 
                !address.includes('수정 제안') &&
                !address.includes('.com') &&
                !address.includes('.kr') &&
                address.length > 5 && 
                (address.includes('구') || address.includes('시') || address.includes('로') || address.includes('길') || address.includes('대로'))) {
              console.log(`✅ 네이버 주소 찾음 (${selector}):`, address);
              return address.replace(/^(지번|도로명)\s*/, '');
            }
          }
        }
        console.log('⚠️ 네이버 지도에서 주소를 찾을 수 없음');
        return '';
      } else if (currentMapService === 'kakao') {
        // 카카오맵에서 주소 추출 (2024년 기준)
        const selectors = [
          '.place_details .txt_address',
          '.addr',
          '[data-id="address"]'
        ];
        for (const selector of selectors) {
          const addrEl = document.querySelector(selector);
          if (addrEl?.textContent?.trim()) {
            // "지번", "도로명" 같은 불필요한 레이블 제거
            return addrEl.textContent.trim().replace(/^(지번|도로명)\s*/, '');
          }
        }
        return '';
      } else if (currentMapService === 'google') {
        // 구글 지도에서 주소 추출
        const addrEl = document.querySelector('[data-item-id*="address"]') ||
                       document.querySelector('[class*="fontBodyMedium"]');
        return addrEl?.textContent?.trim() || '';
      }
      return '';
    }

    // 카테고리 추출 (네이버맵)
    function extractPlaceCategory(): string {
      if (currentMapService === 'naver') {
        // 네이버맵에서 카테고리 정보 추출
        const selectors = [
          '#_title .lnJFt',                // 메인 카테고리 (예: 양식, 카페, 주차장)
          '.zD5Nm .lnJFt',                 // 대체 선택자
          'span.lnJFt',                     // 일반 카테고리 span
        ];
        
        for (const selector of selectors) {
          const categoryEl = document.querySelector(selector);
          if (categoryEl?.textContent?.trim()) {
            return categoryEl.textContent.trim();
          }
        }
      }
      return '';
    }

    // 전화번호 추출 (네이버맵)
    function extractPlacePhone(): string {
      if (currentMapService === 'naver') {
        const selectors = [
          '.xlx7Q',                         // 전화번호 span
          '.O8qbU.nbXkr .xlx7Q',           // 전화번호 섹션 내
          'span.xlx7Q',                     // 일반 전화번호
        ];
        
        for (const selector of selectors) {
          const phoneEl = document.querySelector(selector);
          if (phoneEl?.textContent?.trim()) {
            return phoneEl.textContent.trim();
          }
        }
      }
      return '';
    }

    // 영업시간 추출 (네이버맵)
    function extractBusinessHours(): string {
      if (currentMapService === 'naver') {
        const selectors = [
          '.A_cdD em',                      // 영업 상태 (영업 중, 휴무 등)
          '.U7pYf time',                    // 라스트오더 시간
          '.y6tNq .h1ryO',                  // 상세 영업시간
        ];
        
        let businessInfo = '';
        for (const selector of selectors) {
          const el = document.querySelector(selector);
          if (el?.textContent?.trim()) {
            businessInfo += el.textContent.trim() + ' ';
          }
        }
        return businessInfo.trim();
      }
      return '';
    }

    // 주차 정보 추출 (네이버맵)
    function extractParkingInfo(): string {
      if (currentMapService === 'naver') {
        // 주차 관련 정보는 주로 "찾아가는길" 섹션에 있음
        const selectors = [
          '.xHaT3 .zPfVt',                  // 주차 정보 텍스트
          '[class*="parking"]',             // parking 클래스 포함
          '.O8qbU.AZ9_F .zPfVt',           // 찾아가는길 섹션
        ];
        
        for (const selector of selectors) {
          const parkingEl = document.querySelector(selector);
          const text = parkingEl?.textContent?.trim() || '';
          if (text && text.includes('주차')) {
            return text;
          }
        }
      }
      return '';
    }

    // 편의시설 추출 (네이버맵)
    function extractAmenities(): string {
      if (currentMapService === 'naver') {
        const amenitiesEl = document.querySelector('.O8qbU.Uv6Eo .xPvPE');
        return amenitiesEl?.textContent?.trim() || '';
      }
      return '';
    }

    // 네이버맵 좌표 추출
    function extractNaverCoordinates(): { lat: number | null, lng: number | null } {
      // 네이버맵은 좌표를 직접 노출하지 않으므로 
      // API 호출이나 다른 방법이 필요합니다
      return { lat: null, lng: null };
    }

    // UI 패널 생성
    function createParkingPanel() {
      if (uiInjected) return;
      
      const panel = document.createElement('div');
      panel.id = 'parking-helper-panel';
      panel.className = 'parking-helper-panel';
      panel.innerHTML = `
        <div class="ph-header">
          <h2>🚗 파킹 헬퍼</h2>
          <div class="ph-header-buttons">
            <button class="ph-action-btn ph-report-btn">제보</button>
            <button class="ph-action-btn ph-review-btn">리뷰</button>
            <button class="ph-close">✕</button>
          </div>
        </div>
        <div class="ph-content">
          <div class="ph-place-info ph-section">
            <h3 class="ph-place-name"></h3>
            <p class="ph-place-address"></p>
          </div>
          <div class="ph-basic-info ph-section">
            <!-- 기본 주차 정보가 여기에 표시됩니다 -->
          </div>
          <div class="ph-summary-info ph-section">
            <!-- 리뷰 기반 요약 정보가 여기에 표시됩니다 -->
          </div>
          <div class="ph-review-list ph-section">
             <div class="ph-loading">주차 정보를 불러오는 중...</div>
          </div>
        </div>
      `;
      
      // 스타일 추가
      const style = document.createElement('style');
      style.textContent = `
        .parking-helper-panel {
          position: fixed;
          right: 20px;
          top: 100px;
          width: 320px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          overflow: hidden;
          transition: transform 0.3s ease;
        }
        
        .parking-helper-panel.collapsed {
          transform: translateX(340px);
        }
        
        .ph-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .ph-header h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .ph-header-buttons {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ph-action-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .ph-action-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .ph-close {
          background: transparent;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s;
        }
        
        .ph-close:hover {
          background: rgba(255,255,255,0.2);
        }
        
        .ph-content {
          padding: 0;
          max-height: 600px;
          overflow-y: auto;
        }
        
        .ph-loading {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }
        
        .ph-section {
          padding: 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .ph-section:last-child {
          border-bottom: none;
        }

        .ph-place-info {
            background: #f8f9fa;
        }

        .ph-place-name {
            font-size: 20px !important;
            font-weight: 700 !important;
            margin: 0 0 8px 0 !important;
            color: #333 !important;
        }

        .ph-place-address {
            font-size: 14px;
            color: #666;
            margin: 0;
            cursor: pointer;
            transition: color 0.2s;
            border-radius: 4px;
            padding: 2px 4px;
        }

        .ph-place-address:hover {
            background-color: #f0f0f0;
            color: #333;
        }

        .ph-basic-info-item {
            display: flex;
            align-items: center;
            font-size: 14px;
            margin-bottom: 8px;
        }

        .ph-basic-info-item:last-child {
            margin-bottom: 0;
        }

        .ph-basic-info-icon {
            font-size: 20px;
            margin-right: 12px;
            width: 24px;
            text-align: center;
        }
        
        .ph-section h3 {
          font-size: 16px;
          margin: 0 0 12px 0;
          color: #333;
          font-weight: 600;
        }
        
        .ph-review {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 8px;
        }
        
        .ph-review-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .ph-review-author {
          font-weight: 500;
          color: #333;
        }
        
        .ph-review-rating {
          color: #ffa500;
        }
        
        .ph-review-content {
          color: #666;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .ph-tip {
          display: flex;
          align-items: start;
          padding: 10px;
          background: #fff3cd;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        
        .ph-tip-icon {
          margin-right: 10px;
          font-size: 20px;
        }
        
        .ph-tip-content {
          flex: 1;
          font-size: 14px;
          color: #856404;
        }
        
        .ph-empty {
          text-align: center;
          padding: 30px;
          color: #999;
        }
        
        .ph-error {
          background: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
        }
      `;
      
      document.head.appendChild(style);
      document.body.appendChild(panel);
      
      // 닫기 버튼 이벤트
      // 버튼 이벤트 리스너 추가
      const closeBtn = panel.querySelector('.ph-close');
      closeBtn?.addEventListener('click', () => panel.classList.add('collapsed'));

      const reportBtn = panel.querySelector('.ph-report-btn');
      reportBtn?.addEventListener('click', () => alert('잘못된 정보를 제보해주세요! (기능 구현 예정)'));

      const reviewBtn = panel.querySelector('.ph-review-btn');
      reviewBtn?.addEventListener('click', () => alert('주차 경험에 대한 리뷰를 작성해주세요! (기능 구현 예정)'));

      // 주소 클릭 시 복사 기능 추가
      panel.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('ph-place-address')) {
            const address = target.textContent;
            if (address) {
                navigator.clipboard.writeText(address).then(() => {
                    const originalText = target.textContent;
                    target.textContent = '✅ 주소 복사 완료!';
                    setTimeout(() => {
                        target.textContent = originalText;
                    }, 1500);
                }).catch(err => {
                    console.error('주소 복사 실패:', err);
                    alert('주소 복사에 실패했습니다.');
                });
            }
        }
    });
      
      uiInjected = true;
    }

    // 패널 콘텐츠 업데이트
    function updatePanelContent(data: any) {
      const panel = document.getElementById('parking-helper-panel');
      if (!panel) return;

      // 1. 장소 정보 업데이트
      const placeNameEl = panel.querySelector('.ph-place-name');
      const placeAddressEl = panel.querySelector('.ph-place-address');
      
      // 장소명 업데이트 (항상 업데이트)
      if (placeNameEl) {
        const placeName = currentPlaceData?.name || '장소 정보를 불러오는 중...';
        placeNameEl.textContent = placeName;
        console.log('🔄 UI 업데이트 - 장소명:', placeName);
      }
      
      // 주소 업데이트 (항상 업데이트)
      if (placeAddressEl) {
        const placeAddress = currentPlaceData?.address || '주소를 확인하는 중...';
        placeAddressEl.textContent = placeAddress;
        console.log('🔄 UI 업데이트 - 주소:', placeAddress);
      }

      // 2. 기본 주차 정보 업데이트 (임시 데이터)
      const basicInfoEl = panel.querySelector('.ph-basic-info');
      if (basicInfoEl) {
        // TODO: API에서 실제 데이터 가져오기
        const mockData = {
          fee: '30분 2,000원 / 추가 10분 500원',
          totalSpaces: 50,
          status: '여유',
        };
        basicInfoEl.innerHTML = `
          <div class="ph-basic-info-item">
            <span class="ph-basic-info-icon">💰</span>
            <span><strong>요금:</strong> ${mockData.fee}</span>
          </div>
          <div class="ph-basic-info-item">
            <span class="ph-basic-info-icon">🅿️</span>
            <span><strong>총 주차면:</strong> ${mockData.totalSpaces}대</span>
          </div>
          <div class="ph-basic-info-item">
            <span class="ph-basic-info-icon">🟢</span>
            <span><strong>현재 상태:</strong> ${mockData.status} (실시간 정보)</span>
          </div>
        `;
      }

      // 3. 리뷰 및 팁 정보 업데이트
      const reviewListEl = panel.querySelector('.ph-review-list');
      if (!reviewListEl) return;

      if (!data || (!data.reviews && !data.tips)) {
        reviewListEl.innerHTML = `
          <div class="ph-empty">
            <p>🅿️</p>
            <p>아직 이 장소에 대한<br>주차 리뷰 정보가 없습니다</p>
          </div>
        `;
        return;
      }

      let reviewsHtml = '';
      if (data.reviews && data.reviews.length > 0) {
        reviewsHtml += '<h3>주차 리뷰</h3>';
        data.reviews.forEach((review: any) => {
          reviewsHtml += `
            <div class="ph-review">
              <div class="ph-review-header">
                <span class="ph-review-author">${review.author || '익명'}</span>
                <span class="ph-review-rating">${'★'.repeat(review.rating || 0)}</span>
              </div>
              <div class="ph-review-content">${review.content}</div>
            </div>
          `;
        });
      }

      if (data.tips && data.tips.length > 0) {
        reviewsHtml += '<h3 style="margin-top: 20px;">주차 꿀팁</h3>';
        data.tips.forEach((tip: any) => {
          reviewsHtml += `
            <div class="ph-tip">
              <span class="ph-tip-icon">💡</span>
              <div class="ph-tip-content">${tip.content}</div>
            </div>
          `;
        });
      }

      reviewListEl.innerHTML = reviewsHtml;
    }

    // 주차 데이터 가져오기
    async function fetchParkingData(placeId: string) {
      try {
        // currentPlaceData가 없으면 초기화
        if (!currentPlaceData) {
          console.log('⚠️ currentPlaceData가 없어서 초기화합니다.');
          currentPlaceData = {
            name: '',
            address: '',
            uniqueId: '',
            category: '',
            phone: '',
            businessHours: '',
            parkingInfo: '',
            amenities: '',
            mapService: currentMapService,
            placeId: placeId,
            latitude: null,
            longitude: null,
            reviewCount: 0,
            tipCount: 0,
            rating: '-'
          };
        }
        
        // API를 통해 장소 등록 및 데이터 조회
        if (currentPlaceData?.name) {
          const ingestResponse = await ingestPlace({
            provider: currentMapService as 'naver' | 'kakao' | 'google',
            external_place_id: placeId,
            name: currentPlaceData.name,
            address: currentPlaceData.address,
            latitude: currentPlaceData.latitude || undefined,
            longitude: currentPlaceData.longitude || undefined,
          });
          
          if (ingestResponse.data?.place) {
            console.log('장소 등록/조회 성공:', ingestResponse.data.place);
            
            // 등록된 장소의 리뷰 조회
            const reviewsResponse = await fetchReviews({
              place_id: ingestResponse.data.place.id,
              limit: 10
            });
            
            if (reviewsResponse.data) {
              const reviews = reviewsResponse.data;
              const avgRating = reviews.length > 0 
                ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.filter((r: any) => r.rating).length
                : null;
              
              currentPlaceData = {
                ...currentPlaceData,
                reviewCount: reviews.length,
                tipCount: 0, // 팁은 별도 API로 조회 필요
                rating: avgRating ? avgRating.toFixed(1) : '-',
                reviews: reviews,
                tips: []
              };
              
              console.log('주차 데이터 업데이트:', {
                placeId: placeId,
                reviewCount: reviews.length,
                rating: currentPlaceData.rating
              });
              
              updatePanelContent({
                reviews: reviews,
                rating: currentPlaceData.rating
              });
            } else {
              // 리뷰가 없는 경우
              currentPlaceData = {
                ...currentPlaceData,
                reviewCount: 0,
                tipCount: 0,
                rating: '-',
                reviews: [],
                tips: []
              };
              updatePanelContent(null);
            }
          }
        } else if (currentPlaceData?.latitude && currentPlaceData?.longitude) {
          // 장소명이 없는 경우 좌표 기반 검색
          const searchResponse = await searchParkingLots({
            lat: currentPlaceData.latitude,
            lng: currentPlaceData.longitude,
            radius: 500,
            limit: 5
          });
          
          if (searchResponse.data) {
            updatePanelContent({ nearbyParking: searchResponse.data });
          }
        }
      } catch (error) {
        console.error('주차 데이터 요청 실패:', error);
        // 에러 발생시에도 currentPlaceData 초기화
        currentPlaceData = {
          ...currentPlaceData,
          reviewCount: 0,
          tipCount: 0,
          rating: '-',
          reviews: [],
          tips: []
        };
        updatePanelContent(null);
      }
    }

    // URL 변경 감지
    function detectUrlChange() {
      const newPlaceId = extractPlaceId();
      
      if (newPlaceId !== currentPlaceId) {
        currentPlaceId = newPlaceId;
        
        if (currentPlaceId) {
          console.log('장소 감지:', currentPlaceId);
          
          // 네이버 지도는 지연 처리
          const extractPlaceInfo = () => {
            const { lat, lng } = currentMapService === 'kakao' 
              ? extractKakaoCoordinates() 
              : extractNaverCoordinates();

            // 핵심 식별 정보 (업체명 + 주소)
            const name = extractPlaceName();
            const address = extractPlaceAddress();
            
            // 고유 식별자 생성 (업체명 + 주소 조합)
            const uniqueId = `${name}_${address}`.replace(/\s+/g, '_');

            currentPlaceData = {
              // 핵심 식별 정보
              name: name,
              address: address,
              uniqueId: uniqueId,              // 고유 식별자
              
              // 부가 정보
              category: extractPlaceCategory(),
              phone: extractPlacePhone(),
              businessHours: extractBusinessHours(),
              parkingInfo: extractParkingInfo(),
              amenities: extractAmenities(),
              
              // 지도 서비스 정보
              mapService: currentMapService,
              placeId: currentPlaceId,         // 네이버/카카오의 고유 ID
              latitude: lat,
              longitude: lng,
              
              // 리뷰 관련 (초기값)
              reviewCount: 0,
              tipCount: 0,
              rating: '-'
            };
            
            // 수집된 정보 로그 출력
            console.log('📍 장소 정보 수집 완료:', {
              '🏢 업체명': currentPlaceData.name || '❌ 없음',
              '📬 주소': currentPlaceData.address || '❌ 없음',
              '🔑 고유ID': currentPlaceData.uniqueId,
              '🏷️ 카테고리': currentPlaceData.category || '❌ 없음',
              '📞 전화': currentPlaceData.phone || '❌ 없음',
              '⏰ 영업시간': currentPlaceData.businessHours || '❌ 없음',
              '🚗 주차정보': currentPlaceData.parkingInfo || '❌ 없음',
              '🏪 편의시설': currentPlaceData.amenities || '❌ 없음',
              '📍 좌표': { lat: currentPlaceData.latitude, lng: currentPlaceData.longitude }
            });
            
            // 장소명이 제대로 추출되지 않은 경우 경고
            if (!currentPlaceData.name || currentPlaceData.name === '장소명 없음') {
              console.error('⚠️ 장소명 추출 실패! 선택자를 확인하세요.');
              // 디버깅을 위해 현재 페이지의 GHAhO 클래스 요소들 출력
              const allGHAhO = document.querySelectorAll('.GHAhO');
              console.log('🔍 페이지의 모든 .GHAhO 요소:', allGHAhO.length, '개');
              allGHAhO.forEach((el, i) => {
                console.log(`  ${i+1}. "${el.textContent?.trim()}" (parent: ${el.parentElement?.className})`);
              });
            }
            
            // 장소명이 없으면 재시도
            if (!currentPlaceData.name && currentMapService === 'naver') {
              let retryCount = 0;
              const maxRetries = 3;
              
              const retryExtraction = () => {
                retryCount++;
                const retryName = extractPlaceName();
                const retryAddress = extractPlaceAddress();
                
                if (retryName && retryName !== '장소명 없음') {
                  console.log(`재시도 ${retryCount}번째로 장소명 찾음:`, retryName);
                  currentPlaceData = {
                    ...currentPlaceData,
                    name: retryName,
                    address: retryAddress || currentPlaceData.address
                  };
                  // UI 업데이트
                  updatePanelContent(null);
                } else if (retryCount < maxRetries) {
                  console.log(`장소명 추출 재시도 ${retryCount}/${maxRetries}...`);
                  setTimeout(retryExtraction, 1000 * retryCount);
                } else {
                  console.log('장소명을 찾을 수 없음 - 최대 재시도 횟수 초과');
                  // 실패해도 UI 업데이트
                  updatePanelContent(null);
                }
              };
              
              setTimeout(retryExtraction, 1000);
            }
          };
          
          // 네이버 지도는 지연 실행
          if (currentMapService === 'naver') {
            console.log('🔄 네이버맵 정보 추출 시작 (지연 실행)...');
            setTimeout(() => {
              extractPlaceInfo();
              console.log('📊 추출된 데이터:', {
                name: currentPlaceData?.name,
                address: currentPlaceData?.address,
                category: currentPlaceData?.category
              });
              // 정보 추출 후 UI 업데이트
              updatePanelContent(null);
            }, 1000);  // 500ms에서 1000ms로 증가
          } else {
            extractPlaceInfo();
          }
          
          // UI 패널이 없으면 생성
          if (!uiInjected) {
            (createParkingPanel as any)();
          }
          
          // 패널 표시
          const panel = document.getElementById('parking-helper-panel');
          if (panel) {
            panel.classList.remove('collapsed');
            // 패널 표시 직후 현재 데이터로 업데이트
            updatePanelContent(null);
          }
          
          // 데이터 가져오기
          fetchParkingData(currentPlaceId);
          
          // 백그라운드 스크립트에 알림
          browser.runtime.sendMessage({
            type: 'PLACE_DETECTED',
            place: {
              id: currentPlaceId,
              service: currentMapService,
              url: window.location.href
            }
          });
        }
      }
    }

    // 초기화
    function init() {
      currentMapService = detectMapService();
      
      if (!currentMapService) {
        console.log('지원하지 않는 지도 서비스');
        return;
      }
      
      console.log('지도 서비스 감지:', currentMapService);
      
      // URL 변경 감지 설정
      detectUrlChange();
      
      // pushState/replaceState 감지
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      
      history.pushState = function(...args) {
        originalPushState.apply(history, args);
        setTimeout(() => detectUrlChange(), 100);
      };
      
      history.replaceState = function(...args) {
        originalReplaceState.apply(history, args);
        setTimeout(() => detectUrlChange(), 100);
      };
      
      // popstate 이벤트 리스너
      window.addEventListener('popstate', detectUrlChange);
      
      // DOM 변경 감지 (SPA 대응) - 더 효율적으로 개선
      let observerTimer: any = null;
      const observer = new MutationObserver(() => {
        // 너무 자주 실행되지 않도록 디바운스 적용
        if (observerTimer) clearTimeout(observerTimer);
        observerTimer = setTimeout(() => {
          detectUrlChange();
        }, 500);
      });
      
      // 네이버 지도는 특정 컨테이너만 관찰
      if (currentMapService === 'naver') {
        // 네이버 지도가 완전히 로드될 때까지 대기
        const waitForNaverMap = setInterval(() => {
          const mapContainer = document.querySelector('#app') || document.querySelector('#container');
          if (mapContainer) {
            clearInterval(waitForNaverMap);
            observer.observe(mapContainer, {
              childList: true,
              subtree: false,  // subtree를 false로 하여 성능 개선
              attributes: false,
              characterData: false
            });
          }
        }, 1000);
      } else {
        // 다른 지도 서비스는 기존 방식 사용
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: false,
          characterData: false
        });
      }
    }

    // 백그라운드 스크립트로부터 메시지 수신
    browser.runtime.onMessage.addListener((request, _sender) => {
      console.log('메시지 수신:', request.type);
      
      switch(request.type) {
        case 'MAP_DETECTED':
          console.log('지도 감지 메시지 수신');
          detectUrlChange();
          return Promise.resolve({ success: true });
          
        case 'FETCH_PLACE_DATA':
          if (request.place && request.place.id) {
            fetchParkingData(request.place.id);
          }
          return Promise.resolve({ success: true });
          
        case 'GET_CURRENT_PLACE':
          // 팝업에서 현재 장소 정보 요청
          if (currentPlaceId && currentPlaceData) {
            return Promise.resolve({ 
              place: {
                id: currentPlaceId,
                name: currentPlaceData.name || '장소명 없음',
                address: currentPlaceData.address || '주소 없음',
                reviewCount: currentPlaceData.reviewCount || 0,
                tipCount: currentPlaceData.tipCount || 0,
                rating: currentPlaceData.rating || '-'
              }
            });
          } else {
            return Promise.resolve({ place: null });
          }
          
        case 'SHOW_PARKING_DETAILS':
          // 팝업에서 상세 정보 표시 요청
          console.log('상세 정보 표시 요청 받음');
          if (!uiInjected) {
            (createParkingPanel as any)();
          }
          const panel = document.getElementById('parking-helper-panel');
          if (panel) {
            panel.classList.remove('collapsed');
          }
          // 현재 장소 데이터로 패널 업데이트
          if (currentPlaceId) {
            fetchParkingData(currentPlaceId);
          }
          return Promise.resolve({ success: true });
          
        case 'SHOW_REVIEW_FORM':
          // 팝업에서 리뷰 작성 요청
          console.log('리뷰 작성 폼 표시 요청 받음');
          if (!uiInjected) {
            (createParkingPanel as any)();
          }
          const reviewPanel = document.getElementById('parking-helper-panel');
          if (reviewPanel) {
            reviewPanel.classList.remove('collapsed');
            // 리뷰 작성 폼 표시 기능 추가 예정
            const contentDiv = reviewPanel.querySelector('.ph-content');
            if (contentDiv) {
              contentDiv.innerHTML = `
                <div class="ph-review-form" style="padding: 20px;">
                  <h3 style="margin: 0 0 15px 0; color: #333;">리뷰 작성하기</h3>
                  <p style="color: #666; font-size: 14px;">이 기능은 곧 추가될 예정입니다.</p>
                  <button onclick="window.location.reload()" style="
                    margin-top: 15px;
                    padding: 10px 20px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                  ">돌아가기</button>
                </div>
              `;
            }
          }
          return Promise.resolve({ success: true });
          
        default:
          // 알 수 없는 메시지 타입
          console.log('알 수 없는 메시지 타입:', request.type);
          return Promise.resolve({ success: false, error: 'Unknown message type' });
      }
    });

    // 페이지 로드 완료 후 초기화
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  },
});