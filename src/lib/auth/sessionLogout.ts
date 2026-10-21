/** Do not clear local identity or report logout until Firebase confirms sign-out. */
export async function completeLogout(signOut: () => Promise<void>, clearLocalSession: () => void) {
  await signOut();
  clearLocalSession();
}
