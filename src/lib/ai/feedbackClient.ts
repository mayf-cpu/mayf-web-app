export type DoubtRating = 'helpful' | 'unhelpful';
type RatingSession = { getIdToken(): Promise<string> } | null | undefined;

/** Feedback is acknowledged only after the authenticated durable write succeeds. */
export async function submitDoubtRating(session: RatingSession, doubtId: string, rating: DoubtRating, fetcher: typeof fetch = fetch): Promise<void> {
  if (!session) throw new Error('Sign in to save feedback.');
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(doubtId) || !['helpful', 'unhelpful'].includes(rating)) {
    throw new Error('A valid answer and rating are required.');
  }
  const token = await session.getIdToken();
  const response = await fetcher('/api/ai-teacher/rate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ doubtId, rating }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.success !== true || data.doubtId !== doubtId || data.rating !== rating) {
    throw new Error('Feedback was not saved. Please retry.');
  }
}
