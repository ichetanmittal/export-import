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
    phone: '+65-6123-4567',
    bank_account_number: '001-234567-8',
    ifsc_code: 'DBSSSGSG',
    geography: 'Singapore'
  },
  {
    email: 'bank@demo.com',
    password: 'Demo@123',
    name: 'DBS Bank',
    role: 'bank',
    organization: 'DBS Bank',
    phone: '+65-6878-8888'
  },
  {
    email: 'exporter@demo.com',
    password: 'Demo@123',
    name: 'XYZ Exports Ltd',
    role: 'exporter',
    organization: 'XYZ Exports Ltd',
    phone: '+91-22-1234-5678',
    bank_account_number: '123456789012',
    ifsc_code: 'ICIC0001234',
    geography: 'Mumbai, India'
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
