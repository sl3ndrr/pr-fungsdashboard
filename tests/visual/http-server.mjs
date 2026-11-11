/** Local fallback for environments without Python; no runtime dependency. */
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {pathToFileURL} from 'node:url';
export function serve(root=resolve('.'),port=8000) {
 const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.woff2':'font/woff2'};
 return http.createServer(async(req,res)=>{
  try {
   const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/\/$/,'/index.html'));
   if(!path.startsWith(root+sep))throw Error('Outside root');
   const body=await readFile(path);
   res.setHeader('Content-Type',types[extname(path)]||'application/octet-stream');res.end(body);
  } catch {res.statusCode=404;res.end('Not found');}
 }).listen(port,'127.0.0.1');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)serve(resolve(process.argv[2]||'.'),Number(process.argv[3]||8000));
