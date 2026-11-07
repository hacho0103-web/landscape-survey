import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  checkPassword,
  createSessionToken,
  isConfigured,
} from '@/lib/auth'

// 네 자리 비밀번호의 무작위 대입을 막기 위해 연속 실패 시 잠시 잠근다.
const MAX_FAILURES = 10
const LOCK_MS = 10 * 60 * 1000

let failures = 0
let lockedUntil = 0

export async function POST(req: NextRequest) {
  if (!isConfigured()) {
    return Response.json({ error: '서버에 비밀번호가 설정되지 않았습니다.' }, { status: 503 })
  }

  if (Date.now() < lockedUntil) {
    return Response.json(
      { error: '시도가 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!checkPassword(password)) {
    failures += 1
    if (failures >= MAX_FAILURES) {
      failures = 0
      lockedUntil = Date.now() + LOCK_MS
    }
    return Response.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 })
  }

  failures = 0
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })

  return Response.json({ ok: true })
}
