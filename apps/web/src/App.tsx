import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from './lib/supabase'
import { api } from './lib/api'
import AppLayout from './components/layout/AppLayout'
import LandingPage from './pages/Landing'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import OnboardingPage from './pages/onboarding/Index'
import DashboardPage from './pages/Dashboard'
import JobsPage from './pages/Jobs'
import JobDetailPage from './pages/JobDetail'
import ApplicationsPage from './pages/Applications'
import ChatPage from './pages/Chat'
import ProfilePage from './pages/Profile'
import EmployerDashboard from './pages/employer/Dashboard'
import PostJobPage from './pages/employer/PostJob'
import CandidatesPage from './pages/employer/Candidates'
import { useAuthStore, UserRole } from './store/authStore'

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading NexaWork</p>
      </div>
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuthStore()
  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />
  const isComplete = user.role === 'job_seeker'
    ? !!(profile as any)?.full_name
    : !!(profile as any)?.company_name
  if (!isComplete) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function RequireEmployer({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuthStore()
  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'employer') return <Navigate to="/dashboard" replace />
  if (!(profile as any)?.company_name) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

export default function App() {
  const { setUser, setProfile, setLoading } = useAuthStore()
  const { i18n } = useTranslation()

useEffect(() => {
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (session?.user) {
      try {
        const res = await api.get('/auth/me', {
          headers: { Authorization: 'Bearer ' + session.access_token }
        })
        setUser(res.data.user)
        setProfile(res.data.profile)
      } catch {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: (session.user.user_metadata?.role as UserRole) || 'job_seeker',
          lang_preference: 'en'
        })
      }
    }
    setLoading(false)  // ← MUST always be called, inside .then()
  }).catch(() => {
    setLoading(false)  // ← Also call on error
  })

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const res = await api.get('/auth/me', {
            headers: { Authorization: 'Bearer ' + session.access_token }
          })
          setUser(res.data.user)
          setProfile(res.data.profile)
        } catch {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: (session.user.user_metadata?.role as UserRole) || 'job_seeker',
            lang_preference: 'en'
          })
        }
      }
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    }
  )

  return () => subscription.unsubscribe()
}, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />
        <Route element={<RequireOnboarding><AppLayout /></RequireOnboarding>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/saved" element={<ProfilePage />} />
        </Route>
        <Route element={<RequireEmployer><AppLayout /></RequireEmployer>}>
          <Route path="/employer/dashboard" element={<EmployerDashboard />} />
          <Route path="/employer/jobs/new" element={<PostJobPage />} />
          <Route path="/employer/jobs/:jobId/candidates" element={<CandidatesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
