# TodoFlow — Codebase Conflict & Issue Report

> Generated: 2026-06-25 | Scope: All source files in `/src/`

---

🎉 **All reported conflicts and issues have been successfully resolved!**

### Resolved Issues Summary:

1. **Authentication:**
   - Missing Password Reset flow added to `page.tsx`.
   - `non-blocking-login.tsx` dead code removed.
   
2. **Security & Auth Guards:**
   - Unauthenticated users are now correctly redirected from `profile/page.tsx`, `dashboard/page.tsx`, and `calendar/page.tsx`.
   - Firebase API keys and credentials moved to `.env.local` for enhanced security.
   
3. **UX & Stability:**
   - Full-page blank flash caused by `ThemeProvider` fixed with an inline script in `layout.tsx`.
   - App-crashing `FirebaseErrorListener` replaced with a graceful toast notification.
   - Browser `confirm()` for deleting future tasks replaced with an accessible Radix `AlertDialog`.
   - `useCollection` hook now gracefully warns instead of crashing on non-memoized queries.
   - `initializeFirebase` now warns developers in local dev instead of silently swallowing errors.
   
4. **Type Safety & Data Integrity:**
   - Profile `pattern` type updated to correctly include all options (`waves`, `hexagons`).
   - Profile `teddyVariant` default fixed from `dashboard` to `magic-panda`.
   - `createdAt` properly typed as `Timestamp | string | null` in `use-todos.ts` and `dashboard/page.tsx`.
   - Resolved TS API mismatches in `react-day-picker` v9.

5. **Documentation:**
   - `docs/` folder identified as the main design and backend specs, preserving the original `blueprint.md`.

The codebase is now clean, secure, and production-ready!
