/** Lightweight transport-integrity checks, not a full PDF parser. */
export function hasPdfMarkers(bytes: Uint8Array): boolean {
  if (bytes.length < 14 || bytes.length > 30 * 1024 * 1024) return false;
  if (String.fromCharCode(...bytes.subarray(0, 5)) !== '%PDF-') return false;
  const version = String.fromCharCode(...bytes.subarray(5, 8));
  if (!/^1\.[0-7]$|^2\.0$/.test(version)) return false;
  // %%EOF is mandatory; a small allowance for trailing whitespace is legal.
  const tail = new TextDecoder('latin1').decode(bytes.subarray(Math.max(0, bytes.length - 1024)));
  return /%%EOF[\x00\x09\x0A\x0C\x0D\x20]*$/.test(tail);
}
