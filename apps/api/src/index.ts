import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'

import { authRoutes } from './routes/auth.js'
import { jobsRoutes } from './routes/jobs.js'
import { seekerRoutes } from './routes/seeker.js'
import { employerRoutes } from './routes/employer.js'
import { aiRoutes } from './routes/ai.js'
import { adminRoutes } from './routes/admin.js'
import { startScheduler } from './services/scheduler.js'

const app = Fastify({ logger: process.env.NODE_ENV === 'development' })

// ── Plugins ──────────────────────────────────────────────────────
await app.register(helmet, { contentSecurityPolicy: false })

await app.register(cors, {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://nexawork.vercel.app',
    /\.vercel\.app$/
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
})

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({ error: 'Too many requests — please slow down' })
})

// ── Health check ─────────────────────────────────────────────────
app.get('/health', async () => ({
  status: 'ok',
  service: 'NexaWork API',
  version: '1.0.0',
  timestamp: new Date().toISOString()
}))

// ── Routes ───────────────────────────────────────────────────────
await app.register(authRoutes)
await app.register(jobsRoutes)
await app.register(seekerRoutes)
await app.register(employerRoutes)
await app.register(aiRoutes)
await app.register(adminRoutes)

// ── Error handler ─────────────────────────────────────────────────
app.setErrorHandler((error, _request, reply) => {
  console.error('API Error:', error)
  reply.status(error.statusCode ?? 500).send({
    error: error.message || 'Internal server error'
  })
})

// ── Start ────────────────────────────────────────────────────────
const port = parseInt(process.env.PORT || '3001')

try {
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`\n🚀 NexaWork API running on http://localhost:${port}`)
  console.log(`📋 Health: http://localhost:${port}/health\n`)

  // Start the aggregation scheduler
  startScheduler()
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
