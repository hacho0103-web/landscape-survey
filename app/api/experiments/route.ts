import { randomUUID } from 'crypto'
import { NextRequest } from 'next/server'
import { requireResearcher } from '@/lib/auth'
import { parseDemographics } from '@/lib/demographics'
import { readExperiments, updateExperiments, type Experiment } from '@/lib/experiments'

export async function GET() {
  const denied = await requireResearcher()
  if (denied) return denied

  return Response.json(await readExperiments())
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageOrder, participantId, researchConsent, recordingConsent } = body as {
      imageOrder: string[]
      participantId: unknown
      researchConsent: unknown
      recordingConsent: unknown
    }
    const demographics = parseDemographics(body.demographics)
    const label = typeof participantId === 'string' ? participantId.trim() : ''

    if (!Array.isArray(imageOrder) || imageOrder.length === 0) {
      return Response.json({ error: '이미지 순서가 없습니다.' }, { status: 400 })
    }
    if (!label || label.length > 30) {
      return Response.json({ error: '실험자 고유 번호가 없습니다.' }, { status: 400 })
    }
    if (researchConsent !== true || typeof recordingConsent !== 'boolean') {
      return Response.json({ error: '동의 정보가 없습니다.' }, { status: 400 })
    }
    if (!demographics) {
      return Response.json({ error: '인적사항이 올바르지 않습니다.' }, { status: 400 })
    }

    const newExp: Experiment = {
      id: `exp_${Date.now()}_${randomUUID().slice(0, 8)}`,
      label,
      date: new Date().toISOString(),
      imageOrder,
      recordingConsent,
      demographics,
    }

    return await updateExperiments((experiments) => {
      // 다른 사람의 결과와 섞이지 않게 완료된 번호는 막고, 중단한 번호는 다시 쓸 수 있게 둔다.
      if (experiments.some((e) => e.label === label && e.completed === true)) {
        return Response.json({ error: '이미 완료된 번호입니다.' }, { status: 409 })
      }
      experiments.push(newExp)
      return Response.json(newExp)
    })
  } catch (e) {
    console.error(e)
    return Response.json({ error: '저장 실패' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireResearcher()
  if (denied) return denied

  try {
    const body = await req.json().catch(() => null)
    const ids = body?.ids
    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: '삭제할 기록이 없습니다.' }, { status: 400 })
    }

    const targets = new Set(ids)
    const deleted = await updateExperiments((experiments) => {
      const total = experiments.length
      experiments.splice(0, total, ...experiments.filter((e) => !targets.has(e.id)))
      return total - experiments.length
    })

    return Response.json({ deleted })
  } catch (e) {
    console.error(e)
    return Response.json({ error: '삭제 실패' }, { status: 500 })
  }
}
