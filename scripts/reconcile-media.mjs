import { loadEnvFile } from 'node:process';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
loadEnvFile('frontend/.env.local');
const client=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
const bucket=client.storage.from('portfolio-media');
let indexed=0, unreadable=0;
async function scan(prefix='') {
 for(let offset=0;;offset+=100) {
  const result=await bucket.list(prefix,{limit:100,offset,sortBy:{column:'name',order:'asc'}});
  if(result.error) throw result.error;
  for(const entry of result.data) {
   const path=prefix?`${prefix}/${entry.name}`:entry.name;
   if(!entry.id){await scan(path);continue;}
   const existing=await client.from('media_assets').select('id,width,height,sha256,deleting').eq('storage_path',path).maybeSingle();
   if(existing.error) throw existing.error;
   if(existing.data?.deleting||(existing.data?.width&&existing.data?.sha256)) continue;
   const download=await bucket.download(path);
   if(download.error){unreadable++;continue;}
   const bytes=Buffer.from(await download.data.arrayBuffer());
   let dimensions;
   try { dimensions=await sharp(bytes,{limitInputPixels:40_000_000}).metadata(); } catch {unreadable++;continue;}
   const metadata={width:dimensions.width,height:dimensions.height,byte_size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
   const saved=existing.data?await client.from('media_assets').update(metadata).eq('id',existing.data.id):await client.from('media_assets').insert({...metadata,storage_path:path,filename:entry.name,content_type:entry.metadata?.mimetype||download.data.type||'application/octet-stream',created_at:entry.created_at});
   if(saved.error) throw saved.error;
   indexed++;
  }
  if(result.data.length<100) break;
 }
}
await scan();
console.log(JSON.stringify({indexed,unreadable,note:'Existing assignments and stored files were preserved.'}));
