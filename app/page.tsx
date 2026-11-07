'use client'

import { useState } from 'react'
import ParticipantView from '@/components/ParticipantView'
import PasswordGate from '@/components/PasswordGate'
import ResearcherView from '@/components/ResearcherView'
import GalleryView from '@/components/GalleryView'

type Tab = 'participant' | 'researcher' | 'gallery'

const TABS: { id: Tab; label: string }[] = [
  { id: 'participant', label: '실험자' },
  { id: 'researcher', label: '연구자' },
  { id: 'gallery', label: '갤러리' },
]

export default function Home() {
  const [tab, setTab] = useState<Tab>('participant')

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="hero-texture absolute inset-x-0 top-0 h-96 pointer-events-none" aria-hidden="true" />

      <header className="relative">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <h1 className="flex items-center gap-3 text-lg font-semibold tracking-tight text-neutral-900">
            <span
              className="w-8 h-8 rounded-full bg-neutral-900 flex items-end justify-center gap-0.5 pb-2 shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
              aria-hidden="true"
            >
              <span className="w-1 h-2 bg-white rounded-sm" />
              <span className="w-1 h-3.5 bg-white rounded-sm" />
              <span className="w-1 h-2.5 bg-white rounded-sm" />
            </span>
            도시 경관 이미지 실험
          </h1>
          <nav className="flex gap-1 bg-neutral-200/60 rounded-xl p-1">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === id
                    ? 'bg-white text-neutral-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {tab === 'participant' && <ParticipantView />}
        {tab === 'researcher' && (
          <PasswordGate>
            <ResearcherView />
          </PasswordGate>
        )}
        {tab === 'gallery' && (
          <PasswordGate>
            <GalleryView />
          </PasswordGate>
        )}
      </main>
    </div>
  )
}
