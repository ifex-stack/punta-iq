// Migration script to add streak tracking columns to the database
import { db } from "../server/db.js";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Running migration to add streak tracking columns...");

  try {
    // Check if referral_streak column exists in users table
    const checkReferralStreakColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'referral_streak'
    `);

    if (!checkReferralStreakColumn.rows.length) {
      console.log("Adding referral_streak column to users table...");
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN referral_streak INTEGER NOT NULL DEFAULT 0
      `);
      console.log("✅ referral_streak column added successfully");
    } else {
      console.log("✅ referral_streak column already exists");
    }

    // Check if last_referral_date column exists in users table
    const checkLastReferralDateColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'last_referral_date'
    `);

    if (!checkLastReferralDateColumn.rows.length) {
      console.log("Adding last_referral_date column to users table...");
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN last_referral_date TIMESTAMP
      `);
      console.log("✅ last_referral_date column added successfully");
    } else {
      console.log("✅ last_referral_date column already exists");
    }

    // Check if completed_at column exists in referrals table
    const checkCompletedAtColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'referrals' 
      AND column_name = 'completed_at'
    `);

    if (!checkCompletedAtColumn.rows.length) {
      console.log("Adding completed_at column to referrals table...");
      await db.execute(sql`
        ALTER TABLE referrals 
        ADD COLUMN completed_at TIMESTAMP
      `);
      console.log("✅ completed_at column added successfully");
    } else {
      console.log("✅ completed_at column already exists");
    }

    // Check if reward_amount column exists in referrals table
    const checkRewardAmountColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'referrals' 
      AND column_name = 'reward_amount'
    `);

    if (!checkRewardAmountColumn.rows.length) {
      console.log("Adding reward_amount column to referrals table...");
      await db.execute(sql`
        ALTER TABLE referrals 
        ADD COLUMN reward_amount INTEGER
      `);
      console.log("✅ reward_amount column added successfully");
    } else {
      console.log("✅ reward_amount column already exists");
    }

    // Check if reward_date column exists in referrals table
    const checkRewardDateColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'referrals' 
      AND column_name = 'reward_date'
    `);

    if (!checkRewardDateColumn.rows.length) {
      console.log("Adding reward_date column to referrals table...");
      await db.execute(sql`
        ALTER TABLE referrals 
        ADD COLUMN reward_date TIMESTAMP
      `);
      console.log("✅ reward_date column added successfully");
    } else {
      console.log("✅ reward_date column already exists");
    }

    console.log("Migration completed successfully! ✨");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});