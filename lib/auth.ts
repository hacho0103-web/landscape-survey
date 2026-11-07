import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'researcher_session'
export const SESSION_MAX_AGE = 60 * 60 * 12 // 12시간

// 저장소가 공개되어 있으므로 비밀번호는 코드가 아닌 환경변수로만 관리한다.
function getPassword() {
  return process.env.RESEARCHER_PASSWORD || null
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB)
}

function sign(expires: string, password: string) {
  return createHmac('sha256', password).update(`researcher:${expires}`).digest('hex')
}

export function isConfigured() {
  return getPassword() !== null
}

export function checkPassword(input: string) {
  const password = getPassword()
  return password !== null && safeEqual(input, password)
}

export function createSessionToken() {
  const password = getPassword()
  if (!password) throw new Error('RESEARCHER_PASSWORD is not set')
  const expires = String(Date.now() + SESSION_MAX_AGE * 1000)
  return `${expires}.${sign(expires, password)}`
}

async function isAuthenticated() {
  const password = getPassword()
  if (!password) return false

  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return false

  const [expires, signature] = token.split('.')
  if (!expires || !signature || Number(expires) < Date.now()) return false
  return safeEqual(signature, sign(expires, password))
}

/** 인증되지 않았으면 401 응답을, 인증되었으면 null을 반환한다. */
export async function requireResearcher() {
  if (await isAuthenticated()) return null
  return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
}
