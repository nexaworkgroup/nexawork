import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { api } from '../lib/api'
import JobCard, { Job } from '../components/jobs/JobCard'
import ApplyModal from '../components/jobs/ApplyModal'
import { clsx } from 'clsx'

const JOB_TYPES = ['full_time', 'part_time', 'internship', 'contract', 'graduate_scheme']
const EXP_LEVELS = ['entry', 'mid', 'senior']

export default function JobsPage() {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [location, setLocation] = useState('')
  const [type, setType] = useState('')
  const [level, setLevel] = useState('')
  const [remote, setRemote] = useState(false)
  const [page, setPage] = useState(1)
  const [applyJob, setApplyJob] = useState<Job | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (location) params.set('location', location)
  if (type) params.set('type', type)
  if (level) params.set('level', level)
  if (remote) params.set('remote', 'true')
  params.set('page', String(page))

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', q, location, type, level, remote, page],
    queryFn: () => api.get(`/jobs?${params}`).then(r => r.data),
    staleTime: 60_000
  })

  const jobs: Job[] = data?.jobs || []

  const clearFilters = () => { setQ(''); setLocation(''); setType(''); setLevel(''); setRemote(false); setPage(1) }
  const hasFilters = q || location || type || level || remote

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.jobs')}</h1>
        {data?.total && <p className="text-gray-400 text-sm mt-1">{data.total.toLocaleString()} jobs available</p>}
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1) }}
            placeholder="Search job titles, skills..."
            className="input-field pl-10" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
            showFilters || hasFilters ? 'border-brand-green bg-brand-green-light text-brand-green' : 'border-gray-200 hover:border-gray-300')}>
          <SlidersHorizontal size={16} />
          Filters
          {hasFilters && <span className="w-1.5 h-1.5 bg-brand-green rounded-full" />}
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2.5 text-sm text-gray-400 hover:text-red-500 transition-colors">
            <X size={16} /> Clear
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Location</label>
            <input value={location} onChange={e => { setLocation(e.target.value); setPage(1) }}
              placeholder="Douala, Cameroon..." className="input-field text-sm py-2" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Job Type</label>
            <select value={type} onChange={e => { setType(e.target.value); setPage(1) }} className="input-field text-sm py-2">
              <option value="">All types</option>
              {JOB_TYPES.map(jt => <option key={jt} value={jt}>{t(`jobs.${jt}` as any)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Experience</label>
            <select value={level} onChange={e => { setLevel(e.target.value); setPage(1) }} className="input-field text-sm py-2">
              <option value="">All levels</option>
              {EXP_LEVELS.map(l => <option key={l} value={l}>{t(`jobs.${l}` as any)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Remote</label>
            <button onClick={() => { setRemote(!remote); setPage(1) }}
              className={clsx('w-full py-2 rounded-lg border text-sm font-medium transition-all',
                remote ? 'border-brand-green bg-brand-green text-white' : 'border-gray-200 hover:border-gray-300')}>
              {remote ? '✓ Remote Only' : 'Include Remote'}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-48" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p>{t('jobs.no_results')}</p>
          {hasFilters && <button onClick={clearFilters} className="btn-primary mt-4 text-sm">Clear Filters</button>}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map(job => <JobCard key={job.id} job={job} onApply={setApplyJob} />)}
          </div>
          <div className="flex justify-center gap-3 mt-8">
            {page > 1 && <button onClick={() => setPage(p => p - 1)} className="btn-secondary px-6 py-2">← Previous</button>}
            {jobs.length === 20 && <button onClick={() => setPage(p => p + 1)} className="btn-primary px-6 py-2">Next →</button>}
          </div>
        </>
      )}

      {applyJob && <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} />}
    </div>
  )
}
