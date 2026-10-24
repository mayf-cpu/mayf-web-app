export type AiFailureCode = 'AI_API_KEY_INVALID' | 'AI_ACCESS_DENIED' | 'AI_QUOTA_EXCEEDED' | 'AI_REQUEST_REJECTED' |
  'AI_MODEL_UNAVAILABLE' | 'AI_PROVIDER_TIMEOUT' | 'AI_PROVIDER_UNAVAILABLE' | 'AI_EMPTY_RESPONSE' | 'AI_PROVIDER_ERROR';

/** Provider errors can contain request URLs, credentials and question text. Never return them. */
export function safeAiFailure(error: unknown): { code: AiFailureCode; status: number | null; retryModel: boolean } {
  const value = error as { status?: unknown; name?: unknown; message?: unknown } | null;
  const status = typeof value?.status === 'number' && Number.isInteger(value.status) ? value.status : null;
  // Recognize only a fixed provider reason; never forward free-form error text.
  if ((status === 400 || status === 403) && typeof value?.message === 'string' &&
      /\bAPI_KEY_(?:INVALID|EXPIRED)\b/.test(value.message)) {
    return { code: 'AI_API_KEY_INVALID', status, retryModel: false };
  }
  if (status === 401 || status === 403) return { code: 'AI_ACCESS_DENIED', status, retryModel: false };
  if (status === 429) return { code: 'AI_QUOTA_EXCEEDED', status, retryModel: false };
  if (status === 400) return { code: 'AI_REQUEST_REJECTED', status, retryModel: false };
  if (status === 404) return { code: 'AI_MODEL_UNAVAILABLE', status, retryModel: true };
  if (value?.name === 'AiProviderTimeout' || status === 408 || status === 504) {
    return { code: 'AI_PROVIDER_TIMEOUT', status, retryModel: true };
  }
  return { code: status !== null && status >= 500 ? 'AI_PROVIDER_UNAVAILABLE' : 'AI_PROVIDER_ERROR', status, retryModel: true };
}

/** Bound each attempt, clear timers, and stop retries for account-wide provider failures. */
export async function generateWithModelFallback<T extends { readonly text?: string }>(
  models: string[], generate: (model: string) => Promise<T>,
  onFailure: (failure: ReturnType<typeof safeAiFailure> & { model: string }) => void,
  timeoutMs = 12000,
): Promise<{ success: true; response: T; model: string } | { success: false; code: AiFailureCode }> {
  let code: AiFailureCode = 'AI_PROVIDER_ERROR';
  for (const model of [...new Set(models)].filter(Boolean)) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => { const error = new Error('Provider deadline exceeded'); error.name = 'AiProviderTimeout'; reject(error); }, timeoutMs);
      });
      const response = await Promise.race([generate(model), timeout]);
      if (response?.text?.trim()) return { success: true, response, model };
      code = 'AI_EMPTY_RESPONSE';
      onFailure({ model, code, status: null, retryModel: true });
    } catch (error) {
      const failure = safeAiFailure(error);
      code = failure.code;
      onFailure({ model, ...failure });
      if (!failure.retryModel) break;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  return { success: false, code };
}
