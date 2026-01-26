#!/usr/bin/env node
/**
 * @torka/claude-workflows - Post-install script
 * Copies workflow files to the appropriate .claude directory
 * 
 * Behavior: Always syncs files from the package (overwrites if different)
 * - New files are copied
 * - Existing files are updated if content differs (backup created)
 * - Identical files are skipped (no-op)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ANSI colors for output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logUpdate(message) {
  log(`  ↻ ${message}`, 'cyan');
}

function logBackup(message) {
  log(`  ⤷ ${message}`, 'yellow');
}

function logSkip(message) {
  log(`  ○ ${message}`, 'yellow');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
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
      // Make sure it's not our own package.json
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (pkg.name !== '@torka/claude-workflows') {
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
 * - New files: copied
 * - Changed files: backed up (.backup), then updated
 * - Identical files: skipped
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
        // File exists - check if content differs
        const srcContent = fs.readFileSync(srcPath);
        const destContent = fs.readFileSync(destPath);

        if (srcContent.equals(destContent)) {
          // Identical - skip
          stats.unchanged.push(destPath);
          logSkip(`Unchanged: ${path.relative(stats.targetBase, destPath)}`);
        } else {
          // Different - backup existing file, then update
          const backupPath = destPath + '.backup';
          fs.copyFileSync(destPath, backupPath);
          stats.backups.push(backupPath);
          logBackup(`Backup: ${path.relative(stats.targetBase, backupPath)}`);

          fs.copyFileSync(srcPath, destPath);
          stats.updated.push(destPath);
          logUpdate(`Updated: ${path.relative(stats.targetBase, destPath)}`);
        }
      } else {
        // New file - copy
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

  log('\n' + colors.bold + '📦 @torka/claude-workflows - Installing...' + colors.reset);
  log(`   Target: ${targetBase}`, 'blue');
  log(`   Mode: ${isGlobal ? 'Global' : 'Project-level'}\n`, 'blue');

  // Create target .claude directory if it doesn't exist
  if (!fs.existsSync(targetBase)) {
    fs.mkdirSync(targetBase, { recursive: true });
  }

  // Ensure gitignore entries for package-installed files
  const gitignorePath = path.join(targetBase, '.gitignore');
  const gitignoreEntries = [
    'commands/implement-epic-with-subagents.md',
    'commands/plan-parallelization.md',
    'commands/git-local-cleanup-push-pr.md',
    'commands/github-pr-resolve.md',
    'commands/dev-story-backend.md',
    'commands/dev-story-fullstack.md',
    'commands/dev-story-ui.md',
    'agents/principal-code-reviewer.md',
    'agents/story-prep-master.md',
    'agents/desk-check-gate.md',
    'skills/agent-creator/',
    'skills/designer-founder/',
    '*.backup',
  ];
  const addedCount = ensureGitignoreEntries(
    gitignorePath,
    gitignoreEntries,
    'Installed by @torka/claude-workflows'
  );
  if (addedCount > 0) {
    log(`   Updated .claude/.gitignore (added ${addedCount} entries)`, 'green');
  }

  const stats = {
    copied: [],
    updated: [],
    unchanged: [],
    backups: [],
    targetBase,
  };

  // Define what to copy and where
  // Note: dest is relative to targetBase (.claude/)
  // Use '../' to go to project root for _bmad/ paths
  const mappings = [
    { src: 'commands', dest: 'commands' },
    { src: 'agents', dest: 'agents' },
    { src: 'skills', dest: 'skills' },
    // BMAD workflows (installed to project root, not .claude/)
    {
      src: 'bmad-workflows/bmm/workflows/4-implementation/implement-epic-with-subagents',
      dest: '../_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents',
    },
  ];

  for (const { src, dest } of mappings) {
    const srcPath = path.join(packageDir, src);
    const destPath = path.join(targetBase, dest);

    if (fs.existsSync(srcPath)) {
      log(`\n${colors.bold}${src}/${colors.reset}`);
      copyDirRecursive(srcPath, destPath, stats);
    }
  }

  // Ensure gitignore entries for BMAD workflow
  const bmadDir = path.join(targetBase, '../_bmad');
  if (fs.existsSync(bmadDir)) {
    const bmadGitignorePath = path.join(bmadDir, '.gitignore');
    const bmadEntries = [
      'bmm/workflows/4-implementation/implement-epic-with-subagents/',
    ];
    const bmadAdded = ensureGitignoreEntries(
      bmadGitignorePath,
      bmadEntries,
      'Installed by @torka/claude-workflows'
    );
    if (bmadAdded > 0) {
      log(`   Updated _bmad/.gitignore (added ${bmadAdded} entries)`, 'green');
    }
  }

  // Ensure gitignore entries for BMAD output
  const bmadOutputDir = path.join(targetBase, '../_bmad-output');
  if (fs.existsSync(bmadOutputDir)) {
    const bmadOutputGitignorePath = path.join(bmadOutputDir, '.gitignore');
    const bmadOutputEntries = [
      'epic-executions/',
    ];
    const outputAdded = ensureGitignoreEntries(
      bmadOutputGitignorePath,
      bmadOutputEntries,
      'Runtime output from @torka/claude-workflows'
    );
    if (outputAdded > 0) {
      log(`   Updated _bmad-output/.gitignore (added ${outputAdded} entries)`, 'green');
    }
  }

  // Summary
  log('\n' + colors.bold + '📊 Installation Summary' + colors.reset);
  log(`   Files copied (new): ${stats.copied.length}`, 'green');
  log(`   Files updated: ${stats.updated.length}`, 'cyan');
  log(`   Files unchanged: ${stats.unchanged.length}`, 'yellow');
  if (stats.backups.length > 0) {
    log(`   Backups created: ${stats.backups.length} (*.backup files)`, 'yellow');
  }

  // Post-install instructions
  log('\n' + colors.bold + '📝 Next Steps' + colors.reset);
  log('   1. Run /git-cleanup-and-merge or /plan-parallelization to test');
  log('   2. Try /designer-founder for UI/UX design workflows');
  log('   3. Use /dev-story-ui, /dev-story-backend, or /dev-story-fullstack for story execution\n');

  // Note about BMAD dependencies
  log(colors.yellow + '⚠️  Note: Some components work better with BMAD Method installed:' + colors.reset);
  log('   - principal-code-reviewer (uses BMAD code-review workflow)');
  log('   - story-prep-master (uses BMAD story workflows)');
  log('\n   Fully included (no external dependencies):');
  log('   ✓ git-cleanup-and-merge');
  log('   ✓ plan-parallelization');
  log('   ✓ implement-epic-with-subagents (workflow files included)');
  log('   ✓ dev-story-ui, dev-story-backend, dev-story-fullstack');
  log('   ✓ agent-creator skill (with expertise profiles)');
  log('   ✓ designer-founder skill');
  log('   ✓ desk-check-gate agent\n');
}

// Run installation
try {
  install();
} catch (error) {
  logError(`Installation failed: ${error.message}`);
  // Don't exit with error code - allow npm install to complete
  console.error(error);
}
