# EAS Build with Apple Watch companion

Normal `eas build --profile production` shows **Apple Watch: No** for two reasons:

1. **`app/ios` was gitignored** — EAS never uploaded the Watch target and rebuilt iOS without it.
2. **EAS remote credentials** only sign the iPhone app — Watch needs a second provisioning profile.

## Fix overview

| Target                       | Bundle ID                          |
| ---------------------------- | ---------------------------------- |
| `TimeTrackers`               | `com.time-tracker.app`             |
| `TimeTrackerWatch Watch App` | `com.time-tracker.app.watchkitapp` |

Use profile **`production-watch`** (local multi-target credentials).

## One-time setup

### A. Commit the native iOS project (required)

`ios/` is no longer gitignored. Commit it so EAS receives the Watch target:

```bash
cd /Users/user/Desktop/Code/TimeTracker
git add app/ios app/.gitignore app/.easignore app/eas.json app/credentials.json.example app/docs/WATCH_EAS.md app/package.json
git commit -m "Include iOS Watch companion in EAS uploads"
```

### B. Download iPhone signing files from Expo

1. Open [EAS Credentials](https://expo.dev/accounts/bbanothu/projects/TimeTracker/credentials)
2. iOS → download Distribution Certificate → `app/ios/certs/dist-cert.p12` (save the password)
3. Download Provisioning Profile for `com.time-tracker.app` → `app/ios/certs/TimeTrackers.mobileprovision`

### C. Create Watch App ID + profile on Apple Developer

1. [Identifiers](https://developer.apple.com/account/resources/identifiers/list) → **+** → App IDs → App
2. Bundle ID (explicit): `com.time-tracker.app.watchkitapp`
3. [Profiles](https://developer.apple.com/account/resources/profiles/list) → **+** → **App Store Connect**
4. Select that App ID + the **same** distribution certificate → download as `app/ios/certs/TimeTrackerWatch.mobileprovision`

### D. Create `credentials.json`

```bash
cd app
cp credentials.json.example credentials.json
# Set both password fields to the dist-cert password from step B
```

`credentials.json` is gitignored — do not commit it.

### E. Build + TestFlight

```bash
cd app
npm run release:ios:watch
```

When it finishes, TestFlight should show **Apple Watch: Yes**. Update the iPhone app, then install TimeTracker on the Watch if needed (Watch app → My Watch → Available Apps).
