import type { RequestHandler, Request, Response } from 'express';
import { getAdminFirestore } from '../firebase/admin';
import type { FirestoreDocumentStore } from '../firebase/documentStore';
import { contentCmsManager } from './contentManager';
import { categoryManager } from '../categories/categoryManager';
import { auditLogService } from '../audit/auditLogger';
import { couponService } from '../coupons/couponService';

type State = { exportState(): Record<string, any>[]; importState(items: Record<string, any>[]): void };
/** Each operation reads durable data. Conditional atomic writes reject concurrent edits. */
export class CatalogueRepository {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private states: { collection: string; state: State }[], private getStore: () => FirestoreDocumentStore | null) {}
  run<T>(operation: () => T | Promise<T>, write = false): Promise<T> {
    const task = this.queue.then(async () => {
      const db = this.getStore();
      if (!db && process.env.NODE_ENV === 'production') throw new Error('Firebase storage is not configured');
      const marker = db && write ? await db.collection('catalogueState').doc('initialized').get() : null;
      const loaded = db ? await Promise.all(this.states.map(({ collection }) => db.list(collection))) : null;
      const before = this.states.map(({ state }, i) => loaded ? loaded[i].map(doc => ({ ...doc.data, id: doc.id })) : state.exportState());
      // Configured Firestore is authoritative, including before the first write.
      // Never advertise or persist bundled demo records when a collection is empty.
      this.states.forEach(({ state }, i) => state.importState(structuredClone(before[i])));
      try {
        const result = await operation();
        if (write && db && !(result as any)?.failed) {
          const changes = this.states.flatMap(({ collection, state }, i) => {
            const old = new Map(loaded![i].map(doc => [doc.id, doc]));
            const after = state.exportState();
            const nextIds = new Set(after.map(item => item.id));
            return [
              ...after.filter(item => JSON.stringify(old.get(item.id)?.data) !== JSON.stringify(item)).map(item => ({ collection, id: item.id, data: item, updateTime: old.get(item.id)?.updateTime })),
              ...loaded![i].filter(doc => !nextIds.has(doc.id)).map(doc => ({ collection, id: doc.id, updateTime: doc.updateTime })),
            ];
          });
          // Serialize catalogue-wide invariants (unique slugs and category references)
          // even when concurrent operations modify different document IDs.
          changes.push({ collection: 'catalogueState', id: 'initialized', data: { initialized: true }, updateTime: marker?.updateTime });
          await db.commit(changes);
        }
        if ((result as any)?.failed) this.states.forEach(({ state }, i) => state.importState(before[i]));
        return result;
      } catch (error) {
        this.states.forEach(({ state }, i) => state.importState(before[i]));
        throw error;
      }
    });
    this.queue = task.catch(() => {});
    return task;
  }
}
export const catalogueRepository = new CatalogueRepository([
  { collection: 'contentItems', state: contentCmsManager },
  { collection: 'categories', state: categoryManager },
  { collection: 'coupons', state: couponService.couponState },
  { collection: 'promotions', state: couponService.promotionState },
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
