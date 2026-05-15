import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

export type UserRole = 'job_seeker' | 'employer' | 'admin'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  lang_preference: 'en' | 'fr'
}

export interface Profile {
  id?: string
  user_id?: string
  full_name?: string
  avatar_url?: string
  location?: string
  profile_strength?: number
  degree?: string
  field_of_study?: string
  institution?: string
  graduation_year?: number
  bio?: string
  cv_url?: string
  is_open_to_work?: boolean
  company_name?: string
  logo_url?: string
  industry?: string
  company_size?: string
  website?: string
  description?: string
  is_verified?: boolean
}

interface AuthState {
  user: AuthUser | null
  profile: Profile | null
  loading: boolean
  setUser: (user: AuthUser | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      loading: false,  // Start false — never block on load

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null, loading: false })
      }
    }),
    {
      name: 'nexawork-auth',
      partialize: (state) => ({ user: state.user, profile: state.profile })
    }
  )
)
