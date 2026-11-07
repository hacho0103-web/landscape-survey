import { NextResponse } from 'next/server'

// 업로드 볼륨이 public/ 아래에 있어 실험 기록(_data)까지 정적 파일로 노출된다.
// 앱은 /api/uploads만 사용하므로 직접 접근 경로는 전부 막는다.
export function proxy() {
  return new NextResponse('Not found', { status: 404 })
}

export const config = {
  matcher: '/uploads/:path*',
}
