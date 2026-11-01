import {test,expect} from 'vitest';
import {LengthOracle,OPTIONS,payload,gzip,aesGcmEncrypt} from './oracle.ts';
test('real gzip has GZIP magic and reduces repeated synthetic data',async()=>{const z=await gzip(new TextEncoder().encode('compression '.repeat(80)));expect([...z.slice(0,3)]).toEqual([31,139,8]);expect(z.length).toBeLessThan(80*12);});
test('all four equal-length guesses authenticate; vulnerable oracle measurably distinguishes the actual token',async()=>{const o=new LengthOracle();await o.init();const r=await o.compare('together');expect(r.every(x=>x.verified)).toBe(true);expect(new Set(OPTIONS.map(x=>x.length)).size).toBe(1);expect(r[0]!.ciphertextBytes).toBeLessThan(Math.min(...r.slice(1).map(x=>x.ciphertextBytes)));});
test('separate contexts and no compression remove the candidate-specific match in this fixture',async()=>{const o=new LengthOracle();await o.init();for(const m of ['separated','none'] as const){const r=await o.compare(m);expect(r.every(x=>x.verified)).toBe(true);expect(new Set(r.map(x=>x.ciphertextBytes)).size).toBe(1);} });
test('integrity tag adds 16 bytes; malformed guesses rejected',async()=>{const o=new LengthOracle();await o.init();const x=await o.observe('DUSK-FOX-7','together');expect(x.ciphertextBytes).toBe(x.compressedBytes+16);await expect(o.observe('<script>','together')).rejects.toThrow();expect(payload('DUSK-FOX-7')).toContain('csrf_token=DUSK-FOX-7');});

test('invalid compression mode fails closed',async()=>{const o=new LengthOracle();await o.init();await expect(o.observe('DUSK-FOX-7','unknown' as never)).rejects.toThrow(/Unsupported compression/);});
test('oracle provisions the advertised AES-256-GCM key',async()=>{const o=new LengthOracle();await o.init();expect(o.key?.algorithm.name).toBe('AES-GCM');expect((o.key?.algorithm as AesKeyAlgorithm).length).toBe(256);});
test('production AES-GCM helper matches the NIST AES-256 empty-plaintext tag',async()=>{
  // NIST SP 800-38D AES-GCM examples, GCM-AES256 Example #1:
  // https://csrc.nist.gov/csrc/media/projects/cryptographic-standards-and-guidelines/documents/examples/aes_gcm.pdf
  const fromHex=(value:string)=>Uint8Array.from(value.match(/../g)!,byte=>Number.parseInt(byte,16));
  const key=await crypto.subtle.importKey('raw',fromHex('feffe9928665731c6d6a8f9467308308feffe9928665731c6d6a8f9467308308'),{name:'AES-GCM'},false,['encrypt']);
  const sealed=await aesGcmEncrypt(key,fromHex('cafebabefacedbaddecaf888'),new Uint8Array());
  expect([...sealed].map(byte=>byte.toString(16).padStart(2,'0')).join('')).toBe('fd2caa16a5832e76aa132c1453eeda7e');
});
