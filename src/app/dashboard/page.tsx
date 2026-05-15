'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

type WorkoutDay = 'Push' | 'Pull' | 'Legs' | 'Custom'

type Exercise = {
  id: string
  name: string
  targetSets: number
  targetReps: number
  defaultWeight: number
}

type WorkoutTemplate = {
  day: WorkoutDay
  exercises: Exercise[]
}

type WorkoutRow = {
  id?: string
  day?: string
  created_at?: string
}

const defaultTemplates: WorkoutTemplate[] = [
  {
    day: 'Push',
    exercises: [
      { id: 'bench_press', name: 'Bench Press', targetSets: 3, targetReps: 6, defaultWeight: 235 },
      { id: 'incline_db_press', name: 'Incline DB Press', targetSets: 3, targetReps: 8, defaultWeight: 85 },
      { id: 'lateral_raise', name: 'Lateral Raise', targetSets: 3, targetReps: 15, defaultWeight: 25 },
    ],
  },
  {
    day: 'Pull',
    exercises: [
      { id: 'barbell_row', name: 'Barbell Row', targetSets: 3, targetReps: 8, defaultWeight: 185 },
      { id: 'lat_pulldown', name: 'Lat Pulldown', targetSets: 3, targetReps: 10, defaultWeight: 160 },
      { id: 'db_curl', name: 'DB Curl', targetSets: 3, targetReps: 12, defaultWeight: 40 },
    ],
  },
  {
    day: 'Legs',
    exercises: [
      { id: 'back_squat', name: 'Back Squat', targetSets: 3, targetReps: 5, defaultWeight: 295 },
      { id: 'rdl', name: 'Romanian Deadlift', targetSets: 3, targetReps: 8, defaultWeight: 225 },
      { id: 'leg_press', name: 'Leg Press', targetSets: 3, targetReps: 12, defaultWeight: 450 },
    ],
  },
  {
    day: 'Custom',
    exercises: [{ id: 'custom_1', name: 'Custom Exercise', targetSets: 3, targetReps: 8, defaultWeight: 135 }],
  },
]

const nextDayMap: Record<'Push' | 'Pull' | 'Legs', 'Push' | 'Pull' | 'Legs'> = {
  Push: 'Pull',
  Pull: 'Legs',
  Legs: 'Push',
}

const STORAGE_KEY = 'training-app-custom-templates-v1'

