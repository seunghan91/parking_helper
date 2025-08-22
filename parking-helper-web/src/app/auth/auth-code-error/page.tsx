export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">인증 오류</h1>
        <p className="text-gray-600 mb-6">
          로그인 과정에서 오류가 발생했습니다. 다시 시도해주세요.
        </p>
        <a
          href="/login"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          로그인 페이지로 돌아가기
        </a>
      </div>
    </div>
  )
}