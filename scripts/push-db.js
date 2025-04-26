const { exec } = require('child_process');

console.log('🏗 Pushing schema to the database...');

exec('npx drizzle-kit push:pg', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  
  console.log(`stdout: ${stdout}`);
  console.log('✅ Database schema pushed successfully!');
});