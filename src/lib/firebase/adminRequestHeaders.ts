import { auth } from './client';

/** Get a current verified Firebase session for sensitive admin requests. */
export async function getAdminRequestHeaders(): Promise<Record<string, string>> {
  if (auth) await auth.authStateReady();
  const user = auth?.currentUser;
  if (!user) throw new Error('Administrator sign-in is required.');
  const token = await user.getIdToken();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}
