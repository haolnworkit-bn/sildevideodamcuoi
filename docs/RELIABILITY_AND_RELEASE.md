# Reliability, export benchmarks, billing and backup

## Regression checks

Run `npm ci && npm run typecheck && npm run test:lunar && npm run check:assets && npm run test:assets && npm run build`.
The PR workflow now runs these checks on Ubuntu/Node 24. A successful build is not proof that all browsers can export video.

## Video export benchmark

Run `npm run dev` and open `/dev/export?aspect=16:9&photos=3&loops=1&audio=1` in Chrome/Edge.
Repeat with `&webm=1`, `aspect=9:16`, and `loops=15` on desktop and mobile.
Collect the `METRICS` JSON from the result element for each combination, including:
- `elapsedMs`: total run wall clock time (includes font load and metadata playback).
- `outputBytes`: final video size.
- `speedVsRealtimeApprox`: effective video duration / wall time; **approximate**.
- `jsHeapStartBytes` and `jsHeapEndBytes`: Chromium-only snapshots, **not peak process memory**.
- `audioDropped`, `audioDecodedBytes`, `metadata`, `userAgent`.

The WebM path is real-time by design; avoid treating a long runtime as failure without testing real playback. For a peak-memory benchmark, use the Chrome Performance/Memory panels or OS process memory. Record results per device; no browser benchmark results are asserted by this repository change.

## Backup and restore

Editor toolbar offers **Sao lưu** and **Phục hồi**. A JSON backup embeds the project and its photos and music encoded as base64. Keep this file private: it contains event names, addresses and photos. Restore creates a fresh project ID and new IndexedDB asset keys; no payment/unlock is transferred. Archives are limited to 60 MB when imported. Test restore across a fresh browser profile before relying on the backup for production data.

## Payments: deliberately fail closed

**No live payment provider is integrated.** Dev-only `PAYMENT_PROVIDER=mock` can simulate purchase locally. In production mock is rejected, server returns 501 for unconfigured providers, and localStorage unlock flags are ignored. Never enable monetization on production and tell users checkout works without first integrating a provider and server-owned proof of payment.

Before real billing, implement a provider-specific signed callback validated against the provider API, durable order/entitlement records with idempotency and reconciliation, authenticated customer/project binding, payment status UI, and **server-enforced clean export**. Client-side Canvas rendering cannot be protected simply by an entitlement check in React; users can bypass it. A payment integration without an enforced server export boundary is not a secure paid product.
