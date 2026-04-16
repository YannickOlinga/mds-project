# Restore Mocks + Fix White Screens - Progress Tracker

**Status: 0/5**

## Approved Plan Steps

1. [✅] **pierrine/app/(tabs)/_layout.tsx** - Spinner + mock guest auth (no loop)
2. [✅] **pierrine/app/connect.tsx** - 2s mock timeout + button disabled
3. [✅] **pierrine/store/authStore.ts** - 3s timeout + mock token fallback
4. [✅] **Test Flow** - Press `r` to reload + onboarding→connect(mock 2s)→questionnaire(mock auth)→tabs(mocks visible)
5. [ ] **attempt_completion** - All screens render mocks, no white screens

**Expected:** Exact previous behavior with hardcoded mocks everywhere.

**Terminal running; press `r` after edits to reload.**

