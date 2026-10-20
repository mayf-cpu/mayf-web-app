# Private PDF storage setup (staging first)

The Cloudflare Worker uses an R2 binding named `MAYF_PDF_BUCKET`, configured in `wrangler.jsonc`. This change does **not** create the bucket or upload materials.

1. In the Cloudflare dashboard, create an **R2 bucket** named `mayf-study-materials` in the account deploying the `mayf` Worker. Keep the bucket private; do not attach a public domain.
2. Upload genuine PDFs to object keys `pdf/<contentId>.pdf`. The content ID must match an entry in `src/lib/download/downloadRegistry.ts`; for example, the key for `dl-10-cheatsheet` is `pdf/dl-10-cheatsheet.pdf`. The displayed download filename comes from the registry entry and need not match the object key.
3. Store each object with `application/pdf` content type and confirm the bytes are a valid PDF (beginning with `%PDF-`). Limit each PDF to **30 MiB**.
4. Deploy to a **staging Worker** linked to the correct R2 bucket. Verify access control, rate limits, expiry, download correctness, actual PDF opening, and admin audit logs. Do not activate live checkout before the end-to-end payment checks.
5. Ensure the R2 bucket binding exists and the file object is uploaded before enabling student downloads. If missing, the API returns `FILE_NOT_AVAILABLE`.

## Important outstanding limitations

- Download tokens are stored in the Worker process memory. A token may not resolve on a different isolate or after a restart. Distributed, atomic single-use tokens are **not implemented yet**; use a durable token backend before production release.
- Download audit logs and rate limits are also currently process-local.
- Existing `pdfExists` checks an R2 object's metadata; the actual file handler separately checks the PDF magic bytes. A broken uploaded object can therefore cause a subsequent 503, not an invalid PDF download.
- R2 account/bucket provisioning and genuine PDF uploads require appropriate Cloudflare account access; code commits alone are insufficient.
- Never make the R2 bucket public or expose an R2 access key to the browser.
