// 브라우저와 서버가 함께 쓰는 연락처 형식. 파일 저장 코드(contacts.ts)와 분리해 둔다.
export interface ContactEntry {
  label: string // 실험 번호. 예전에 번호 없이 저장된 연락처는 빈 문자열
  contact: string
}

// 같은 사람이 여러 번 참여했는지 보려고 공백·하이픈·괄호·대소문자를 무시하고 비교한다.
export function contactKey(contact: string) {
  return contact.normalize('NFC').toLowerCase().replace(/[\s\-().]/g, '')
}
