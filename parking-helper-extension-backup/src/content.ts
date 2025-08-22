// 파킹 헬퍼 확장 프로그램 - Content Script

interface PlaceInfo {
  name: string
  address?: string
  latitude?: number
  longitude?: number
  provider: 'naver' | 'kakao' | 'google'
  externalId?: string
}

class ParkingHelperExtension {
  private panel: HTMLElement | null = null
  private currentPlace: PlaceInfo | null = null
  private debounceTimer: NodeJS.Timeout | null = null
  private cache = new Map<string, { data: any; timestamp: number }>()
  private CACHE_TTL = 5 * 60 * 1000 // 5분

  constructor() {
    this.init()
  }

  private init() {
    // 패널 생성
    this.createPanel()
    
    // 지도 서비스별 초기화
    const hostname = window.location.hostname
    if (hostname.includes('map.naver.com')) {
      this.initNaver()
    } else if (hostname.includes('map.kakao.com')) {
      this.initKakao()
    } else if (hostname.includes('google.com/maps')) {
      this.initGoogle()
    }

    // URL 변경 감지
    this.observeUrlChanges()
  }

  private createPanel() {
    this.panel = document.createElement('div')
    this.panel.id = 'parking-helper-panel'
    this.panel.className = 'parking-helper-panel'
    this.panel.innerHTML = `
      <div class="parking-helper-header">
        <h3>🅿️ 파킹 헬퍼</h3>
      </div>
      <div class="parking-helper-content">
        <div class="parking-helper-loading">
          <p>주차 정보를 불러오는 중...</p>
        </div>
      </div>
    `
    document.body.appendChild(this.panel)
  }

  private updatePanel(content: string) {
    if (!this.panel) return
    const contentEl = this.panel.querySelector('.parking-helper-content')
    if (contentEl) {
      contentEl.innerHTML = content
    }
  }

  private showLoading() {
    this.updatePanel(`
      <div class="parking-helper-loading">
        <p>주차 정보를 불러오는 중...</p>
      </div>
    `)
  }

  private showError(message: string) {
    this.updatePanel(`
      <div class="parking-helper-error">
        <p>❌ ${message}</p>
        <button onclick="window.parkingHelper.retry()">다시 시도</button>
      </div>
    `)
  }

  private showEmpty() {
    this.updatePanel(`
      <div class="parking-helper-empty">
        <p>근처 주차 정보가 아직 없어요</p>
        <button onclick="window.parkingHelper.addReview()">리뷰 남기기</button>
      </div>
    `)
  }

  private showParkingInfo(data: any) {
    let html = '<div class="parking-helper-info">'
    
    if (data.tips && data.tips.length > 0) {
      html += '<div class="parking-tips">'
      html += '<h4>💡 꿀팁</h4>'
      data.tips.forEach((tip: any) => {
        html += `<div class="tip-item">✅ ${tip}</div>`
      })
      html += '</div>'
    }

    if (data.parkingLots && data.parkingLots.length > 0) {
      html += '<div class="parking-list">'
      html += '<h4>🚗 추천 주차장</h4>'
      data.parkingLots.forEach((lot: any) => {
        html += `
          <div class="parking-item">
            <h5>${lot.name}</h5>
            <p>📍 ${lot.distance || '도보 5분'}</p>
            <p>💰 ${lot.price || '10분/500원'}</p>
            <p>🏢 ${lot.type === 'public' ? '공영' : '민영'}</p>
          </div>
        `
      })
      html += '</div>'
    }

    if (data.reviews && data.reviews.length > 0) {
      html += '<div class="review-list">'
      html += '<h4>⭐ 최근 리뷰</h4>'
      data.reviews.forEach((review: any) => {
        html += `
          <div class="review-item">
            <div class="review-header">
              <span class="stars">${'★'.repeat(review.rating)}</span>
              <span class="author">${review.author}</span>
            </div>
            <p>${review.comment}</p>
            <div class="review-footer">
              <span>${review.date}</span>
              <button>👍 도움돼요</button>
            </div>
          </div>
        `
      })
      html += '</div>'
    }

    html += '</div>'
    this.updatePanel(html)
  }

