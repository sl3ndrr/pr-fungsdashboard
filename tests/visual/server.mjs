import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, sep, extname} from 'node:path';

const root=resolve(process.env.DASHBOARD_ROOT || '.');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
createServer(async (request,response) => {
  try {
    const pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);
    const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if (!file.startsWith(root+sep)) {response.writeHead(403).end();return;}
    const data=await readFile(file);
    response.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);
  } catch {response.writeHead(404).end();}
}).listen(8765,'127.0.0.1');
