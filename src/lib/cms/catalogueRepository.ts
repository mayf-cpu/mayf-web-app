import type { RequestHandler, Request, Response } from 'express';
import { getAdminFirestore } from '../firebase/admin';
import type { FirestoreDocumentStore } from '../firebase/documentStore';
import { contentCmsManager } from './contentManager';
import { ingestionState } from '../ingestion/ingestionService';
import { categoryManager } from '../categories/categoryManager';
import { auditLogService } from '../audit/auditLogger';

import { DocumentStateRepository } from '../firebase/documentStateRepository';
export { DocumentStateRepository as CatalogueRepository } from '../firebase/documentStateRepository';

export const catalogueRepository = new DocumentStateRepository([
  { collection: 'contentItems', state: contentCmsManager },
  { collection: 'categories', state: categoryManager },
  { collection: 'importJobs', state: ingestionState },
  { collection: 'adminAuditLogs', state: auditLogService },
], getAdminFirestore);

/** Buffer JSON so success is sent only after the durable transaction finishes. */
export function catalogueRoute(write: boolean, handler: (req: Request, res: Response) => unknown): RequestHandler {
  return async (req, res) => {
    try {
      const result = await catalogueRepository.run(async () => {
        let status = 200;
        let body: any;
        const reply = { status(code: number) { status = code; return reply; }, json(value: unknown) { body = value; return reply; } };
        await handler(req, reply as Response);
        return { status, body, failed: status >= 400 };
      }, write);
      if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'no-store');
      res.status(result.status).json(result.body);
    } catch (error: any) {
      res.status(503).json({ success: false, error: error.message || 'Catalogue storage unavailable' });
    }
  };
}
