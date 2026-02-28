import { Command } from 'commander'
import { apiFetch } from '../lib/api.js'

type Provider = {
  id: string
  name: string
  available: boolean
}

export function registerProvidersCommand(program: Command): void {
  const providers = program
    .command('providers')
    .description('Manage and inspect available LLM providers')

  providers
    .command('list')
    .description('List all available LLM providers and their status')
    .action(async () => {
      try {
        const response = await apiFetch('/api/config/providers')

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string }
          console.error(`Error: ${body.error ?? `API returned status ${response.status}`}`)
          process.exit(1)
        }

        const items = (await response.json()) as Provider[]

        if (items.length === 0) {
          console.log('No providers available.')
          return
        }

        // Compute column widths
        const idWidth = Math.max(2, ...items.map((p) => p.id.length))
        const nameWidth = Math.max(4, ...items.map((p) => p.name.length))

        const pad = (s: string, w: number) => s.padEnd(w)

        const header = `${pad('id', idWidth)}  ${pad('name', nameWidth)}  available`
        const divider = `${'-'.repeat(idWidth)}  ${'-'.repeat(nameWidth)}  ${'-'.repeat(9)}`

        console.log(header)
        console.log(divider)

        for (const p of items) {
          const status = p.available ? '✓ [OK]' : '[sem chave]'
          console.log(`${pad(p.id, idWidth)}  ${pad(p.name, nameWidth)}  ${status}`)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`Error: ${message}`)
        process.exit(1)
      }
    })
}
