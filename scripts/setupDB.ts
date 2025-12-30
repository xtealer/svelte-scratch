/**
 * Database Setup Script
 *
 * This script initializes the database with the first super admin user.
 * Run this once when setting up a new installation.
 *
 * Usage:
 *   npx tsx scripts/setupDB.ts
 *
 * Or add to package.json scripts:
 *   "setup:db": "tsx scripts/setupDB.ts"
 */

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

// Load environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGO_DB_NAME = 'games';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

function questionHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(prompt);

    const stdin = process.stdin;
    const oldRawMode = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();

    let password = '';

    const onData = (char: Buffer) => {
      const c = char.toString('utf8');

      switch (c) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          stdin.setRawMode(oldRawMode);
          stdin.pause();
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.exit();
          break;
        case '\u007F': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(prompt + '*'.repeat(password.length));
          }
          break;
        default:
          password += c;
          process.stdout.write('*');
          break;
      }
    };

    stdin.on('data', onData);
  });
}

async function main() {
  console.log('\n🎰 Casino Admin - Database Setup\n');
  console.log('='.repeat(40));
  console.log('This script will create the first super admin user.');
  console.log('Super admins can create both admin and seller users.\n');

  // Connect to MongoDB
  console.log(`Connecting to MongoDB: ${MONGODB_URI}`);
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log(`✓ Connected to database: ${MONGO_DB_NAME}\n`);

    const db = client.db(MONGO_DB_NAME);
    const usersCollection = db.collection('users');

    // Check if super admin already exists
    const existingSuperAdmin = await usersCollection.findOne({ role: 'superadmin' });

    if (existingSuperAdmin) {
      console.log('⚠️  A super admin already exists!');
      console.log(`   Username: ${existingSuperAdmin.username}`);
      console.log('\nUse the admin panel to create additional users.');
      rl.close();
      await client.close();
      process.exit(0);
    }

    // Get super admin details
    console.log('Create Super Admin Account\n');

    const username = await question('Username: ');
    if (!username || username.length < 3) {
      console.log('❌ Username must be at least 3 characters');
      rl.close();
      await client.close();
      process.exit(1);
    }

    // Check if username exists
    const existingUser = await usersCollection.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      console.log('❌ Username already exists');
      rl.close();
      await client.close();
      process.exit(1);
    }

    const password = await questionHidden('Password: ');
    if (!password || password.length < 6) {
      console.log('❌ Password must be at least 6 characters');
      rl.close();
      await client.close();
      process.exit(1);
    }

    const confirmPassword = await questionHidden('Confirm Password: ');
    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match');
      rl.close();
      await client.close();
      process.exit(1);
    }

    const name = await question('Full Name: ');
    if (!name) {
      console.log('❌ Name is required');
      rl.close();
      await client.close();
      process.exit(1);
    }

    // Create super admin
    const hashedPassword = await bcrypt.hash(password, 10);

    const superAdmin = {
      username: username.toLowerCase(),
      password: hashedPassword,
      role: 'superadmin',
      name,
      active: true,
      createdAt: new Date()
    };

    await usersCollection.insertOne(superAdmin);

    console.log('\n✅ Super admin created successfully!\n');
    console.log('='.repeat(40));
    console.log(`Username: ${username}`);
    console.log(`Role: Super Admin`);
    console.log('='.repeat(40));
    console.log('\nYou can now log in at /admin');

    // Initialize default games
    const gamesCollection = db.collection('games');
    const existingGames = await gamesCollection.countDocuments();

    if (existingGames === 0) {
      await gamesCollection.insertMany([
        {
          gameId: 'slots',
          name: 'Tragamonedas',
          enabled: true,
          description: 'Slot machine game with 3x3 grid',
          updatedAt: new Date()
        },
        {
          gameId: 'scratch',
          name: 'Raspadita',
          enabled: true,
          description: 'Scratch card lottery game',
          updatedAt: new Date()
        }
      ]);
      console.log('\n✓ Default games initialized');
    }

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    rl.close();
    await client.close();
    console.log('\nDatabase connection closed.');
  }
}

main();
