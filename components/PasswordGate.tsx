'use client'

import { useState, type ReactNode } from 'react'

// 실험 기기를 참가자와 공유하므로 탭에 들어올 때마다 비밀번호를 묻는다.
export default function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        setUnlocked(true)
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? '확인에 실패했습니다.')
      }
    } catch {
      setError('확인 중 오류가 발생했습니다.')
    } finally {
      setPassword('')
      setSubmitting(false)
    }
  }

  if (unlocked) return <>{children}</>

  return (
    <section className="card max-w-sm mx-auto mt-12 p-8">
      <h2 className="text-xl font-bold tracking-tight text-neutral-900 mb-5">비밀번호 확인</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          aria-label="비밀번호"
          autoComplete="off"
          autoFocus
          className="border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || password.length === 0}
          className="btn-primary px-4 py-3"
        >
          {submitting ? '확인 중...' : '확인'}
        </button>
      </form>
    </section>
  )
}
