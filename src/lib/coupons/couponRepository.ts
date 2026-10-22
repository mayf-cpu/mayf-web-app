import type { RequestHandler, Request, Response } from 'express';

export { commerceRepository as couponRepository } from '../payments/commerceRepository';
import { commerceRepository as couponRepository } from '../payments/commerceRepository';

/** Send success only after the conditional Firestore commit succeeds. */
export function couponRoute(write: boolean, handler: (req: Request, res: Response) => unknown): RequestHandler {
  return async (req, res) => {
    try {
      const result = await couponRepository.run(async () => {
        let status = 200;
        let body: any;
        const reply = { status(code: number) { status = code; return reply; }, json(value: unknown) { body = value; return reply; } };
        await handler(req, reply as Response);
        return { status, body, failed: status >= 400 };
      }, write);
      res.setHeader('Cache-Control', 'no-store');
      res.status(result.status).json(result.body);
    } catch {
      res.status(503).json({ success: false, error: 'Saved data is temporarily unavailable or changed concurrently. Refresh and retry.' });
    }
  };
}
