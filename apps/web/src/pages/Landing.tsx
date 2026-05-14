import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Zap, Search, CheckCircle2, ArrowRight, Users, Briefcase, TrendingUp, Globe, Star } from 'lucide-react'
import { api } from '../lib/api'
import { useEffect, useState } from 'react'

function LanguageToggle() {
  const { i18n } = useTranslation()
  const toggle = () => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')
  return (
    <button onClick={toggle} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-green transition-colors">
      <Globe size={16} />
      {i18n.language === 'en' ? 'FR' : 'EN'}
    </button>
  )
}

export default function LandingPage() {
  const { t } = useTranslation()
  const [recentJobs, setRecentJobs] = useState<any[]>([])

  useEffect(() => {
    api.get('/jobs?page=1').then(r => setRecentJobs(r.data.jobs?.slice(0, 5) || [])).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <span className="text-2xl font-bold">
            <span className="text-brand-green">Nexa</span>
            <span className="text-gray-900">Work</span>
          </span>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-brand-green transition-colors">
              {t('nav.login')}
            </Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2">
              {t('nav.register')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-green-light via-white to-brand-gold-light pt-20 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-brand-green/20 rounded-full px-4 py-1.5 text-sm text-brand-green font-medium mb-6 shadow-sm">
            <Zap size={14} className="text-brand-gold" />
            Africa's #1 AI-Powered Job Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
            {t('landing.hero_title')}{' '}
            <span className="text-brand-green relative">
              {t('landing.hero_title_accent')}
              <span className="absolute -bottom-1 left-0 right-0 h-1 bg-brand-gold rounded-full" />
            </span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            {t('landing.hero_subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary text-base px-8 py-3.5 flex items-center gap-2 justify-center">
              {t('landing.cta_seeker')} <ArrowRight size={18} />
            </Link>
            <Link to="/register?role=employer" className="btn-secondary text-base px-8 py-3.5">
              {t('landing.cta_employer')}
            </Link>
          </div>

          {/* Live job ticker */}
          {recentJobs.length > 0 && (
            <div className="mt-12 flex items-center justify-center gap-2 text-sm text-gray-400 flex-wrap">
              <span className="font-medium text-gray-600">Just added:</span>
              {recentJobs.map(j => (
                <span key={j.id} className="inline-flex items-center gap-1 bg-white border border-gray-100 rounded-full px-3 py-1 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse" />
                  {j.title} @ {j.company_name}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-brand-green">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-8 text-center">
          {[
            { icon: Briefcase, value: '10,000+', label: t('landing.stat_jobs') },
            { icon: Users, value: '500+', label: t('landing.stat_companies') },
            { icon: TrendingUp, value: '2,000+', label: t('landing.stat_placed') },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label}>
              <Icon size={28} className="text-brand-gold mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{value}</p>
              <p className="text-sm text-green-200 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">{t('landing.how_title')}</h2>
          <p className="text-center text-gray-400 mb-16 text-lg">Three steps to your first job</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', title: t('landing.step1_title'), desc: t('landing.step1_desc'), color: 'bg-brand-green-light', accent: 'text-brand-green' },
              { num: '02', title: t('landing.step2_title'), desc: t('landing.step2_desc'), color: 'bg-brand-gold-light', accent: 'text-brand-gold-dark' },
              { num: '03', title: t('landing.step3_title'), desc: t('landing.step3_desc'), color: 'bg-brand-green-light', accent: 'text-brand-green' },
            ].map(({ num, title, desc, color, accent }) => (
              <div key={num} className="text-center">
                <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
                  <span className={`text-2xl font-bold ${accent}`}>{num}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For graduates callout */}
      <section className="py-20 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-brand-green rounded-2xl p-10 text-center text-white">
            <Star size={32} className="text-brand-gold mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">{t('landing.for_graduates')}</h2>
            <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">{t('landing.for_graduates_desc')}</p>
            <Link to="/register" className="inline-flex items-center gap-2 bg-brand-gold text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-brand-gold-dark transition-colors">
              Start Free — No CV Needed <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span className="font-bold text-gray-700">
            <span className="text-brand-green">Nexa</span>Work
          </span>
          <span>© 2026 NexaWork · Cameroon 🇨🇲 · Built with ❤️ for Africa</span>
          <LanguageToggle />
        </div>
      </footer>
    </div>
  )
}
