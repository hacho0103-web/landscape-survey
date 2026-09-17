'use client'

import { useState, useEffect, useRef } from 'react'

interface Experiment {
  id: string
  label: string
  date: string
  imageOrder: string[]
}

export default function ResearcherView() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingExps, setLoadingExps] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoadingExps(true)
    await Promise.all([fetchImages(), fetchExperiments()])
    setLoadingExps(false)
  }

  async function fetchImages() {
    try {
      const res = await fetch('/api/images')
      const data = await res.json()
      setImages(data.images)
    } catch {
      setImages([])
    }
  }

  async function fetchExperiments() {
    try {
      const res = await fetch('/api/experiments')
      const data = await res.json()
      setExperiments(data.reverse())
    } catch {
      setExperiments([])
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadMsg(null)

    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }

    try {
      const res = await fetch('/api/images', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        await fetchImages()
        setUploadMsg(`${files.length}개 이미지가 업로드되었습니다.`)
      } else {
        const err = await res.json()
        setUploadMsg(`오류: ${err.error || '업로드 실패'}`)
      }
    } catch {
      setUploadMsg('업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDeleteImage(filename: string) {
    if (!confirm(`"${filename}" 이미지를 삭제할까요?`)) return
    try {
      const res = await fetch(`/api/images?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setImages((prev) => prev.filter((f) => f !== filename))
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  async function handleDeleteExperiment(id: string) {
    if (!confirm('이 실험 기록을 삭제할까요?')) return
    try {
      const res = await fetch(`/api/experiments/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setExperiments((prev) => prev.filter((e) => e.id !== id))
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 이미지 업로드 섹션 */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">이미지 관리</h2>

        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (fileInputRef.current) {
              const dt = e.dataTransfer
              // Trigger change via input by setting files
              const input = fileInputRef.current
              // Create a synthetic event simulation
              const fileList = dt.files
              if (fileList.length > 0) {
                Object.defineProperty(input, 'files', { value: fileList, configurable: true })
                input.dispatchEvent(new Event('change', { bubbles: true }))
              }
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          {uploading ? (
            <p className="text-blue-600 font-medium">업로드 중...</p>
          ) : (
            <>
              <p className="text-gray-500 font-medium">클릭하거나 이미지를 드래그하여 업로드</p>
              <p className="text-gray-400 text-sm mt-1">JPG, PNG, WebP 등 지원</p>
            </>
          )}
        </div>

        {uploadMsg && (
          <p
            className={`mt-3 text-sm ${
              uploadMsg.startsWith('오류') ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {uploadMsg}
          </p>
        )}

        {images.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-600 mb-3">
              현재 이미지 ({images.length}개)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <div key={img} className="relative group">
                  <img
                    src={`/api/uploads/${encodeURIComponent(img)}`}
                    alt={img}
                    className="w-full aspect-video object-cover rounded-lg border border-gray-200"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteImage(img)
                      }}
                      className="opacity-0 group-hover:opacity-100 bg-red-500 text-white text-xs px-2 py-1 rounded transition-opacity"
                    >
                      삭제
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">{img}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 실험 기록 섹션 */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">실험 기록</h2>
          <button
            onClick={fetchAll}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            새로고침
          </button>
        </div>

        {loadingExps ? (
          <p className="text-gray-400 text-sm">불러오는 중...</p>
        ) : experiments.length === 0 ? (
          <p className="text-gray-400 text-sm">아직 실험 기록이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {experiments.map((exp) => (
              <div
                key={exp.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    setExpandedId(expandedId === exp.id ? null : exp.id)
                  }
                >
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-800">{exp.label}</span>
                    <span className="text-sm text-gray-500">{formatDate(exp.date)}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {exp.imageOrder.length}개 이미지
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteExperiment(exp.id)
                      }}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      삭제
                    </button>
                    <span className="text-gray-400 text-sm">
                      {expandedId === exp.id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {expandedId === exp.id && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      표시 순서 (1번부터)
                    </p>
                    <ol className="flex flex-col gap-1">
                      {exp.imageOrder.map((img, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-sm">
                          <span className="w-6 h-6 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full text-xs font-mono flex-shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-mono text-gray-700 truncate">{img}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="text-xs text-gray-400 mt-3 font-mono">ID: {exp.id}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
