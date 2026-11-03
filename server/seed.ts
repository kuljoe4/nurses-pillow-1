import { db } from './db.js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { NC_HOSPITAL_SEEDS, NC_LISTING_SEEDS } from '../src/services/database.js';

dotenv.config();

async function seed() {
  console.log('Seeding Database with Enterprise Schema...');

  try {
    // Provision super_admin securely using environment variables
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
      console.log('Provisioning super_admin account based on environment variables...');
      const saltRounds = 10;
      const adminHash = await bcrypt.hash(adminPassword, saltRounds);
      await db.query(`
        INSERT INTO users (id, email, password_hash, full_name, role, is_nurse_verified, is_host_verified)
        VALUES ('admin-root', $1, $2, 'Operations Administrator', 'super_admin', true, true)
        ON CONFLICT (id) DO UPDATE SET password_hash = $2, email = $1, role = 'super_admin', full_name = 'Operations Administrator'
      `, [adminEmail.toLowerCase(), adminHash]);
      console.log('Super admin provisioned successfully.');
    }

    if (NC_HOSPITAL_SEEDS.length > 0) {
      const values = [];
      const params = [];
      let paramIndex = 1;

      for (const h of NC_HOSPITAL_SEEDS) {
        const placeholders = [];
        for (let i = 0; i < 13; i++) {
          placeholders.push(`$${paramIndex++}`);
        }
        values.push(`(${placeholders.join(', ')})`);
        params.push(h.id, h.name, h.health_system, h.address, h.city, h.state, h.zip, h.latitude, h.longitude, h.trauma_level, h.teaching_hospital, h.parking_type, h.nurse_feedback_score);
      }

      await db.query(`
        INSERT INTO healthcare_facilities (id, name, health_system, address_line1, city, state, postal_code, latitude, longitude, trauma_level, teaching_hospital, parking_type, nurse_feedback_score)
        VALUES ${values.join(', ')}
        ON CONFLICT (id) DO NOTHING;
      `, params);
    }

    await db.query(`
      INSERT INTO users (id, email, password_hash, role, full_name, is_host_verified)
      VALUES
      ('host-sarah-m', 'host-sarah@example.com', 'dummy_hash', 'host', 'Sarah M', true),
      ('host-karen-b', 'host-karen@example.com', 'dummy_hash', 'host', 'Karen B', true),
      ('host-james-l', 'host-james@example.com', 'dummy_hash', 'host', 'James L', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    if (NC_LISTING_SEEDS.length > 0) {
      const values = [];
      const placeholders = [];
      let i = 1;
      for (const l of NC_LISTING_SEEDS) {
        placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
        values.push(l.id, l.host_id, l.title, 'A beautiful sanctuary for clinicians.', l.address, l.city, l.state, l.zip, l.latitude, l.longitude, l.nearest_hospital_id, l.monthly_rate, l.security_deposit, l.cleaning_fee, l.is_active, true);
      }

      await db.query(`
        INSERT INTO listings (id, host_id, title, description, address_line1, city, state, postal_code, latitude, longitude, nearest_hospital_id, monthly_rent, security_deposit_amount, cleaning_fee, is_published, is_verified_by_admin)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (id) DO NOTHING;
      `, values);

      const defaultImages = [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
      ];

      let photoValues: any[] = [];
      let photoPlaceholders: string[] = [];
      let pIdx = 1;
      for (const l of NC_LISTING_SEEDS) {
        defaultImages.forEach((img, index) => {
          photoPlaceholders.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
          photoValues.push(l.id, img, index, index === 0);
        });
      }

      if (photoPlaceholders.length > 0) {
        await db.query(`
          INSERT INTO listing_photos (listing_id, photo_url, display_order, is_cover)
          VALUES ${photoPlaceholders.join(', ')}
          ON CONFLICT DO NOTHING;
        `, photoValues);
      }
    }

    console.log('Seeding Complete');
  } catch(e) {
    console.error('Error seeding data', e);
  } finally {
      process.exit();
  }
}
seed();
