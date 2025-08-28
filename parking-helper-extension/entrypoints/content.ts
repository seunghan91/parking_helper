import { defineContentScript } from 'wxt/sandbox';
import { browser } from 'wxt/browser';

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

    // 카카오 지도에서 장소 ID 추출
    function extractKakaoPlaceId(): string | null {
      const pathMatch = window.location.pathname.match(/\/(\d+)$/);
      if (pathMatch) {
        return pathMatch[1];
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
    
    // 장소명 추출
    function extractPlaceName(): string {
      if (currentMapService === 'naver') {
        // 네이버 지도에서 장소명 추출 - 2024년 최신 선택자들
        const selectors = [
          '#_title > span:first-child',     // 최신 네이버 지도 UI
          '#_title span.GHAhO',              // 장소 상세 페이지
          '.place_bluelink',                 // 기본 장소 링크
          '.title_text',                     // 제목 텍스트  
          'span.YouOG',                      // 새 UI 장소명
          '.Fc1rA',                          // 헤더 장소명
          '.LDgIH',                          // 장소 제목
          '[class*="place_name"]',          // place_name 포함 클래스
          '.place_section_content h1',       // 섹션 내 h1
          '.place_section_content h2',       // 섹션 내 h2
        ];
        
        for (const selector of selectors) {
          try {
            const nameEl = document.querySelector(selector);
            if (nameEl?.textContent?.trim()) {
              const placeName = nameEl.textContent.trim();
              if (!placeName.includes('로딩') && !placeName.includes('...') && placeName.length > 1) {
                console.log(`네이버 장소명 찾음 (${selector}):`, placeName);
                return placeName;
              }
            }
          } catch (e) {
            // 선택자 에러 무시
          }
        }
        
        // 모든 h1, h2 태그 검사 (fallback)
        const headings = document.querySelectorAll('h1, h2');
        for (const heading of headings) {
          const text = heading.textContent?.trim();
          if (text && text.length > 1 && text.length < 50 && 
              !text.includes('로딩') && !text.includes('...')) {
            console.log(`네이버 장소명 찾음 (heading fallback):`, text);
            return text;
          }
        }
        
        console.log('네이버 지도에서 장소명을 찾을 수 없음');
        return '';
      } else if (currentMapService === 'kakao') {
        // 카카오맵에서 장소명 추출
        const nameEl = document.querySelector('.link_name') ||
                       document.querySelector('.tit_location');
        return nameEl?.textContent?.trim() || '';
      } else if (currentMapService === 'google') {
        // 구글 지도에서 장소명 추출
        const nameEl = document.querySelector('h1[class*="fontHeadlineLarge"]') ||
                       document.querySelector('[class*="place-name"]');
        return nameEl?.textContent?.trim() || '';
      }
      return '';
    }
    
    // 주소 추출
    function extractPlaceAddress(): string {
      if (currentMapService === 'naver') {
        // 네이버 지도에서 주소 추출
        const addrEl = document.querySelector('.addr') || 
                       document.querySelector('[class*="address"]');
        return addrEl?.textContent?.trim() || '';
      } else if (currentMapService === 'kakao') {
        // 카카오맵에서 주소 추출
        const addrEl = document.querySelector('.txt_address') ||
                       document.querySelector('.addr');
        return addrEl?.textContent?.trim() || '';
      } else if (currentMapService === 'google') {
        // 구글 지도에서 주소 추출
        const addrEl = document.querySelector('[data-item-id*="address"]') ||
                       document.querySelector('[class*="fontBodyMedium"]');
        return addrEl?.textContent?.trim() || '';
      }
      return '';
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
          <button class="ph-close">✕</button>
        </div>
        <div class="ph-content">
          <div class="ph-loading">
            주차 정보를 불러오는 중...
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
          font-size: 18px;
          font-weight: 600;
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
          padding: 16px;
          max-height: 500px;
          overflow-y: auto;
        }
        
        .ph-loading {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }
        
        .ph-section {
          margin-bottom: 20px;
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
      const closeBtn = panel.querySelector('.ph-close');
      closeBtn?.addEventListener('click', () => {
        panel.classList.add('collapsed');
      });
      
      uiInjected = true;
    }

    // 패널 콘텐츠 업데이트
    function updatePanelContent(data: any) {
      const contentDiv = document.querySelector('.ph-content');
      if (!contentDiv) return;
      
      if (!data || (!data.reviews && !data.tips)) {
        contentDiv.innerHTML = `
          <div class="ph-empty">
            <p>🅿️</p>
            <p>아직 이 장소에 대한<br>주차 정보가 없습니다</p>
          </div>
        `;
        return;
      }
      
      let html = '';
      
      // 리뷰 섹션
      if (data.reviews && data.reviews.length > 0) {
        html += '<div class="ph-section">';
        html += '<h3>주차 리뷰</h3>';
        
        data.reviews.forEach((review: any) => {
          html += `
            <div class="ph-review">
              <div class="ph-review-header">
                <span class="ph-review-author">${review.author || '익명'}</span>
                <span class="ph-review-rating">${'★'.repeat(review.rating || 0)}</span>
              </div>
              <div class="ph-review-content">${review.content}</div>
            </div>
          `;
        });
        
        html += '</div>';
      }
      
      // 팁 섹션
      if (data.tips && data.tips.length > 0) {
        html += '<div class="ph-section">';
        html += '<h3>주차 꿀팁</h3>';
        
        data.tips.forEach((tip: any) => {
          html += `
            <div class="ph-tip">
              <span class="ph-tip-icon">💡</span>
              <div class="ph-tip-content">${tip.content}</div>
            </div>
          `;
        });
        
        html += '</div>';
      }
      
      contentDiv.innerHTML = html;
    }

    // 주차 데이터 가져오기
    async function fetchParkingData(placeId: string) {
      try {
        // 백그라운드 스크립트에 데이터 요청
        const response = await browser.runtime.sendMessage({
          type: 'GET_DATA',
          placeId: placeId
        });
        
        if (response.success) {
          // 받은 데이터를 currentPlaceData에 저장
          if (response.data) {
            currentPlaceData = {
              ...currentPlaceData,
              reviewCount: response.data.reviewCount || 0,
              tipCount: response.data.tipCount || 0,
              rating: response.data.rating || '-'
            };
          }
          updatePanelContent(response.data);
        } else {
          console.error('데이터 가져오기 실패:', response.error);
          updatePanelContent(null);
        }
      } catch (error) {
        console.error('주차 데이터 요청 실패:', error);
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
            currentPlaceData = {
              name: extractPlaceName(),
              address: extractPlaceAddress(),
              reviewCount: 0,
              tipCount: 0,
              rating: '-'
            };
            
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
                } else if (retryCount < maxRetries) {
                  console.log(`장소명 추출 재시도 ${retryCount}/${maxRetries}...`);
                  setTimeout(retryExtraction, 1000 * retryCount);
                } else {
                  console.log('장소명을 찾을 수 없음 - 최대 재시도 횟수 초과');
                }
              };
              
              setTimeout(retryExtraction, 1000);
            }
          };
          
          // 네이버 지도는 지연 실행
          if (currentMapService === 'naver') {
            setTimeout(extractPlaceInfo, 500);
          } else {
            extractPlaceInfo();
          }
          
          // UI 패널이 없으면 생성
          if (!uiInjected) {
            createParkingPanel();
          }
          
          // 패널 표시
          const panel = document.getElementById('parking-helper-panel');
          if (panel) {
            panel.classList.remove('collapsed');
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
        setTimeout(detectUrlChange, 100);
      };
      
      history.replaceState = function(...args) {
        originalReplaceState.apply(history, args);
        setTimeout(detectUrlChange, 100);
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
    browser.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (request.type === 'MAP_DETECTED') {
        console.log('지도 감지 메시지 수신');
        detectUrlChange();
      } else if (request.type === 'FETCH_PLACE_DATA') {
        if (request.place && request.place.id) {
          fetchParkingData(request.place.id);
        }
      } else if (request.type === 'GET_CURRENT_PLACE') {
        // 팝업에서 현재 장소 정보 요청
        if (currentPlaceId && currentPlaceData) {
          sendResponse({ 
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
          sendResponse({ place: null });
        }
        return true;
      } else if (request.type === 'SHOW_PARKING_DETAILS') {
        // 팝업에서 상세 정보 표시 요청
        console.log('상세 정보 표시 요청 받음');
        if (!uiInjected) {
          createParkingPanel();
        }
        const panel = document.getElementById('parking-helper-panel');
        if (panel) {
          panel.classList.remove('collapsed');
        }
        // 현재 장소 데이터로 패널 업데이트
        if (currentPlaceId) {
          fetchParkingData(currentPlaceId);
        }
      } else if (request.type === 'SHOW_REVIEW_FORM') {
        // 팝업에서 리뷰 작성 요청
        console.log('리뷰 작성 폼 표시 요청 받음');
        if (!uiInjected) {
          createParkingPanel();
        }
        const panel = document.getElementById('parking-helper-panel');
        if (panel) {
          panel.classList.remove('collapsed');
          // 리뷰 작성 폼 표시 기능 추가 예정
          const contentDiv = panel.querySelector('.ph-content');
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
      }
      
      return true;
    });

    // 페이지 로드 완료 후 초기화
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  },
});