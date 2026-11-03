# Nurses Pillow Project Guidelines (`GEMINI.md`)

## 1. Build, Dependencies & Deployment
- **Package Manager:** Pnpm (`pnpm`). All dependency changes must be finalized by running `pnpm install` to generate/update `pnpm-lock.yaml` before pushing to `main` to avoid `ERR_PNPM_OUTDATED_LOCKFILE` in Railway CI/CD deployments.

## 2. Git & Authentication Workflow
- **Environment Overrides:** In this development environment, `GIT_CONFIG_GLOBAL=/dev/null` and `GIT_CONFIG_SYSTEM=/dev/null` are set.
- **Fetching/Pulling with Authentication:** When running git commands that authenticate or update remote refs via `gh` or HTTPS credentials, explicitly unset the git config override environment variables:
  ```bash
  env -u GIT_CONFIG_GLOBAL -u GIT_CONFIG_SYSTEM -u GIT_CONFIG_COUNT \
      -u GIT_CONFIG_KEY_0 -u GIT_CONFIG_KEY_1 -u GIT_CONFIG_KEY_2 \
      -u GIT_CONFIG_KEY_3 -u GIT_CONFIG_KEY_4 -u GIT_CONFIG_KEY_5 \
      -u GIT_CONFIG_KEY_6 -u GIT_CONFIG_KEY_7 \
      git fetch origin main
  ```

## 3. Engineering Standards & Testing
- Adhere strictly to TypeScript type safety, strict typing, and idiomatic project conventions.
- Always verify behavioral changes with tests and workspace checks.
