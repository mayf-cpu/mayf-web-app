import type { FirestoreDocumentStore } from './documentStore';

type State = { exportState(): Record<string, any>[]; importState(items: Record<string, any>[]): void };
/** Each operation reads durable data. Conditional atomic writes reject concurrent edits. */
export class DocumentStateRepository {
  private queue: Promise<unknown> = Promise.resolve();
  private defaults: Record<string, any>[][];
  constructor(private states: { collection: string; state: State }[], private getStore: () => FirestoreDocumentStore | null, private markerCollection = 'catalogueState') {
    this.defaults = states.map(({ state }) => state.exportState());
  }
  run<T>(operation: () => T | Promise<T>, write = false): Promise<T> {
    const task = this.queue.then(async () => {
      const db = this.getStore();
      if (!db && (process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production')) throw new Error('Firebase storage is not configured');
      const marker = db ? await db.collection(this.markerCollection).doc('initialized').get() : null;
      const loaded = db ? await Promise.all(this.states.map(({ collection }) => db.list(collection))) : null;
      const before = this.states.map(({ state }, i) => loaded ? loaded[i].map(doc => ({ ...doc.data, id: doc.id })) : state.exportState());
      this.states.forEach(({ state }, i) => state.importState(structuredClone(loaded && !marker?.exists && !loaded[i].length ? this.defaults[i] : before[i])));
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
          changes.push({ collection: this.markerCollection, id: 'initialized', data: { initialized: true }, updateTime: marker?.updateTime });
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
