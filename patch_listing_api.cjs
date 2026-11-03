const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const search = `      await db.query(
        \`
        UPDATE listings
        SET
          title = $1, monthly_rent = $2, cleaning_fee = $3,
          pet_fee = $4, parking_fee = $5, property_type = $6,
          is_published = true,
          updated_at = NOW()
        WHERE id = $7 AND host_id = $8
      \`,
        [title, monthly_rent, cleaning_fee, pet_fee, parking_fee, property_type, id, host_id]
      );`;

const replace = `      // Determine if we can publish.
      const hostCheck = await db.query('SELECT is_host_verified, stripe_payouts_enabled FROM users WHERE id = $1', [host_id]);
      const canPublish = hostCheck.rows.length > 0 && hostCheck.rows[0].is_host_verified && hostCheck.rows[0].stripe_payouts_enabled;

      await db.query(
        \`
        UPDATE listings
        SET
          title = $1, monthly_rent = $2, cleaning_fee = $3,
          pet_fee = $4, parking_fee = $5, property_type = $6,
          is_published = $9,
          updated_at = NOW()
        WHERE id = $7 AND host_id = $8
      \`,
        [title, monthly_rent, cleaning_fee, pet_fee, parking_fee, property_type, id, host_id, canPublish]
      );`;

if (content.includes(search)) {
    fs.writeFileSync('server.ts', content.replace(search, replace));
    console.log("Listing update API patched successfully.");
} else {
    console.log("Could not find Listing update API block.");
}
