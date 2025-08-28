// Popup 스크립트
interface PlaceInfo {
  id?: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  mapProvider: 'naver' | 'kakao' | 'google';
}

interface ParkingData {
  reviewCount: number;
  tipCount: number;
  rating: number | null;
}

class PopupController {
  private loadingView: HTMLElement;
  private inactiveView: HTMLElement;
  private activeView: HTMLElement;

  constructor() {
    this.loadingView = document.getElementById('loading-view')!;
    this.inactiveView = document.getElementById('inactive-view')!;
    this.activeView = document.getElementById('active-view')!;

    this.init();
  }

  private async init() {
    try {
      // 현재 활성 탭에서 장소 정보 가져오기
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab?.id) {
        this.showInactive();
        return;
      }

      // Content script에서 현재 장소 정보 요청
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'getCurrentPlace' 
      });

      if (response?.place) {
        await this.showPlaceInfo(response.place);
      } else {
        this.showInactive();
      }
    } catch (error) {
      console.error('팝업 초기화 오류:', error);
      this.showInactive();
    }
  }

  private showInactive() {
    this.loadingView.style.display = 'none';
    this.inactiveView.style.display = 'block';
    this.activeView.style.display = 'none';
  }

  private async showPlaceInfo(place: PlaceInfo) {
    try {
      // 백엔드에서 주차 정보 가져오기
      const parkingData = await this.fetchParkingData(place);
      
      // UI 업데이트
      this.updatePlaceUI(place, parkingData);
      
      // 뷰 전환
      this.loadingView.style.display = 'none';
      this.inactiveView.style.display = 'none';
      this.activeView.style.display = 'block';
      
      // 이벤트 리스너 설정
      this.setupEventListeners(place);
    } catch (error) {
      console.error('장소 정보 로드 오류:', error);
      this.showInactive();
    }
  }

  private async fetchParkingData(place: PlaceInfo): Promise<ParkingData> {
    // TODO: 실제 API 엔드포인트 연결
    const apiUrl = 'https://your-app-url.vercel.app';
    
    try {
      // 장소 검색
      const searchResponse = await fetch(`${apiUrl}/api/parking/search?q=${encodeURIComponent(place.name)}&address=${encodeURIComponent(place.address)}`);
      
      if (!searchResponse.ok) {
        throw new Error('검색 실패');
      }
      
      const searchData = await searchResponse.json();
      
      if (searchData.places && searchData.places.length > 0) {
        const matchedPlace = searchData.places[0];
        
        // 리뷰 및 팁 개수 계산
        const reviewCount = matchedPlace.reviews?.length || 0;
        const tipCount = matchedPlace.tips?.length || 0;
        
        // 평점 계산
        let rating = null;
        if (reviewCount > 0) {
          const totalRating = matchedPlace.reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
          rating = Math.round((totalRating / reviewCount) * 10) / 10;
        }
        
        return { reviewCount, tipCount, rating };
      }
      
      return { reviewCount: 0, tipCount: 0, rating: null };
    } catch (error) {
      console.error('API 호출 오류:', error);
      // 개발 중이므로 더미 데이터 반환
      return { 
        reviewCount: Math.floor(Math.random() * 20), 
        tipCount: Math.floor(Math.random() * 10), 
        rating: Math.round(Math.random() * 50) / 10 
      };
    }
  }

  private updatePlaceUI(place: PlaceInfo, data: ParkingData) {
    const placeNameEl = document.getElementById('place-name')!;
    const placeAddressEl = document.getElementById('place-address')!;
    const reviewCountEl = document.getElementById('review-count')!;
    const tipCountEl = document.getElementById('tip-count')!;
    const ratingEl = document.getElementById('rating')!;

    placeNameEl.textContent = place.name;
    placeAddressEl.textContent = place.address;
    reviewCountEl.textContent = data.reviewCount.toString();
    tipCountEl.textContent = data.tipCount.toString();
    ratingEl.textContent = data.rating ? data.rating.toString() : '-';
  }

  private setupEventListeners(place: PlaceInfo) {
    const viewDetailsBtn = document.getElementById('view-details')!;
    const writeReviewBtn = document.getElementById('write-review')!;

    viewDetailsBtn.addEventListener('click', () => {
      // 웹앱에서 상세 페이지 열기
      const detailUrl = `https://your-app-url.vercel.app/place/${encodeURIComponent(place.name)}?address=${encodeURIComponent(place.address)}`;
      chrome.tabs.create({ url: detailUrl });
      window.close();
    });

    writeReviewBtn.addEventListener('click', () => {
      // 웹앱에서 리뷰 작성 페이지 열기
      const reviewUrl = `https://your-app-url.vercel.app/place/${encodeURIComponent(place.name)}/review?address=${encodeURIComponent(place.address)}`;
      chrome.tabs.create({ url: reviewUrl });
      window.close();
    });
  }
}

// DOM이 로드되면 팝업 컨트롤러 초기화
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});