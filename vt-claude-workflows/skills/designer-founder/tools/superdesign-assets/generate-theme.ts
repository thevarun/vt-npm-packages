#!/usr/bin/env npx tsx
/**
 * Theme Generation CLI Script
 *
 * Generates CSS theme files from input content.
 * Matches the execution logic of the generateTheme tool.
 *
 * Usage:
 *   npx tsx _bmad-output/tmp/generate-theme.ts --name "Theme Name" --output path/to/theme.css --input source.css
 *   cat theme.css | npx tsx _bmad-output/tmp/generate-theme.ts --name "Theme Name" --output path/to/theme.css
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as readline from 'node:readline'

// Parse command-line arguments
const args = process.argv.slice(2)

function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag)
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined
}

function hasFlag(flag: string): boolean {
  return args.includes(flag)
}

function printUsage(): void {
  console.log(`
Theme Generation CLI

Usage:
  npx tsx generate-theme.ts --name <theme_name> --output <path> [options]

Required:
  --name <theme_name>    Theme name for identification
  --output <path>        Output CSS file path (relative to project root)

Optional:
  --input <path>         Read CSS content from file (alternative to stdin)
  --no-create-dirs       Don't create parent directories
  --help                 Show this help message

Examples:
  # Read CSS from file
  npx tsx generate-theme.ts --name "Dark Mode" --output .superdesign/themes/dark.css --input theme-content.css

  # Read CSS from stdin
  cat theme.css | npx tsx generate-theme.ts --name "Light Mode" --output .superdesign/themes/light.css

  # Echo CSS directly
  echo ':root { --primary: blue; }' | npx tsx generate-theme.ts --name "Test" --output .superdesign/test.css
`)
}

function printResult(success: boolean, message: string, data?: Record<string, unknown>): void {
  const result = {
    success,
    message,
    ...data,
  }
  console.log(JSON.stringify(result, null, 2))
}

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if stdin has data (not a TTY)
    if (process.stdin.isTTY) {
      resolve('')
      return
    }

    const rl = readline.createInterface({
      input: process.stdin,
      terminal: false,
    })

    const lines: string[] = []
    rl.on('line', line => lines.push(line))
    rl.on('close', () => resolve(lines.join('\n')))
    rl.on('error', reject)
  })
}

async function main(): Promise<void> {
  // Show help if requested
  if (hasFlag('--help') || hasFlag('-h')) {
    printUsage()
    process.exit(0)
  }

  // Parse arguments
  const themeName = getArg('--name')
  const outputPath = getArg('--output')
  const inputPath = getArg('--input')
  const createDirs = !hasFlag('--no-create-dirs')

  // Validate required arguments
  if (!themeName) {
    printResult(false, 'Missing required argument: --name')
    process.exit(1)
  }

  if (!outputPath) {
    printResult(false, 'Missing required argument: --output')
    process.exit(1)
  }

  // Determine project root (two levels up from this script location)
  const projectRoot = path.resolve(__dirname, '../..')

  // Resolve and validate output path
  const resolvedOutputPath = path.resolve(projectRoot, outputPath)
  if (!resolvedOutputPath.startsWith(projectRoot)) {
    printResult(false, 'Output path must be within project directory', {
      attempted_path: outputPath,
      resolved_path: resolvedOutputPath,
      project_root: projectRoot,
    })
    process.exit(1)
  }

  // Read CSS content from input file or stdin
  let cssContent: string

  if (inputPath) {
    const resolvedInputPath = path.resolve(projectRoot, inputPath)
    if (!resolvedInputPath.startsWith(projectRoot)) {
      printResult(false, 'Input path must be within project directory', {
        attempted_path: inputPath,
      })
      process.exit(1)
    }

    if (!fs.existsSync(resolvedInputPath)) {
      printResult(false, `Input file not found: ${inputPath}`, {
        resolved_path: resolvedInputPath,
      })
      process.exit(1)
    }

    cssContent = fs.readFileSync(resolvedInputPath, 'utf-8')
  }
  else {
    cssContent = await readStdin()
  }

  if (!cssContent || cssContent.trim() === '') {
    printResult(false, 'No CSS content provided. Use --input <file> or pipe content via stdin.')
    process.exit(1)
  }

  // Create parent directories if needed
  const outputDir = path.dirname(resolvedOutputPath)
  if (createDirs && !fs.existsSync(outputDir)) {
    try {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    catch (err) {
      printResult(false, `Failed to create directory: ${outputDir}`, {
        error: err instanceof Error ? err.message : String(err),
      })
      process.exit(1)
    }
  }

  // Write CSS content to output file
  try {
    fs.writeFileSync(resolvedOutputPath, cssContent, 'utf-8')
  }
  catch (err) {
    printResult(false, `Failed to write file: ${resolvedOutputPath}`, {
      error: err instanceof Error ? err.message : String(err),
    })
    process.exit(1)
  }

  // Print success result
  printResult(true, `Theme "${themeName}" saved successfully`, {
    theme_name: themeName,
    file_path: resolvedOutputPath,
    relative_path: outputPath,
    bytes_written: Buffer.byteLength(cssContent, 'utf-8'),
  })
}

main().catch((err) => {
  printResult(false, 'Unexpected error', {
    error: err instanceof Error ? err.message : String(err),
  })
  process.exit(1)
})
