'use client'

import { useState, type FormEvent } from 'react'
import {
  CONSENT_GREETING,
  CONSENT_INTRO,
  CONSENT_SECTIONS,
  CONSENT_TITLE,
  RESEARCH_CONSENT,
} from '@/lib/consent'
import {
  AGE_QUESTION,
  DEMOGRAPHICS_INTRO,
  EXPERIENCE_QUESTION,
  GENDER_QUESTION,
  JOB_QUESTION,
  OTHER_JOB,
  VISIT_QUESTION,
  type Demographics,
} from '@/lib/demographics'

export interface IntakeData {
  contact: string
  demographics: Demographics
}

interface IntakeProps {
  onSubmit: (data: IntakeData) => Promise<boolean>
  onCancel: () => void
}

type Step = 'consent' | 'declined' | 'contact' | 'demographics'

function ChoiceGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-3 text-neutral-800 cursor-pointer">
          <input
            type="radio"
            name={name}
            checked={value === option}
            onChange={() => onChange(option)}
            className="w-4 h-4"
          />
          {option}
        </label>
      ))}
    </div>
  )
}

const question = 'font-semibold text-neutral-900 mb-3'
const textField =
  'border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors'

// 실험 이미지를 보기 전 단계로, 전체 화면을 덮어 상단 탭을 가린다.
export default function Intake({ onSubmit, onCancel }: IntakeProps) {
  const [step, setStep] = useState<Step>('consent')
  const [researchChoice, setResearchChoice] = useState('')
  const [contact, setContact] = useState('')
  const [gender, setGender] = useState('')
  const [age, setAge] = useState('')
  const [job, setJob] = useState('')
  const [jobOther, setJobOther] = useState('')
  const [experience, setExperience] = useState('')
  const [visitFrequency, setVisitFrequency] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitFailed, setSubmitFailed] = useState(false)

  const declined = researchChoice === RESEARCH_CONSENT.decline
  const canLeaveConsent = researchChoice !== ''
  const ageNumber = Number(age)
  const isDemographicsDone =
    gender !== '' &&
    Number.isInteger(ageNumber) &&
    ageNumber >= 1 &&
    ageNumber <= 120 &&
    job !== '' &&
    (job !== OTHER_JOB || jobOther.trim() !== '') &&
    experience !== '' &&
    visitFrequency !== ''

  function handleConsent(e: FormEvent) {
    e.preventDefault()
    if (canLeaveConsent) setStep(declined ? 'declined' : 'contact')
  }

  function handleContact(e: FormEvent) {
    e.preventDefault()
    setStep('demographics')
  }

  async function handleDemographics(e: FormEvent) {
    e.preventDefault()
    if (!isDemographicsDone || isSubmitting) return

    setIsSubmitting(true)
    setSubmitFailed(false)
    const saved = await onSubmit({
      contact: contact.trim(),
      demographics: {
        gender,
        age: ageNumber,
        job,
        jobOther: job === OTHER_JOB ? jobOther.trim() : undefined,
        experience,
        visitFrequency,
      },
    })
    if (saved) return

    setIsSubmitting(false)
    setSubmitFailed(true)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {step === 'consent' && (
          <form onSubmit={handleConsent} className="flex flex-col gap-6">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
              {CONSENT_TITLE}
            </h2>
            <div className="card p-7 flex flex-col gap-6 leading-relaxed text-neutral-700">
              <div className="flex flex-col gap-2">
                <p>{CONSENT_GREETING}</p>
                <p>{CONSENT_INTRO}</p>
              </div>
              {CONSENT_SECTIONS.map((section) => (
                <section key={section.title} className="flex flex-col gap-2">
                  <h3 className="font-semibold text-neutral-900">{section.title}</h3>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </section>
              ))}
            </div>

            <fieldset className="card p-7">
              <legend className="sr-only">{RESEARCH_CONSENT.title}</legend>
              <h3 className={question}>{RESEARCH_CONSENT.title}</h3>
              <p className="leading-relaxed text-neutral-700 mb-4">{RESEARCH_CONSENT.statement}</p>
              <ChoiceGroup
                name="research"
                options={[RESEARCH_CONSENT.agree, RESEARCH_CONSENT.decline]}
                value={researchChoice}
                onChange={setResearchChoice}
              />
            </fieldset>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={onCancel} className="btn-secondary px-6 py-3">
                취소
              </button>
              <button
                type="submit"
                disabled={!canLeaveConsent}
                className="btn-primary px-10 py-3 font-semibold"
              >
                다음
              </button>
            </div>
          </form>
        )}

        {step === 'declined' && (
          <div className="flex flex-col items-center gap-6 py-20 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
              연구 참여에 동의하지 않으셨습니다
            </h2>
            <p className="text-neutral-600">
              응답 내용은 저장되지 않았습니다. 시간을 내주셔서 감사합니다.
            </p>
            <button onClick={onCancel} className="btn-secondary px-6 py-3">
              처음으로
            </button>
          </div>
        )}

        {step === 'contact' && (
          <form onSubmit={handleContact} className="flex flex-col gap-6 max-w-lg mx-auto py-16">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
              답례품 받을 연락처
            </h2>
            <div className="card p-7 flex flex-col gap-3">
              <label htmlFor="contact" className="leading-relaxed text-neutral-800">
                답례품을 받을 연락처나 이메일 주소를 적어주세요. (선택사항)
              </label>
              <input
                id="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                maxLength={100}
                autoFocus
                autoComplete="off"
                className={`${textField} text-lg`}
              />
              <p className="text-sm leading-relaxed text-neutral-500">
                적지 않아도 넘어갈 수 있습니다. 연락처는 실험을 끝까지 마친 경우에만 저장되며, 실험
                자료와 분리해 보관하고, 지급 목적으로만 사용하며, 지급 완료 3개월 후 파기합니다.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStep('consent')}
                className="btn-secondary px-6 py-3"
              >
                이전
              </button>
              <button type="submit" className="btn-primary px-10 py-3 font-semibold">
                다음
              </button>
            </div>
          </form>
        )}

        {step === 'demographics' && (
          <form onSubmit={handleDemographics} className="flex flex-col gap-6">
            <header>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
                인적사항
              </h2>
              <p className="text-neutral-600 mt-3">{DEMOGRAPHICS_INTRO}</p>
            </header>

            <div className="card p-7 flex flex-col gap-8">
              <fieldset>
                <legend className={question}>1. {GENDER_QUESTION.question}</legend>
                <ChoiceGroup
                  name="gender"
                  options={GENDER_QUESTION.options}
                  value={gender}
                  onChange={setGender}
                />
              </fieldset>

              <div>
                <label htmlFor="age" className={`block ${question}`}>
                  2. {AGE_QUESTION}
                </label>
                <div className="flex items-center gap-2 text-neutral-800">
                  만
                  <input
                    id="age"
                    type="number"
                    min={1}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className={`${textField} w-24`}
                  />
                  세
                </div>
              </div>

              <fieldset>
                <legend className={question}>3. {JOB_QUESTION.question}</legend>
                <ChoiceGroup
                  name="job"
                  options={JOB_QUESTION.options}
                  value={job}
                  onChange={setJob}
                />
                {job === OTHER_JOB && (
                  <input
                    value={jobOther}
                    onChange={(e) => setJobOther(e.target.value)}
                    maxLength={50}
                    aria-label="기타 직업"
                    placeholder="직업을 적어주세요"
                    className={`${textField} w-full mt-3`}
                  />
                )}
              </fieldset>

              <fieldset>
                <legend className={question}>4. {EXPERIENCE_QUESTION.question}</legend>
                <ChoiceGroup
                  name="experience"
                  options={EXPERIENCE_QUESTION.options}
                  value={experience}
                  onChange={setExperience}
                />
              </fieldset>

              <fieldset>
                <legend className={question}>5. {VISIT_QUESTION.question}</legend>
                <ChoiceGroup
                  name="visit"
                  options={VISIT_QUESTION.options}
                  value={visitFrequency}
                  onChange={setVisitFrequency}
                />
              </fieldset>
            </div>

            {submitFailed && (
              <p className="text-red-600">저장하지 못했습니다. 다시 다음을 눌러주세요.</p>
            )}
            <div className="flex items-center justify-end gap-3">
              {!isDemographicsDone && (
                <p className="text-sm text-neutral-500">모든 문항에 응답하면 넘어갈 수 있습니다.</p>
              )}
              <button
                type="button"
                onClick={() => setStep('contact')}
                className="btn-secondary px-6 py-3"
              >
                이전
              </button>
              <button
                type="submit"
                disabled={!isDemographicsDone || isSubmitting}
                className="btn-primary px-10 py-3 font-semibold"
              >
                {isSubmitting ? '저장 중...' : '다음'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
