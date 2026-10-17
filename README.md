# Compression Leak

**Status:** working interactive teaching implementation with automated checks. Passing CI or successful publication is not a formal security audit. GitHub Pages publication includes an explicit source-SHA check against served bytes.

## What It Is

A browser-only length-oracle experiment: build a synthetic response containing a fictional private token and an attacker-controlled reflected guess. Run native gzip, then real WebCrypto AES-256-GCM, and measure the *encrypted* byte length. All contents and keys stay local. No network attack is performed.

## Exhibits

1. **Shared dictionary:** compress secret and reflection together, encrypt, authenticate, and compare four equal-length guesses to observe match-dependent size.
2. **Independent dictionaries:** compress secret and reflected input separately, showing how this specific cross-string signal disappears in the controlled fixture.
3. **No compression:** compare equivalent input lengths and see why this removes this particular compression signal, but not ciphertext-length leakage in general.
4. **One measurement:** demonstrate that a single sample does not prove secrecy or let an observer confidently identify a token.
5. **Fail closed:** malformed guesses and unsupported compression modes produce errors, not deceptively successful results.

## When to Use It

Correct encryption and authentication do not conceal message length. Compressing an attacker-controlled guess beside a secret may leak information, as in BREACH and related compression-oracle attacks.

**Do not use:** This code with real keys, credentials, signatures, records or adversaries. The experiment isolates one mechanism; it is not a deployable cryptographic service.

## Live Demo

[Open Compression Leak](https://systemslibrarian.github.io/crypto-lab-compression-leak/). Publication is performed through GitHub Actions. The deploy job checks that the page serves the exact source commit before reporting a successful deployment. If this check fails, the public site must be treated as **unverified** even if an earlier artifact was published.

## What Can Go Wrong

The experiment models the data-dependent size signal, not a production BREACH exploit. A tie among compressed sizes is inconclusive, and even perfect size equality across four probes is not a general length-hiding security proof.

## Real-World Usage

[BREACH](https://breachattack.com/); NIST SP 800-38D (AES-GCM); gzip/DEFLATE (RFC 1952/1951). Related: [AES Modes](https://systemslibrarian.github.io/crypto-lab-aes-modes/), [Protocol Composition](https://systemslibrarian.github.io/crypto-lab-protocol-compose/), [Order Leak](https://systemslibrarian.github.io/crypto-lab-order-leak/).

## How to Run Locally

Install with `npm ci`, run `npm test`, `npm run build`, and `npm run test:a11y` before using `npm run dev`. Browser tests serve a freshly rebuilt production artifact. Do not skip the accessibility or correctness gate.

## Related Demos

[BREACH](https://breachattack.com/); NIST SP 800-38D (AES-GCM); gzip/DEFLATE (RFC 1952/1951). Related: [AES Modes](https://systemslibrarian.github.io/crypto-lab-aes-modes/), [Protocol Composition](https://systemslibrarian.github.io/crypto-lab-protocol-compose/), [Order Leak](https://systemslibrarian.github.io/crypto-lab-order-leak/).

## Build & Verify

The suite checks real gzip bytes, a NIST SP 800-38D AES-256-GCM known-answer tag, ciphertext size including the 16-byte tag, genuine decrypt-and-authenticate, secret-dependent size measurements, defenses in this fixture, malformed guesses and unsupported modes. Browser tests exercise the rendered leak and mitigations.

CI runs Vitest and Playwright, checks the production build, and refuses deployment on failures. After the Pages publish step, a fresh HTTP GET must return `deployment.json` identifying the exact `GITHUB_SHA` and GitHub repository, and a second GET must return HTML containing the app mount. The hosted source SHA is **deployed build identity evidence**, not a cryptographic security proof. Full negative-claim and mutation-test compliance remains subject to independent review.

---

*One of the browser demos in the [Crypto Lab](https://crypto-lab.systemslibrarian.dev/) suite.*

*"So whether you eat or drink or whatever you do, do it all for the glory of God." — 1 Corinthians 10:31*
