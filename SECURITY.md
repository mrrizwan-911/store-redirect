# Security Audit Checklist

## Before Launch

### Authentication
- [ ] JWT_ACCESS_SECRET is 32+ random characters (run: `openssl rand -base64 32`)
- [ ] JWT_REFRESH_SECRET is different from ACCESS_SECRET
- [ ] Admin default password changed from Admin@123
- [ ] Google OAuth redirect URIs are correct for production domain

### API Security
- [ ] All admin routes return 403 for non-admin users
- [ ] Rate limiting is active (test: send 6 login attempts, verify 429)
- [ ] Account lockout works after 5 failed logins
- [ ] Cron endpoints return 401 without CRON_SECRET header

### Payment Security
- [ ] JazzCash: callback validates pp_SecureHash
- [ ] JazzCash: callback validates pp_Amount matches order total
- [ ] Stripe: webhook validates Stripe-Signature header
- [ ] No payment credentials in client-side code
- [ ] JAZZCASH_* env vars are NOT prefixed with NEXT_PUBLIC_

### Data Security
- [ ] No passwords/tokens appear in console.log statements
- [ ] Review bodies are sanitized (test: submit <script>alert(1)</script>)
- [ ] Gift messages are sanitized
- [ ] User can only see their own orders (/account/orders)
- [ ] User cannot access another user's cart

### Infrastructure
- [ ] .env.local is in .gitignore and NOT committed
- [ ] Supabase RLS (Row Level Security) enabled as second layer
- [ ] Cloudinary upload preset is restricted to server-side only
- [ ] HTTPS enforced in production (Vercel handles this)

### Headers (verify at securityheaders.com)
- [ ] X-Frame-Options: SAMEORIGIN
- [ ] X-Content-Type-Options: nosniff
- [ ] Strict-Transport-Security present
- [ ] Content-Security-Policy is configured

### Dependencies
- [!] `npm audit` shows 0 high/critical vulnerabilities — MANUAL REVIEW NEEDED
    - Known Issues (as of 2026-05-17):
        - `@anthropic-ai/sdk 0.79.0-0.91.0`: Moderate - Insecure Default File Permissions in Local Filesystem Memory Tool
        - `@hono/node-server <1.19.13`: Moderate - Middleware bypass via repeated slashes in serveStatic
        - `next 9.3.4-canary.0 - 16.3.0-canary.5`: **HIGH** - Multiple vulnerabilities including:
            * Denial of Service with Server Components (GHSA-8h8q-6873-q5fj)
            * Middleware/Proxy bypasses (GHSA-26hh-7cqf-hhc6, GHSA-3g8h-86w9-wvmq, GHSA-492v-c6pp-mqqv)
            * Cache poisoning vulnerabilities (GHSA-vfv6-92ff-j949, GHSA-wfc6-r584-vfw7)
            * XSS via CSP nonces and beforeInteractive scripts (GHSA-ffhc-5mcf-pf4q, GHSA-gx5p-jg67-6x7h)
            * Denial of Service via connection exhaustion and Image Optimization API (GHSA-mg66-mrh9-m8jx, GHSA-h64f-5h5j-jqjh)
            * SSRF via WebSocket upgrades (GHSA-c4j6-fc7j-m34r)
            * Pages Router i18n bypass (GHSA-36qx-fr4f-26g5)
        - `postcss <8.5.10`: Moderate - XSS via Unescaped </style> in CSS Stringify Output
    - **Note**: Manual investigation required due to custom Next.js setup. Fix available via `npm audit fix --force` but may introduce breaking changes.
- [ ] All packages are recent versions (no EOL packages)
