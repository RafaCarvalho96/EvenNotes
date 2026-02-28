import Fastify from 'fastify'
import { commandsRoute } from './routes/commands.js'
import { configRoute } from './routes/config.js'
import { filesRoute } from './routes/files.js'
import { healthRoute } from './routes/health.js'
import { runsRoute } from './routes/runs.js'
import { workspaceRoute } from './routes/workspace.js'

export function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      // Mask secrets so they never appear in log output
      redact: {
        paths: [
          'apiKey',
          'key',
          'token',
          'password',
          'secret',
          'req.headers.authorization',
          'req.headers["x-api-key"]',
        ],
        censor: '[REDACTED]',
      },
    },
  })

  // ── Request correlation: attach runId to every request log ──────────────────
  app.addHook('onRequest', (request, _reply, done) => {
    // Fastify assigns request.id automatically; we surface it as runId for
    // easy grepping across log lines for a single request lifecycle.
    request.log = request.log.child({ runId: request.id })
    done()
  })

  app.addHook('onResponse', (request, reply, done) => {
    request.log.info(
      {
        method: request.method,
        path: request.url,
        statusCode: reply.statusCode,
        durationMs: reply.elapsedTime,
      },
      'request completed',
    )
    done()
  })

  app.register(healthRoute)
  app.register(workspaceRoute)
  app.register(filesRoute)
  app.register(commandsRoute)
  app.register(runsRoute)
  app.register(configRoute)

  return app
}
