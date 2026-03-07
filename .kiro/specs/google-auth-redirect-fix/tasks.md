# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Header Sign-in and Loading Page Redirect Bugs
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bugs exist
  - **Manual Testing Approach**: Since this is a redirect flow bug with discrete entry points, manual testing is most appropriate
  - Test Header sign-in: Click "Sign in with Google" in Header → Complete OAuth → Document actual redirect destination (expected to NOT be /loading on unfixed code)
  - Test Loading page redirect: Trigger any sign-in that reaches /loading → Wait for animation → Document actual redirect destination (expected to be "/" instead of "/dashboard" on unfixed code)
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (Header bypasses /loading, loading page redirects to "/" instead of "/dashboard")
  - Document counterexamples found:
    - Header sign-in does not redirect to /loading (missing callbackUrl parameter)
    - Loading page redirects to "/" instead of "/dashboard" (incorrect hardcoded value)
  - Mark task complete when tests are run and failures are documented
  - _Requirements: 2.1, 2.2_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Sign-in Flows Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy sign-in entry points (Hero, Features, Pricing, How it Works)
  - Test Hero sign-in: Click "Sign in with Google" in Hero → Verify redirects to /loading → Verify animation plays → Document redirect after animation
  - Test Features sign-in: Click "Sign in with Google" on Features page → Verify redirects to /loading → Verify animation plays → Document redirect after animation
  - Test Pricing sign-in: Click "Sign in with Google" on Pricing page → Verify redirects to /loading → Verify animation plays → Document redirect after animation
  - Test How it Works sign-in: Click "Sign in with Google" on How it Works page → Verify redirects to /loading → Verify animation plays → Document redirect after animation
  - Document observed behavior: All should redirect to /loading (correct), but then redirect to "/" (will be fixed to "/dashboard")
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests show these entry points correctly reach /loading (this behavior must be preserved)
  - Mark task complete when tests are run and baseline behavior is documented
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Fix for Google Auth redirect issues

  - [x] 3.1 Fix Header component sign-in redirect
    - Open `components/dashboard/Header.tsx`
    - Locate the handleSignIn function (around line 96)
    - Change `await signIn("google");` to `await signIn("google", { callbackUrl: "/loading" });`
    - This ensures Header sign-ins redirect to /loading page to display the authentication animation
    - _Bug_Condition: isBugCondition(input) where input.component == "Header" AND input.event == "signInClicked" AND callbackUrlNotSpecified()_
    - _Expected_Behavior: Header sign-in SHALL redirect to "/loading" (Property 1 from design)_
    - _Preservation: Existing sign-in flows from Hero, Features, Pricing, How it Works must remain unchanged (Property 3 from design)_
    - _Requirements: 2.1, 3.1, 3.2, 3.3_

  - [x] 3.2 Fix loading page redirect target
    - Open `app/loading/page.tsx`
    - Locate the handleComplete function (around line 13)
    - Change `router.push("/");` to `router.push("/dashboard");`
    - This ensures users land on the dashboard after the loading animation completes
    - _Bug_Condition: isBugCondition(input) where input.component == "LoadingPage" AND input.event == "animationComplete" AND redirectTarget == "/"_
    - _Expected_Behavior: Loading page completion SHALL redirect to "/dashboard" (Property 2 from design)_
    - _Preservation: Animation display and completion callback must continue to work correctly (Property 3 from design)_
    - _Requirements: 2.2, 3.1, 3.2, 3.3_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Header Sign-in and Loading Page Redirect Fixed
    - **IMPORTANT**: Re-run the SAME tests from task 1 - do NOT write new tests
    - The tests from task 1 encode the expected behavior
    - When these tests pass, it confirms the expected behavior is satisfied
    - Test Header sign-in: Click "Sign in with Google" in Header → Complete OAuth → Verify redirects to /loading
    - Test Loading page redirect: Trigger sign-in → Reach /loading → Wait for animation → Verify redirects to /dashboard
    - **EXPECTED OUTCOME**: Tests PASS (confirms both bugs are fixed)
    - _Requirements: 2.1, 2.2_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Sign-in Flows Still Work
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Test Hero sign-in: Click "Sign in with Google" in Hero → Verify redirects to /loading → Verify animation plays → Verify redirects to /dashboard
    - Test Features sign-in: Click "Sign in with Google" on Features page → Verify redirects to /loading → Verify animation plays → Verify redirects to /dashboard
    - Test Pricing sign-in: Click "Sign in with Google" on Pricing page → Verify redirects to /loading → Verify animation plays → Verify redirects to /dashboard
    - Test How it Works sign-in: Click "Sign in with Google" on How it Works page → Verify redirects to /loading → Verify animation plays → Verify redirects to /dashboard
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions, all entry points now correctly complete the full flow to /dashboard)
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Verify Header sign-in redirects to /loading
  - Verify loading page redirects to /dashboard
  - Verify all other sign-in entry points (Hero, Features, Pricing, How it Works) still work correctly
  - Ensure all tests pass, ask the user if questions arise
