# FIREBASE & FIRESTORE COST OPTIMIZATION RULES (PREVENT BILLING EXPLOSION)

### 1. READS OPTIMIZATION (Prevent Read Spikes)
- **Always Use Limits**: Never fetch a collection without a query limit. Every query fetching multiple documents must include `.limit(N)` (e.g. `limit(20)`).
- **Pagination**: Use cursor-based pagination (`startAfter`, `startAt`) for large lists instead of fetching all documents and filtering on client side.
- **Never Query in Loops (No N+1 Queries)**: Never execute Firestore queries inside loops (`forEach`, `map`, `for`). Use `where('__name__', 'in', ids)` (chunked in batches of up to 30) or denormalize reference data.
- **Clean Up Realtime Listeners**: Always unsubscribe `onSnapshot` listeners when components unmount to prevent persistent background reads.
- **Use Aggregation Queries**: For counts and sums, always use Firestore aggregation queries (`count()`, `sum()`, `average()`) which cost 1 read per 1000 index entries, instead of fetching entire document snapshots.

### 2. CACHING & LOCAL PERSISTENCE
- **Cache-First Pattern**: Always check `localStorage` or memory cache before making any Firestore read.
- **Cache Key Pattern**: `oskarshop_{feature}_{identifier}` with strict expiry (5 min dynamic data, 1 hour static data).
- **Invalidate on Mutation**: Whenever a write/update happens, immediately invalidate or update the local cache so redundant re-fetches are avoided.

### 3. WRITES & TRANSACTIONS (Prevent Write Spikes)
- **Batch Writes**: Use `writeBatch()` for multiple document writes/updates (up to 500 operations per batch) instead of individual sequential write calls.
- **Selective Updates**: Use `updateDoc` for specific field changes instead of `setDoc` overwriting entire documents unnecessarily.
- **Debounce & Throttle User Writes**: Debounce auto-save or high-frequency input writes (e.g. search term logs, typing indicators, slider updates) before writing to Firestore.

### 4. CLOUD FUNCTIONS & INFINITE LOOP PREVENTION
- **Guard Cloud Function Triggers**: Any Firestore trigger (`onDocumentUpdated`, `onDocumentWritten`) MUST have a guard condition checking if relevant fields actually changed to prevent recursive infinite write loops.
- **Idempotency**: Ensure background jobs and Cloud Functions are idempotent and cannot be triggered in cascading loops.

### 5. DATA MODELING & DENORMALIZATION
- **Denormalize Read-Heavy Data**: If user profile summary, product title, or thumbnail is displayed repeatedly across lists, embed the minimal summary directly in the parent document to avoid multi-document read lookups.
- **Subcollections vs Top-Level Collections**: Separate rarely-read large data (e.g. logs, audit history) into subcollections to keep parent document payload lean.
