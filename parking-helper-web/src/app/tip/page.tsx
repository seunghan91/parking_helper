'use client';

import { useState } from 'react';

export default function TipPage() {
  const [tipContent, setTipContent] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          💡 주차 꿀팁 공유
        </h1>
        
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              장소
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="꿀팁을 공유할 장소를 입력하세요"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">선택하세요</option>
              <option value="free">무료 주차</option>
              <option value="cheap">저렴한 주차</option>
              <option value="hidden">숨은 주차장</option>
              <option value="time">시간대별 팁</option>
              <option value="event">행사/이벤트</option>
              <option value="other">기타</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              꿀팁 내용
            </label>
            <textarea
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="유용한 주차 정보를 공유해주세요. 예) 평일 오후 2-5시는 무료 주차 가능"
              value={tipContent}
              onChange={(e) => setTipContent(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              유용한 시간대 (선택)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-600">평일 오전</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-600">평일 오후</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-600">주말 오전</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-600">주말 오후</span>
              </label>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              💡 좋은 꿀팁 예시
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 특정 시간대 무료/할인 정보</li>
              <li>• 근처 숨겨진 공영주차장 위치</li>
              <li>• 주차 후 도보 이동 경로 팁</li>
              <li>• 행사/축제 시 대체 주차 방법</li>
            </ul>
          </div>
          
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              꿀팁 등록
            </button>
            <button
              type="button"
              className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              onClick={() => window.history.back()}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}