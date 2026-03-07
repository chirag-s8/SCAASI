# Google Auth Redirect Fix - Bugfix Design

## Overview

This bugfix addresses two related redirect issues in the Google authentication flow:
1. The Header component's "Sign in with Google" button bypasses the loading animation page by not specifying a callbackUrl
2. The loading page redirects to "/" instead of "/dashboard" after animation completion

The fix ensures all sign-in entry points follow the consistent flow: Google auth → /loading (with animation) → /dashboard.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when users sign in via the Header component or when the loading animation completes
- **Property (P)**: The desired behavior - Header sign-in should redirect to /loading, and loading page should redirect to /dashboard
- **Preservation**: Existing sign-in behavior from other components (Hero, Features, Pricing, How it Works) that already correctly specify callbackUrl: "/loading"
- **signIn()**: NextAuth function in `next-auth/react` that initiates Google OAuth flow
- **callbackUrl**: Optional parameter to signIn() that specifies where to redirect after successful authentication
- **handleComplete**: Callback function in `/app/loading/page.tsx` that executes when MailMindLoginAnimation finishes
- **router.push()**: Next.js navigation function that performs client-side routing

## Bug Details

### Fault Condition

The bug manifests in two distinct scenarios:

**Scenario 1**: When a user clicks "Sign in with Google" from the Header component, the signIn() function is called without a callbackUrl parameter, causing NextAuth to use its default redirect behavior (typically redirecting to the page where sign-in was initiated or a default callback URL), bypassing the /loading page entirely.

**Scenario 2**: When the loading page animation completes, the handleComplete function calls router.push("/") instead of router.push("/dashboard"), sending users to the home page instead of the dashboard.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { component: string, event: string }
  OUTPUT: boolean
  
  RETURN (input.component == "Header" 
          AND input.event == "signInClicked" 
          AND callbackUrlNotSpecified())
         OR
         (input.component == "LoadingPage" 
          AND input.event == "animationComplete" 
          AND redirectTarget == "/")
END FUNCTION
```

### Examples

- **Header Sign-in Bug**: User clicks "Sign in with Google" in Header → Google OAuth completes → User lands on default NextAuth redirect (not /loading) → Animation never plays
- **Loading Redirect Bug**: User completes Google OAuth from any component → Lands on /loading → Animation plays → Redirects to "/" (home page) instead of "/dashboard"
- **Correct Flow (from other components)**: User clicks "Sign in with Google" on Hero/Features/Pricing/How-it-Works → Google OAuth completes → User lands on /loading → Animation plays → Should redirect to /dashboard (currently redirects to "/")
- **Edge case**: User manually navigates to /loading without authentication → Animation plays → Redirects to "/" (this behavior may be acceptable)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All other components (ScassiHero3D, Features, Pricing, How it Works) that already specify `callbackUrl: "/loading"` must continue to work exactly as they do now
- The MailMindLoginAnimation component must continue to display and animate correctly
- Authentication error handling and cancellation flows must continue to work appropriately
- The Header component's visual appearance, magnetic button effect, and other UI behaviors must remain unchanged

**Scope:**
All authentication flows that already correctly specify `callbackUrl: "/loading"` should be completely unaffected by this fix. This includes:
- Sign-in buttons in Hero section (ScassiHero3D.tsx)
- Sign-in buttons in Features page (app/features/page.tsx)
- Sign-in buttons in Pricing page (app/pricing/page.tsx - multiple instances)
- Sign-in buttons in How it Works page (app/how-it-works/page.tsx)

## Hypothesized Root Cause

Based on the code analysis, the root causes are clear:

1. **Missing callbackUrl Parameter**: In `components/dashboard/Header.tsx` line 96, the signIn() call is:
   ```typescript
   await signIn("google");
   ```
   This should be:
   ```typescript
   await signIn("google", { callbackUrl: "/loading" });
   ```
   Without the callbackUrl parameter, NextAuth uses its default redirect logic instead of sending users to /loading.

2. **Incorrect Redirect Target**: In `app/loading/page.tsx` line 13, the handleComplete function contains:
   ```typescript
   router.push("/");
   ```
   This should be:
   ```typescript
   router.push("/dashboard");
   ```
   The hardcoded "/" destination sends users to the home page instead of the dashboard.

## Correctness Properties

Property 1: Fault Condition - Header Sign-in Redirects to Loading Page

_For any_ user interaction where the "Sign in with Google" button in the Header component is clicked and authentication succeeds, the fixed signIn function SHALL redirect to "/loading" to display the authentication animation before proceeding to the dashboard.

**Validates: Requirements 2.1**

Property 2: Fault Condition - Loading Page Redirects to Dashboard

_For any_ completion of the MailMindLoginAnimation on the /loading page, the fixed handleComplete function SHALL redirect to "/dashboard" instead of "/".

**Validates: Requirements 2.2**

Property 3: Preservation - Existing Sign-in Flows Unchanged

_For any_ sign-in interaction from components other than Header (Hero, Features, Pricing, How it Works) that already specify callbackUrl: "/loading", the authentication flow SHALL produce exactly the same behavior as before the fix, preserving the existing redirect to /loading.

**Validates: Requirements 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

The root cause analysis is straightforward - both issues are simple parameter/value corrections.

**File 1**: `components/dashboard/Header.tsx`

**Function**: `handleSignIn`

**Specific Changes**:
1. **Add callbackUrl parameter**: Modify the signIn() call on line 96 to include `{ callbackUrl: "/loading" }` as the second argument
   - Change from: `await signIn("google");`
   - Change to: `await signIn("google", { callbackUrl: "/loading" });`
   - This ensures Header sign-ins follow the same flow as other components

**File 2**: `app/loading/page.tsx`

**Function**: `handleComplete`

**Specific Changes**:
1. **Update redirect target**: Modify the router.push() call on line 13 to redirect to "/dashboard" instead of "/"
   - Change from: `router.push("/");`
   - Change to: `router.push("/dashboard");`
   - This ensures users land on the dashboard after the loading animation completes

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, verify the bugs exist on unfixed code by observing incorrect redirects, then verify the fix works correctly and preserves existing behavior for other sign-in entry points.

### Exploratory Fault Condition Checking

**Goal**: Confirm the bugs exist BEFORE implementing the fix by observing the incorrect redirect behavior.

**Test Plan**: Manually test the authentication flow from different entry points and observe where users are redirected. Document the actual vs expected behavior.

**Test Cases**:
1. **Header Sign-in Test**: Click "Sign in with Google" in Header → Complete OAuth → Observe redirect destination (will NOT be /loading on unfixed code)
2. **Loading Page Redirect Test**: Trigger any sign-in flow that reaches /loading → Wait for animation → Observe redirect destination (will be "/" instead of "/dashboard" on unfixed code)
3. **Hero Sign-in Test**: Click "Sign in with Google" in Hero section → Complete OAuth → Observe redirect (should already go to /loading on unfixed code)
4. **Features Sign-in Test**: Click "Sign in with Google" on Features page → Complete OAuth → Observe redirect (should already go to /loading on unfixed code)

**Expected Counterexamples**:
- Header sign-in bypasses /loading page entirely
- Loading page redirects to "/" instead of "/dashboard"
- Possible causes: missing callbackUrl parameter, incorrect hardcoded redirect target

### Fix Checking

**Goal**: Verify that after the fix, both the Header sign-in and loading page redirect work correctly.

**Pseudocode:**
```
FOR ALL signInEvent WHERE signInEvent.component == "Header" DO
  result := handleSignIn_fixed()
  ASSERT result.redirectsTo == "/loading"
