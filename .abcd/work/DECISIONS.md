# Security bug-hunt loop — decisions log

Dated, one-line summaries of each autonomous security-hardening round.

- 2026-07-29 — Round 1: fixed 5 confirmed defects — provider/schema registry prototype-chain DoS (`Object.hasOwn`), star-rating `String.repeat` crash/hang clamp, `settings.json` fetch now honours the source allowlist, oversized image no longer wipes the whole cache, and entity/definition validation strips prototype-polluting keys before Zod. 32 reproduction tests added. Refuted candidates recorded in the round PR.
