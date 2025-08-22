import React, { useEffect, useState } from 'react';
import { PlaceInfo, ParkingInfo } from '../../utils/types';
import { detectPlaceInfo } from '../../utils/placeDetector';
import { fetchParkingInfo } from '../../utils/api';
import { analytics } from '../../utils/analytics';

const ParkingHelperPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlace, setCurrentPlace] = useState<PlaceInfo | null>(null);
  const [parkingInfo, setParkingInfo] = useState<ParkingInfo | null>(null);

  useEffect(() => {
    // URL 변경 감지
    const handleUrlChange = () => {
      detectPlace();
    };

    // 초기 장소 감지
    detectPlace();

    // URL 변경 이벤트 리스너
    window.addEventListener('popstate', handleUrlChange);
    
    // MutationObserver로 DOM 변경 감지
    const observer = new MutationObserver(() => {
      detectPlace();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      observer.disconnect();
    };
  }, []);

  const detectPlace = async () => {
    try {
      const place = await detectPlaceInfo();
      if (place && (!currentPlace || place.externalId !== currentPlace.externalId)) {
        setCurrentPlace(place);
        // Track place view
        analytics.trackPlaceView(place);
        await loadParkingInfo(place);
      }
    } catch (err) {
      console.error('Failed to detect place:', err);
      analytics.trackError(err as Error, { context: 'place_detection' });
    }
  };

  const loadParkingInfo = async (place: PlaceInfo) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const info = await fetchParkingInfo(place);
      setParkingInfo(info);
      // Track successful load
      analytics.track('parking_info_loaded', {
        place_name: place.name,
        provider: place.provider,
        has_parking_lots: (info.parkingLots?.length || 0) > 0,
        has_reviews: (info.reviews?.length || 0) > 0,
        has_tips: (info.tips?.length || 0) > 0
      });
    } catch (err) {
      setError('주차 정보를 불러올 수 없습니다.');
      console.error('Failed to fetch parking info:', err);
      analytics.trackError(err as Error, { context: 'parking_info_fetch' });
    } finally {
      setIsLoading(false);
    }
  };

  const retry = () => {
    if (currentPlace) {
      loadParkingInfo(currentPlace);
    }
  };

  return (
    <div className="parking-helper-panel">
      <div className="parking-helper-header">
        <h3>🅿️ 파킹 헬퍼</h3>
      </div>
      
      <div className="parking-helper-content">
        {isLoading && (
          <div className="parking-helper-loading">
            <p>주차 정보를 불러오는 중...</p>
          </div>
        )}
        
        {error && (
          <div className="parking-helper-error">
            <p>❌ {error}</p>
            <button onClick={retry}>다시 시도</button>
          </div>
        )}
        
        {!isLoading && !error && !parkingInfo && (
          <div className="parking-helper-empty">
            <p>근처 주차 정보가 아직 없어요</p>
            <button onClick={() => console.log('Add review')}>리뷰 남기기</button>
          </div>
        )}
        
        {!isLoading && !error && parkingInfo && (
          <div className="parking-helper-info">
            {parkingInfo.tips && parkingInfo.tips.length > 0 && (
              <div className="parking-tips">
                <h4>💡 꿀팁</h4>
                {parkingInfo.tips.map((tip, index) => (
                  <div key={index} className="tip-item">✅ {tip.content}</div>
                ))}
              </div>
            )}
            
            {parkingInfo.parkingLots && parkingInfo.parkingLots.length > 0 && (
              <div className="parking-list">
                <h4>🚗 추천 주차장</h4>
                {parkingInfo.parkingLots.map((lot) => (
                  <div key={lot.id} className="parking-item">
                    <h5>{lot.name}</h5>
                    <p>📍 {lot.distance || '도보 5분'}</p>
                    <p>💰 {lot.base_fee_info || '10분/500원'}</p>
                    <p>🏢 {lot.type === 'public' ? '공영' : '민영'}</p>
                  </div>
                ))}
              </div>
            )}
            
            {parkingInfo.reviews && parkingInfo.reviews.length > 0 && (
              <div className="review-list">
                <h4>⭐ 최근 리뷰</h4>
                {parkingInfo.reviews.map((review) => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <span className="stars">{'★'.repeat(review.rating)}</span>
                      <span className="author">{review.display_name || '익명'}</span>
                    </div>
                    <p>{review.content}</p>
                    <div className="review-footer">
                      <span>{new Date(review.created_at).toLocaleDateString()}</span>
                      <button>👍 도움돼요</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParkingHelperPanel;