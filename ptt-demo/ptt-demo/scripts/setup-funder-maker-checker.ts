// Script to set up funder maker-checker users
// Run with: npx tsx scripts/setup-funder-maker-checker.ts

const FUNDER_SETUP_API_URL = 'http://localhost:3000';

async function setupFunderUsers() {
  console.log('🚀 Setting up funder maker-checker users...\n');

  // Step 1: Update existing funder to maker role
  console.log('Step 1: Updating existing funder to maker role...');
  console.log('Run this SQL command:');
  console.log(`UPDATE users SET funder_role = 'maker' WHERE email = 'funder@demo.com';\n`);

  // Step 2: Register checker user
  console.log('Step 2: Registering funder checker user...');

  const checkerUser = {
    email: 'funder-checker@demo.com',
    password: 'Demo@123',
    name: 'GIFT IBU Checker',
    role: 'funder',
    organization: 'GIFT International Banking Unit',
    phone: '+1-555-0105',
    balance: 10000000 // Same balance pool as maker
  };

  try {
    const response = await fetch(`${FUNDER_SETUP_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkerUser)
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Registered: ${checkerUser.email}`);
      console.log('\nNow run this SQL to set checker role:');
      console.log(`UPDATE users SET funder_role = 'checker' WHERE email = 'funder-checker@demo.com';\n`);
    } else {
      console.log(`❌ Failed: ${checkerUser.email} - ${data.error}`);
    }
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('\n✨ Setup complete!\n');
  console.log('Funder Login Credentials:');
  console.log('  Maker:   funder@demo.com / Demo@123');
  console.log('  Checker: funder-checker@demo.com / Demo@123\n');
  console.log('Remember to run the SQL commands above to set the roles!');
}

setupFunderUsers();
