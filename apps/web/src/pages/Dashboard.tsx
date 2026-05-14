import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Zap, AlertCircle } from 'lucide-react'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import JobCard, { Job } from '../components/jobs/JobCard'
import ApplyModal from '../components/jobs/ApplyModal'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [applyJob, setApplyJob] = useState<Job | null>(null)

  const name = (profile as any)?.full_name?.split(' ')[0] || ''
  const strength = (profile as any)?.profile_strength || 0

  const { data, isLoading } = useQuery({
    queryKey: ['feed', page],
    queryFn: () => api.get(`/seeker/feed?page=${page}`).then(r => r.data)
  })

  const jobs: Job[] = data?.jobs || []
  const hasEmbedding = data?.has_embedding

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {name ? t('dashboard.greeting', { name }) : t('dashboard.greeting_new')}
        </h1>

        {/* Profile strength bar */}
        {strength < 80 && (
          <div className="mt-4 p-4 bg-brand-gold-light border border-brand-gold/30 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {t('dashboard.profile_strength', { score: strength })}
              </span>
              <button onClick={() => navigate('/profile')}
                className="text-xs text-brand-green font-medium hover:underline">
                Improve →
              </button>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-green rounded-full transition-all duration-500"
                style={{ width: `${strength}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{t('dashboard.complete_profile')}</p>
          </div>
        )}
      </div>

      {/* Section header */}
      <div className="flex items-center gap-2 mb-5">
        <Zap size={20} className="text-brand-gold" />
        <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.your_matches')}</h2>
        {!hasEmbedding && jobs.length > 0 && (
          <span className="ml-auto flex items-center gap-1 text-xs text-brand-gold">
            <AlertCircle size={14} /> AI matching activates after profile completion
          </span>
        )}
      </div>

      {/* Job grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
              </div>
              <div className="h-9 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Zap size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">{t('dashboard.no_embedding')}</p>
          <button onClick={() => navigate('/profile')} className="btn-primary mt-4">
            Complete Profile
          </button>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} onApply={setApplyJob} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-3 mt-8">
            {page > 1 && (
              <button onClick={() => setPage(p => p - 1)} className="btn-secondary px-6 py-2">← Previous</button>
            )}
            {jobs.length === 20 && (
              <button onClick={() => setPage(p => p + 1)} className="btn-primary px-6 py-2">Next →</button>
            )}
          </div>
        </>
      )}

      {/* Apply modal */}
      {applyJob && <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} />}
    </div>
  )
}
