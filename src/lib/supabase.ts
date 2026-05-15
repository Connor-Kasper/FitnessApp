import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (process.env.NODE_ENV !== 'production' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    'Supabase env vars are missing. Auth/data features are disabled until NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.',
  )
}

type UserShape = { email?: string } | null
type SupabaseErrorShape = { message: string }

type SupabaseLikeClient = {
  auth: {
    getUser: () => Promise<{ data: { user: UserShape }; error: SupabaseErrorShape | null }>
    signInWithOtp: (params: {
      email: string
    }) => Promise<{ data: null; error: SupabaseErrorShape | null }>
    signOut: () => Promise<{ error: SupabaseErrorShape | null }>
  }
  from: (_table: string) => {
    select: (_columns?: string) => {
      order: (_column: string, _options?: { ascending?: boolean }) => Promise<{
        data: unknown[]
        error: SupabaseErrorShape | null
      }>
    }
    insert: (_values: Record<string, unknown>) => Promise<{
      data: unknown
      error: SupabaseErrorShape | null
    }>
    update: (_values: Record<string, unknown>) => {
      eq: (_column: string, _value: string) => Promise<{
        data: unknown
        error: SupabaseErrorShape | null
      }>
    }
  }
}

const createNoopSupabaseClient = (): SupabaseLikeClient => ({
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithOtp: async () => ({ data: null, error: { message: 'Supabase is not configured.' } }),
    signOut: async () => ({ error: { message: 'Supabase is not configured.' } }),
  },
  from: () => ({
    select: () => ({
      order: async () => ({ data: [], error: { message: 'Supabase is not configured.' } }),
    }),
    insert: async () => ({ data: null, error: { message: 'Supabase is not configured.' } }),
    update: () => ({
      eq: async () => ({ data: null, error: { message: 'Supabase is not configured.' } }),
    }),
  }),
})

export const supabase: SupabaseLikeClient =
  supabaseUrl && supabaseAnonKey
    ? (createClient(supabaseUrl, supabaseAnonKey) as unknown as SupabaseLikeClient)
    : createNoopSupabaseClient()
