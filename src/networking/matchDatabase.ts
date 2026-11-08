import { getDatabase, type Database } from 'firebase/database';
import { getFirebaseApp } from '../firebase/app';

/** The database the match runs on, or null when Firebase is not configured. */
export function getMatchDatabase(): Database | null {
  const app = getFirebaseApp();
  return app ? getDatabase(app) : null;
}
