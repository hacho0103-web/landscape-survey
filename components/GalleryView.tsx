'use client'

import { useState, useEffect } from 'react'

export default function GalleryView() {
  const [images, setImages] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/images')
      .then((r) => r.json())
      .then((d) => setImages(d.images ?? []))
      .catch(() => {})
  }, [])

  return (
    <>
      {images.length === 0 ? (
        <div className="flex items-center justify-center py-24 text-gray-400">
          업로드된 이미지가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((img) => (
            <button
              key={img}
              onClick={() => setSelected(img)}
              className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 hover:border-blue-400 transition-colors focus:outline-none"
            >
              <img
                src={`/api/uploads/${encodeURIComponent(img)}`}
                alt={img}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setSelected(null)}
        >
          <img
            src={`/api/uploads/${encodeURIComponent(selected)}`}
            alt={selected}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setSelected(null)}
            className="absolute top-4 right-6 text-white text-3xl font-light hover:text-gray-300"
          >
            ✕
          </button>
          <p className="absolute bottom-4 text-white/60 text-sm">{selected}</p>
        </div>
      )}
    </>
  )
}
