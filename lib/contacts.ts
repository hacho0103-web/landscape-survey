import { enqueueWrite, readDataFile, writeDataFile } from './experiments'

const CONTACTS_FILE = 'contacts.json'

export async function readContacts(): Promise<string[]> {
  return (await readDataFile<string[]>(CONTACTS_FILE)) ?? []
}

// 동의서대로 실험 자료와 분리해서 보관한다. 기록 ID나 시각을 함께 남기지 않고,
// 저장 순서로 참가자를 짐작할 수 없게 임의의 위치에 넣는다.
export function addContact(contact: string) {
  return enqueueWrite(async () => {
    const contacts = (await readDataFile<string[]>(CONTACTS_FILE)) ?? []
    contacts.splice(Math.floor(Math.random() * (contacts.length + 1)), 0, contact)
    await writeDataFile(CONTACTS_FILE, contacts)
  })
}

export function clearContacts() {
  return enqueueWrite(() => writeDataFile(CONTACTS_FILE, []))
}
