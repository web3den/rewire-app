# Cloud Build Setup for Testing While Traveling

You've signed up at Expo with: **hope@forgebeyond.ai**

## Quick Start (One Time)

### Step 1: Login to EAS
```bash
cd ~/projects/rewire-app
eas login
```

- It opens a browser window
- Log in with your Expo credentials (hope@forgebeyond.ai / Qwerty1!2!3!)
- Once done, close the browser
- Come back to terminal — you're logged in

### Step 2: Verify Login
```bash
eas whoami
```
Should show your username/email.

### Step 3: You're Done ✅

## Testing New Builds (While Traveling)

Every time you want to test:

```bash
cd ~/projects/rewire-app
eas build --platform ios --profile preview
```

**What happens:**
1. Code uploads to Expo cloud servers
2. Builds your app (~10-15 minutes)
3. Generates a **QR code** in terminal
4. Creates a **shareable link** you can send to anyone
5. Anyone with the link can test on their phone (iOS or Android)

**Output looks like:**
```
✅ Build finished!

QR Code:
[QR code displayed]

Shareable Link:
https://expo.dev/artifacts/[build-id]
```

Scan the QR or share the link. Done.

## For Den While Traveling

1. Make code changes
2. `git push` (optional, just for backup)
3. `eas build --platform ios --profile preview`
4. Wait ~10 min
5. Get QR code
6. Share with stakeholders
7. They test on their phones
8. Get feedback
9. Iterate

**No local setup needed. Works anywhere.**

## Troubleshooting

### "Not logged in"
Run: `eas login` again

### "Build failed"
Check the error in terminal. Usually TypeScript or dependency issues. Fix, then run `eas build` again.

### "Build is taking too long"
It's normal. First build takes ~15 min. Rebuilds are faster (~5-10 min).

---

**You're all set for cloud testing.** Just run `eas login` once, then use `eas build --platform ios --profile preview` whenever you want to test a new build.
