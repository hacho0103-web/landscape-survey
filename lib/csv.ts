import type { Experiment } from './experiments'
import { INTERVIEW_QUESTIONS } from './interview'

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

export function buildInterviewRows(experiments: Experiment[]): Cell[][] {
  const rows: Cell[][] = [['실험번호', ...INTERVIEW_QUESTIONS]]
  for (const exp of experiments) {
    if (exp.interviewAnswers) rows.push([exp.label, ...exp.interviewAnswers])
  }
  return rows
}

export function buildContactRows(contacts: string[]): Cell[][] {
  return [['연락처'], ...contacts.map((contact) => [contact])]
}
