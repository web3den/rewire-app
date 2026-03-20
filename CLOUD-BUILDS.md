# Cloud Builds for Testing While Traveling

## Quick Start

### Option 1: EAS Build (Recommended)
Works anywhere, generates shareable QR code for testing on any device.

**One-time setup:**
```bash
cd ~/projects/rewire-app
eas login
```

**Build for testing:**
```bash
eas build --platform ios --profile preview
```

**Output:** QR code + shareable link you can send to anyone

**Time:** ~10-15 minutes per build

---

### Option 2: GitHub Pages (Web Version)
Auto-builds on every `git push`, instant web testing.

**One-time setup:**
1. Push repo to GitHub
2. Go to Settings → Pages
3. Set source to "GitHub Actions"
4. Done

**Then:**
```bash
git push origin main
```

**Output:** Auto-deployed to `https://denclaw.github.io/rewire-app` (2-5 min after push)

---

### Option 3: Local Testing (Home Network Only)
For when you're home on same Wi-Fi as your machine.

```bash
npx expo start
# Then scan QR or use: exp://YOUR_IP:8081
```

---

## For Traveling

Use **EAS Build** (Option 1).

**Workflow:**
1. Make changes locally
2. Run: `eas build --platform ios --profile preview`
3. Wait ~10 min
4. Share the generated link with stakeholders
5. Anyone can test on their phone without local setup

---

## Why Three Options?

- **EAS**: Cloud-hosted, shareable, works anywhere
- **GitHub Pages**: Automatic on every push, web-only (no native features)
- **Local**: Instant feedback, only works at home

For traveling, **always use EAS**.

---

## Files Ready

- `eas.json` — EAS configuration
- `.github/workflows/build-and-deploy.yml` — GitHub Actions CI
- This file — documentation

**Next step:** Run `eas login` once, then you're ready.
