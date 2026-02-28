import { buildApp } from './app.js'

const PORT = Number(process.env.PORT) || 3001

const app = buildApp()

try {
  const address = await app.listen({ port: PORT, host: '0.0.0.0' })
  app.log.info(`Server listening at ${address}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
