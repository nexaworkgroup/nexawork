import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { User, Upload, CheckCircle } from 'lucide-react'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { profile, setProfile } = useAuthStore()
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  const { data: skillsData } = useQuery({
    queryKey: ['skills'],
    queryFn: () => api.get('/skills').then(r => r.data)
  })

  const skills = skillsData?.skills || []
  const grouped = skills.reduce((acc: any, s: any) => {
    acc[s.category] = [...(acc[s.category] || []), s]
    return acc
  }, {})

  useEffect(() => {
    if (profile) setForm({ ...profile })
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.put('/seeker/profile', { ...form, skill_ids: selectedSkills })
      setProfile(res.data.profile)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
    setSaving(false)
  }

  const toggleSkill = (id: string) => {
    setSelectedSkills(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const strength = (profile as any)?.profile_strength || 0

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.profile')}</h1>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-brand-green font-medium">
            <CheckCircle size={16} /> Saved!
          </span>
        )}
      </div>

      {/* Profile strength */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Profile Strength</span>
          <span className="text-sm font-bold text-brand-green">{strength}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand-green rounded-full transition-all duration-500" style={{ width: `${strength}%` }} />
        </div>
      </div>

      {/* Basic info */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User size={18} className="text-brand-green" /> Basic Information
        </h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('onboarding.full_name')}</label>
            <input value={form.full_name || ''} onChange={e => setForm((p: any) => ({ ...p, full_name: e.target.value }))}
              className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('onboarding.location')}</label>
            <input value={form.location || ''} onChange={e => setForm((p: any) => ({ ...p, location: e.target.value }))}
              className="input-field" placeholder="Douala, Cameroon" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
            <textarea value={form.bio || ''} onChange={e => setForm((p: any) => ({ ...p, bio: e.target.value }))}
              rows={3} className="input-field resize-none" placeholder="Tell employers about yourself..." />
          </div>
        </div>
      </div>

      {/* Education */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Education</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('onboarding.degree')}</label>
            <input value={form.degree || ''} onChange={e => setForm((p: any) => ({ ...p, degree: e.target.value }))}
              className="input-field" placeholder="BSc, MSc, HND..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('onboarding.field')}</label>
            <input value={form.field_of_study || ''} onChange={e => setForm((p: any) => ({ ...p, field_of_study: e.target.value }))}
              className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('onboarding.institution')}</label>
            <input value={form.institution || ''} onChange={e => setForm((p: any) => ({ ...p, institution: e.target.value }))}
              className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('onboarding.grad_year')}</label>
            <input type="number" value={form.graduation_year || ''} onChange={e => setForm((p: any) => ({ ...p, graduation_year: parseInt(e.target.value) }))}
              className="input-field" placeholder="2024" />
          </div>
        </div>
      </div>

      {/* Skills */}
      {Object.keys(grouped).length > 0 && (
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">{t('onboarding.seeker_step3_title')}</h2>
          <div className="space-y-4">
            {Object.entries(grouped).map(([cat, catSkills]: any) => (
              <div key={cat}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{cat}</p>
                <div className="flex flex-wrap gap-2">
                  {catSkills.map((skill: any) => (
                    <button key={skill.id} onClick={() => toggleSkill(skill.id)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        selectedSkills.includes(skill.id)
                          ? 'bg-brand-green text-white border-brand-green'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-brand-green'
                      }`}>
                      {skill.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 text-base">
        {saving ? 'Saving…' : t('common.save') + ' Profile'}
      </button>
    </div>
  )
}
