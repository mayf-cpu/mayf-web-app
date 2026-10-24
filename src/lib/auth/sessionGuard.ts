/** Invalidates in-flight identity/profile work after another auth event or unmount. */
export class SessionGuard {
  private revision = 0;
  begin() { const revision = ++this.revision; return () => revision === this.revision; }
  invalidate() { this.revision++; }
}
