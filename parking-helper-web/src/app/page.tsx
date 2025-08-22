import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">파킹 헬퍼</h1>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{user.email}</span>
                <form action="/auth/logout" method="post">
                  <button className="text-sm text-gray-500 hover:text-gray-700">
                    로그아웃
                  </button>
                </form>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            실사용자 기반 주차 정보 플랫폼
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            네이버, 카카오, 구글 지도와 함께 사용하는 주차 정보 서비스
          </p>
          
          {user ? (
            <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-2">환영합니다!</h3>
              <p className="text-gray-600">
                로그인 성공! 프로필 정보:
              </p>
              <pre className="mt-4 text-left text-sm bg-gray-50 p-4 rounded overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
              <p className="text-gray-600 mb-4">
                로그인하여 주차 정보를 확인하고 리뷰를 남겨보세요
              </p>
              <Link 
                href="/login" 
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
              >
                시작하기
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
