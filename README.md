# Compression Leak

**Status:** implementation candidate under test. A passing build does not constitute an independent security audit.

## What It Is

Compress and encrypt synthetic responses and discover what ciphertext length reveals. Uses synthetic examples, locally in the browser. **Not production cryptography or a security product.**

## Exhibits

The interactive workbench in `src/main.ts` executes real cryptographic operations and shows the measured result, its operational limitation, and independently checked failure cases. See `brief.md` for the complete target.

## When to Use It

Use to learn the named cryptographic principle. Do **not** supply actual secrets or use the lab as a key manager, attack tool or signature service.

## Live Demo

Planned: https://systemslibrarian.github.io/crypto-lab-compression-leak/ — not verified live until GitHub Pages is configured, the checks pass, and served bytes are inspected.

## What Can Go Wrong

The lesson's negative claim must stay visible when all of the relevant primitive's mathematical checks pass. See `brief.md`.

## Real-World Usage

See the standards linked from `brief.md`. Browser-only teaching examples are not full deployed protocols.

## How to Run Locally

`npm install` (generates the lockfile), `npm test`, `npm run build`, `npm run test:a11y`, `npm run dev`.

## Related Demos

https://crypto-lab.systemslibrarian.dev/

## Build & Verify

`npm test` runs Vitest crypto KATs/behavior tests; `npm run test:a11y` runs real Playwright browser interaction and accessibility checks on a freshly built Vite preview. Treat browser and deployment checks as unverified until CI reports success; source alone does not prove a production deployment. Do not claim any formal security audit.

---

*One of the browser demos in the [Crypto Lab](https://crypto-lab.systemslibrarian.dev/) suite.*

*"So whether you eat or drink or whatever you do, do it all for the glory of God." — 1 Corinthians 10:31*
