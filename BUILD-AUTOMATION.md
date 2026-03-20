# Rewire App — Build Automation & Cloud Testing

## Problem
Den needs to test latest builds from anywhere (while traveling) without local setup.

## Solution: GitHub Pages + Expo Web Export

### Step 1: Configure for Web Export
Already done in `app.json` + TypeScript config.

### Step 2: Automate Export → GitHub Pages
Create GitHub Action that:
1. Runs on every push to `main`
2. Builds Expo web version
3. Exports to `./dist`
4. Deploys to GitHub Pages

### Step 3: Instant Testing
Once deployed, Den can:
- Visit: `https://denclaw.github.io/rewire-app` from any device
- Scan QR code or use web version
- Test latest build immediately

---

## Quick Setup

### GitHub Actions Workflow
Create `.github/workflows/build-and-deploy.yml`:

```yaml
name: Build & Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Expo web
        run: npx expo export --platform web
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Enable GitHub Pages
1. Go to repo Settings → Pages
2. Set Source: GitHub Actions
3. Wait for first build
4. URL: `https://denclaw.github.io/rewire-app`

---

## Alternative: EAS Build (Official Expo Cloud)

### Setup
```bash
cd ~/projects/rewire-app
eas login  # One-time setup, browser login
eas build --platform ios --profile preview  # Creates shareable link
```

### Result
- Automatic cloud build
- Shareable link (QR code)
- Works on any device (no local IP needed)
- Builds stored in Expo dashboard

### Pros
- Official Expo service
- Works across networks
- Native iOS/Android builds

### Cons
- Requires Expo account
- Slower build time (~10-15 min)

---

## Recommended: Hybrid Approach

**For quick local testing:**
- Use `npx expo start` (current setup) — instant, local IP link

**For traveling/sharing:**
- Use EAS build — cloud-hosted, shareable, no IP needed

**For CI/Archive:**
- Use GitHub Pages + Actions — automatic on every push

---

## Implementation Priority

1. **Now:** Set up EAS login (requires one interactive session)
2. **Then:** Configure `.github/workflows/build-and-deploy.yml`
3. **Finally:** Enable GitHub Pages in repo settings

Once set up, Den gets:
- Local testing: `exp://192.168.86.239:8081` (instant)
- Cloud testing: EAS link (shareable, traveling)
- Auto-deploy: GitHub Pages (every push)

---

## Commands for Den

```bash
# Local testing (instant, no build)
npx expo start

# Cloud testing (shareable, works anywhere)
eas build --platform ios --profile preview

# Check build status
eas build --status
```

Output will include a QR code + shareable link.
