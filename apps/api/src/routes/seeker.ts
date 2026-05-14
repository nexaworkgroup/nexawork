import { FastifyInstance } from 'fastify'
import { authenticate, requireRole } from '../middleware/authenticate.js'
import { supabase } from '../lib/supabase.js'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function seekerRoutes(app: FastifyInstance) {
  // GET /seeker/profile
  app.get('/seeker/profile', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { id } = request.user!
    const { data, error } = await supabase
      .from('profiles_seeker')
      .select('*, seeker_skills(*, skills(*))')
      .eq('user_id', id)
      .single()

    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ profile: data })
  })

  // PUT /seeker/profile — update + re-embed
  app.put('/seeker/profile', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { id } = request.user!
    const body = request.body as any

    const { data: existing } = await supabase
      .from('profiles_seeker')
      .select('id')
      .eq('user_id', id)
      .single()

    const { data, error } = await supabase
      .from('profiles_seeker')
      .update({
        full_name: body.full_name,
        location: body.location,
        degree: body.degree,
        field_of_study: body.field_of_study,
        institution: body.institution,
        graduation_year: body.graduation_year,
        bio: body.bio,
        is_open_to_work: body.is_open_to_work,
        profile_strength: computeProfileStrength(body)
      })
      .eq('user_id', id)
      .select()
      .single()

    if (error) return reply.status(500).send({ error: error.message })

    // Update skills if provided
    if (body.skill_ids && Array.isArray(body.skill_ids)) {
      await supabase.from('seeker_skills').delete().eq('seeker_id', existing!.id)
      if (body.skill_ids.length > 0) {
        await supabase.from('seeker_skills').insert(
          body.skill_ids.map((skillId: string) => ({
            seeker_id: existing!.id,
            skill_id: skillId
          }))
        )
      }
    }

    // Re-generate embedding asynchronously
    embedSeekerProfile(id, data).catch(console.error)

    return reply.send({ profile: data })
  })

  // GET /seeker/applications
  app.get('/seeker/applications', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { id } = request.user!
    const { data: profile } = await supabase
      .from('profiles_seeker')
      .select('id')
      .eq('user_id', id)
      .single()

    const { data, error } = await supabase
      .from('applications')
      .select('*, jobs(title, company_name, location, job_type, is_remote)')
      .eq('seeker_id', profile!.id)
      .order('created_at', { ascending: false })

    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ applications: data })
  })

  // POST /applications — apply to a job
  app.post('/applications', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { id } = request.user!
    const { job_id, cover_letter } = request.body as { job_id: string; cover_letter?: string }

    const { data: profile } = await supabase
      .from('profiles_seeker')
      .select('id, embedding')
      .eq('user_id', id)
      .single()

    // Get job embedding for match score
    const { data: job } = await supabase
      .from('jobs')
      .select('embedding')
      .eq('id', job_id)
      .single()

    let matchScore = null
    if (profile?.embedding && job?.embedding) {
      matchScore = cosineSimilarity(profile.embedding as number[], job.embedding as number[])
    }

    const { data, error } = await supabase
      .from('applications')
      .insert({
        seeker_id: profile!.id,
        job_id,
        cover_letter,
        ai_match_score: matchScore
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return reply.status(409).send({ error: 'Already applied to this job' })
      return reply.status(500).send({ error: error.message })
    }

    // Log job view
    await supabase.from('job_views').insert({ seeker_id: profile!.id, job_id })

    return reply.status(201).send({ application: data })
  })

  // GET /seeker/saved-jobs
  app.get('/seeker/saved-jobs', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { id } = request.user!
    const { data: profile } = await supabase
      .from('profiles_seeker').select('id').eq('user_id', id).single()

    const { data } = await supabase
      .from('saved_jobs')
      .select('*, jobs(*)')
      .eq('seeker_id', profile!.id)
      .order('created_at', { ascending: false })

    return reply.send({ saved_jobs: data })
  })

  // POST /seeker/saved-jobs/:jobId
  app.post('/seeker/saved-jobs/:jobId', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { jobId } = request.params as { jobId: string }
    const { id } = request.user!
    const { data: profile } = await supabase.from('profiles_seeker').select('id').eq('user_id', id).single()

    await supabase.from('saved_jobs').insert({ seeker_id: profile!.id, job_id: jobId }).select().single()
    return reply.send({ success: true })
  })

  // DELETE /seeker/saved-jobs/:jobId
  app.delete('/seeker/saved-jobs/:jobId', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { jobId } = request.params as { jobId: string }
    const { id } = request.user!
    const { data: profile } = await supabase.from('profiles_seeker').select('id').eq('user_id', id).single()

    await supabase.from('saved_jobs').delete().eq('seeker_id', profile!.id).eq('job_id', jobId)
    return reply.send({ success: true })
  })

  // GET /skills — skills taxonomy
  app.get('/skills', async (_request, reply) => {
    const { data } = await supabase.from('skills').select('*').order('category').order('name')
    return reply.send({ skills: data })
  })
}

// ── Helpers ──────────────────────────────────────────────────────

function computeProfileStrength(profile: any): number {
  const fields = [
    profile.full_name, profile.location, profile.degree,
    profile.field_of_study, profile.institution, profile.bio,
    profile.graduation_year
  ]
  const filled = fields.filter(Boolean).length
  const hasSkills = profile.skill_ids?.length > 0
  const base = Math.round((filled / fields.length) * 80)
  return Math.min(100, base + (hasSkills ? 20 : 0))
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0)
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0))
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0))
  return magA && magB ? Math.round((dot / (magA * magB)) * 100) : 0
}

async function embedSeekerProfile(userId: string, profile: any) {
  try {
    const text = [
      profile.full_name, profile.location, profile.degree,
      profile.field_of_study, profile.institution, profile.bio
    ].filter(Boolean).join(' ')

    if (!text.trim()) return

    const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text })
    const embedding = res.data[0].embedding

    await supabase
      .from('profiles_seeker')
      .update({ embedding: embedding as any })
      .eq('user_id', userId)
  } catch (e) {
    console.error('Seeker embedding failed:', e)
  }
}
