'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

const features = [
  {
    title: 'Workout Timer',
    description: 'Start a focused session with adjustable work and rest timing.',
  },
  {
    title: 'Set Counter',
    description: 'Track sets as you go with one-tap increment and reset controls.',
  },
  {
    title: 'Rep Counter',
    description: 'Keep your reps visible and accurate during every exercise.',
  },
]

export default function Home() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: { email?: string } | null } }) => {
      setUserEmail(data.user?.email ?? null)
    })
  }, [])

  const signIn = async () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setMessage('Please enter your email.')
      return
    }

    setSending(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Magic link sent. Check your email.')
      setEmail('')
    }

    setSending(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16 md:py-24">
        <div className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-blue-100">
          MVP Mode · Auth Optional
        </div>

        <div className="max-w-3xl space-y-6">
          <h1 className="text-4xl font-black leading-tight md:text-6xl">
            Train better with a clean
            <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              {' '}
              timer + set/rep counter
            </span>
          </h1>
          <p className="text-base text-slate-200 md:text-lg">
            Jump straight into your workout. Pick an exercise, run your timer, and count sets + reps
            with zero friction.
          </p>
          {userEmail ? <p className="text-sm text-emerald-300">Signed in as {userEmail}</p> : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/dashboard" className="sm:w-auto">
            <Button size="lg" className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400">
              Start Training Session
            </Button>
          </Link>
          <Link href="/progress" className="sm:w-auto">
            <Button size="lg" className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400">
              View Progress
            </Button>
          </Link>
          <a href="#features" className="sm:w-auto">
            <Button
              size="lg"
              className="w-full border border-white/30 bg-slate-800 text-slate-100 hover:bg-slate-700"
            >
              View Features
            </Button>
          </a>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
          <h2 className="text-xl font-bold">Optional sign in</h2>
          <p className="mt-1 text-sm text-slate-300">
            Use magic link auth now, or skip and continue in MVP mode.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="bg-white/90 text-slate-900 placeholder:text-slate-500"
            />
            <Button
              onClick={signIn}
              className="bg-indigo-500 text-white hover:bg-indigo-400 sm:w-48"
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send Magic Link'}
            </Button>
          </div>
          {message ? <p className="mt-3 text-sm text-slate-200">{message}</p> : null}
        </div>

        <div id="features" className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/40"
            >
              <h2 className="text-lg font-bold">{feature.title}</h2>
              <p className="mt-2 text-sm text-slate-200">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
