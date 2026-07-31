# Catalog Publication Wave 2 Queue — 2026-07-31

## Status

The remaining 23 Group A revisions have a current positive Human Review
Decision and remain unpublished with zero Approval and zero Publication Batch.
They are excluded from Wave 1 and require a new exact immutable operation
manifest before any write.

## Reviewed queue

1. Vacus 7209
2. Mindray iMEC 8/10/12
3. Storm 5900
4. Vacus 7018
5. Canon Aplio i700
6. Canon Aplio i800
7. GE Vivid iQ
8. GE Vivid T9
9. Mindray DC-40
10. Mindray DC-70
11. Mindray DC-80
12. Mindray M9
13. Mindray MX8
14. Mindray Resona 6
15. Mindray Resona 7
16. Mindray Resona i9
17. Bionet FC1400
18. Huntleigh Sonicaid Team3-I
19. Huntleigh Sonicaid Team3-A
20. Canon Aplio i900
21. GE LOGIQ E9
22. Bionet CardioCare 2000
23. Bionet CardioTouch 3000

## Recommendation

Create a Wave 2 manifest from fresh durable state, split the scope into a first
controlled batch of at most 15–20 Products, and repeat exact preflight,
idempotent Approval, Publication and public smoke. Do not reuse the completed
Wave 1 operation key.
