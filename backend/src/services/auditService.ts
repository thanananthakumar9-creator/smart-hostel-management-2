import { execute } from '../database/db';
import { v4 as uuidv4 } from 'uuid';

export async function logAudit(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null = null,
  details: any = null
): Promise<void> {
  try {
    const id = uuidv4();
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : (details || null);
    await execute(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [id, userId, action, entityType, entityId, detailsStr]
    );
  } catch (err: any) {
    console.error('Failed to write audit log:', err.message);
  }
}
