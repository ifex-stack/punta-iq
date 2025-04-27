-- SQL script to add streak tracking columns to the database

-- Add missing columns to the users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referral_streak') THEN
        ALTER TABLE users ADD COLUMN referral_streak INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added referral_streak column to users table';
    ELSE
        RAISE NOTICE 'referral_streak column already exists in users table';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_referral_date') THEN
        ALTER TABLE users ADD COLUMN last_referral_date TIMESTAMP;
        RAISE NOTICE 'Added last_referral_date column to users table';
    ELSE
        RAISE NOTICE 'last_referral_date column already exists in users table';
    END IF;
END $$;

-- Add missing columns to the referrals table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'completed_at') THEN
        ALTER TABLE referrals ADD COLUMN completed_at TIMESTAMP;
        RAISE NOTICE 'Added completed_at column to referrals table';
    ELSE
        RAISE NOTICE 'completed_at column already exists in referrals table';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'reward_amount') THEN
        ALTER TABLE referrals ADD COLUMN reward_amount INTEGER;
        RAISE NOTICE 'Added reward_amount column to referrals table';
    ELSE
        RAISE NOTICE 'reward_amount column already exists in referrals table';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'reward_date') THEN
        ALTER TABLE referrals ADD COLUMN reward_date TIMESTAMP;
        RAISE NOTICE 'Added reward_date column to referrals table';
    ELSE
        RAISE NOTICE 'reward_date column already exists in referrals table';
    END IF;
END $$;