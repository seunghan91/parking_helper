import { defineBackground } from 'wxt/sandbox';

export default defineBackground(() => {
  console.log('파킹 헬퍼 백그라운드 서비스 시작됨');

  // 설치 및 업데이트 이벤트
  browser.runtime.onInstalled.addListener((details) => {
    handleInstall(details);
  });

  // 탭 업데이트 이벤트
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    handleTabUpdate(tabId, changeInfo, tab);
  });

  function handleInstall(details: any) {
    console.log('파킹 헬퍼 설치됨:', details.reason);
    
    if (details.reason === 'install') {
      // 설치 시 지도 사이트 중 하나를 열기 (네이버 지도)
      browser.tabs.create({
        url: 'https://map.naver.com'
      });
    }
  }

  function handleTabUpdate(tabId: number, changeInfo: any, tab: any) {
    if (changeInfo.status === 'complete' && tab.url) {
      const isMapSite = checkIsMapSite(tab.url);
      
      if (isMapSite) {
        // 지도 사이트에서 뱃지 업데이트
        updateBadge(tabId, 0);
        
        // 콘텐츠 스크립트에 메시지 전송
        sendToContentScript(tabId, {
          type: 'MAP_DETECTED',
          url: tab.url
        });
      }
    }
  }

  function checkIsMapSite(url: string): boolean {
    const mapDomains = [
      'map.naver.com',
      'map.kakao.com',
      'maps.google.com',
      'www.google.com/maps'
    ];
    
    return mapDomains.some(domain => url.includes(domain));
  }

  async function updateBadge(tabId: number, count: number) {
    await browser.action.setBadgeText({
      text: count > 0 ? count.toString() : '',
      tabId: tabId
    });
    
    await browser.action.setBadgeBackgroundColor({
      color: '#4CAF50',
      tabId: tabId
    });
  }

  async function sendToContentScript(tabId: number, message: any) {
    try {
      await browser.tabs.sendMessage(tabId, message);
    } catch (error) {
      console.error('콘텐츠 스크립트로 메시지 전송 실패:', error);
    }
  }

  async function getTabInfo(tabId: number): Promise<{ id: number; url?: string } | null> {
    try {
      const tab = await browser.tabs.get(tabId);
      return {
        id: tab.id || tabId,
        url: tab.url
      };
    } catch (error) {
      console.error('탭 정보 가져오기 실패:', error);
      return null;
    }
  }

  // 메시지 리스너
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('메시지 수신:', request);
    
    if (request.type === 'GET_DATA') {
      // 스토리지에서 데이터 가져오기
      const key = `place_${request.placeId}`;
      browser.storage.local.get([key])
        .then((result) => {
          sendResponse({
            success: true,
            data: result[key] || null
          });
        })
        .catch((error) => {
          console.error('데이터 조회 실패:', error);
          sendResponse({
            success: false,
            error: error.message
          });
        });
    } else if (request.type === 'SAVE_DATA') {
      // 스토리지에 데이터 저장
      const key = `place_${request.placeId}`;
      const data = {
        ...request.data,
        lastUpdated: new Date().toISOString()
      };
      
      browser.storage.local.set({ [key]: data })
        .then(() => {
          sendResponse({
            success: true
          });
        })
        .catch((error) => {
          console.error('데이터 저장 실패:', error);
          sendResponse({
            success: false,
            error: error.message
          });
        });
    } else if (request.type === 'PLACE_DETECTED') {
      // 장소 감지 시 처리
      sendToContentScript(sender.tab?.id || 0, {
        type: 'FETCH_PLACE_DATA',
        place: request.place
      });
      
      sendResponse({ success: true });
    } else if (request.type === 'UPDATE_BADGE') {
      // 뱃지 업데이트
      updateBadge(sender.tab?.id || 0, request.count);
      sendResponse({ success: true });
    }
  
    return true; // 비동기 응답을 위해 true 반환
  });
});