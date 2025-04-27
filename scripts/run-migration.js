#!/usr/bin/env node

import { spawnSync } from 'child_process';

console.log("Running streak columns migration script...");
const result = spawnSync('node', ['--import', 'tsx', 'scripts/migrate-db-streak-columns.js'], { 
  stdio: 'inherit',
  shell: true 
});

if (result.status !== 0) {
  console.error("Migration script failed with error code", result.status);
  process.exit(1);
}

console.log("Database migration completed ✅");