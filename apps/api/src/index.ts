import './config.js' // fail-fast env validation
import { config } from './config.js'
import { buildApp } from './app.js'

const PORT = config.PORT

const app = buildApp()

try {
  const address = await app.listen({ port: PORT, host: '0.0.0.0' })
  app.log.info(`Server listening at ${address}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
