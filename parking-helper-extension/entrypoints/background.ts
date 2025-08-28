// Background Script - 서비스 워커
interface InstallDetails {
  reason: string;
}

interface TabInfo {
  id: number;
  url?: string;
}

class BackgroundService {
  constructor() {
    this.init();
  }

  private init() {
    // 설치 및 업데이트 이벤트
    chrome.runtime.onInstalled.addListener((details: InstallDetails) => {
      this.handleInstall(details);
    });

    // 탭 업데이트 이벤트
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // 아이콘 클릭 이벤트
    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab);
    });

    console.log('파킹 헬퍼 백그라운드 서비스 시작됨');
  }

  private handleInstall(details: InstallDetails) {
    console.log('파킹 헬퍼 설치됨:', details.reason);
    
    if (details.reason === 'install') {
      // 설치 시 환영 페이지 열기
      chrome.tabs.create({
        url: 'https://your-app-url.vercel.app/welcome'
      });
    }
  }

  private handleTabUpdate(tabId: number, changeInfo: any, tab: any) {
    if (changeInfo.status === 'complete' && tab.url) {
      const isMapSite = this.isMapSite(tab.url);
      
      if (isMapSite) {
        // 지도 사이트에서 아이콘 활성화
        chrome.action.setIcon({
          tabId,
          path: {
            16: 'icon-16.png',
            48: 'icon-48.png',
            128: 'icon-128.png'
          }
        });
        
        chrome.action.setTitle({
          tabId,
          title: '파킹 헬퍼 - 주차 정보 확인하기'
        });
        
        chrome.action.setBadgeText({
          tabId,
          text: '●'
        });
        
        chrome.action.setBadgeBackgroundColor({
          tabId,
          color: '#007bff'
        });
      } else {
        // 다른 사이트에서 아이콘 비활성화
        chrome.action.setBadgeText({
          tabId,
          text: ''
        });
        
        chrome.action.setTitle({
          tabId,
          title: '파킹 헬퍼 - 지도 사이트에서 이용해주세요'
        });
      }
    }
  }

  private handleActionClick(tab: TabInfo) {
    if (!tab.url) return;
    
    const isMapSite = this.isMapSite(tab.url);
    
    if (isMapSite) {
      // 지도 사이트에서는 팝업이 자동으로 열림
      return;
    } else {
      // 다른 사이트에서는 지원되는 지도 사이트로 이동
      chrome.tabs.create({
        url: 'https://map.naver.com'
      });
    }
  }

  private isMapSite(url: string): boolean {
    const mapDomains = [
      'map.naver.com',
      'map.kakao.com', 
      'www.google.com/maps',
      'maps.google.com'
    ];

    return mapDomains.some(domain => url.includes(domain));
  }

  // 메시지 통신 처리
  private setupMessageHandling() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'getActiveTab':
          this.getActiveTab().then(sendResponse);
          return true;
        
        case 'openWebApp':
          chrome.tabs.create({
            url: message.url || 'https://your-app-url.vercel.app'
          });
          sendResponse({ success: true });
          return true;
          
        default:
          sendResponse({ error: 'Unknown action' });
          return true;
      }
    });
  }

  private async getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }
}

// Background Service 초기화
new BackgroundService();