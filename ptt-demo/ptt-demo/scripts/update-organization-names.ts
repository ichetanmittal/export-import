// Script to update organization names for existing users
// Run with: npx tsx scripts/update-organization-names.ts

const UPDATE_API_URL = 'http://localhost:3000';

const updates = [
  {
    email: 'importer@demo.com',
    newName: 'Gf Machining Solutions Pte Ltd SG',
    newOrganization: 'Gf Machining Solutions Pte Ltd SG'
  },
  {
    email: 'exporter@demo.com',
    newName: 'S G Fabtex Pvt Ltd India',
    newOrganization: 'S G Fabtex Pvt Ltd India'
  }
];

async function updateOrganizationNames() {
  console.log('🔄 Updating organization names...\n');

  for (const update of updates) {
    try {
      // First, get the user by email to get their ID
      const getUserResponse = await fetch(`${UPDATE_API_URL}/api/auth/user-by-email?email=${encodeURIComponent(update.email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!getUserResponse.ok) {
        console.log(`❌ User not found: ${update.email}`);
        continue;
      }

      const userData = await getUserResponse.json();
      const userId = userData.data.id;

      // Update the user's name and organization
      const updateResponse = await fetch(`${UPDATE_API_URL}/api/auth/user/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: update.newName,
          organization: update.newOrganization
        })
      });

      const updateData = await updateResponse.json();

      if (updateResponse.ok) {
        console.log(`✅ Updated: ${update.email}`);
        console.log(`   Name: ${update.newName}`);
        console.log(`   Organization: ${update.newOrganization}\n`);
      } else {
        console.log(`❌ Failed to update: ${update.email} - ${updateData.error}\n`);
      }
    } catch (error: any) {
      console.log(`❌ Error updating ${update.email}: ${error.message}\n`);
    }
  }

  console.log('✨ Organization names update complete!');
}

updateOrganizationNames();
