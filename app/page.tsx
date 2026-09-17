'use client'

import { useState } from 'react'
import ParticipantView from '@/components/ParticipantView'
import ResearcherView from '@/components/ResearcherView'
import GalleryView from '@/components/GalleryView'

type Tab = 'participant' | 'researcher' | 'gallery'

export default function Home() {
  const [tab, setTab] = useState<Tab>('participant')

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">도시 경관 이미지 실험</h1>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTab('participant')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'participant'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              실험자
            </button>
            <button
              onClick={() => setTab('researcher')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'researcher'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              연구자
            </button>
            <button
              onClick={() => setTab('gallery')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'gallery'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              갤러리
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {tab === 'participant' && <ParticipantView />}
        {tab === 'researcher' && <ResearcherView />}
        {tab === 'gallery' && <GalleryView />}
      </main>
    </div>
  )
}
