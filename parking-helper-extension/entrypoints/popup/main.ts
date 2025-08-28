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

  // 현재 탭 상태 확인
  async function checkCurrentTab() {
    try {
      // 현재 탭 정보 가져오기
      const [tab] = await browser.tabs.query({ 
        active: true, 
        currentWindow: true 
      }) as browser.Tabs.Tab[];

      if (!tab || !tab.url) {
        showView('inactive');
        return;
      }

      // 지도 사이트 체크
      const isOnMapSite = isMapSite(tab.url);
      
      if (isOnMapSite) {
        // 지도 사이트에서 활성화됨 - 콘텐츠 스크립트에서 장소 정보 가져오기
        await fetchPlaceInfo(tab);
      } else {
        showView('inactive');
      }
    } catch (error) {
      console.error('탭 상태 확인 실패:', error);
      showView('inactive');
    }
  }

  // 장소 정보 가져오기
  async function fetchPlaceInfo(tab: browser.Tabs.Tab) {
    try {
      if (!tab.id) {
        showView('inactive');
        return;
      }

      // 콘텐츠 스크립트에 현재 장소 정보 요청
      const response = await browser.tabs.sendMessage<any, GetCurrentPlaceResponse>(tab.id, {
        type: 'GET_CURRENT_PLACE'
      }).catch(() => null);

      if (response && response.place) {
        // 장소 정보가 있으면 active view 표시
        updatePlaceInfo(response.place);
        showView('active');
      } else {
        // 장소 정보가 없으면 inactive view 표시
        showView('inactive');
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
    // 모든 view 숨기기
    if (loadingView) loadingView.style.display = 'none';
    if (inactiveView) inactiveView.style.display = 'none';
    if (activeView) activeView.style.display = 'none';
    
    // 선택된 view 표시
    switch (type) {
      case 'loading':
        if (loadingView) loadingView.style.display = 'block';
        break;
      case 'inactive':
        if (inactiveView) inactiveView.style.display = 'block';
        break;
      case 'active':
        if (activeView) activeView.style.display = 'block';
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
    
    // 로컬 개발 서버로 연결 (추후 실제 URL로 변경)
    const reviewUrl = 'http://localhost:3003/review';
    await browser.tabs.create({ url: reviewUrl });
    window.close();
  }

  // 스토리지 변경 감지 (옵션)
  browser.storage.onChanged.addListener((changes: browser.Storage.StorageAreaOnChangedChangesType, area: string) => {
    if (area === 'local') {
      // 필요시 UI 업데이트
      checkCurrentTab();
    }
  });
});