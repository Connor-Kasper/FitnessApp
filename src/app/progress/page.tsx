'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

type BodyweightRow = {
  weight?: number
  created_at?: string
}

type WorkoutRow = {
  id?: string
  day?: string
  status?: string
  finished_sets?: number
  created_at?: string
  completed_at?: string
}

type SetRow = {
  exercise_name?: string
  set_number?: number
  reps?: number
  weight?: number
  created_at?: string
}

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

function toDateInputValue(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 16)
}

function LineChart({
  title,
  values,
  labels,
  color = '#22d3ee',
}: {
  title: string
  values: number[]
  labels: string[]
  color?: string
}) {
  const width = 760
  const height = 220
  const padding = 24

  const points = useMemo(() => {
    if (values.length === 0) return ''
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    return values
      .map((value, index) => {
        const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1)
        const y = height - padding - ((value - min) * (height - padding * 2)) / range
        return `${x},${y}`
      })
      .join(' ')
  }, [values])

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
      <h2 className="text-lg font-extrabold text-slate-50">{title}</h2>
      {values.length === 0 ? (
        <p className="mt-3 text-sm text-slate-300">No data yet.</p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 p-2">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-56 min-w-[680px] w-full">
              <rect x="0" y="0" width={width} height={height} fill="#020617" />
              <polyline fill="none" stroke={color} strokeWidth="3" points={points} />
              {values.map((value, index) => {
                const min = Math.min(...values)
                const max = Math.max(...values)
                const range = max - min || 1
                const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1)
                const y = height - padding - ((value - min) * (height - padding * 2)) / range
                return (
                  <g key={`${title}-${index}`}>
                    <circle cx={x} cy={y} r="4" fill={color} />
                    <text x={x} y={y - 8} fontSize="10" textAnchor="middle" fill="#f8fafc">
                      {value}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-200">
            {labels.map((label, index) => (
              <span key={`${label}-${index}`} className="rounded border border-slate-700 bg-slate-950 px-2 py-1">
                {label}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default function ProgressPage() {
  const [bodyweights, setBodyweights] = useState<BodyweightRow[]>([])
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([])
  const [sets, setSets] = useState<SetRow[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  const [manualBodyweight, setManualBodyweight] = useState('176')
  const [manualBodyweightDate, setManualBodyweightDate] = useState('')
  const [manualWorkoutDay, setManualWorkoutDay] = useState('Push')
  const [manualWorkoutSets, setManualWorkoutSets] = useState('3')
  const [manualWorkoutStatus, setManualWorkoutStatus] = useState('completed')
  const [manualWorkoutDate, setManualWorkoutDate] = useState('')
  const [manualSetExercise, setManualSetExercise] = useState('Bench Press')
  const [manualSetNumber, setManualSetNumber] = useState('1')
  const [manualSetReps, setManualSetReps] = useState('6')
  const [manualSetWeight, setManualSetWeight] = useState('225')
  const [manualSetDate, setManualSetDate] = useState('')

  const loadProgress = async () => {
    setErrorMessage('')

    const [bwRes, workoutRes, setRes] = await Promise.all([
      supabase.from('bodyweight_logs').select('weight, created_at').order('created_at', { ascending: true }),
      supabase
        .from('workouts')
        .select('id, day, status, finished_sets, created_at, completed_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('sets')
        .select('exercise_name, set_number, reps, weight, created_at')
        .order('created_at', { ascending: false }),
    ])

    if (bwRes.error || workoutRes.error || setRes.error) {
      setErrorMessage(
        bwRes.error?.message || workoutRes.error?.message || setRes.error?.message || 'Unable to load progress right now.',
      )
    }

    setBodyweights((Array.isArray(bwRes.data) ? (bwRes.data as BodyweightRow[]) : []).slice(-30))
    setWorkouts(Array.isArray(workoutRes.data) ? (workoutRes.data as WorkoutRow[]) : [])
    setSets(Array.isArray(setRes.data) ? (setRes.data as SetRow[]) : [])
  }

  useEffect(() => {
    loadProgress()
  }, [])

  const addManualBodyweight = async () => {
    setStatusMessage('')
    const createdAt = manualBodyweightDate ? new Date(manualBodyweightDate).toISOString() : new Date().toISOString()
    const { error } = await supabase.from('bodyweight_logs').insert({
      weight: Number(manualBodyweight || '0'),
      created_at: createdAt,
    })
    if (error) {
      setStatusMessage(error.message || 'Failed to save bodyweight entry.')
      return
    }
    setStatusMessage('Bodyweight entry saved.')
    await loadProgress()
  }

  const addManualWorkout = async () => {
    setStatusMessage('')
    const createdAt = manualWorkoutDate ? new Date(manualWorkoutDate).toISOString() : new Date().toISOString()
    const { error } = await supabase.from('workouts').insert({
      day: manualWorkoutDay,
      status: manualWorkoutStatus,
      finished_sets: Number(manualWorkoutSets || '0'),
      created_at: createdAt,
      completed_at: manualWorkoutStatus === 'completed' ? createdAt : null,
    })
    if (error) {
      setStatusMessage(error.message || 'Failed to save workout entry.')
      return
    }
    setStatusMessage('Workout entry saved.')
    await loadProgress()
  }

  const addManualSet = async () => {
    setStatusMessage('')
    const createdAt = manualSetDate ? new Date(manualSetDate).toISOString() : new Date().toISOString()
    const { error } = await supabase.from('sets').insert({
      exercise_name: manualSetExercise,
      set_number: Number(manualSetNumber || '0'),
      reps: Number(manualSetReps || '0'),
      weight: Number(manualSetWeight || '0'),
      created_at: createdAt,
    })
    if (error) {
      setStatusMessage(error.message || 'Failed to save set entry.')
      return
    }
    setStatusMessage('Set entry saved.')
    await loadProgress()
  }

  const bodyweightValues = bodyweights.map((entry) => Number(entry.weight ?? 0)).filter((value) => Number.isFinite(value) && value > 0)
  const bodyweightLabels = bodyweights.map((entry) => formatDate(entry.created_at))

  const workoutVolumePoints = workouts
    .slice(0, 20)
    .reverse()
    .map((workout) => Number(workout.finished_sets ?? 0))

  const workoutVolumeLabels = workouts
    .slice(0, 20)
    .reverse()
    .map((workout) => `${workout.day ?? 'Day'} · ${formatDate(workout.completed_at || workout.created_at)}`)

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-black text-slate-50 md:text-4xl">Progress</h1>
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">Dashboard</Button>
            </Link>
            <Link href="/">
              <Button className="border border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800">Home</Button>
            </Link>
          </div>
        </div>

        {errorMessage ? (
          <p className="rounded-lg border border-rose-400/70 bg-rose-500/20 p-3 text-sm text-rose-100">{errorMessage}</p>
        ) : null}
        {statusMessage ? (
          <p className="rounded-lg border border-cyan-400/60 bg-cyan-500/20 p-3 text-sm text-cyan-100">{statusMessage}</p>
        ) : null}

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="text-lg font-extrabold text-slate-50">Add Bodyweight Entry</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <Input
              value={manualBodyweight}
              onChange={(event) => setManualBodyweight(event.target.value)}
              type="number"
              inputMode="decimal"
              className="border-slate-600 bg-slate-950 text-slate-50 placeholder:text-slate-400"
            />
            <Input
              value={manualBodyweightDate}
              onChange={(event) => setManualBodyweightDate(event.target.value)}
              type="datetime-local"
              className="border-slate-600 bg-slate-950 text-slate-50"
              placeholder={toDateInputValue(new Date().toISOString())}
            />
            <Button onClick={addManualBodyweight} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
              Save
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="text-lg font-extrabold text-slate-50">Add Workout Entry</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-5">
            <Input
              value={manualWorkoutDay}
              onChange={(event) => setManualWorkoutDay(event.target.value)}
              className="border-slate-600 bg-slate-950 text-slate-50"
            />
            <Input
              value={manualWorkoutStatus}
              onChange={(event) => setManualWorkoutStatus(event.target.value)}
              className="border-slate-600 bg-slate-950 text-slate-50"
            />
            <Input
              value={manualWorkoutSets}
              onChange={(event) => setManualWorkoutSets(event.target.value)}
              type="number"
              inputMode="decimal"
              className="border-slate-600 bg-slate-950 text-slate-50"
            />
            <Input
              value={manualWorkoutDate}
              onChange={(event) => setManualWorkoutDate(event.target.value)}
              type="datetime-local"
              className="border-slate-600 bg-slate-950 text-slate-50"
            />
            <Button onClick={addManualWorkout} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
              Save
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="text-lg font-extrabold text-slate-50">Add Set Entry</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-6">
            <Input
              value={manualSetExercise}
              onChange={(event) => setManualSetExercise(event.target.value)}
              className="border-slate-600 bg-slate-950 text-slate-50"
            />
            <Input
              value={manualSetNumber}
              onChange={(event) => setManualSetNumber(event.target.value)}
              type="number"
              inputMode="decimal"
              className="border-slate-600 bg-slate-950 text-slate-50"
            />
            <Input
              value={manualSetReps}
              onChange={(event) => setManualSetReps(event.target.value)}
              type="number"
              inputMode="decimal"
              className="border-slate-600 bg-slate-950 text-slate-50"
            />
            <Input
              value={manualSetWeight}
              onChange={(event) => setManualSetWeight(event.target.value)}
              type="number"
              inputMode="decimal"
              className="border-slate-600 bg-slate-950 text-slate-50"
            />
            <Input
              value={manualSetDate}
              onChange={(event) => setManualSetDate(event.target.value)}
              type="datetime-local"
              className="border-slate-600 bg-slate-950 text-slate-50"
            />
            <Button onClick={addManualSet} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
              Save
            </Button>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <LineChart title="Bodyweight Trend" values={bodyweightValues} labels={bodyweightLabels} color="#34d399" />
          <LineChart title="Workout Volume Trend" values={workoutVolumePoints} labels={workoutVolumeLabels} color="#22d3ee" />
        </div>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="text-lg font-extrabold text-slate-50">Recent Bodyweight</h2>
          <div className="mt-3 space-y-2">
            {bodyweights.length === 0 ? (
              <p className="text-sm text-slate-300">No entries yet.</p>
            ) : (
              bodyweights
                .slice()
                .reverse()
                .slice(0, 12)
                .map((entry, index) => (
                  <div
                    key={`bw-${index}-${entry.created_at ?? 'na'}`}
                    className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <span className="text-slate-100">{Number(entry.weight ?? 0)} lb</span>
                    <span className="text-slate-300">{formatDate(entry.created_at)}</span>
                  </div>
                ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="text-lg font-extrabold text-slate-50">Recent Workouts</h2>
          <div className="mt-3 space-y-2">
            {workouts.length === 0 ? (
              <p className="text-sm text-slate-300">No entries yet.</p>
            ) : (
              workouts.slice(0, 12).map((workout, index) => (
                <div
                  key={`wk-${index}-${workout.id ?? 'na'}`}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                >
                  <p className="text-slate-100">
                    <span className="font-bold">{workout.day ?? 'Unknown'}</span> ·{' '}
                    <span className="text-slate-300">{workout.status ?? 'unknown'}</span>
                  </p>
                  <p className="text-slate-300">
                    Finished sets: {Number(workout.finished_sets ?? 0)} · {formatDate(workout.completed_at || workout.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="text-lg font-extrabold text-slate-50">Recent Sets</h2>
          <div className="mt-3 space-y-2">
            {sets.length === 0 ? (
              <p className="text-sm text-slate-300">No entries yet.</p>
            ) : (
              sets.slice(0, 20).map((entry, index) => (
                <div
                  key={`set-${index}-${entry.created_at ?? 'na'}`}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                >
                  <p className="text-slate-100">{entry.exercise_name ?? 'Exercise'}</p>
                  <p className="text-slate-300">
                    Set {Number(entry.set_number ?? 0)} · {Number(entry.reps ?? 0)} reps · {Number(entry.weight ?? 0)} lb
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
