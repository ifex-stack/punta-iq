#!/bin/bash

echo "Running database migrations and seed..."

# Run migrations
echo "🏗 Pushing schema to database..."
npx drizzle-kit push:pg
if [ $? -ne 0 ]; then
  echo "❌ Failed to push schema to database"
  exit 1
fi

# Run seed script
echo "🌱 Seeding database with initial data..."
node scripts/seed-db.js
if [ $? -ne 0 ]; then
  echo "❌ Failed to seed database"
  exit 1
fi

echo "✅ Database setup completed successfully!"