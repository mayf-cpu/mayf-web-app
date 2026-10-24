import { httpServerHandler } from 'cloudflare:node';
import { app } from './server';
import { env } from 'cloudflare:workers';
import { configurePdfBucket, type PdfR2Bucket } from './src/lib/download/pdfObjectStorage';

configurePdfBucket((env as { MAYF_PDF_BUCKET?: PdfR2Bucket }).MAYF_PDF_BUCKET || null);

app.listen(3000);
export default httpServerHandler({ port: 3000 });
