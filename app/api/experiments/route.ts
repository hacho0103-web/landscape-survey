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
    const { imageOrder, researchConsent } = body as {
      imageOrder: string[]
      researchConsent: unknown
    }
    const demographics = parseDemographics(body.demographics)

    if (!Array.isArray(imageOrder) || imageOrder.length === 0) {
      return Response.json({ error: '이미지 순서가 없습니다.' }, { status: 400 })
    }
    if (researchConsent !== true) {
      return Response.json({ error: '동의 정보가 없습니다.' }, { status: 400 })
    }
    if (!demographics) {
      return Response.json({ error: '인적사항이 올바르지 않습니다.' }, { status: 400 })
    }

    const id = `exp_${Date.now()}_${randomUUID().slice(0, 8)}`
    const date = new Date().toISOString()

    const newExp = await updateExperiments((experiments) => {
      // 일부 기록을 지워도 번호가 겹치지 않도록 남은 기록의 최대 번호 다음을 쓴다.
      const numbers = experiments.map((e) => Number(/^실험 (\d+)$/.exec(e.label)?.[1] ?? 0))
      const experiment: Experiment = {
        id,
        label: `실험 ${Math.max(0, ...numbers) + 1}`,
        date,
        imageOrder,
        demographics,
      }
      experiments.push(experiment)
      return experiment
    })

    return Response.json(newExp)
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
