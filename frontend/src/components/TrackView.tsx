import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { generateQuestion } from '../api/questions'
import { useLearningStore } from '../store/useCounterStore'
import type { Language } from '../types/backend'

type TrackViewProps = {
  language: Language
}

const TOTAL_STEPS = 3

export function TrackView({ language }: TrackViewProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})

  const submitAnswer = useLearningStore((state) => state.submitAnswer)
  const attemptedQuestions = useLearningStore((state) => state.attemptedQuestions)
  const correctQuestions = useLearningStore((state) => state.correctQuestions)

  const questionKey = `${language}:step-${currentStep}`
  const previousStepKey = `${language}:step-${currentStep - 1}`
  const previousAnswerCorrect = currentStep === 1 ? false : (correctQuestions[previousStepKey] ?? false)
  const trackLabel = language === 'cpp' ? 'C++ Fundamentals' : 'Python Fundamentals'

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['generated-question', language, currentStep, previousAnswerCorrect],
    queryFn: () =>
      generateQuestion({
        language,
        step_number: currentStep,
        previous_answer_correct: previousAnswerCorrect,
      }),
    refetchOnWindowFocus: false,
  })

  const isAttempted = attemptedQuestions[questionKey] ?? false
  const wasCorrect = correctQuestions[questionKey] ?? false
  const selectedAnswer = selectedAnswers[currentStep]

  const solvedCount = useMemo(() => {
    let count = 0
    for (let step = 1; step <= TOTAL_STEPS; step += 1) {
      if (correctQuestions[`${language}:step-${step}`]) {
        count += 1
      }
    }
    return count
  }, [correctQuestions, language])

  const progressPercent = Math.round((currentStep / TOTAL_STEPS) * 100)
  const question = data?.question

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">{trackLabel}</h2>
        <p className="text-sm text-slate-300">Auto-generated beginner questions with boilerplate.</p>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
          <span>
            Step {currentStep}/{TOTAL_STEPS}
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800">
          <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <article className="mt-6 space-y-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
        {isLoading && <p className="text-slate-300">Generating question...</p>}

        {isError && (
          <div className="space-y-3">
            <p className="text-rose-300">
              Failed to load question: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <button
              onClick={() => refetch()}
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium hover:bg-sky-500"
            >
              Retry
            </button>
          </div>
        )}

        {question && (
          <>
            <div>
              <h3 className="text-xl font-semibold">Step {currentStep}</h3>
              <p className="mt-2 text-sm text-slate-300">{question.explanation}</p>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Boilerplate</p>
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-sky-200">
                <code>{question.boilerplate_code}</code>
              </pre>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
              <p className="font-medium">{question.prompt}</p>
              <div className="mt-3 grid gap-2">
                {question.options.map((option, index) => (
                  <button
                    key={option}
                    onClick={() =>
                      setSelectedAnswers((prev) => ({
                        ...prev,
                        [currentStep]: index,
                      }))
                    }
                    disabled={isAttempted}
                    className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                      selectedAnswer === index
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-100'
                        : 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                    } disabled:cursor-not-allowed disabled:opacity-80`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() =>
                    submitAnswer(questionKey, selectedAnswer === question.answer_index, question.points)
                  }
                  disabled={selectedAnswer === undefined || isAttempted}
                  className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Check Answer
                </button>
                {isAttempted && (
                  <p className={`text-sm ${wasCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {wasCorrect
                      ? `Correct! +${question.points} points.`
                      : `Not correct. Correct answer: ${question.options[question.answer_index]}`}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </article>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm text-slate-300">
          Solved in this path: {solvedCount}/{TOTAL_STEPS}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
            disabled={currentStep === 1}
            className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS))}
            disabled={currentStep === TOTAL_STEPS}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  )
}
