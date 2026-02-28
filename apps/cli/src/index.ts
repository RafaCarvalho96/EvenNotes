#!/usr/bin/env node
import { Command } from 'commander'
import { registerHealthCommand } from './commands/health.js'
import { registerWorkspaceCommand } from './commands/workspace.js'
import { registerRunCommand } from './commands/run.js'
import { registerPipelinesCommand } from './commands/pipelines.js'
import { registerProvidersCommand } from './commands/providers.js'

const program = new Command()

program
  .name('evennotes')
  .description('EvenNotes CLI — AI-powered Markdown workspace tool')
  .version('0.1.0')

// US-008: health
registerHealthCommand(program)

// US-009: workspace tree
registerWorkspaceCommand(program)

// US-010: run summarize | rewrite | create-prd
registerRunCommand(program)

// US-011: pipelines list, providers list
registerPipelinesCommand(program)
registerProvidersCommand(program)

program.parse(process.argv)
