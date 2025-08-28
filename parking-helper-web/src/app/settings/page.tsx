'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [autoDetect, setAutoDetect] = useState(true);
  const [dataSync, setDataSync] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          ⚙️ 설정
        </h1>
        
        <div className="space-y-6">
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">알림 설정</h2>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">주차 정보 알림</p>
                  <p className="text-sm text-gray-500">새로운 주차 정보가 있을 때 알림</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">자동 감지</p>
                  <p className="text-sm text-gray-500">지도 사이트 방문 시 자동으로 확장 프로그램 활성화</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoDetect}
                  onChange={(e) => setAutoDetect(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
            </div>
          </div>
          
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">데이터 관리</h2>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">클라우드 동기화</p>
                  <p className="text-sm text-gray-500">여러 기기에서 데이터 동기화</p>
                </div>
                <input
                  type="checkbox"
                  checked={dataSync}
                  onChange={(e) => setDataSync(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
              
              <div>
                <p className="font-medium text-gray-700 mb-2">캐시 관리</p>
                <button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                  캐시 삭제
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">지원 지도 서비스</h2>
            
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" checked readOnly className="mr-3" />
                <span className="text-gray-700">네이버 지도</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" checked readOnly className="mr-3" />
                <span className="text-gray-700">카카오맵</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" checked readOnly className="mr-3" />
                <span className="text-gray-700">구글 맵</span>
              </label>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">정보</h2>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p>버전: 1.0.0</p>
              <p>개발자: Parking Helper Team</p>
              <p>
                <a href="/welcome" className="text-blue-500 hover:underline">
                  사용 가이드
                </a>
              </p>
              <p>
                <a href="#" className="text-blue-500 hover:underline">
                  개인정보 처리방침
                </a>
              </p>
            </div>
          </div>
          
          <div className="pt-6 flex gap-4">
            <button
              type="button"
              className="flex-1 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              저장
            </button>
            <button
              type="button"
              className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              onClick={() => window.history.back()}
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}