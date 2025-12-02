const CHECKER_API_URL = 'http://localhost:3000';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: string;
  organization: string;
  balance?: number;
  bank_role?: string;
}

async function registerUser(userData: RegisterData) {
  try {
    console.log(`Registering ${userData.name}...`);

    const response = await fetch(`${CHECKER_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ ${userData.name} registered successfully!`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Role: ${userData.role}`);
      console.log(`   Bank Role: ${userData.bank_role}`);
      return data;
    } else {
      console.error(`❌ Failed to register ${userData.name}:`, data.error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error registering ${userData.name}:`, error);
    return null;
  }
}

async function main() {
  console.log('🏦 Registering Bank Checker User\n');

  const checkerUser: RegisterData = {
    email: 'checker@demo.com',
    password: 'Demo@123',
    name: 'Bank Checker',
    role: 'bank',
    organization: 'ICICI Bank',
    balance: 10000000,
    bank_role: 'checker'
  };

  const result = await registerUser(checkerUser);

  if (result) {
    console.log('\n✅ Bank checker user created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Email: checker@demo.com');
    console.log('   Password: Demo@123');
    console.log('   Bank Role: checker');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Login as checker@demo.com');
    console.log('   2. Go to /bank/pending-approvals');
    console.log('   3. You will see pending actions created by the maker');
    console.log('   4. Click "Approve" to execute the action\n');
  } else {
    console.log('\n❌ Failed to create checker user. Check the errors above.');
  }
}

main();
