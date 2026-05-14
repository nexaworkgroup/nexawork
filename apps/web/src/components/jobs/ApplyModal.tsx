import { useState } from 'react'
import { X, Send, CheckCircle } from 'lucide-react'
import { api } from '../../lib/api'
import { Job } from './JobCard'

interface Props {
  job: Job
  onClose: () => void
}

export default function ApplyModal({ job, onClose }: Props) {
  const [coverLetter, setCoverLetter] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleApply = async () => {
    setLoading(true); setError('')
    try {
      if (job.source !== 'native' && job.external_url) {
        window.open(job.external_url, '_blank')
        await api.post('/applications', { job_id: job.id, cover_letter: coverLetter }).catch(() => {})
        setDone(true)
      } else {
        await api.post('/applications', { job_id: job.id, cover_letter: coverLetter })
        setDone(true)
      }
    } catch (e: any) {
      setError(e.message || 'Failed to apply')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {done ? (
          <div className="p-8 text-center">
            <CheckCircle size={48} className="text-brand-green mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Application Submitted! 🎉</h3>
            <p className="text-gray-500 mb-6">
              {job.source !== 'native'
                ? "We've opened the original job posting for you to complete your application there too."
                : "Your application has been sent to the employer."}
            </p>
            <button onClick={onClose} className="btn-primary w-full">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">{job.title}</h3>
                <p className="text-sm text-gray-400">{job.company_name}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>
              )}
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Letter <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                rows={4}
                placeholder="Tell the employer why you're a great fit..."
                className="input-field resize-none"
              />
              <p className="text-xs text-gray-400 mt-1.5">Your profile and skills will be shared with the employer automatically.</p>
            </div>

            <div className="flex gap-3 p-5 pt-0">
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleApply} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Send size={16} />
                {loading ? 'Applying…' : 'Apply Now'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
