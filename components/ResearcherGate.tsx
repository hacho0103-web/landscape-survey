'use client'

import { useState } from 'react'
import ResearcherView from '@/components/ResearcherView'

// 실험 기기를 참가자와 공유하므로 탭에 들어올 때마다 비밀번호를 묻는다.
export default function ResearcherGate() {
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

  if (unlocked) return <ResearcherView />

  return (
    <section className="max-w-sm mx-auto bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">연구자 인증</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          aria-label="비밀번호"
          autoComplete="off"
          autoFocus
          className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-400"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || password.length === 0}
          className="bg-blue-600 text-white font-medium rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {submitting ? '확인 중...' : '확인'}
        </button>
      </form>
    </section>
  )
}
