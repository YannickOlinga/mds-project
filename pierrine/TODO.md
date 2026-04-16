# Fix White Screen After Questionnaire - Progress Tracker

## Approved Plan Steps ✅

**Status: 1/6 COMPLETED**

1. [✅] **Create TODO.md** - Track implementation steps
2. [ ] **Edit pierrine/store/authStore.ts** 
   - Fix `initializeAuth()`: use `getAccessToken()` from lib/auth.ts
   - Add 3s timeout for loading
   - Better error logging, consistent storage keys
3. [ ] **Edit pierrine/app/(tabs)/_layout.tsx**
   - Add 5s timeout fallback for auth.loading
   - Ensure always visible UI (loading → auth UI → redirect)
4. [ ] **Edit pierrine/app/(tabs)/profile.tsx**
   - Fix storage keys to `pierrine.accessToken` (match auth.ts)
5. [ ] **Test Flow**
   - Clear cache: `npx expo start --clear`
   - Questionnaire → tabs (loading → content or login redirect)
   - Verify Expo Go & web
6. [ ] **attempt_completion** - Confirm no white screens

**Post-Edit: Run `npx expo start --clear` to test.**

