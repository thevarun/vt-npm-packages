#!/usr/bin/env node
/**
 * @torka/claude-qol - Post-install script
 * Copies QoL files to the appropriate .claude directory
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ANSI colors for output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

// Files that should not be overwritten if user has customized them
const PROTECTED_FILES = [
  'auto_approve_safe.rules.json'
];

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logSkip(message) {
  log(`  ○ ${message}`, 'yellow');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

function logUpdate(message) {
  log(`  ↻ ${message}`, 'blue');
}

function logBackup(message) {
  log(`  ⤷ ${message}`, 'cyan');
}

function logPreserve(message) {
  log(`  ★ ${message}`, 'yellow');
}

/**
 * Determine the target .claude directory based on installation context
 */
function getTargetBase() {
  // Check if this is a global installation
  const isGlobal = process.env.npm_config_global === 'true';

  if (isGlobal) {
    // Global install: use ~/.claude
    return path.join(os.homedir(), '.claude');
  }

  // Local install: find the project root (where package.json lives)
  // Start from INIT_CWD (where npm was run) or current working directory
  let projectRoot = process.env.INIT_CWD || process.cwd();

  // Walk up to find package.json (the actual project, not this package)
  while (projectRoot !== path.dirname(projectRoot)) {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (pkg.name !== '@torka/claude-qol') {
          return path.join(projectRoot, '.claude');
        }
      } catch (e) {
        // Continue walking up
      }
    }
    projectRoot = path.dirname(projectRoot);
  }

  // Fallback to INIT_CWD
  return path.join(process.env.INIT_CWD || process.cwd(), '.claude');
}

/**
 * Ensure entries exist in a .gitignore file (append if missing)
 */
function ensureGitignoreEntries(gitignorePath, entries, header) {
  let existingContent = '';
  if (fs.existsSync(gitignorePath)) {
    existingContent = fs.readFileSync(gitignorePath, 'utf8');
  }

  const existingLines = new Set(
    existingContent.split('\n').map(line => line.trim()).filter(Boolean)
  );

  const missingEntries = entries.filter(entry => !existingLines.has(entry));

  if (missingEntries.length > 0) {
    const newContent = existingContent.trimEnd() +
      (existingContent ? '\n\n' : '') +
      `# ${header}\n` +
      missingEntries.join('\n') + '\n';
    fs.writeFileSync(gitignorePath, newContent);
    return missingEntries.length;
  }
  return 0;
}

/**
 * Recursively copy directory contents
 */
function copyDirRecursive(src, dest, stats) {
  if (!fs.existsSync(src)) {
    return;
  }

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, stats);
    } else {
      if (fs.existsSync(destPath)) {
        // Check if this is a protected user config file
        if (PROTECTED_FILES.includes(entry.name)) {
          stats.preserved.push(destPath);
          logPreserve(`Preserved (user config): ${path.relative(stats.targetBase, destPath)}`);
          continue;
        }

        // Check if files are identical (inline comparison)
        const srcContent = fs.readFileSync(srcPath);
        const destContent = fs.readFileSync(destPath);
        const filesAreIdentical = srcContent.equals(destContent);

        if (filesAreIdentical) {
          stats.unchanged.push(destPath);
          logSkip(`Unchanged: ${path.relative(stats.targetBase, destPath)}`);
        } else {
          // Backup existing file, then replace
          const backupPath = destPath + '.backup';
          fs.copyFileSync(destPath, backupPath);
          stats.backups.push(backupPath);
          logBackup(`Backup: ${path.relative(stats.targetBase, backupPath)}`);

          fs.copyFileSync(srcPath, destPath);
          stats.updated.push(destPath);
          logUpdate(`Updated: ${path.relative(stats.targetBase, destPath)}`);
        }
      } else {
        fs.copyFileSync(srcPath, destPath);
        stats.copied.push(destPath);
        logSuccess(`Copied: ${path.relative(stats.targetBase, destPath)}`);
      }
    }
  }
}

