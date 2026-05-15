import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { api } from './lib/api'
import { useAuthStore, UserRole } from './store/authStore'
import AppLayout from './components/layout/AppLayout'
import LandingPage from './pages/Landing'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import OnboardingPage from './pages/onboarding/Index'
import DashboardPage from './pages/Dashboard'
import JobsPage from './pages/Jobs'
import JobDetailPage from './pages/JobDetail'
import ApplicationsPage from './pages/Applications'
import SavedJobsPage from './pages/SavedJobs'
import ChatPage from './pages/Chat'
import ProfilePage from './pages/Profile'
import EmployerDashboard from './pages/employer/Dashboard'
import PostJobPage from './pages/employer/PostJob'
import CandidatesPage from './pages/employer/Candidates'
import FloatingChat from './components/FloatingChat'

// Route guards — never show loader since loading starts false
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  const done = user.role === 'job_seeker'
    ? !!(profile as any)?.full_name
    : !!(profile as any)?.company_name
  if (!done) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function RequireEmployer({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'employer') return <Navigate to="/dashboard" replace />
  if (!(profile as any)?.company_name) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

export default function App() {
  const { user, setUser, setProfile } = useAuthStore()

  useEffect(() => {
    // On mount: sync session from Supabase (handles page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !user) {
        // Restore basic user from session
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: (session.user.user_metadata?.role as UserRole) || 'job_seeker',
          lang_preference: 'en'
        })
        // Load full profile in background
        api.get('/auth/me', {
          headers: { Authorization: 'Bearer ' + session.access_token }
        }).then(res => {
          setUser(res.data.user)
          setProfile(res.data.profile)
        }).catch(() => {})
      }
    }).catch(() => {})

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        }
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
          <Route path="/saved" element={<SavedJobsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route element={<RequireEmployer><AppLayout /></RequireEmployer>}>
          <Route path="/employer/dashboard" element={<EmployerDashboard />} />
          <Route path="/employer/jobs/new" element={<PostJobPage />} />
          <Route path="/employer/jobs/:jobId/candidates" element={<CandidatesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <FloatingChat />
    </BrowserRouter>
  )
}
