import { db } from '../server/db.js';

async function deleteUser() {
  const email = process.argv[2];

  if (!email) {
    console.error('Error: Please provide an email address.');
    console.log('Usage: npx tsx scripts/delete_user.ts <email>');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    // Initialize DB connection (this sets up both local and railway connections)
    await db.initDb();

    console.log(`Deleting user with email: ${email}`);

    // First find the user to get their ID to delete related records if any
    const findResult = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);

    if (findResult.rows.length === 0) {
      console.log(`User with email '${email}' not found in the database.`);
      process.exit(0);
    }

    const userId = findResult.rows[0].id;
    console.log(`Found user with ID: ${userId}. Proceeding with deletion...`);

    // Optionally you may need to delete related records in other tables if ON DELETE CASCADE is not configured
    // For now, let's try to delete the user.
    const deleteResult = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);

    if (deleteResult.rows.length > 0) {
      console.log(`Successfully deleted user '${email}'.`);
    } else {
      console.log(`Failed to delete user '${email}'.`);
    }

    process.exit(0);
  } catch (error) {
    console.error('An error occurred while deleting the user:', error);
    process.exit(1);
  }
}

deleteUser();
