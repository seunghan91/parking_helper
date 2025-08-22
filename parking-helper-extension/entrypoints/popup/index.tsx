import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';

const Popup: React.FC = () => {
  const openWebsite = () => {
    chrome.tabs.create({ url: 'https://parkinghelper.co.kr' });
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="popup-container">
      <div className="popup-header">
        <img src="/icon-128.png" alt="Parking Helper" className="popup-logo" />
        <h1>파킹 헬퍼</h1>
      </div>
      
      <div className="popup-content">
        <p className="popup-description">
          네이버, 카카오, 구글 지도에서 실시간 주차 정보를 확인하세요!
        </p>
        
        <div className="popup-stats">
          <div className="stat-item">
            <span className="stat-label">오늘 확인한 장소</span>
            <span className="stat-value">12</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">도움받은 리뷰</span>
            <span className="stat-value">38</span>
          </div>
        </div>
        
        <div className="popup-actions">
          <button className="btn btn-primary" onClick={openWebsite}>
            웹사이트 방문
          </button>
          <button className="btn btn-secondary" onClick={openSettings}>
            설정
          </button>
        </div>
      </div>
      
      <div className="popup-footer">
        <p>v0.0.1 • Made with ❤️ by Parking Helper Team</p>
      </div>
    </div>
  );
};

const App = () => <Popup />;

export default App;