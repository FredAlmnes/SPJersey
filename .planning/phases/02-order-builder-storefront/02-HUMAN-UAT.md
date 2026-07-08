---
status: resolved
phase: 02-order-builder-storefront
source: [02-VERIFICATION.md]
started: 2026-07-08T17:10:00Z
updated: 2026-07-08T17:25:00Z
---

## Current Test

[complete]

## Tests

### 1. Mobile collapsed cart bar does not cover the submit button (CR-01 fix)
expected: Collapsed bar is a small, fixed-height (~64px) strip; expand/collapse works via the chevron button; the form's submit button remains fully visible and clickable underneath at any scroll position.
result: pass

### 2. Edit-then-remove no longer silently discards the customer's edit (CR-02 fix)
expected: Removing the cart item currently open for editing clears the form back to "Legg i handlekurv" state rather than leaving a stale, submittable "Oppdater" form bound to a since-removed item.
result: pass

## Summary

total: 2
passed: 2
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