/**
 * Main installation function
 */
function install() {
  const packageDir = __dirname;
  const targetBase = getTargetBase();
  const isGlobal = process.env.npm_config_global === 'true';

  log('\n' + colors.bold + '📦 @torka/claude-qol - Installing...' + colors.reset);
  log(`   Target: ${targetBase}`, 'blue');
  log(`   Mode: ${isGlobal ? 'Global' : 'Project-level'}\n`, 'blue');

  // Create target .claude directory if it doesn't exist
  if (!fs.existsSync(targetBase)) {
    fs.mkdirSync(targetBase, { recursive: true });
  }

  // Ensure gitignore entries for package-installed files
  const gitignorePath = path.join(targetBase, '.gitignore');
  const gitignoreEntries = [
    'scripts/auto_approve_safe.py',
    'scripts/auto_approve_safe.rules.json',
    'scripts/context-monitor.py',
    'scripts/__pycache__/',
    'commands/optimize-auto-approve-hook.md',
    'skills/nash/',
    'auto_approve_safe.decisions.jsonl',
    'auto_approve_safe.decisions.archived.jsonl',
    '*.backup',
  ];
  const addedCount = ensureGitignoreEntries(
    gitignorePath,
    gitignoreEntries,
    'Installed by @torka/claude-qol'
  );
  if (addedCount > 0) {
    log(`   Updated .gitignore (added ${addedCount} entries)`, 'green');
  }

  const stats = {
    copied: [],
    updated: [],
    unchanged: [],
    preserved: [],
    backups: [],
    targetBase,
  };

  // Define what to copy and where
  const mappings = [
    { src: 'hooks', dest: 'scripts' },     // Hooks go to scripts directory
    { src: 'scripts', dest: 'scripts' },
    { src: 'commands', dest: 'commands' },
    { src: 'skills', dest: 'skills' },
  ];

  for (const { src, dest } of mappings) {
    const srcPath = path.join(packageDir, src);
    const destPath = path.join(targetBase, dest);

    if (fs.existsSync(srcPath)) {
      log(`\n${colors.bold}${src}/${colors.reset}`);
      copyDirRecursive(srcPath, destPath, stats);
    }
  }

  // Summary
  log('\n' + colors.bold + '📊 Installation Summary' + colors.reset);
  log(`   Files copied: ${stats.copied.length}`, 'green');
  log(`   Files updated: ${stats.updated.length}`, 'blue');
  log(`   Backups created: ${stats.backups.length}`, 'cyan');
  log(`   Files unchanged: ${stats.unchanged.length}`, 'yellow');
  log(`   Files preserved (user config): ${stats.preserved.length}`, 'yellow');

  // Post-install instructions
  log('\n' + colors.bold + '📝 Configuration Required' + colors.reset);
  log('   Add to your .claude/settings.local.json:\n');

  log(colors.yellow + '   Auto-approve hook (recommended):' + colors.reset);
  log('   {');
  log('     "hooks": {');
  log('       "PreToolUse": [{');
  log('         "matcher": "Bash|Read|Grep|Glob|Write|Edit|MultiEdit",');
  log('         "hooks": [{');
  log('           "type": "command",');
  log('           "command": "python3 \\"$CLAUDE_PROJECT_DIR\\"/.claude/scripts/auto_approve_safe.py"');
  log('         }]');
  log('       }]');
  log('     }');
  log('   }\n');

  log(colors.yellow + '   Status line (optional):' + colors.reset);
  log('   {');
  log('     "statusLine": {');
  log('       "type": "command",');
  log('       "command": "python3 \\"$CLAUDE_PROJECT_DIR\\"/.claude/scripts/context-monitor.py"');
  log('     }');
  log('   }\n');

  log('   See examples/settings.local.example.json for a complete example.\n');
}

// Run installation
try {
  install();
} catch (error) {
  logError(`Installation failed: ${error.message}`);
  // Don't exit with error code - allow npm install to complete
  console.error(error);
}
