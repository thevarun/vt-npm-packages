#!/usr/bin/env node
/**
 * @torka/claude-qol - Pre-uninstall script
 * Removes QoL files from the .claude directory
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
  scripts: [
    'auto_approve_safe.py',
    'auto_approve_safe.rules.json',
    'context-monitor.py',
  ],
  commands: [
    'optimize-auto-approve-hook.md',
    'docs-quick-update.md',
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
        if (pkg.name !== '@torka/claude-qol') {
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

  log('\n' + colors.bold + '📦 @torka/claude-qol - Uninstalling...' + colors.reset);
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
