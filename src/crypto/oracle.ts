/** Genuine browser gzip -> AES-256-GCM length oracle, for synthetic teaching data only. */
export type Mode='together'|'separated'|'none';
export type Observation={guess:string;mode:Mode;plaintextBytes:number;compressedBytes:number;ciphertextBytes:number;verified:boolean;ivPrefix:string};
export const SECRET='DUSK-FOX-7';
const te=new TextEncoder();
export const OPTIONS=['DUSK-FOX-7','DUSK-BAT-7','DUSK-CAT-7','DUSK-HEN-7'];
const hex=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export function payload(guess:string){
 if(!/^[A-Z0-9-]{1,24}$/.test(guess))throw new Error('Use 1–24 uppercase A–Z, digits or hyphen');
 // Same reflection target is compressed in a *single* context as a private token.
 return `Content-Type: text/html\nX-Sample: Training only\n<div class="private">csrf_token=${SECRET}</div>\n<p>Latest submitted lookup: csrf_token=${guess}</p>\nEnd synthetic response`;
}
export async function gzip(input:Uint8Array):Promise<Uint8Array>{
 if(typeof CompressionStream==='undefined')throw new Error('This browser lacks the built-in gzip compressor');
 const stream=new CompressionStream('gzip');const writer=stream.writable.getWriter();
 await writer.write(new Uint8Array(input));await writer.close();
 return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}
function equals(a:Uint8Array,b:Uint8Array){return a.length===b.length&&a.every((v,i)=>v===b[i]);}
export class LengthOracle{
 key?:CryptoKey;
 seenIV=new Set<string>();
 async init(){this.key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
 async observe(guess:string,mode:Mode):Promise<Observation>{
   if(!this.key)throw new Error('Initialize AES-GCM first');
   const text=payload(guess);
   const raw=te.encode(text);
   let prepared:Uint8Array;
   if(mode==='together')prepared=await gzip(raw);
   else if(mode==='none')prepared=raw;
   else{
      // Two independent gzip dictionaries: a secret-bearing context and a public reflection.
      const privateRaw=te.encode(`Content-Type: text/html\n<div class="private">csrf_token=${SECRET}</div>\n`);
      const publicRaw=te.encode(`Latest submitted lookup: csrf_token=${guess}\nEnd synthetic response`);
      const priv=await gzip(privateRaw),pub=await gzip(publicRaw);
      prepared=new Uint8Array(priv.length+pub.length);prepared.set(priv);prepared.set(pub,priv.length);
   }
   const iv=crypto.getRandomValues(new Uint8Array(12));const mark=hex(iv);if(this.seenIV.has(mark))throw new Error('Repeated IV: abort');this.seenIV.add(mark);
   const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,tagLength:128},this.key,new Uint8Array(prepared)));
   const recovered=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv,tagLength:128},this.key,new Uint8Array(ct)));
   return {guess,mode,plaintextBytes:raw.length,compressedBytes:prepared.length,ciphertextBytes:ct.length,verified:equals(recovered,prepared),ivPrefix:mark.slice(0,12)};
 }
 async compare(mode:Mode='together'){const results:Observation[]=[];for(const candidate of OPTIONS)results.push(await this.observe(candidate,mode));return results;}
}
