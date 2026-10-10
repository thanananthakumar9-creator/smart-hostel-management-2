import { execute } from '../database/db';
import { v4 as uuidv4 } from 'uuid';

export async function createNotification(
  userId: string,
  title: string,
  message: string
): Promise<void> {
  const id = uuidv4();
  await execute(
    `INSERT INTO notifications (id, user_id, title, message, is_read, created_at)
     VALUES ($1, $2, $3, $4, 0, CURRENT_TIMESTAMP)`,
    [id, userId, title, message]
  );
}

export async function createNotifications(
  userIds: (string | null | undefined)[],
  title: string,
  message: string
): Promise<void> {
  for (const userId of userIds) {
    if (userId) {
      await createNotification(userId, title, message);
    }
  }
}
