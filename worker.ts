import { httpServerHandler } from 'cloudflare:node';
import { app } from './server';

app.listen(3000);
export default httpServerHandler({ port: 3000 });