END FOR

FOR ALL animationComplete WHERE animationComplete.page == "/loading" DO
  result := handleComplete_fixed()
  ASSERT result.redirectsTo == "/dashboard"
END FOR
```

### Preservation Checking

**Goal**: Verify that sign-in flows from other components (Hero, Features, Pricing, How it Works) continue to work exactly as before.

**Pseudocode:**
```
FOR ALL signInEvent WHERE signInEvent.component IN ["Hero", "Features", "Pricing", "HowItWorks"] DO
  ASSERT handleSignIn_original(signInEvent) == handleSignIn_fixed(signInEvent)
END FOR
```

**Testing Approach**: Manual testing is sufficient for this bugfix because:
- The changes are minimal and localized (two single-line modifications)
- The behavior is deterministic (no complex logic or edge cases)
- Visual confirmation of redirect flow is straightforward
- The number of entry points is small and well-defined

**Test Plan**: Test each sign-in entry point on UNFIXED code first to document current behavior, then test on FIXED code to verify preservation.

**Test Cases**:
1. **Hero Sign-in Preservation**: Click "Sign in with Google" in Hero → Verify still redirects to /loading → Verify animation plays → Verify redirects to /dashboard
2. **Features Sign-in Preservation**: Click "Sign in with Google" on Features page → Verify still redirects to /loading → Verify animation plays → Verify redirects to /dashboard
3. **Pricing Sign-in Preservation**: Click "Sign in with Google" on Pricing page → Verify still redirects to /loading → Verify animation plays → Verify redirects to /dashboard
4. **How it Works Sign-in Preservation**: Click "Sign in with Google" on How it Works page → Verify still redirects to /loading → Verify animation plays → Verify redirects to /dashboard

### Unit Tests

- Test that Header component's handleSignIn function calls signIn() with correct callbackUrl parameter
- Test that loading page's handleComplete function calls router.push() with "/dashboard"
- Test that animation component continues to trigger onComplete callback correctly

### Property-Based Tests

Property-based testing is not necessary for this bugfix because:
- The changes are simple parameter/value corrections with no complex logic
- The input space is discrete and small (specific button clicks, not continuous data)
- Manual testing provides sufficient coverage for the deterministic behavior

### Integration Tests

- Test complete flow: Header sign-in → Google OAuth → /loading page → Animation → /dashboard
- Test complete flow from each other entry point to verify preservation
- Test that authentication errors still display appropriately
- Test that cancelling authentication doesn't break the flow
