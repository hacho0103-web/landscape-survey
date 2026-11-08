import type { Experiment } from './experiments'
import {
  COMPARISON_PAIR,
  INTERVIEW_QUESTIONS,
  LEGACY_INTERVIEW_QUESTIONS,
  PHOTO_LETTERS,
  describeInterviewImages,
} from './interview'

type Cell = string | number | undefined

function escapeCell(cell: Cell) {
  if (typeof cell === 'number') return String(cell)
  let text = (cell ?? '').normalize('NFC')
  // 참가자가 쓴 글이 엑셀에서 수식으로 실행되지 않게 한다.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// 엑셀이 한글을 UTF-8로 읽도록 BOM을 붙인다.
export function toCsv(rows: Cell[][]) {
  return '﻿' + rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')
}

function formatStatus(exp: Experiment) {
  if (exp.completed === true) return '완료'
  return exp.completed === false ? '중단' : '미완료'
}

export function buildResponseRows(experiments: Experiment[]): Cell[][] {
  const rows: Cell[][] = [
    [
      '실험번호',
      '실험일시',
      '상태',
      '녹음동의',
      '성별',
      '연령',
      '직업',
      '직업_기타',
      '관련경험',
      '방문빈도',
      '표시순서',
      '이미지',
      '걷고싶다',
      '편안하다',
      '보기좋다',
      '관람시간_초',
    ],
  ]

  for (const exp of experiments) {
    exp.imageOrder.forEach((image, index) => {
      const rating = exp.ratings?.[image]
      const viewTime = exp.viewTimes?.[image]
      rows.push([
        exp.label,
        exp.date,
        formatStatus(exp),
        exp.recordingConsent === undefined ? '' : exp.recordingConsent ? '동의' : '미동의',
        exp.demographics?.gender,
        exp.demographics?.age,
        exp.demographics?.job,
        exp.demographics?.jobOther,
        exp.demographics?.experience,
        exp.demographics?.visitFrequency,
        index + 1,
        image,
        rating?.[0],
        rating?.[1],
        rating?.[2],
        viewTime === undefined ? undefined : viewTime / 1000,
      ])
    })
  }
  return rows
}

const GROUP_TEXT = { high: '높게', low: '낮게' } as const

function roundMean(mean: number | undefined) {
  return mean === undefined ? undefined : Math.round(mean * 100) / 100
}

// 답변과 함께 참가자가 본 사진 A~F(파일명·평균·높음/낮음)와 4번 비교 사진을 남긴다.
export function buildInterviewRows(experiments: Experiment[]): Cell[][] {
  const photoColumns = PHOTO_LETTERS.flatMap((letter) => [
    `사진${letter}`,
    `사진${letter}_평균`,
    `사진${letter}_평가`,
  ])
  const rows: Cell[][] = [
    [
      '실험번호',
      ...INTERVIEW_QUESTIONS,
      '3번_모두같은점수',
      ...photoColumns,
      '4번_사진A',
      '4번_사진B',
      '이전형식_답변',
    ],
  ]
  for (const exp of experiments) {
    if (!exp.interviewAnswers) continue
    if (exp.interviewAnswers.length === LEGACY_INTERVIEW_QUESTIONS.length) {
      const legacy = exp.interviewAnswers
        .map((answer, i) => `${i + 1}. ${LEGACY_INTERVIEW_QUESTIONS[i]}\n${answer}`)
        .join('\n\n')
      rows.push([exp.label, ...INTERVIEW_QUESTIONS.map(() => ''), '', ...photoColumns.map(() => ''), '', '', legacy])
      continue
    }
    const { images, allEqual } = describeInterviewImages(exp)
    const photoCells = PHOTO_LETTERS.flatMap((_, i) => {
      const image = images[i]
      return [image?.filename, roundMean(image?.mean), image?.group && GROUP_TEXT[image.group]]
    })
    const pair = exp.interviewPair ?? []
    rows.push([
      exp.label,
      ...exp.interviewAnswers,
      allEqual ? '예' : '아니오',
      ...photoCells,
      pair[0] ?? COMPARISON_PAIR[0],
      pair[1] ?? COMPARISON_PAIR[1],
      '',
    ])
  }
  return rows
}

export function buildContactRows(contacts: string[]): Cell[][] {
  return [['연락처'], ...contacts.map((contact) => [contact])]
}
