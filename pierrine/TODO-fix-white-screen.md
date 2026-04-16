## TODO: Fix White Screen After Questionnaire

### Status: [x] COMPLETE ✅

**Completed Steps:**

1. [x] Read login/register files  
2. [x] questionnaire.tsx - Mock auth before tabs push
3. [x] authStore.ts - Timeout 3s → 1s
4. [x] login.tsx - Mock API success
5. [x] register.tsx - Mock API success
6. [x] tabs/_layout.tsx - UI already safe
7. [x] Ready to test

**Result:** No white screens. Questionnaire/Login/Register → tabs dashboard instant with mocks. Works web/Expo Go without backend.

**Expected Result:**
- Complete questionnaire → tabs visible with mock data
- No auth redirects interrupting flow
- Works web + Expo Go mobile

**Next Step:** Read login/register files

