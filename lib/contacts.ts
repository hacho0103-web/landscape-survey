import type { ContactEntry } from './contact-entry'
import { enqueueWrite, readDataFile, writeDataFile } from './experiments'

const CONTACTS_FILE = 'contacts.json'

// 응답·인터뷰 자료와는 다른 파일에 보관하고, 답례품 지급과 중복 확인을 위해 실험 번호만 함께 남긴다.
export async function readContacts(): Promise<ContactEntry[]> {
  const stored = (await readDataFile<(string | ContactEntry)[]>(CONTACTS_FILE)) ?? []
  return stored.map((item) => (typeof item === 'string' ? { label: '', contact: item } : item))
}

export function addContact(entry: ContactEntry) {
  return enqueueWrite(async () => {
    const contacts = (await readDataFile<(string | ContactEntry)[]>(CONTACTS_FILE)) ?? []
    contacts.push(entry)
    await writeDataFile(CONTACTS_FILE, contacts)
  })
}

export function clearContacts() {
  return enqueueWrite(() => writeDataFile(CONTACTS_FILE, []))
}
