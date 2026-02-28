import { Command } from 'commander'
import { apiFetch } from '../lib/api.js'

type Pipeline = {
  id: string
  name: string
  description: string
}

export function registerPipelinesCommand(program: Command): void {
  const pipelines = program
    .command('pipelines')
    .description('Manage and inspect available AI pipelines')

  pipelines
    .command('list')
    .description('List all available AI pipelines')
    .action(async () => {
      try {
        const response = await apiFetch('/api/config/pipelines')

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string }
          console.error(`Error: ${body.error ?? `API returned status ${response.status}`}`)
          process.exit(1)
        }

        const items = (await response.json()) as Pipeline[]

        if (items.length === 0) {
          console.log('No pipelines available.')
          return
        }

        // Compute column widths
        const idWidth = Math.max(2, ...items.map((p) => p.id.length))
        const nameWidth = Math.max(4, ...items.map((p) => p.name.length))

        const pad = (s: string, w: number) => s.padEnd(w)

        const header = `${pad('id', idWidth)}  ${pad('name', nameWidth)}  description`
        const divider = `${'-'.repeat(idWidth)}  ${'-'.repeat(nameWidth)}  ${'-'.repeat(11)}`

        console.log(header)
        console.log(divider)

        for (const p of items) {
          console.log(`${pad(p.id, idWidth)}  ${pad(p.name, nameWidth)}  ${p.description}`)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`Error: ${message}`)
        process.exit(1)
      }
    })
}
