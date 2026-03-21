# Traveling Builds Setup

## Problem
You're traveling without your Mac mini. You need to test new builds on your phone while away.

## Solution: GitHub Actions + EAS Build (Real Phone)

### One-Time Setup (Do This Now, Before Traveling)

#### Step 1: Generate iOS Provisioning Profiles
```bash
cd ~/projects/rewire-app
eas credentials configure --platform ios
```

Follow the prompts to:
1. Create/select an Apple Team ID
2. Generate ad hoc provisioning profiles
3. Save the credentials to EAS (encrypted)

#### Step 2: Update eas.json Profile
```json
{
  "build": {
    "preview": {
      "ios": {
        "distribution": "internal"
      }
    }
  }
}
```

(Already done — this is internal distribution, which supports ad hoc profiles)

#### Step 3: Test Locally
```bash
export EXPO_TOKEN="LY6pUx82-6cEDQPpG_W37TDoZDqYGp36jkQUj3nJ"
eas build --platform ios --profile preview --non-interactive
```

If it works locally, it'll work in GitHub Actions.

#### Step 4: Done
Once credentials are saved to EAS, GitHub Actions can use them automatically.

### While Traveling

After setup, the workflow is:
1. Agent commits code: `git push origin main`
2. GitHub Actions triggers automatically
3. ~10-15 minutes later: Build ready
4. QR code or link available at: https://expo.dev/accounts/hopeatforge/projects/rewire

No credentials stored locally. Everything encrypted on EAS servers.

---

## Current Status

- ✅ EAS project configured
- ✅ GitHub Actions workflow set up
- ⏳ Waiting for: iOS provisioning profiles (one-time setup above)

Once profiles are created, switch workflow back from `simulator` to `preview`:
```bash
git checkout HEAD -- .github/workflows/eas-build.yml  # or manually change simulator → preview
```

Then all future pushes will build for real phones.
