import { Command } from 'commander'
import { apiFetch } from '../lib/api.js'

export function registerHealthCommand(program: Command): void {
  program
    .command('health')
    .description('Check the health of the EvenNotes API')
    .action(async () => {
      try {
        const response = await apiFetch('/health')

        if (!response.ok) {
          console.error(`API returned status ${response.status}`)
          process.exit(1)
        }

        const data = (await response.json()) as { status: string; timestamp: string }
        console.log(`status:    ${data.status}`)
        console.log(`timestamp: ${data.timestamp}`)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`Error: Unable to reach the API — ${message}`)
        process.exit(1)
      }
    })
}