function asNumber(value: string, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isSavingSet, setIsSavingSet] = useState(false)
  const [isFinishingWorkout, setIsFinishingWorkout] = useState(false)
  const [isSavingBodyweight, setIsSavingBodyweight] = useState(false)

  const [templates, setTemplates] = useState<WorkoutTemplate[]>(defaultTemplates)
  const [currentDay, setCurrentDay] = useState<WorkoutDay>('Push')
  const [selectedExerciseId, setSelectedExerciseId] = useState(defaultTemplates[0].exercises[0].id)
  const [workoutId, setWorkoutId] = useState<string | null>(null)

  const [setNumberInput, setSetNumberInput] = useState('1')
  const [repInput, setRepInput] = useState('6')
  const [weightInput, setWeightInput] = useState('235')
  const [bodyweightInput, setBodyweightInput] = useState('176')

  const currentTemplate = useMemo(
    () => templates.find((template) => template.day === currentDay) ?? templates[0],
    [templates, currentDay],
  )

  const selectedExercise = useMemo(
    () =>
      currentTemplate.exercises.find((exercise) => exercise.id === selectedExerciseId) ??
      currentTemplate.exercises[0],
    [currentTemplate, selectedExerciseId],
  )

  const loggedSetsCount = Math.max(Number(setNumberInput) - 1, 0)
  const workoutComplete = loggedSetsCount >= selectedExercise.targetSets

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as WorkoutTemplate[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        setTemplates(parsed)
      }
    } catch {
      setStatusMessage('Could not load saved workout templates.')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  }, [templates])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: { email?: string } | null } }) => {
      setUserEmail(data.user?.email ?? null)
    })
  }, [])

  useEffect(() => {
    const hydrateNextWorkoutDay = async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('id, day, created_at')
        .order('created_at', { ascending: false })

      if (error || !Array.isArray(data) || data.length === 0) {
        return
      }

      const latestWorkout = (data[0] as WorkoutRow | undefined) ?? undefined
      const latestDay = latestWorkout?.day

      if (latestDay === 'Push' || latestDay === 'Pull' || latestDay === 'Legs') {
        const inferredDay = nextDayMap[latestDay]
        setCurrentDay(inferredDay)
      }
    }

    hydrateNextWorkoutDay()
  }, [])

  useEffect(() => {
    const activeTemplate = templates.find((template) => template.day === currentDay) ?? templates[0]
    const firstExercise = activeTemplate.exercises[0]
    if (!firstExercise) return
    setSelectedExerciseId(firstExercise.id)
    setRepInput(String(firstExercise.targetReps))
    setWeightInput(String(firstExercise.defaultWeight))
    setSetNumberInput('1')
  }, [currentDay, templates])

  const signOut = async () => {
    const client = supabase as {
      auth: {
        signOut?: () => Promise<{ error: { message?: string } | null }>
      }
    }

    if (!client.auth.signOut) {
      setAuthMessage('Sign out is unavailable.')
      return
    }

    const { error } = await client.auth.signOut()
    if (error) {
      setAuthMessage(error.message || 'Unable to sign out right now.')
      return
    }

    setUserEmail(null)
    setAuthMessage('Signed out.')
  }

  const updateExercise = (exerciseId: string, field: keyof Exercise, value: string) => {
    setTemplates((current) =>
      current.map((template) =>
        template.day !== currentDay
          ? template
          : {
              ...template,
              exercises: template.exercises.map((exercise) =>
                exercise.id !== exerciseId
                  ? exercise
                  : {
                      ...exercise,
                      [field]:
                        field === 'name'
                          ? value
                          : asNumber(value, exercise[field] as number),
                    },
              ),
            },
      ),
    )
  }

  const addExercise = () => {
    setTemplates((current) =>
      current.map((template) =>
        template.day !== currentDay
          ? template
          : {
              ...template,
              exercises: [
                ...template.exercises,
                {
                  id: `custom_${Date.now()}`,
                  name: 'New Exercise',
                  targetSets: 3,
                  targetReps: 8,
                  defaultWeight: 135,
                },
              ],
            },
      ),
    )
  }

  const removeExercise = (exerciseId: string) => {
    setTemplates((current) =>
      current.map((template) => {
        if (template.day !== currentDay) return template
        const filtered = template.exercises.filter((exercise) => exercise.id !== exerciseId)
        return { ...template, exercises: filtered.length > 0 ? filtered : template.exercises }
      }),
    )
  }

  const ensureWorkout = async () => {
    if (workoutId) return workoutId

    const payload = {
      day: currentDay,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('workouts').insert(payload)
    if (error) {
      setStatusMessage(error.message || 'Could not start workout.')
      return null
    }

    const { data: refreshedData } = await supabase
      .from('workouts')
      .select('id, day, created_at')
      .order('created_at', { ascending: false })

    const latest = (Array.isArray(refreshedData) ? (refreshedData[0] as WorkoutRow | undefined) : undefined) ?? undefined
    if (!latest?.id) {
      setStatusMessage('Workout started, but ID was not returned.')
      return null
    }

    setWorkoutId(latest.id)
    return latest.id
  }

  const logSet = async () => {
    setStatusMessage('')
    setIsSavingSet(true)

    const ensuredWorkoutId = await ensureWorkout()
    if (!ensuredWorkoutId) {
      setIsSavingSet(false)
      return
    }

    const setNumber = Number(setNumberInput || '0')
    const reps = Number(repInput || '0')
    const weight = Number(weightInput || '0')

    const { error } = await supabase.from('sets').insert({
      workout_id: ensuredWorkoutId,
      day: currentDay,
      exercise_id: selectedExercise.id,
      exercise_name: selectedExercise.name,
      set_number: setNumber,
      reps,
      weight,
      created_at: new Date().toISOString(),
    })

    if (error) {
      setStatusMessage(error.message || 'Unable to log set right now.')
      setIsSavingSet(false)
      return
    }

    setSetNumberInput(String(setNumber + 1))
    setStatusMessage(`Logged set ${setNumber}.`)
    setIsSavingSet(false)
  }

  const finishWorkout = async () => {
    setStatusMessage('')
    setIsFinishingWorkout(true)

    const ensuredWorkoutId = await ensureWorkout()
    if (!ensuredWorkoutId) {
      setIsFinishingWorkout(false)
      return
    }

    const { error } = await supabase
      .from('workouts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        finished_sets: Math.max(Number(setNumberInput) - 1, 0),
      })
      .eq('id', ensuredWorkoutId)

    if (error) {
      setStatusMessage(error.message || 'Unable to finish workout right now.')
      setIsFinishingWorkout(false)
      return
    }

    setWorkoutId(null)
    setSetNumberInput('1')
    setStatusMessage('Workout finished.')
    setIsFinishingWorkout(false)
  }

  const saveBodyweight = async () => {
    setStatusMessage('')
    setIsSavingBodyweight(true)

    const weight = Number(bodyweightInput || '0')
    const { error } = await supabase.from('bodyweight_logs').insert({
      weight,
      created_at: new Date().toISOString(),
    })

    if (error) {
      setStatusMessage(error.message || 'Unable to save bodyweight right now.')
      setIsSavingBodyweight(false)
      return
    }

    setStatusMessage(`Bodyweight logged: ${weight} lb`)
    setIsSavingBodyweight(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-black md:text-4xl text-slate-50">Workout Dashboard</h1>
          <div className="flex items-center gap-2">
            {userEmail ? <span className="text-xs text-emerald-300 md:text-sm">Signed in: {userEmail}</span> : null}
            <Link href="/progress">
              <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">Progress</Button>
            </Link>
            <Link href="/">
              <Button className="border border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800">Home</Button>
            </Link>
            {userEmail ? (
              <Button onClick={signOut} className="border border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800">
                Sign Out
              </Button>
            ) : null}
          </div>
        </div>

        {authMessage ? <p className="text-sm text-slate-100">{authMessage}</p> : null}
        {statusMessage ? <p className="text-sm text-cyan-200">{statusMessage}</p> : null}

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5 md:p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">Bodyweight</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row">
            <Input
              value={bodyweightInput}
              onChange={(event) => setBodyweightInput(event.target.value)}
              inputMode="decimal"
              type="number"
              step="0.1"
              placeholder="176.0"
              className="border-slate-600 bg-slate-950 text-slate-50 placeholder:text-slate-400"
            />
            <Button
              onClick={saveBodyweight}
              disabled={isSavingBodyweight}
              className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            >
              {isSavingBodyweight ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5 md:p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">Day</p>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            {(['Push', 'Pull', 'Legs', 'Custom'] as WorkoutDay[]).map((day) => (
              <Button
                key={day}
                onClick={() => setCurrentDay(day)}
                className={
                  currentDay === day
                    ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                    : 'border border-slate-600 bg-slate-950 text-slate-100 hover:bg-slate-800'
                }
              >
                {day}
              </Button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5 md:p-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">Exercises</p>
            <Button onClick={addExercise} className="bg-violet-500 text-slate-50 hover:bg-violet-400">
              Add Exercise
            </Button>
          </div>
          <div className="space-y-3">
            {currentTemplate.exercises.map((exercise) => (
              <div key={exercise.id} className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                <div className="grid gap-3 md:grid-cols-5">
                  <Input
                    value={exercise.name}
                    onChange={(event) => updateExercise(exercise.id, 'name', event.target.value)}
                    className="border-slate-600 bg-slate-900 text-slate-50 placeholder:text-slate-400 md:col-span-2"
                  />
                  <Input
                    value={String(exercise.targetSets)}
                    onChange={(event) => updateExercise(exercise.id, 'targetSets', event.target.value)}
                    inputMode="decimal"
                    type="number"
                    className="border-slate-600 bg-slate-900 text-slate-50 placeholder:text-slate-400"
                  />
                  <Input
                    value={String(exercise.targetReps)}
                    onChange={(event) => updateExercise(exercise.id, 'targetReps', event.target.value)}
                    inputMode="decimal"
                    type="number"
                    className="border-slate-600 bg-slate-900 text-slate-50 placeholder:text-slate-400"
                  />
                  <Input
                    value={String(exercise.defaultWeight)}
                    onChange={(event) => updateExercise(exercise.id, 'defaultWeight', event.target.value)}
                    inputMode="decimal"
                    type="number"
                    className="border-slate-600 bg-slate-900 text-slate-50 placeholder:text-slate-400"
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedExerciseId(exercise.id)
                      setRepInput(String(exercise.targetReps))
                      setWeightInput(String(exercise.defaultWeight))
                    }}
                    className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  >
                    Select
                  </Button>
                  <Button
                    onClick={() => removeExercise(exercise.id)}
                    className="border border-rose-400/60 bg-rose-500/20 text-rose-100 hover:bg-rose-500/30"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-600 bg-slate-900 p-5 md:p-6">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-100">Set Logging</p>
          <p className="mt-2 text-base text-slate-50">
            Exercise: <span className="font-extrabold text-white">{selectedExercise.name}</span>
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-200">Set #</label>
              <Input
                value={setNumberInput}
                onChange={(event) => setSetNumberInput(event.target.value)}
                inputMode="decimal"
                type="number"
                step="1"
                min="1"
                className="border-slate-500 bg-slate-800 text-white placeholder:text-slate-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-200">Reps</label>
              <Input
                value={repInput}
                onChange={(event) => setRepInput(event.target.value)}
                inputMode="decimal"
                type="number"
                step="1"
                min="0"
                className="border-slate-500 bg-slate-800 text-white placeholder:text-slate-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-200">Weight (lb)</label>
              <Input
                value={weightInput}
                onChange={(event) => setWeightInput(event.target.value)}
                inputMode="decimal"
                type="number"
                step="0.5"
                min="0"
                className="border-slate-500 bg-slate-800 text-white placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 md:flex-row">
            <Button
              onClick={logSet}
              disabled={isSavingSet}
              className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            >
              {isSavingSet ? 'Logging...' : 'Log Set'}
            </Button>
            <Button
              onClick={finishWorkout}
              disabled={isFinishingWorkout}
              className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            >
              {isFinishingWorkout ? 'Finishing...' : 'Finish Workout'}
            </Button>
          </div>

          <p className="mt-3 text-sm text-slate-200">
            {workoutComplete ? 'Target sets reached.' : 'Log your next set.'}
          </p>
        </section>
      </div>
    </main>
  )
}
