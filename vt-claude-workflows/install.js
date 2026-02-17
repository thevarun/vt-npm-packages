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

// Files that should not be overwritten if user has customized them
const PROTECTED_FILES = [
  'vt-preferences.md',
];

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

function logPreserve(message) {
  log(`  ★ ${message}`, 'yellow');
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
        // Check if this is a protected user config file
        if (PROTECTED_FILES.includes(entry.name)) {
          stats.preserved.push(destPath);
          logPreserve(`Preserved (user config): ${path.relative(stats.targetBase, destPath)}`);
          continue;
        }

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
    'skills/product-architect/',
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
    preserved: [],
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
      'screenshots/',
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
  if (stats.preserved.length > 0) {
    log(`   Files preserved: ${stats.preserved.length} (user config)`, 'yellow');
  }
  if (stats.backups.length > 0) {
    log(`   Backups created: ${stats.backups.length} (*.backup files)`, 'yellow');
  }

  // Post-install instructions
  log('\n' + colors.bold + '📝 Next Steps' + colors.reset);
  log('   1. Run /git-cleanup-and-merge or /plan-parallelization to test');
  log('   2. Try /designer-founder for UI/UX design workflows');
  log('   3. Try /product-architect for autonomous PRD + Architecture (requires Agent Teams)');
  log('   4. Use /dev-story-ui, /dev-story-backend, or /dev-story-fullstack for story execution\n');

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
  log('   ✓ product-architect skill (requires Agent Teams + BMAD)');
  log('   ✓ desk-check-gate agent\n');
}

/**
 * Auto-install Vercel react-best-practices skill for performance optimization
 * Provides 57 React/Next.js performance rules with built-in guidance
 */
async function installReactBestPractices(isGlobal) {
  const { execSync } = require('child_process');

  log('\n' + colors.bold + '════════════════════════════════════════════════════════════' + colors.reset);
  log(colors.bold + '  REACT BEST PRACTICES SETUP' + colors.reset);
  log(colors.bold + '════════════════════════════════════════════════════════════' + colors.reset);
  log('\nInstalling Vercel react-best-practices skill (57 performance rules)...\n');

  const globalFlag = isGlobal ? ' -g' : '';
  const execOptions = {
    stdio: 'inherit',
    timeout: 90000,
    cwd: isGlobal ? undefined : (process.env.INIT_CWD || process.cwd()),
  };

  try {
    execSync(`npx skills add vercel-labs/agent-skills --skill react-best-practices${globalFlag} -a claude-code -y`, execOptions);

    log('\n' + colors.bold + '════════════════════════════════════════════════════════════' + colors.reset);
    log(colors.green + colors.bold + '  ✓ REACT BEST PRACTICES INSTALLED' + colors.reset);
    log('');
    log('  The skill provides guidance for:');
    log('  - Eliminating waterfalls (CRITICAL)');
    log('  - Bundle size optimization (CRITICAL)');
    log('  - Server-side performance (HIGH)');
    log('  - Re-render optimization (MEDIUM)');
    log('');
    log('  To update: npx skills update');
    log(colors.bold + '════════════════════════════════════════════════════════════' + colors.reset + '\n');

  } catch (error) {
    log('\n' + colors.bold + '════════════════════════════════════════════════════════════' + colors.reset);
    log(colors.yellow + colors.bold + '  ⚠ REACT BEST PRACTICES INSTALLATION SKIPPED' + colors.reset);
    log('');
    log('  To install manually:');
    log('  npx skills add vercel-labs/agent-skills --skill react-best-practices -g -a claude-code');
    log(colors.bold + '════════════════════════════════════════════════════════════' + colors.reset + '\n');
  }
}

/**
 * Auto-install Google's stitch-skills for Stitch integration
 * These skills enhance the designer-founder workflow with Stitch support
 */
async function installStitchSkills(isGlobal) {
  const { execSync } = require('child_process');

  log('\n' + colors.bold + '════════════════════════════════════════════════════════════' + colors.reset);
  log(colors.bold + '  STITCH INTEGRATION SETUP' + colors.reset);
  log(colors.bold + '════════════════════════════════════════════════════════════' + colors.reset);
  log('\nInstalling Google stitch-skills for Stitch design tool...\n');

  const globalFlag = isGlobal ? ' -g' : '';
  const execOptions = {
    stdio: 'inherit',
    timeout: 60000,
    cwd: isGlobal ? undefined : (process.env.INIT_CWD || process.cwd()),
  };

  try {
    // Install react-components skill (for HTML→React conversion)
    execSync(`npx skills add google-labs-code/stitch-skills --skill react-components${globalFlag} -a claude-code -y`, execOptions);

    log('\n' + colors.bold + '════════════════════════════════════════════════════════════' + colors.reset);
    log(colors.green + colors.bold + '  ✓ STITCH SKILLS INSTALLED SUCCESSFULLY' + colors.reset);
    log('');
    log('  To use Stitch in designer-founder workflow:');
    log('  1. Configure Stitch MCP server');
    log('  2. Run /designer-founder and select [T] Stitch');
    log('');
    log('  To update skills later: npx skills update');
    log(colors.bold + '════════════════════════════════════════════════════════════' + colors.reset + '\n');

  } catch (error) {
    log('\n' + colors.bold + '════════════════════════════════════════════════════════════' + colors.reset);
    log(colors.yellow + colors.bold + '  ⚠ STITCH SKILLS INSTALLATION SKIPPED' + colors.reset);
    log('');
    log('  Could not auto-install stitch-skills.');
    log('  This may be due to network issues or missing dependencies.');
    log('');
    log('  To install manually later:');
    log('  npx skills add google-labs-code/stitch-skills -g -a claude-code');
    log('');
    log('  You can still use other design tools (SuperDesign, MagicPatterns).');
    log(colors.bold + '════════════════════════════════════════════════════════════' + colors.reset + '\n');
  }
}

// Run installation
try {
  const isGlobal = process.env.npm_config_global === 'true';
  install();
  // Attempt to install external skills (non-blocking)
  installReactBestPractices(isGlobal);
  installStitchSkills(isGlobal);
} catch (error) {
  logError(`Installation failed: ${error.message}`);
  // Don't exit with error code - allow npm install to complete
  console.error(error);
}
