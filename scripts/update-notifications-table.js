/**
 * Update notifications table to add required columns for timezone-based scheduling
 */
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create a new database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addColumnsToNotificationsTable() {
  const client = await pool.connect();
  
  try {
    console.log('Beginning transaction...');
    await client.query('BEGIN');
    
    // Check if the columns already exist
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name IN ('scheduled_for', 'is_delivered', 'delivered_at', 'priority', 'channel', 'timezone_offset');
    `);
    
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    console.log('Existing columns:', existingColumns);
    
    // Add columns that don't exist yet
    if (!existingColumns.includes('scheduled_for')) {
      console.log('Adding scheduled_for column...');
      await client.query(`
        ALTER TABLE notifications 
        ADD COLUMN scheduled_for TIMESTAMP WITH TIME ZONE;
      `);
    }
    
    if (!existingColumns.includes('is_delivered')) {
      console.log('Adding is_delivered column...');
      await client.query(`
        ALTER TABLE notifications 
        ADD COLUMN is_delivered BOOLEAN DEFAULT FALSE;
      `);
    }
    
    if (!existingColumns.includes('delivered_at')) {
      console.log('Adding delivered_at column...');
      await client.query(`
        ALTER TABLE notifications 
        ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
      `);
    }
    
    if (!existingColumns.includes('priority')) {
      console.log('Adding priority column...');
      await client.query(`
        ALTER TABLE notifications 
        ADD COLUMN priority INTEGER DEFAULT 1;
      `);
    }
    
    if (!existingColumns.includes('channel')) {
      console.log('Adding channel column...');
      await client.query(`
        ALTER TABLE notifications 
        ADD COLUMN channel TEXT DEFAULT 'in-app';
      `);
    }
    
    if (!existingColumns.includes('timezone_offset')) {
      console.log('Adding timezone_offset column...');
      await client.query(`
        ALTER TABLE notifications 
        ADD COLUMN timezone_offset INTEGER;
      `);
    }
    
    await client.query('COMMIT');
    console.log('Transaction committed. Notifications table updated successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating notifications table:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await addColumnsToNotificationsTable();
    console.log('Database schema update completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Failed to update database schema:', error);
    process.exit(1);
  }
}

main();