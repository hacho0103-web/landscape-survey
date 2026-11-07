'use client'

import { useState, type FormEvent } from 'react'

export default function ContactForm({ experimentId }: { experimentId: string }) {
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!contact.trim() || status === 'saving') return

    setStatus('saving')
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentId, contact }),
      })
      setStatus(res.ok || res.status === 409 ? 'saved' : 'failed')
    } catch {
      setStatus('failed')
    }
  }

  if (status === 'saved') {
    return <p className="text-sm text-neutral-600">연락처가 저장되었습니다. 감사합니다.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="card w-full max-w-md p-6 flex flex-col gap-3">
      <label htmlFor="contact" className="font-semibold text-neutral-900">
        상품권을 받으실 연락처를 남겨주세요
      </label>
      <p className="text-sm leading-relaxed text-neutral-500">
        연락처는 실험 자료와 분리해 보관하고, 지급 목적으로만 사용하며, 지급 완료 3개월 후 파기합니다.
      </p>
      <div className="flex gap-2">
        <input
          id="contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          maxLength={100}
          autoComplete="off"
          placeholder="휴대폰 번호 또는 이메일"
          className="min-w-0 flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
        />
        <button
          type="submit"
          disabled={!contact.trim() || status === 'saving'}
          className="btn-primary px-5 py-2"
        >
          저장
        </button>
      </div>
      {status === 'failed' && (
        <p className="text-sm text-red-600">저장하지 못했습니다. 다시 시도해주세요.</p>
      )}
    </form>
  )
}
