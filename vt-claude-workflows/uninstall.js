#!/usr/bin/env node
/**
 * @torka/claude-workflows - Pre-uninstall script
 * Removes workflow files from the .claude directory
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
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logSkip(message) {
  log(`  ○ ${message}`, 'yellow');
}

/**
 * Files that were installed by this package
 * Only remove files we installed, not user-modified files
 */
const INSTALLED_FILES = {
  commands: [
    'implement-epic-with-subagents.md',
    'plan-parallelization.md',
    'git-local-cleanup-push-pr.md',
    'github-pr-resolve.md',
    'dev-story-backend.md',
    'dev-story-fullstack.md',
    'dev-story-ui.md',
  ],
  agents: [
    'principal-code-reviewer.md',
    'story-prep-master.md',
    'desk-check-gate.md',
  ],
  'skills/agent-creator': [
    'SKILL.md',
    'REGISTRY.yaml',
    'STORY-AGENT-TEMPLATE.md',
    'NON-STORY-AGENT-TEMPLATE.md',
    'COMMUNITY-REPOS.md',
  ],
  'skills/agent-creator/expertise': [
    'INDEX.md',
    'react-frontend.md',
    'backend-api.md',
    'nextjs-fullstack.md',
    'testing.md',
    'database-orm.md',
    'devops-ci.md',
  ],
  'skills/designer-founder': [
    'workflow.md',
  ],
  'skills/designer-founder/steps': [
    'step-01-context.md',
    'step-01b-continue.md',
    'step-02-scope.md',
    'step-03-design.md',
    'step-04-artifacts.md',
  ],
  'skills/designer-founder/templates': [
    'component-strategy.md',
    'design-brief.md',
    'layouts.md',
    'user-journeys.md',
  ],
  'skills/designer-founder/tools': [
    'conversion.md',
    'direct-mapping.md',
    'magicpatterns.md',
    'superdesign.md',
    'wireframe.md',
  ],
  'skills/designer-founder/tools/superdesign-assets': [
    'generate-theme.ts',
    'superdesign-agent-instructions.md',
  ],
};

/**
 * BMAD workflow files installed to _bmad/ (relative to project root)
 * These use ../ from .claude/ to reach project root
 */
const BMAD_INSTALLED_FILES = {
  '../_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents': [
    'workflow.md',
    'workflow.yaml',
    'workflow-plan-implement-epic-with-subagents.md',
    'completion-summary-implement-epic-with-subagents.md',
  ],
  '../_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents/steps': [
    'step-01-init.md',
    'step-01b-continue.md',
    'step-01c-new.md',
    'step-02-orchestrate.md',
    'step-03-complete.md',
  ],
  '../_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents/templates': [
    'epic-completion-report.md',
  ],
  '../_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents/validation': [
    'checklist.md',
  ],
  '../_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents/checklists': [
    'desk-check-checklist.md',
  ],
};

/**
 * Determine the target .claude directory based on installation context
 */
function getTargetBase() {
  const isGlobal = process.env.npm_config_global === 'true';

  if (isGlobal) {
    return path.join(os.homedir(), '.claude');
  }

  let projectRoot = process.env.INIT_CWD || process.cwd();

  while (projectRoot !== path.dirname(projectRoot)) {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
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

  return path.join(process.env.INIT_CWD || process.cwd(), '.claude');
}

/**
 * Remove a file if it exists and matches what we installed
 */
function removeFile(filePath, stats) {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      stats.removed.push(filePath);
      logSuccess(`Removed: ${path.relative(stats.targetBase, filePath)}`);
    } catch (error) {
      stats.failed.push({ path: filePath, error: error.message });
      log(`  ✗ Failed to remove: ${path.relative(stats.targetBase, filePath)}`, 'red');
    }
  } else {
    stats.notFound.push(filePath);
    logSkip(`Not found: ${path.relative(stats.targetBase, filePath)}`);
  }
}

/**
 * Remove empty directories
 */
function removeEmptyDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    if (files.length === 0) {
      fs.rmdirSync(dirPath);
      return true;
    }
  }
  return false;
}

/**
 * Main uninstall function
 */
function uninstall() {
  const targetBase = getTargetBase();
  const isGlobal = process.env.npm_config_global === 'true';

  log('\n' + colors.bold + '📦 @torka/claude-workflows - Uninstalling...' + colors.reset);
  log(`   Target: ${targetBase}`, 'blue');
  log(`   Mode: ${isGlobal ? 'Global' : 'Project-level'}\n`, 'blue');

  if (!fs.existsSync(targetBase)) {
    log('   .claude directory not found, nothing to remove.\n', 'yellow');
    return;
  }

  const stats = {
    removed: [],
    notFound: [],
    failed: [],
    targetBase,
  };

  // Remove files by category
  for (const [dir, files] of Object.entries(INSTALLED_FILES)) {
    log(`\n${colors.bold}${dir}/${colors.reset}`);
    for (const file of files) {
      const filePath = path.join(targetBase, dir, file);
      removeFile(filePath, stats);
    }

    // Try to remove empty directories
    const dirPath = path.join(targetBase, dir);
    if (removeEmptyDir(dirPath)) {
      log(`  ○ Removed empty directory: ${dir}/`, 'yellow');
    }
  }

  // Remove BMAD workflow files (installed to _bmad/ relative to project root)
  log('\n' + colors.bold + 'BMAD Workflows' + colors.reset);
  for (const [dir, files] of Object.entries(BMAD_INSTALLED_FILES)) {
    const displayDir = dir.replace('../', '');
    log(`\n${colors.bold}${displayDir}/${colors.reset}`);
    for (const file of files) {
      const filePath = path.join(targetBase, dir, file);
      removeFile(filePath, stats);
    }

    // Try to remove empty directories
    const dirPath = path.join(targetBase, dir);
    if (removeEmptyDir(dirPath)) {
      log(`  ○ Removed empty directory: ${displayDir}/`, 'yellow');
    }
  }

  // Clean up empty BMAD directories (from deepest to shallowest)
  const bmadDirs = [
    '../_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents/checklists',
    '../_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents/validation',
    '../_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents/templates',
    '../_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents/steps',
    '../_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents',
  ];
  for (const bmadSubDir of bmadDirs) {
    const dirPath = path.join(targetBase, bmadSubDir);
    if (removeEmptyDir(dirPath)) {
      log(`  ○ Removed empty directory: ${bmadSubDir.replace('../', '')}/`, 'yellow');
    }
  }

  // Try to remove skill directories if empty
  const skillDirs = [
    'skills/designer-founder/tools/superdesign-assets',
    'skills/designer-founder/tools',
    'skills/designer-founder/templates',
    'skills/designer-founder/steps',
    'skills/designer-founder',
    'skills/agent-creator/expertise',
    'skills/agent-creator',
  ];
  for (const skillSubDir of skillDirs) {
    const dirPath = path.join(targetBase, skillSubDir);
    if (removeEmptyDir(dirPath)) {
      log(`  ○ Removed empty directory: ${skillSubDir}/`, 'yellow');
    }
  }

  // Summary
  log('\n' + colors.bold + '📊 Uninstall Summary' + colors.reset);
  log(`   Files removed: ${stats.removed.length}`, 'green');
  log(`   Files not found: ${stats.notFound.length}`, 'yellow');
  if (stats.failed.length > 0) {
    log(`   Failed to remove: ${stats.failed.length}`, 'red');
  }

  log('\n' + colors.yellow + '⚠️  Note: settings.local.json was not modified.' + colors.reset);
  log('   You may want to manually remove hook/statusLine configurations.\n');
}

// Run uninstall
try {
  uninstall();
} catch (error) {
  log(`Uninstall warning: ${error.message}`, 'yellow');
  // Don't exit with error code - allow npm uninstall to complete
}
