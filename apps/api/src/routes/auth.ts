import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/authenticate.js'
import { supabase } from '../lib/supabase.js'

export async function authRoutes(app: FastifyInstance) {

  app.get('/auth/me', { preHandler: authenticate }, async (request, reply) => {
    const { id, role } = request.user!

    // Ensure user record exists
    await supabase.from('users').upsert({
      id,
      email: request.user!.email,
      role
    }, { onConflict: 'id' })

    let profile = null

    if (role === 'job_seeker') {
      // Try to get profile
      const { data } = await supabase
        .from('profiles_seeker')
        .select('*')
        .eq('user_id', id)
        .single()

      if (data) {
        profile = data
      } else {
        // Create it if missing
        const { data: created } = await supabase
          .from('profiles_seeker')
          .insert({ user_id: id, full_name: '' })
          .select()
          .single()
        profile = created
      }
    } else if (role === 'employer') {
      const { data } = await supabase
        .from('profiles_employer')
        .select('*')
        .eq('user_id', id)
        .single()

      if (data) {
        profile = data
      } else {
        const { data: created } = await supabase
          .from('profiles_employer')
          .insert({ user_id: id, company_name: '' })
          .select()
          .single()
        profile = created
      }
    }

    return reply.send({ user: request.user, profile })
  })

  app.put('/auth/language', { preHandler: authenticate }, async (request, reply) => {
    const { lang } = request.body as { lang: 'en' | 'fr' }
    if (!['en', 'fr'].includes(lang)) {
      return reply.status(400).send({ error: 'Language must be en or fr' })
    }
    const { error } = await supabase
      .from('users')
      .update({ lang_preference: lang })
      .eq('id', request.user!.id)

    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ success: true, lang })
  })
}