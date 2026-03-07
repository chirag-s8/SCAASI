# Bugfix Requirements Document

## Introduction

This document addresses the Google authentication redirect flow issue where users clicking "Sign in with Google" from the Header component bypass the loading animation page and are redirected to the wrong final destination. The fix ensures all sign-in entry points follow the same redirect flow: Google auth → /loading (with animation) → /dashboard.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user clicks "Sign in with Google" from the Header component THEN the system redirects directly to the default NextAuth redirect location, bypassing the /loading page and its animation

1.2 WHEN the /loading page animation completes THEN the system redirects to "/" instead of "/dashboard"

### Expected Behavior (Correct)

2.1 WHEN a user clicks "Sign in with Google" from the Header component THEN the system SHALL redirect to "/loading" after successful authentication

2.2 WHEN the /loading page animation completes THEN the system SHALL redirect to "/dashboard"

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user clicks "Sign in with Google" from other components (Hero, Features, Pricing, How it Works) that already specify callbackUrl: "/loading" THEN the system SHALL CONTINUE TO redirect to "/loading" after authentication

3.2 WHEN the MailMindLoginAnimation component plays THEN the system SHALL CONTINUE TO display the animation correctly before redirecting

3.3 WHEN authentication fails or is cancelled THEN the system SHALL CONTINUE TO handle errors appropriately without breaking the user experience
