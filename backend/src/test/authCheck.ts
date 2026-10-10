import { initSchema, queryRow } from '../database/db';
import { runSeed } from '../scripts/seed';
import { comparePassword } from '../utils/auth';

async function main() {
  await initSchema();
  await runSeed();

  const tests = [
    { input: 'student@hostel.com', password: 'student123', expectRole: 'student' },
    { input: '23CS001',            password: 'student123', expectRole: 'student' },
    { input: 'ADM001',             password: 'admin123',   expectRole: 'admin'   },
    { input: 'TCH001',             password: 'tutor123',   expectRole: 'tutor'   },
    { input: 'tutor@hostel.com',   password: 'tutor123',   expectRole: 'tutor'   },
    { input: 'admin@hostel.com',   password: 'admin123',   expectRole: 'admin'   },
    { input: 'parent@hostel.com',  password: 'parent123',  expectRole: 'parent'  },
    { input: 'warden@hostel.com',  password: 'warden123',  expectRole: 'warden'  },
    { input: 'security@hostel.com',password: 'security123',expectRole: 'security'},
  ];

  let pass = 0; let fail = 0;
  for (const t of tests) {
    const rawId = t.input;
    const user = await queryRow<any>(
      `SELECT u.*, s.register_number, t.employee_id
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN tutors t ON t.user_id = u.id
       WHERE LOWER(COALESCE(u.identifier, '')) = LOWER($1)
          OR LOWER(COALESCE(s.register_number, '')) = LOWER($2)
          OR LOWER(COALESCE(t.employee_id, '')) = LOWER($3)
          OR LOWER(u.email) = LOWER($4)`,
      [rawId, rawId, rawId, rawId]
    );
    if (!user) { console.log(`❌ ${rawId} → NOT FOUND`); fail++; continue; }
    const pwOk = await comparePassword(t.password, user.password_hash);
    if (user.role === t.expectRole && pwOk) {
      console.log(`✅ ${rawId} → ${user.role} (${user.email})`);
      pass++;
    } else {
      console.log(`❌ ${rawId} → expected ${t.expectRole}, got ${user.role}, pwOk=${pwOk}`);
      fail++;
    }
  }
  console.log(`\n${pass}/${pass+fail} tests passed.`);
}

main().catch(console.error);
