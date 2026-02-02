# Changelog

## [Unreleased]

### Added
- **Push Notifications**:
    - Implemented `firebase-messaging-sw.js` for background handling.
    - Created `useFcmToken` hook in `src/hooks/useData`.
    - Integrated Notification permission request in `Providers.tsx`.
- **Notifications Page**:
    - Created `src/app/[lang]/(protected)/notifications/page.tsx` and `NotificationsView`.
    - Added GraphQL queries/subscriptions for real-time updates.
- **Settings Page**:
    - Created `src/app/[lang]/(protected)/settings/page.tsx` and `SettingsView`.
    - Implemented Email Update and Password Reset flows.
- **Dependencies**: Added `date-fns` for time formatting.

### Fixed
- **Friends Page Overhaul**:
    - Unified Connections, Requests, and Suggestions into tabs.
    - Added "My Connections" view (Client-side filtered).
    - Hardened WebSocket connection against mobile sleep mode errors.
- **UI Improvements**:
    - Fixed stretched Avatar image in User Cards.
- **GraphQL Types**: Corrected `IndividualUser` -> `IndividualUserObject` discrepancy in `notifications.ts`.
- **PWA**: Fixed `manifest.json` location (moved to `public`).
- **Build**: Fixed TS errors in Service Worker file.
