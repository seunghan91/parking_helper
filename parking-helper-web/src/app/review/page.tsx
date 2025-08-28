'use client';

import { useState } from 'react';

export default function ReviewPage() {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          📝 주차장 리뷰 작성
        </h1>
        
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주차장 이름
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="주차장 이름을 입력하세요"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              평점
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-3xl ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-400 transition-colors`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              리뷰 내용
            </label>
            <textarea
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="주차장 이용 경험을 공유해주세요"
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">추가 정보</h3>
            
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-gray-600">주차 공간이 넓어요</span>
            </label>
            
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-gray-600">요금이 저렴해요</span>
            </label>
            
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-gray-600">접근성이 좋아요</span>
            </label>
            
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-gray-600">24시간 이용 가능해요</span>
            </label>
          </div>
          
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              리뷰 등록
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