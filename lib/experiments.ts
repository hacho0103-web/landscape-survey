import { mkdir, readFile, rename, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import type { Demographics } from './demographics'

const DATA_DIR = path.join(process.cwd(), 'public', 'uploads', '_data')
const EXPERIMENTS_FILE = 'experiments.json'

export interface Experiment {
  id: string
  label: string
  date: string
  imageOrder: string[]
  recordingConsent?: boolean // 녹음 동의 문항을 없애기 전 기록에만 있다.
  demographics?: Demographics
  viewTimes?: Record<string, number> // 이미지별 누적 관람 시간(ms)
  ratings?: Record<string, number[]> // 이미지별 응답, RATING_QUESTIONS와 같은 순서
  completed?: boolean // false면 중단한 실험
  interviewAnswers?: string[] // INTERVIEW_QUESTIONS와 같은 순서
  interviewImages?: string[] // 인터뷰 1~3번에 보여준 사진, 사진 A부터 F 순서
  interviewPair?: string[] // 인터뷰 4번에 보여준 사진 A, B
  contactSaved?: boolean // 연락처 자체는 이 기록과 연결하지 않고 따로 보관한다.
}

async function load(): Promise<Experiment[]> {
  return (await readDataFile<Experiment[]>(EXPERIMENTS_FILE)) ?? []
}

export async function readDataFile<T>(name: string): Promise<T | null> {
  const file = path.join(DATA_DIR, name)
  if (!existsSync(file)) return null
  return JSON.parse(await readFile(file, 'utf-8'))
}

export async function writeDataFile(name: string, data: unknown) {
  const file = path.join(DATA_DIR, name)
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(`${file}.tmp`, JSON.stringify(data, null, 2), 'utf-8')
  await rename(`${file}.tmp`, file)
}

export async function readExperiments(): Promise<Experiment[]> {
  try {
    return await load()
  } catch {
    return []
  }
}

// 응답이 수시로 저장되므로 쓰기를 한 줄로 세워 동시 요청이 서로를 덮어쓰지 않게 한다.
let queue: Promise<unknown> = Promise.resolve()

export function enqueueWrite<T>(write: () => Promise<T>): Promise<T> {
  const task = queue.then(write)
  queue = task.catch(() => {})
  return task
}

export function updateExperiments<T>(update: (experiments: Experiment[]) => T): Promise<T> {
  return enqueueWrite(async () => {
    // 파일을 읽지 못하면 예외를 그대로 올려 기존 기록을 빈 목록으로 덮어쓰지 않는다.
    const experiments = await load()
    const before = JSON.stringify(experiments)
    const result = update(experiments)
    if (JSON.stringify(experiments) !== before) {
      await writeDataFile(EXPERIMENTS_FILE, experiments)
    }
    return result
  })
}
