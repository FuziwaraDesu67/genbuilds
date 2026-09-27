import 'dotenv/config';
import { db } from '../src/lib/db';
import { players, builds } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await db.delete(builds);
    await db.delete(players);

    // Create sample players
    console.log('Creating sample players...');
    const samplePlayers = [
      {
        uid: '600000001',
        nickname: 'TravelerOne',
        ar: 60,
        signature: 'Testing the leaderboard!',
      },
      {
        uid: '600000002',
        nickname: 'ElementalMaster',
        ar: 59,
      },
      {
        uid: '600000003',
        nickname: 'ArtifactFarmer',
        ar: 60,
        signature: 'Grinding for perfect substats',
      },
    ];

    await db.insert(players).values(samplePlayers);

    // Create sample builds
    console.log('Creating sample builds...');
    const sampleBuilds = [
      {
        uid: '600000001',
        avatarId: 10000046, // Hu Tao
        weaponId: 11510, // Staff of Homa
        artifactSets: { 15005: 4 }, // 4pc Crimson Witch
        stats: {
          hp: 35558,
          atk: 1234,
          def: 876,
          em: 105,
          er: 100,
          cr: 91.2,
          cd: 202.3,
          dmgBonus: { pyro: 61.6 },
        },
        talentLevels: { normal: 10, skill: 10, burst: 10 },
        constellation: 6,
        calculatedDamage: '125600',
      },
      {
        uid: '600000002',
        avatarId: 10000087, // Neuvillette
        weaponId: 14512, // Tome of the Eternal Flow
        artifactSets: { 15027: 4 }, // 4pc Marechaussee Hunter
        stats: {
          hp: 42000,
          atk: 1150,
          def: 750,
          em: 50,
          er: 115.2,
          cr: 85.4,
          cd: 195.7,
          dmgBonus: { hydro: 46.6 },
        },
        talentLevels: { normal: 10, skill: 9, burst: 9 },
        constellation: 1,
        calculatedDamage: '118500',
      },
      {
        uid: '600000003',
        avatarId: 10000046, // Hu Tao (different player)
        weaponId: 11509, // Dragon's Bane
        artifactSets: { 15005: 4 },
        stats: {
          hp: 33200,
          atk: 1098,
          def: 820,
          em: 180,
          er: 105,
          cr: 75.8,
          cd: 188.9,
          dmgBonus: { pyro: 61.6 },
        },
        talentLevels: { normal: 9, skill: 10, burst: 8 },
        constellation: 1,
        calculatedDamage: '98400',
      },
      {
        uid: '600000001',
        avatarId: 10000052, // Raiden Shogun
        weaponId: 11509, // Engulfing Lightning
        artifactSets: { 15008: 4 }, // 4pc Emblem
        stats: {
          hp: 24500,
          atk: 2150,
          def: 890,
          em: 40,
          er: 268.5,
          cr: 62.3,
          cd: 142.8,
          dmgBonus: { electro: 46.6 },
        },
        talentLevels: { normal: 6, skill: 10, burst: 10 },
        constellation: 2,
        calculatedDamage: '145200',
      },
    ];

    await db.insert(builds).values(sampleBuilds);

    console.log('✅ Seeding complete!');
    console.log(`   - ${samplePlayers.length} players created`);
    console.log(`   - ${sampleBuilds.length} builds created`);

    // Verify data
    const playerCount = await db.select({ count: sql<number>`count(*)` }).from(players);
    const buildCount = await db.select({ count: sql<number>`count(*)` }).from(builds);

    console.log('\n📊 Database stats:');
    console.log(`   - Players: ${playerCount[0].count}`);
    console.log(`   - Builds: ${buildCount[0].count}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
