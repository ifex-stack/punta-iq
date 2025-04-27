#!/usr/bin/env node

import { spawnSync } from 'child_process';

console.log("Running database schema push...");
const result = spawnSync('npx', ['drizzle-kit', 'push:pg'], { 
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

if (result.status !== 0) {
  console.error("Database push failed with error code", result.status);
  process.exit(1);
}

console.log("Database schema updated successfully ✅");