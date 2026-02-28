import { Command } from 'commander'
import { apiFetch } from '../lib/api.js'

export function registerWorkspaceCommand(program: Command): void {
  const workspace = program
    .command('workspace')
    .description('Commands for inspecting the workspace')

  workspace
    .command('tree')
    .description('List all Markdown files in the workspace, indented by directory depth')
    .action(async () => {
      try {
        const response = await apiFetch('/api/workspace/tree')

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string }
          console.error(`Error: ${body.error ?? `API returned status ${response.status}`}`)
          process.exit(1)
        }

        const files = (await response.json()) as string[]

        if (files.length === 0) {
          console.log('Nenhum arquivo .md encontrado no workspace')
          return
        }

        for (const filePath of files) {
          const depth = filePath.split('/').length - 1
          const indent = '  '.repeat(depth)
          const name = filePath.split('/').pop() ?? filePath
          console.log(`${indent}${name}`)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`Error: ${message}`)
        process.exit(1)
      }
    })
}
