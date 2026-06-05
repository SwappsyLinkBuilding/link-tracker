# Contributing to Swappsy Link Tracker

Thanks for your interest! This project is open source under **AGPL-3.0**.

## Contributor License Agreement (CLA)

By submitting a contribution (a pull request, patch, or any code) you agree that:

1. You are the author of the contribution, or have the right to submit it.
2. You grant Swappsy a **perpetual, worldwide, royalty-free license** to use, modify, and
   relicense your contribution — including in Swappsy's **closed-source** hosted product
   (swappsy.net) — in addition to its release under AGPL-3.0 here.

This dual grant lets the project stay open while allowing the hosted product to build on it. If you
cannot agree to this, please open an issue to discuss before contributing code.

## Scope — what belongs here

✅ Manual link tracking, UI/UX, CSV, themes, i18n, self-hosting/docs, bug fixes.

🚫 **Out of scope** (these live only in the hosted product, by design):
automated/scheduled link checking, alerting/email/notifications, check history & analytics, the
link-exchange marketplace. PRs adding these will be declined — the manual/automatic split is what
makes the open-core model work.

## Dev setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Before opening a PR

- `npm run lint` passes
- `npm test` passes
- Keep the dependency footprint small — this tool is intentionally tiny.
