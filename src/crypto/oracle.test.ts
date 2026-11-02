import {test,expect} from 'vitest';
import {LengthOracle,OPTIONS,payload,gzip,aesGcmEncrypt,splitGcmOutput,GCM_TAG_BYTES} from './oracle.ts';
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

test('production AES-GCM helper matches NIST AES-256 Example #2, ciphertext and tag apart',async()=>{
  // NIST SP 800-38D AES-GCM examples, GCM-AES256 Example #2 (Taglen 128,
  // AADlen 0, PTlen 512), from the same publication as Example #1 above:
  // https://csrc.nist.gov/csrc/media/projects/cryptographic-standards-and-guidelines/documents/examples/aes_gcm.pdf
  //
  // Example #1 encrypts nothing, so its tag is just Cipher(K, J0) and it says
  // nothing about the counter stream or the ciphertext/tag split. This case
  // carries 64 bytes of plaintext, so it exercises both.
  const fromHex=(value:string)=>Uint8Array.from(value.match(/../g)!,byte=>Number.parseInt(byte,16));
  const toHex=(bytes:Uint8Array)=>Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
  const plaintext=fromHex(
    'd9313225f88406e5a55909c5aff5269a'+
    '86a7a9531534f7da2e4c303d8a318a72'+
    '1c3c0c95956809532fcf0e2449a6b525'+
    'b16aedf5aa0de657ba637b391aafd255');
  const expectedCiphertext=
    '522dc1f099567d07f47f37a32a84427d'+
    '643a8cdcbfe5c0c97598a2bd2555d1aa'+
    '8cb08e48590dbb3da7b08b1056828838'+
    'c5f61e6393ba7a0abcc9f662898015ad';
  const expectedTag='b094dac5d93471bdec1a502270e3cc6c';

  const key=await crypto.subtle.importKey('raw',fromHex('feffe9928665731c6d6a8f9467308308feffe9928665731c6d6a8f9467308308'),{name:'AES-GCM'},false,['encrypt']);
  const sealed=await aesGcmEncrypt(key,fromHex('cafebabefacedbaddecaf888'),plaintext);
  const {ciphertext,tag}=splitGcmOutput(sealed);

  // Asserted apart, so a mis-slice cannot be absorbed by the other half.
  expect(toHex(ciphertext)).toBe(expectedCiphertext);
  expect(toHex(tag)).toBe(expectedTag);
  // GCM is a stream mode: the ciphertext is exactly as long as the plaintext,
  // and the whole output is longer by the tag and nothing else.
  expect(ciphertext.length).toBe(plaintext.length);
  expect(sealed.length).toBe(plaintext.length+GCM_TAG_BYTES);
});
