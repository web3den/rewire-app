# GitHub Automation Setup - ONE TIME ONLY

✅ **Completed:**
- GitHub repo created: https://github.com/web3den/rewire-app
- Code pushed
- GitHub Actions workflow added (.github/workflows/eas-build.yml)
- GitHub token stored securely

⏳ **One final step:**

## Add EAS_TOKEN to GitHub Secrets

1. Go to: https://github.com/web3den/rewire-app/settings/secrets/actions
2. Click "New repository secret"
3. Name: `EAS_TOKEN`
4. Value: (Need to get from EAS CLI)

**To get your EAS token:**
```bash
cd ~/projects/rewire-app
eas account:login  # (you're already logged in)
eas credentials:list  # Shows your current tokens
```

Or create a new one from Expo dashboard:
1. Go to: https://expo.dev/accounts/hopeatforge/settings/tokens
2. Create new token (name: `github-ci`)
3. Copy the token value
4. Paste it into GitHub Secrets as `EAS_TOKEN`

## That's It!

Once `EAS_TOKEN` is in GitHub Secrets:

**Every time you push to main:**
- GitHub Actions automatically triggers
- Runs `eas build --platform ios --profile preview`
- ~10-15 minutes later, build is ready
- Check: https://expo.dev/accounts/hopeatforge/projects/rewire

**Future agents just need to:**
```bash
git push origin main
```

No manual builds. Fully automated.

---

**Token locations (for future reference):**
- GitHub token: `~/.openclaw/runtime/tokens/github-rewire-app-ci`
- Supabase token: `~/.openclaw/runtime/supabase/rewire-cli-token`
