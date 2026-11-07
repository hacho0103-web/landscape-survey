import { NextRequest } from 'next/server'
import { requireResearcher } from '@/lib/auth'
import { addContact, clearContacts, readContacts } from '@/lib/contacts'
import { readExperiments, updateExperiments } from '@/lib/experiments'

const MAX_CONTACT_LENGTH = 100

export async function GET() {
  const denied = await requireResearcher()
  if (denied) return denied

  return Response.json({ contacts: await readContacts() })
}

// 참가자가 호출하므로 인증 대신 실험을 완료한 기록당 한 번만 받는다.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const experimentId = body?.experimentId
    const contact = typeof body?.contact === 'string' ? body.contact.trim() : ''
    if (!contact || contact.length > MAX_CONTACT_LENGTH) {
      return Response.json({ error: '연락처를 확인해주세요.' }, { status: 400 })
    }

    const experiments = await readExperiments()
    const exp = experiments.find((e) => e.id === experimentId)
    if (!exp || exp.completed !== true) {
      return Response.json({ error: '완료된 실험이 아닙니다.' }, { status: 403 })
    }
    if (exp.contactSaved) {
      return Response.json({ error: '이미 저장되었습니다.' }, { status: 409 })
    }

    await addContact(contact)
    await updateExperiments((list) => {
      const target = list.find((e) => e.id === experimentId)
      if (target) target.contactSaved = true
    })
    return Response.json({ saved: true })
  } catch (e) {
    console.error(e)
    return Response.json({ error: '저장 실패' }, { status: 500 })
  }
}

export async function DELETE() {
  const denied = await requireResearcher()
  if (denied) return denied

  await clearContacts()
  return Response.json({ deleted: true })
}
