'use client'

import { useState, useEffect, useRef } from 'react'
import { buildContactRows, buildInterviewRows, buildResponseRows, toCsv } from '@/lib/csv'
import { contactKey, type ContactEntry } from '@/lib/contact-entry'
import type { Experiment } from '@/lib/experiments'
import { describeInterviewImages, interviewQuestionsFor } from '@/lib/interview'
import { RATING_QUESTIONS } from '@/lib/ratings'

function downloadCsv(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function formatSeconds(ms: number) {
  return `${(ms / 1000).toFixed(1)}초`
}

function totalViewTime(exp: Experiment) {
  return Object.values(exp.viewTimes ?? {}).reduce((sum, ms) => sum + ms, 0)
}

export default function ResearcherView() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingExps, setLoadingExps] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [contacts, setContacts] = useState<ContactEntry[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoadingExps(true)
    await Promise.all([fetchImages(), fetchExperiments(), fetchContacts()])
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

  async function fetchContacts() {
    try {
      const res = await fetch('/api/contacts')
      const data = await res.json()
      setContacts(data.contacts ?? [])
    } catch {
      setContacts([])
    }
  }

  async function handleClearContacts() {
    if (!confirm(`연락처 ${contacts.length}건을 모두 삭제할까요? 되돌릴 수 없습니다.`)) return
    try {
      const res = await fetch('/api/contacts', { method: 'DELETE' })
      if (res.ok) setContacts([])
      else alert('삭제에 실패했습니다.')
    } catch {
      alert('삭제 중 오류가 발생했습니다.')
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

  function toggleImage(filename: string) {
    setSelectedImages((prev) => {
      const next = new Set(prev)
      if (next.has(filename)) next.delete(filename)
      else next.add(filename)
      return next
    })
  }

  function toggleAllImages() {
    setSelectedImages(allImagesSelected ? new Set() : new Set(images))
  }

  async function handleDeleteSelectedImages() {
    const filenames = images.filter((f) => selectedImages.has(f))
    if (filenames.length === 0) return
    if (!confirm(`선택한 이미지 ${filenames.length}개를 삭제할까요? 되돌릴 수 없습니다.`)) return
    try {
      const res = await fetch('/api/images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames }),
      })
      const data = await res.json().catch(() => null)
      const failed: string[] = data?.failed ?? (res.ok ? [] : filenames)
      setImages((prev) =>
        prev.filter((f) => !filenames.includes(f) || failed.includes(f))
      )
      setSelectedImages(new Set(failed))
      if (failed.length > 0) alert(`${failed.length}개를 삭제하지 못했습니다.`)
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

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(experiments.map((e) => e.id)))
  }

  async function handleDeleteSelected() {
    const ids = experiments.filter((e) => selectedIds.has(e.id)).map((e) => e.id)
    if (ids.length === 0) return
    if (!confirm(`선택한 실험 기록 ${ids.length}건을 삭제할까요?`)) return
    try {
      const res = await fetch('/api/experiments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (res.ok) {
        setExperiments((prev) => prev.filter((e) => !ids.includes(e.id)))
        setSelectedIds(new Set())
      } else {
        alert('삭제에 실패했습니다.')
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const selectedImageCount = images.filter((f) => selectedImages.has(f)).length
  const allImagesSelected = images.length > 0 && selectedImageCount === images.length
  const selectedCount = experiments.filter((e) => selectedIds.has(e.id)).length
  const allSelected = experiments.length > 0 && selectedCount === experiments.length

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
      <section className="card p-7">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 mb-4">이미지 관리</h2>

        <div
          className="border border-dashed border-neutral-300 rounded-xl p-10 text-center bg-neutral-50 hover:border-neutral-900 transition-colors cursor-pointer"
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
            <p className="text-neutral-900 font-medium">업로드 중...</p>
          ) : (
            <>
              <p className="text-neutral-500 font-medium">클릭하거나 이미지를 드래그하여 업로드</p>
              <p className="text-neutral-400 text-sm mt-1">JPG, PNG, WebP 등 지원</p>
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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium text-neutral-600">
                  현재 이미지 ({images.length}개)
                </p>
                <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allImagesSelected}
                    onChange={toggleAllImages}
                  />
                  전체 선택
                </label>
              </div>
              <button
                onClick={handleDeleteSelectedImages}
                disabled={selectedImageCount === 0}
                className="btn-danger text-sm px-3 py-1.5"
              >
                선택 삭제{selectedImageCount > 0 ? ` (${selectedImageCount}개)` : ''}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <div key={img} className="relative group">
                  <input
                    type="checkbox"
                    checked={selectedImages.has(img)}
                    aria-label={`${img} 선택`}
                    onChange={() => toggleImage(img)}
                    className="absolute top-2 left-2 z-10 w-4 h-4"
                  />
                  <img
                    src={`/api/uploads/${encodeURIComponent(img)}`}
                    alt={img}
                    className="w-full aspect-video object-cover rounded-xl border border-black/5"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteImage(img)
                      }}
                      className="opacity-0 group-hover:opacity-100 bg-white text-red-600 text-xs font-medium px-2.5 py-1 rounded-md transition-opacity"
                    >
                      삭제
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 truncate">{img}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 실험 기록 섹션 */}
      <section className="card p-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">실험 기록</h2>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={() =>
                downloadCsv('응답', toCsv(buildResponseRows([...experiments].reverse())))
              }
              disabled={experiments.length === 0}
              className="btn-secondary text-sm px-3 py-1.5"
            >
              응답 CSV
            </button>
            <button
              onClick={() =>
                downloadCsv('인터뷰', toCsv(buildInterviewRows([...experiments].reverse())))
              }
              disabled={experiments.length === 0}
              className="btn-secondary text-sm px-3 py-1.5"
            >
              인터뷰 CSV
            </button>
            <button onClick={fetchAll} className="btn-secondary text-sm px-3 py-1.5">
              새로고침
            </button>
          </div>
        </div>

        {loadingExps ? (
          <p className="text-neutral-400 text-sm">불러오는 중...</p>
        ) : experiments.length === 0 ? (
          <p className="text-neutral-400 text-sm">아직 실험 기록이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-4">
              <label className="flex items-center gap-3 text-sm text-neutral-600 cursor-pointer">
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                전체 선택
              </label>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedCount === 0}
                className="btn-danger text-sm px-3 py-1.5"
              >
                선택 삭제{selectedCount > 0 ? ` (${selectedCount}건)` : ''}
              </button>
            </div>
            {experiments.map((exp) => (
              <div
                key={exp.id}
                className="border border-neutral-200 rounded-xl overflow-hidden"
              >
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors"
                  onClick={() =>
                    setExpandedId(expandedId === exp.id ? null : exp.id)
                  }
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(exp.id)}
                      aria-label={`${exp.label} 선택`}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleSelected(exp.id)}
                    />
                    <span className="font-semibold text-neutral-800">{exp.label}</span>
                    <span className="text-sm text-neutral-500">{formatDate(exp.date)}</span>
                    <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
                      {exp.imageOrder.length}개 이미지
                    </span>
                    {exp.viewTimes ? (
                      <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
                        총 {formatSeconds(totalViewTime(exp))}
                      </span>
                    ) : null}
                    {exp.completed === true && !exp.interviewAnswers && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                        인터뷰 없음
                      </span>
                    )}
                    {exp.completed !== true && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                        {exp.completed === false ? '중단됨' : '시간 기록 없음'}
                      </span>
                    )}
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
                    <span className="text-neutral-400 text-sm">
                      {expandedId === exp.id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {expandedId === exp.id && (
                  <div className="border-t border-neutral-100 px-4 py-3 bg-neutral-50">
                    {exp.demographics && (
                      <div className="mb-4 pb-4 border-b border-neutral-200">
                        <p className="text-xs font-medium text-neutral-500 mb-2">
                          인적사항 · 동의
                        </p>
                        <p className="text-sm text-neutral-700 leading-relaxed">
                          {exp.demographics.gender} · 만 {exp.demographics.age}세 ·{' '}
                          {exp.demographics.jobOther
                            ? `기타(${exp.demographics.jobOther})`
                            : exp.demographics.job}{' '}
                          · 관련 전공·업무 경험 {exp.demographics.experience} · 방문 빈도{' '}
                          {exp.demographics.visitFrequency}
                          {exp.recordingConsent !== undefined &&
                            ` · 인터뷰 녹음 ${exp.recordingConsent ? '동의' : '미동의'}`}
                        </p>
                      </div>
                    )}
                    <p className="text-xs font-medium text-neutral-500 mb-2">
                      표시 순서 (1번부터) · 응답 ({RATING_QUESTIONS.map((q) => q.replace('.', '')).join(' / ')}) ·
                      관람 시간
                    </p>
                    <ol className="flex flex-col gap-1">
                      {exp.imageOrder.map((img, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-sm">
                          <span className="w-6 h-6 flex items-center justify-center bg-neutral-200 text-neutral-600 rounded-full text-xs font-mono flex-shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-mono text-neutral-700 truncate">{img}</span>
                          <span className="ml-auto font-mono text-neutral-800 flex-shrink-0">
                            {exp.ratings?.[img]?.join(' / ') ?? '-'}
                          </span>
                          {exp.viewTimes && (
                            <span className="w-16 text-right font-mono text-neutral-500 flex-shrink-0">
                              {formatSeconds(exp.viewTimes[img] ?? 0)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                    {exp.interviewAnswers && (() => {
                      const { images, allEqual } = describeInterviewImages(exp)
                      const questions = interviewQuestionsFor(exp.interviewAnswers.length, allEqual)
                      return (
                        <div className="mt-5 border-t border-neutral-200 pt-4">
                          <p className="text-xs font-medium text-neutral-500 mb-3">인터뷰</p>
                          {images.length > 0 && (
                            <div className="mb-4 text-sm">
                              <p className="font-medium text-neutral-800 mb-1">
                                1~3번 사진{allEqual ? ' (모든 사진 평균이 같아 높고 낮음 표시 없음)' : ''}
                              </p>
                              <ul className="flex flex-col gap-0.5">
                                {images.map((image) => (
                                  <li key={image.letter} className="flex gap-3 text-neutral-700">
                                    <span className="w-14 font-semibold">사진 {image.letter}</span>
                                    <span className="font-mono truncate">{image.filename}</span>
                                    <span className="ml-auto font-mono flex-shrink-0">
                                      평균 {image.mean?.toFixed(2) ?? '-'}
                                    </span>
                                    <span className="w-10 text-right flex-shrink-0">
                                      {image.group === 'high' ? '높게' : image.group === 'low' ? '낮게' : '-'}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              {exp.interviewPair && (
                                <p className="mt-2 text-neutral-700">
                                  <span className="font-medium text-neutral-800">4번 사진</span> A{' '}
                                  <span className="font-mono">{exp.interviewPair[0]}</span> · B{' '}
                                  <span className="font-mono">{exp.interviewPair[1]}</span>
                                </p>
                              )}
                            </div>
                          )}
                          <dl className="flex flex-col gap-3 text-sm">
                            {questions.map((question, idx) => (
                              <div key={idx}>
                                <dt className="font-medium text-neutral-800">
                                  {idx + 1}. {question}
                                </dt>
                                <dd className="mt-1 text-neutral-600 whitespace-pre-wrap">
                                  {exp.interviewAnswers?.[idx]}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      )
                    })()}
                    <p className="text-xs text-neutral-400 mt-3 font-mono">ID: {exp.id}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 응답 기록과 따로 보여주고, 지급·중복 확인용으로 실험 번호만 붙인다. */}
      <section className="card p-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            답례품 연락처 ({contacts.length}건)
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => downloadCsv('연락처', toCsv(buildContactRows(contacts)))}
              disabled={contacts.length === 0}
              className="btn-secondary text-sm px-3 py-1.5"
            >
              연락처 CSV
            </button>
            <button
              onClick={handleClearContacts}
              disabled={contacts.length === 0}
              className="btn-danger text-sm px-3 py-1.5"
            >
              전체 삭제
            </button>
          </div>
        </div>
        {contacts.length === 0 ? (
          <p className="text-neutral-400 text-sm">아직 저장된 연락처가 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-neutral-700">
            {contacts.map(({ label, contact }, index) => {
              const isDuplicate =
                contacts.filter((other) => contactKey(other.contact) === contactKey(contact)).length > 1
              return (
                <li key={index} className="flex items-center gap-3">
                  <span className="w-20 flex-shrink-0 font-semibold text-neutral-800">
                    {label || '번호 없음'}
                  </span>
                  <span className="break-all">{contact}</span>
                  {isDuplicate && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex-shrink-0">
                      중복
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
