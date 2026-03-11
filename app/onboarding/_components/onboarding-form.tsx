'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { completeOnboarding, type OnboardingData } from '../actions'
import StepBasic from './step-basic'
import StepRole from './step-role'
import StepCreator from './step-creator'
import StepClient from './step-client'
import StepComplete from './step-complete'

const initialData: OnboardingData = {
  username: '',
  isAgeVerified: false,
  isHumanVerified: false,
  userType: 'client',
  creatorBio: '',
  creatorStatus: '停止中',
  callOk: '不可',
  clientBio: '',
}

type Step = 'basic' | 'role' | 'creator' | 'client' | 'complete'

function getSteps(userType: OnboardingData['userType']): Step[] {
  switch (userType) {
    case 'creator':
      return ['basic', 'role', 'creator', 'complete']
    case 'client':
      return ['basic', 'role', 'client', 'complete']
    case 'both':
      return ['basic', 'role', 'creator', 'client', 'complete']
  }
}

export default function OnboardingForm() {
  const router = useRouter()
  const [data, setData] = useState<OnboardingData>(initialData)
  const [currentStep, setCurrentStep] = useState<Step>('basic')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const steps = getSteps(data.userType)
  const stepIndex = steps.indexOf(currentStep)
  const progressPercent = ((stepIndex + 1) / steps.length) * 100

  const onChange = (partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }))
    setError('')
  }

  const goNext = () => {
    const nextIndex = stepIndex + 1
    if (nextIndex < steps.length) {
      const nextStep = steps[nextIndex]
      // complete ステップの前にデータ保存
      if (nextStep === 'complete') {
        startTransition(async () => {
          const result = await completeOnboarding(data)
          if ('error' in result) {
            setError(result.error)
          } else {
            setCurrentStep('complete')
          }
        })
        return
      }
      setCurrentStep(nextStep)
    }
  }

  const goBack = () => {
    const prevIndex = stepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex])
    }
  }

  return (
    <div className="w-full max-w-md space-y-6 px-4">
      {/* プログレスバー */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>ステップ {stepIndex + 1} / {steps.length}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ステップ表示 */}
      {currentStep === 'basic' && (
        <StepBasic data={data} onChange={onChange} onNext={goNext} />
      )}
      {currentStep === 'role' && (
        <StepRole data={data} onChange={onChange} onNext={goNext} onBack={goBack} />
      )}
      {currentStep === 'creator' && (
        <StepCreator data={data} onChange={onChange} onNext={goNext} onBack={goBack} />
      )}
      {currentStep === 'client' && (
        <StepClient data={data} onChange={onChange} onNext={goNext} onBack={goBack} />
      )}
      {currentStep === 'complete' && (
        <StepComplete data={data} />
      )}

      {/* ローディング */}
      {isPending && (
        <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          保存中...
        </div>
      )}
    </div>
  )
}
