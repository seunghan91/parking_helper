// 팝업 인터페이스 스크립트
import './style.css';
import { browser } from 'wxt/browser';
import { isMapSite } from '@/utils/mapDetector';
import type { GetCurrentPlaceResponse, PlaceInfo } from '@/utils/messageTypes';

document.addEventListener('DOMContentLoaded', () => {
  console.log('파킹 헬퍼 팝업 로드됨');

  // View 요소 선택
  const loadingView = document.getElementById('loading-view');
  const inactiveView = document.getElementById('inactive-view');
  const activeView = document.getElementById('active-view');
  
  // 요소 확인
  console.log('View 요소 확인:', {
    loadingView: !!loadingView,
    inactiveView: !!inactiveView, 
    activeView: !!activeView
  });
  
  // Active view 요소들
  const placeNameEl = document.getElementById('place-name');
  const placeAddressEl = document.getElementById('place-address');
  const reviewCountEl = document.getElementById('review-count');
  const tipCountEl = document.getElementById('tip-count');
  const ratingEl = document.getElementById('rating');
  const viewDetailsBtn = document.getElementById('view-details');
  const writeReviewBtn = document.getElementById('write-review');

  // 초기 상태 설정
  checkCurrentTab();

  // 버튼 클릭 이벤트 핸들러
  viewDetailsBtn?.addEventListener('click', handleViewDetails);
  writeReviewBtn?.addEventListener('click', handleWriteReview);
  
  // 지도 링크 클릭 시 팝업 창 닫기
  const mapLinks = document.querySelectorAll('.map-link');
  mapLinks.forEach(link => {
    link.addEventListener('click', () => {
      setTimeout(() => window.close(), 100);
    });
  });

  // 현재 탭 상태 확인
  async function checkCurrentTab() {
    console.log('현재 탭 체크 시작');
    try {
      // 현재 탭 정보 가져오기
      const [tab] = await browser.tabs.query({ 
        active: true, 
        currentWindow: true 
      }) as browser.Tabs.Tab[];

      console.log('현재 탭 URL:', tab?.url);

      if (!tab || !tab.url) {
        console.log('탭 URL이 없음 - inactive 표시');
        showView('inactive');
        return;
      }

      // 지도 사이트 체크
      const isOnMapSite = isMapSite(tab.url);
      console.log('지도 사이트 여부:', isOnMapSite);
      
      if (isOnMapSite) {
        // 지도 사이트에서 활성화됨 - 콘텐츠 스크립트에서 장소 정보 가져오기
        console.log('지도 사이트 감지 - 장소 정보 요청');
        await fetchPlaceInfo(tab);
      } else {
        console.log('지도 사이트 아님 - inactive 표시');
        showView('inactive');
      }
    } catch (error) {
      console.error('탭 상태 확인 실패:', error);
      showView('inactive');
    }
  }

  // 장소 정보 가져오기 (재시도 로직 포함)
  async function fetchPlaceInfo(tab: browser.Tabs.Tab, retryCount = 0) {
    try {
      if (!tab.id) {
        console.log('탭 ID 없음 - inactive 표시');
        showView('inactive');
        return;
      }

      console.log(`콘텐츠 스크립트에 장소 정보 요청중... (시도 ${retryCount + 1}/3)`);
      
      // 콘텐츠 스크립트에 현재 장소 정보 요청
      let response: GetCurrentPlaceResponse | null = null;
      
      try {
        response = await browser.tabs.sendMessage<any, GetCurrentPlaceResponse>(tab.id, {
          type: 'GET_CURRENT_PLACE'
        });
        console.log('응답 받음:', response);
      } catch (err) {
        console.log('메시지 전송 실패:', err);
        
        // 재시도 로직: 콘텐츠 스크립트가 아직 로드되지 않았을 수 있음
        if (retryCount < 2) {
          console.log(`콘텐츠 스크립트 로딩 대기중... ${(retryCount + 1) * 500}ms 후 재시도`);
          setTimeout(() => {
            fetchPlaceInfo(tab, retryCount + 1);
          }, (retryCount + 1) * 500);
          return; // 재시도를 기다리는 동안 로딩 상태 유지
        } else {
          console.log('콘텐츠 스크립트 연결 실패 - 최대 재시도 횟수 초과');
          showView('inactive');
          
          const statusEl = document.querySelector('.status.inactive');
          if (statusEl) {
            statusEl.textContent = '페이지를 새로고침 후 다시 시도해주세요';
          }
          return;
        }
      }

      if (response && response.place) {
        // 장소 정보가 있으면 active view 표시
        console.log('장소 정보 있음:', response.place);
        updatePlaceInfo(response.place);
        showView('active');
      } else {
        // 장소 정보가 없으면 안내 메시지와 함께 inactive view 표시
        console.log('장소 정보 없음 - 지도 페이지이지만 장소가 선택되지 않음');
        showView('inactive');
        
        // 지도 사이트이지만 장소가 선택되지 않은 경우를 위한 메시지 업데이트
        const statusEl = document.querySelector('.status.inactive');
        if (statusEl) {
          statusEl.textContent = '지도에서 장소를 클릭하면 주차 정보를 확인할 수 있습니다';
        }
      }
    } catch (error) {
      console.error('장소 정보 가져오기 실패:', error);
      showView('inactive');
    }
  }

  // 장소 정보 업데이트
  function updatePlaceInfo(place: PlaceInfo) {
    if (placeNameEl) placeNameEl.textContent = place.name || '장소명 없음';
    if (placeAddressEl) placeAddressEl.textContent = place.address || '주소 없음';
    if (reviewCountEl) reviewCountEl.textContent = place.reviewCount || '0';
    if (tipCountEl) tipCountEl.textContent = place.tipCount || '0';
    if (ratingEl) ratingEl.textContent = place.rating || '-';
  }

  // View 전환
  function showView(type: 'loading' | 'inactive' | 'active') {
    console.log(`showView 호출됨: ${type}`);
    console.log('View 요소 상태:', {
      loadingView: !!loadingView,
      inactiveView: !!inactiveView,
      activeView: !!activeView
    });
    
    // 모든 view 숨기기
    if (loadingView) {
      loadingView.style.display = 'none';
      console.log('loading view 숨김');
    }
    if (inactiveView) {
      inactiveView.style.display = 'none';
      console.log('inactive view 숨김');
    }
    if (activeView) {
      activeView.style.display = 'none';
      console.log('active view 숨김');
    }
    
    // 선택된 view 표시
    switch (type) {
      case 'loading':
        if (loadingView) {
          loadingView.style.display = 'block';
          console.log('loading view 표시');
        }
        break;
      case 'inactive':
        if (inactiveView) {
          inactiveView.style.display = 'block';
          console.log('inactive view 표시');
        } else {
          console.error('inactive view 요소를 찾을 수 없음!');
        }
        break;
      case 'active':
        if (activeView) {
          activeView.style.display = 'block';
          console.log('active view 표시');
        }
        break;
    }
  }


  // 자세히 보기 버튼 클릭 핸들러
  async function handleViewDetails() {
    console.log('자세히 보기');
    
    try {
      const [tab] = await browser.tabs.query({ 
        active: true, 
        currentWindow: true 
      }) as browser.Tabs.Tab[];

      if (tab?.id) {
        // 콘텐츠 스크립트에 상세 정보 표시 명령 전송
        await browser.tabs.sendMessage(tab.id, {
          type: 'SHOW_PARKING_DETAILS'
        });

        window.close();
      }
    } catch (error) {
      console.error('상세 정보 표시 실패:', error);
    }
  }

  // 리뷰 작성하기 버튼 클릭 핸들러
  async function handleWriteReview() {
    console.log('리뷰 작성하기');
    
    // 현재 탭에서 리뷰 폼 표시하도록 메시지 전송
    try {
      const [tab] = await browser.tabs.query({ 
        active: true, 
        currentWindow: true 
      }) as browser.Tabs.Tab[];

      if (tab?.id) {
        // 콘텐츠 스크립트에 리뷰 작성 명령 전송
        await browser.tabs.sendMessage(tab.id, {
          type: 'SHOW_REVIEW_FORM'
        });
        
        window.close();
      }
    } catch (error) {
      console.error('리뷰 폼 표시 실패:', error);
      // 폴백: 구글 폼이나 임시 페이지로 연결
      // await browser.tabs.create({ url: 'https://forms.google.com/parking-review' });
    }
  }

  // 스토리지 변경 감지 (옵션)
  browser.storage.onChanged.addListener((changes: browser.Storage.StorageAreaOnChangedChangesType, area: string) => {
    if (area === 'local') {
      // 필요시 UI 업데이트
      checkCurrentTab();
    }
  });
});