import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore, UserRole } from '../store/authStore'

export default function LoginPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) throw authErr
      if (!data.user) throw new Error('No user returned')

      const userRole = (data.user.user_metadata?.role as UserRole) || 'job_seeker'

      useAuthStore.getState().setUser({
        id: data.user.id,
        email: data.user.email || email,
        role: userRole,
        lang_preference: 'en'
      })
      useAuthStore.getState().setLoading(false)

      // Hard navigate
      window.location.href = userRole === 'employer' ? '/employer/dashboard' : '/dashboard'
    } catch (err: any) {
      setError(err.message || t('auth.error_invalid'))
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' }
    })
  }

  return (
    <div className="min-h-screen bg-surface flex">
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-brand-green p-12 text-white">
        <Link to="/" className="flex items-center gap-2 text-green-200 hover:text-white">
          <ArrowLeft size={18} /> Back to home
        </Link>
        <div>
          <p className="text-5xl font-bold leading-tight mb-4">
            Welcome<br />back to<br /><span className="text-brand-gold">NexaWork</span>
          </p>
          <p className="text-green-200 text-lg">Africa's smartest job platform</p>
        </div>
        <p className="text-green-300 text-sm">"Your First Job Finds You"</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-1 text-sm text-gray-400 mb-6">
            <ArrowLeft size={16} /> Home
          </Link>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{t('auth.login_title')}</h1>
            <p className="text-gray-400 mt-1">{t('auth.login_subtitle')}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.email')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? t('auth.loading') : t('auth.sign_in')}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <span className="flex-1 h-px bg-gray-200" />
          </div>

          <button onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">
            <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
            {t('auth.google')}
          </button>

          <p className="text-center text-sm text-gray-400 mt-6">
            {t('auth.no_account')}{' '}
            <Link to="/register" className="text-brand-green font-medium hover:underline">{t('auth.sign_up')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}