import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Clock, Wifi, Bookmark, BookmarkCheck, Zap, ExternalLink } from 'lucide-react'
import { api } from '../../lib/api'
import { clsx } from 'clsx'

interface Job {
  id: string
  title: string
  company_name: string
  location?: string
  is_remote?: boolean
  job_type?: string
  experience_level?: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  posted_at?: string
  match_score?: number
  source?: string
  external_url?: string
  tags?: string[]
}

interface JobCardProps {
  job: Job
  showApply?: boolean
  onApply?: (jobId: string) => void
  applying?: boolean
}

const JOB_TYPE_COLORS: Record<string, string> = {
  internship: 'badge-gold',
  graduate_scheme: 'badge-green',
  full_time: 'badge-gray',
  part_time: 'badge-gray',
  contract: 'badge-gray',
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-brand-green bg-brand-green-light'
  if (score >= 60) return 'text-brand-gold-dark bg-brand-gold-light'
  return 'text-gray-500 bg-gray-100'
}

export default function JobCard({ job, showApply = true, onApply, applying }: JobCardProps) {
  const { t, i18n } = useTranslation()
  const [saved, setSaved] = useState(false)
  const [savingLocal, setSavingLocal] = useState(false)

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSavingLocal(true)
    try {
      if (saved) {
        await api.delete(`/seeker/saved-jobs/${job.id}`)
        setSaved(false)
      } else {
        await api.post(`/seeker/saved-jobs/${job.id}`)
        setSaved(true)
      }
    } catch { /* silent */ }
    setSavingLocal(false)
  }

  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onApply?.(job.id)
  }

  const jobTypeLabel: Record<string, string> = {
    full_time: t('jobs.full_time'), part_time: t('jobs.part_time'),
    internship: t('jobs.internship'), contract: t('jobs.contract'),
    graduate_scheme: t('jobs.graduate_scheme')
  }

  const salary = job.salary_min && job.salary_max
    ? `${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()} ${job.salary_currency || 'XAF'}`
    : null

  return (
    <Link to={job.external_url ? '#' : `/jobs/${job.id}`}
      onClick={job.external_url ? () => window.open(job.external_url, '_blank') : undefined}
      className="card hover:shadow-card-hover hover:border-brand-green/20 transition-all duration-200 block group">
      <div className="flex items-start justify-between gap-3">
        {/* Company avatar */}
        <div className="w-11 h-11 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center font-bold text-lg shrink-0 group-hover:bg-brand-green group-hover:text-white transition-colors">
          {job.company_name?.[0]?.toUpperCase() || '?'}
        </div>

        {/* Match score */}
        {typeof job.match_score === 'number' && job.match_score > 0 && (
          <div className={clsx('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shrink-0', getScoreColor(job.match_score))}>
            <Zap size={11} />
            {job.match_score}% {i18n.language === 'fr' ? 'Match' : 'Match'}
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="font-semibold text-gray-900 group-hover:text-brand-green transition-colors leading-snug">
          {job.title}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">{job.company_name}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        {job.location && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin size={11} />{job.location}
          </span>
        )}
        {job.is_remote && (
          <span className="flex items-center gap-1 text-xs text-brand-green">
            <Wifi size={11} />{t('jobs.remote')}
          </span>
        )}
        {job.posted_at && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={11} />{timeAgo(job.posted_at)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {job.job_type && (
          <span className={clsx('badge text-xs', JOB_TYPE_COLORS[job.job_type] || 'badge-gray')}>
            {jobTypeLabel[job.job_type] || job.job_type}
          </span>
        )}
        {job.experience_level && job.experience_level !== 'any' && (
          <span className="badge badge-gray text-xs">
            {job.experience_level === 'entry' ? t('jobs.entry') : job.experience_level}
          </span>
        )}
        {job.tags?.slice(0, 2).map(tag => (
          <span key={tag} className="badge badge-gray text-xs">{tag}</span>
        ))}
        {job.source && job.source !== 'native' && (
          <span className="flex items-center gap-1 badge badge-gray text-xs">
            <ExternalLink size={9} />
            {job.source === 'jsearch' ? 'LinkedIn/Indeed' : job.source.replace('scraped_', '')}
          </span>
        )}
      </div>

      {salary && (
        <p className="text-sm font-semibold text-brand-green mt-3">{salary}</p>
      )}

      {showApply && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleApply}
            disabled={applying}
            className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-1.5">
            {applying ? t('common.loading') : t('jobs.apply')}
          </button>
          <button onClick={handleSave} disabled={savingLocal}
            className={clsx('p-2 rounded-lg border transition-all',
              saved ? 'bg-brand-green-light border-brand-green text-brand-green' : 'border-gray-200 text-gray-400 hover:border-brand-green hover:text-brand-green')}>
            {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
        </div>
      )}
    </Link>
  )
}
