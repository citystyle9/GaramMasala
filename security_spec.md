# Security Specification: Spice Organizer

## 1. Data Invariants
- Each user's data is isolated under `/users/{userId}/...`.
- Only the authenticated owner of `{userId}` can read or write their own documents.
- Anonymous and Google-authenticated users are supported under their unique `request.auth.uid`.
- Path variable `{userId}` must match `request.auth.uid`.
- Document properties must respect maximum size limits to prevent resource exhaustion attacks.

## 2. The "Dirty Dozen" Test Attack Payloads
1. **Unauthenticated Read**: Attempt to read `/users/user123/recipeState/current` without authentication -> `PERMISSION_DENIED`.
2. **Unauthenticated Write**: Attempt to create `/users/user123/recipeState/current` without auth -> `PERMISSION_DENIED`.
3. **Cross-User Impersonation**: Authenticated as `userA`, trying to write to `/users/userB/recipeState/current` -> `PERMISSION_DENIED`.
4. **Cross-User Read**: Authenticated as `userA`, trying to read `/users/userB/templates/tpl1` -> `PERMISSION_DENIED`.
5. **ID Poisoning Attack**: Passing a 2KB junk character string as `stateId` or `templateId` -> `PERMISSION_DENIED`.
6. **Shadow Field Injection**: Injecting arbitrary extra fields like `{ "isAdmin": true, "backdoor": "open" }` into a template -> `PERMISSION_DENIED`.
7. **Oversized String Bomb**: Setting a 1MB template name -> `PERMISSION_DENIED`.
8. **Negative / NaN Weight**: Setting spice weight to invalid value -> Rejected by schema validation.
9. **Array Exhaustion Attack**: Passing an array of 5,000 spices to exhaust document limits -> `PERMISSION_DENIED` via size constraint.
10. **Tampered Owner ID**: Attempting to set `userId: 'attacker'` inside user `victim`'s path -> `PERMISSION_DENIED`.
11. **Cross-User Delete**: Attempting to delete another user's template -> `PERMISSION_DENIED`.
12. **Catch-All Default Access**: Attempting to read `/random_collection/doc` -> `PERMISSION_DENIED`.