  private async fetchParkingInfo(place: PlaceInfo) {
    // 캐시 확인
    const cacheKey = `${place.provider}-${place.externalId || place.name}`
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.showParkingInfo(cached.data)
      return
    }

    this.showLoading()

    try {
      // API 호출 시뮬레이션 (실제로는 백엔드 API 호출)
      const mockData = {
        tips: [
          'A 빌딩 방문 시 2시간 무료',
          '주말엔 B공영주차장이 50% 할인'
        ],
        parkingLots: [
          {
            name: 'B 공영주차장',
            distance: '도보 3분',
            price: '10분/500원',
            type: 'public'
          },
          {
            name: 'C 카페 제휴주차장',
            distance: '도보 5분',
            price: '1시간 무료',
            type: 'affiliate'
          }
        ],
        reviews: [
          {
            rating: 4,
            author: '김나영',
            comment: '평일 낮에는 여유 있어요',
            date: '2일 전'
          },
          {
            rating: 3,
            author: '박철수',
            comment: '주말엔 좀 붐비네요',
            date: '5일 전'
          }
        ]
      }

      // 캐시 저장
      this.cache.set(cacheKey, {
        data: mockData,
        timestamp: Date.now()
      })

      this.showParkingInfo(mockData)
    } catch (error) {
      this.showError('주차 정보를 불러올 수 없습니다')
    }
  }

  private debounceSearch(place: PlaceInfo) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(() => {
      this.currentPlace = place
      this.fetchParkingInfo(place)
    }, 300)
  }

  // 네이버 지도 초기화
  private initNaver() {
    const observer = new MutationObserver(() => {
      const placeNameEl = document.querySelector('.place_name')
      const addressEl = document.querySelector('.place_address')
      
      if (placeNameEl) {
        const placeName = placeNameEl.textContent?.trim() || ''
        const address = addressEl?.textContent?.trim() || ''
        
        if (placeName && placeName !== this.currentPlace?.name) {
          this.debounceSearch({
            name: placeName,
            address,
            provider: 'naver'
          })
        }
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  // 카카오 지도 초기화
  private initKakao() {
    const observer = new MutationObserver(() => {
      const placeNameEl = document.querySelector('.link_placename')
      const addressEl = document.querySelector('.txt_address')
      
      if (placeNameEl) {
        const placeName = placeNameEl.textContent?.trim() || ''
        const address = addressEl?.textContent?.trim() || ''
        
        if (placeName && placeName !== this.currentPlace?.name) {
          this.debounceSearch({
            name: placeName,
            address,
            provider: 'kakao'
          })
        }
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  // 구글 지도 초기화
  private initGoogle() {
    const observer = new MutationObserver(() => {
      const placeNameEl = document.querySelector('h1.fontHeadlineLarge')
      const addressEl = document.querySelector('[data-item-id="address"]')
      
      if (placeNameEl) {
        const placeName = placeNameEl.textContent?.trim() || ''
        const address = addressEl?.textContent?.trim() || ''
        
        if (placeName && placeName !== this.currentPlace?.name) {
          this.debounceSearch({
            name: placeName,
            address,
            provider: 'google'
          })
        }
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  // URL 변경 감지
  private observeUrlChanges() {
    let lastUrl = location.href
    new MutationObserver(() => {
      const url = location.href
      if (url !== lastUrl) {
        lastUrl = url
        // URL 변경 시 패널 초기화
        this.currentPlace = null
        this.showEmpty()
      }
    }).observe(document, { subtree: true, childList: true })
  }

  // 재시도
  public retry() {
    if (this.currentPlace) {
      this.fetchParkingInfo(this.currentPlace)
    }
  }

  // 리뷰 추가 (실제 구현 시 팝업 또는 새 탭으로)
  public addReview() {
    window.open('https://parking-helper.vercel.app/review/new', '_blank')
  }
}

// 전역 인스턴스 생성
(window as any).parkingHelper = new ParkingHelperExtension()