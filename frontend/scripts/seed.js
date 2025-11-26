#!/usr/bin/env node

/**
 * Development Seed Script
 *
 * This script seeds the IndexedDB with sample data for development purposes.
 * Run this script manually when you need to populate the database with test data.
 *
 * Usage:
 *   npm run seed
 */

import { seedDatabase } from './infrastructure/db/seed.js'

console.log('Starting database seeding...')

seedDatabase()
  .then(() => {
    console.log('✅ Database seeding completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Database seeding failed:', error)
    process.exit(1)
  })
