# Build brief — `crypto-lab-compression-leak`

**2026-10-17 · Proposed / brief only.** GitHub repository created; implementation/deployment subject to verification.

**Binding source:** [Crypto Lab Master Template](https://github.com/systemslibrarian/crypto-lab/blob/main/audits/_MASTER-TEMPLATE.md), §§0–6. If building inside the new lab repo, use [`audits/kickoff.md`](https://github.com/systemslibrarian/crypto-lab/blob/main/audits/kickoff.md) and this file as `brief.md`; catalog changes follow `CLAUDE.md`.

```text
NEW DEMO BRIEF
- Repo name:         crypto-lab-compression-leak
- Short name (H1):   Compression Leak
- Subtitle:          BREACH · DEFLATE/gzip · AES-GCM
- One-liner:         Compress a response containing a hidden token and reflected attacker input, encrypt it with AES-GCM, and infer token prefixes solely from real ciphertext lengths.
- Concept to teach:  Correct authenticated encryption protects contents, but it does not hide the length of compressed plaintext.
- Primitives/spec:   BREACH (2013 attack research); RFC 1951 (DEFLATE); RFC 1952 (gzip); NIST SP 800-38D (AES-GCM).
- Accent (--accent): #F2C078 (proposed; check fleet palette and contrast)
- Favicon emoji:     📏
- In scope:          synthetic CSRF-like token; attacker-controlled reflection; real gzip/DEFLATE compression via CompressionStream('gzip') or a pinned library; real AES-256-GCM; chosen-input length probes; disabled-compression and separated-context comparisons; measured limitations.
- Non-goals:         contacting websites, bypassing actual TLS, sniffing traffic, generalized exploit automation, arbitrary cookie theft, TLS compression, or claims that encryption keys/tags were broken.
```

## The one question

**“If AES-GCM decrypts securely, why can the attacker guess the secret?”** Show real compression shortening a response when injected text matches a nearby secret; the attacker sees only encrypted-response **lengths** and can adapt the next guess. Prove this mechanism with *real compressor bytes and real ciphertext sizes*, not a bar chart driven by guessed rules.

## Scope and boundaries

The browser constructs a **fictional server response** locally, such as a stable body containing `token=<secret>` and `echo=<attacker guess>`. This is a deliberately vulnerable **local scenario**, not a networked attack. The response uses real `CompressionStream('gzip')` (or a justified, pinned standards-conforming library with a test cross-check), then WebCrypto AES-256-GCM with a unique IV on every query. The user must not learn the token from page source/UI until the reveal stage; the secret and all traffic are synthetic.

Keep the attack-specific prerequisite list on screen: response compression, attacker-controlled text reflected **near a secret in the same compression context**, an observable stable length signal, repeatable probing. Clearly separate this HTTP-response mechanism from CRIME/TLS-layer compression. Successful plaintext recovery may require an engineered, stable teaching fixture; do not claim the trick always works on arbitrary responses.

**Related labs:** AES Modes already covers GCM and authenticated encryption; Order Leak covers a different kind of ciphertext structure leakage. This lab owns **compression-induced lengths**, not AEAD implementation details.

## §1 / SECURITY / CORRECTNESS INVARIANTS

1. **Pipeline is genuine:** UTF-8 bytes → real DEFLATE/gzip → real AES-GCM → observed byte length. Report `rawBytes`, `gzipBytes`, `ivBytes`, `tagBytes`, and `ciphertextBytes`; assert the relations with actual returned buffers, not constants displayed as output.
2. **No forgery or plaintext exposure to attacker:** The attacker UI receives sizes, never token or encryption key. The victim verification pane may decrypt and authenticate *after* the experiment to prove tags remain intact.
3. **Fresh IVs:** Each encrypt operation uses a fresh 96-bit IV; never reuse a key/IV combination. The comparison must not rely on nonce reuse.
4. **Failure is not guaranteed:** If real compression does not distinguish candidates, show `INCONCLUSIVE / TIED LENGTHS` and explain dictionary effects or noise rather than manufacture a winning guess.
5. **Mitigation is measured:** Disabling compression on equal-length probes should remove this *particular compression-derived* signal. Separating reflection from secrets must be tested on the actual constructed body; random padding is a noisy mitigation **not** a proof of safety.
6. **Timing/size caveat:** The page observes locally generated ciphertext length, not actual HTTPS record lengths, MTU, chunking, headers or live network telemetry. It cannot certify an application's security.

### ARCHITECTURE

- `src/compression/response.ts`: fixed response grammar, synthetic secret and controlled reflection; HTML/text escaping and byte-counted output.
- `src/compression/gzip.ts`: standards-conforming compressor; independent round-trip/cross-check.
- `src/crypto/aead.ts`: WebCrypto encrypt/decrypt and real buffer length accounting.
- `src/attack/length-oracle.ts`: bounded candidate generation, probe table, differential/ranking logic with explicit inconclusive states.
- `src/mitigation/variants.ts`: compression disabled; reflection separated; optional padding experiment with honest statistical framing.
- `src/ui/`: two-sided attacker/victim workbench, length histogram, byte pipeline, expert disclosures. One future extension seam for noisy multi-sample statistics; do not ship a remotely targetable oracle.

### UI / THE ONE INTERACTION

1. **Observe:** A secret token is concealed behind a lock; the user sees a ciphertext package and its total size, not the token.
2. **Choose a probe:** Enter or select a candidate prefix. Press **Measure**; a real compression and AEAD pipeline returns observed byte counts.
3. **Recover a short fictional token:** Choose the shortest candidate (or inspect ties). A bounded assisted demonstration can try a small alphabet automatically, but the learner makes a prediction first. Any automated run is limited to synthetic in-memory data and a visibly counted query budget.
4. **Break the condition:** Turn off response compression, or separate the attacker-controlled string from the secret's compression context; run the **same guesses**, recompute lengths and compare evidence. An optional padding toggle shows noisy trials and why one sample proves little.
5. **Reveal:** After the learner has tested the hypothesis, show token + previously hidden request body, decompressed output, AES-GCM validation and all sizes; explain why GCM never failed.

**Visual semantics:** A verified GCM tag while token information leaks should read **`ENCRYPTION VERIFIED — LENGTH INFORMATION LEAKS`** as an alarm, not success green. Every length difference is labeled in bytes as well as depicted by bar width. Tie = neutral/inconclusive, not red failure.

### EDGE CASES (fail closed)

Unpaired surrogate input, UTF-8 multibyte token, equal-length candidates and ties, too-short/too-long probes, degenerate empty reflection, compression unsupported, compressor failure, wrong IV/tag on victim verification, non-repeatable padding trials, cancellation during batch testing. Zero arbitrary URLs and zero unbounded loops.

## §2 / Plain-language teaching & negative claim

**Opening:** Repeated text compresses into fewer bytes. When a webpage compresses its own secret together with words an attacker controls, a better guess can make the encrypted response slightly shorter. The encryption still works—the response's length is the leak.

**Negative claim (§4.1d):** “A valid AES-GCM authentication tag does **not** hide information conveyed by ciphertext length.” Test a fixture where all decryption/authentication checks pass while a genuine compression/length oracle distinguishes at least one correct token prefix. Show `VERIFIED — LENGTH LEAK` visibly while all AEAD checks are successful. A test must fail if the negative-claim text disappears.

## TESTS / ACCEPTANCE

- Compression round-trip on pinned plaintext vectors; compare compressor output size/meaning against an independent compliant codec where possible. Do not require byte-for-byte matching if both encoders legitimately choose different DEFLATE encodings—test stated properties instead.
- AES-256-GCM published KATs and independent decrypt/tag tamper rejection. Unique IV/observed-length invariants.
- Real, pinned vulnerable fixture: one or more correct prefixes measurably beat controlled incorrect prefixes. When tied, UI signals inconclusive; tests cannot depend on undefined compressor behavior across all browsers. Pin browser/codec for the strong oracle fixture.
- Defense fixtures: identical-length uncompressed probes produce equal ciphertext lengths; separated compression context removes the *fixture's* shared-dictionary signal; padding experiment does not claim a guaranteed fix.
- `e2e/claims.spec.ts`: recompute the displayed breakdown from actual buffers, drive negative claim, cause failures, exercise stale-verdict retirement/no-op guard and mobile/keyboard paths.
- Build a replayable §4.1c mutation harness for each verdict: real source patch changes bundle; owning test detects wrong size, fabricated success, or invalid tag bypass; restore immediately.
- Apply the master template §3 chrome / dark theme / scripture footer; §4 honest WCAG 2.1 AA gate (production build, axe zero violations); §5 README; §6 PR/test/deploy plus grouped Dependabot and explicit post-auto-merge dispatch. Unique Playwright port, full unit and browser suites blocking deployment, live-byte verification and catalog evidence on carding.

## References & links out

- [BREACH attack project, prerequisites, mitigations, original research](https://breachattack.com/)
- [RFC 1951 (DEFLATE)](https://www.rfc-editor.org/rfc/rfc1951) · [RFC 1952 (gzip)](https://www.rfc-editor.org/rfc/rfc1952)
- [NIST SP 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final)
- [AES Modes](https://systemslibrarian.github.io/crypto-lab-aes-modes/) · [Order Leak](https://systemslibrarian.github.io/crypto-lab-order-leak/)

**Ship criterion:** A learner recovers or distinguishes a synthetic secret using nothing but *measured encrypted lengths*, and can see why AES-GCM remained correct throughout.
