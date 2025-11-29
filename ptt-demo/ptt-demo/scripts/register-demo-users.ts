// Script to register demo users
// Run with: npx tsx scripts/register-demo-users.ts

const API_URL = 'http://localhost:3000';

const demoUsers = [
  {
    email: 'importer@demo.com',
    password: 'Demo@123',
    name: 'ABC Imports Inc',
    role: 'importer',
    organization: 'ABC Imports Inc',
    phone: '+1-555-0101'
  },
  {
    email: 'bank@demo.com',
    password: 'Demo@123',
    name: 'Global Trade Bank',
    role: 'bank',
    organization: 'Global Trade Bank',
    phone: '+1-555-0102'
  },
  {
    email: 'exporter@demo.com',
    password: 'Demo@123',
    name: 'XYZ Exports Ltd',
    role: 'exporter',
    organization: 'XYZ Exports Ltd',
    phone: '+1-555-0103'
  },
  {
    email: 'funder@demo.com',
    password: 'Demo@123',
    name: 'GIFT IBU Funder',
    role: 'funder',
    organization: 'GIFT International Banking Unit',
    phone: '+1-555-0104'
  }
];

async function registerUsers() {
  console.log('🚀 Registering demo users...\n');

  for (const user of demoUsers) {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Registered: ${user.email} (${user.role})`);
      } else {
        console.log(`❌ Failed: ${user.email} - ${data.error}`);
      }
    } catch (error: any) {
      console.log(`❌ Error registering ${user.email}: ${error.message}`);
    }
  }

  console.log('\n✨ Demo users registration complete!');
  console.log('\nYou can now login with:');
  console.log('  importer@demo.com / Demo@123');
  console.log('  bank@demo.com / Demo@123');
  console.log('  exporter@demo.com / Demo@123');
  console.log('  funder@demo.com / Demo@123');
}

registerUsers();
