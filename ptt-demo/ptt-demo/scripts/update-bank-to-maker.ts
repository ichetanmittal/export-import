const UPDATE_API_URL = 'http://localhost:3000';

async function updateBankUserToMaker() {
  try {
    console.log('🔄 Updating existing bank user to maker role...\n');

    // First, get the bank user by email
    const getUserResponse = await fetch(`${UPDATE_API_URL}/api/auth/user-by-email?email=bank@demo.com`);

    if (!getUserResponse.ok) {
      console.error('❌ Could not find bank user');
      return;
    }

    const userData = await getUserResponse.json();
    const bankUser = userData.user;

    console.log(`Found user: ${bankUser.name} (${bankUser.email})`);
    console.log(`Current bank_role: ${bankUser.bank_role || 'not set'}\n`);

    // Update the user to have maker role
    const updateResponse = await fetch(`${UPDATE_API_URL}/api/auth/user/${bankUser.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bank_role: 'maker'
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('❌ Failed to update user:', errorData.error);
      return;
    }

    const updatedData = await updateResponse.json();

    console.log('✅ Successfully updated bank user!');
    console.log(`   Email: ${updatedData.user.email}`);
    console.log(`   Bank Role: ${updatedData.user.bank_role}`);
    console.log('\n📋 Login Credentials:');
    console.log('   Email: bank@demo.com');
    console.log('   Password: Demo@123');
    console.log('   Bank Role: maker');
    console.log('\n🎯 As maker, when you click "Issue PTT", it will create a pending action for checker approval.\n');

  } catch (error) {
    console.error('❌ Error updating bank user:', error);
  }
}

updateBankUserToMaker();
