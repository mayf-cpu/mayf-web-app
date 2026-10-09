# Cloudflare Production Configuration Guide for `mayf.co.in`

This document details the configuration for **Maths at Your Fingertips** (`mayf.co.in`) on Cloudflare to achieve optimal Core Web Vitals (LCP < 1.2s, INP < 100ms, CLS = 0), aggressive edge caching for immutable assets, strict private protection for authenticated routes, Turnstile bot defenses, and Lighthouse 95+ scores.

---

## 1. DNS & SSL/TLS Configuration

### 1.1 DNS Records
Ensure all traffic routes through the Cloudflare Orange Cloud (Proxied):
- **Type**: `A` | **Name**: `@` | **Target**: `<ORIGIN_SERVER_IP>` | **Proxy status**: Proxied (Orange Cloud)
- **Type**: `CNAME` | **Name**: `www` | **Target**: `mayf.co.in` | **Proxy status**: Proxied (Orange Cloud)

### 1.2 SSL/TLS Mode
- **Encryption Mode**: **Full (Strict)**
- **Edge Certificates**:
  - Always Use HTTPS: **ON**
  - Minimum TLS Version: **TLS 1.2** (TLS 1.3 enabled)
  - Opportunistic Encryption: **ON**
  - Automatic HTTPS Rewrites: **ON**
  - Certificate Transparency Monitoring: **ON**
  - HSTS (HTTP Strict Transport Security): **Enabled** (Max-age: 31,536,000s / 1 year, include subdomains, preload)

---

## 2. Edge Caching & Cache Rules

The application server emits granular HTTP `Cache-Control` response headers. Cloudflare Cache Rules should be configured as follows:

### Rule 1: Immutable Static Assets (Aggressive 1-Year Edge & Browser Cache)
- **Expression**:
  `(http.request.uri.path contains "/assets/") or (http.request.uri.path.extension in {"js" "css" "woff" "woff2" "ttf" "eot" "avif" "webp" "png" "jpg" "jpeg" "gif" "svg" "ico"})`
- **Cache Eligibility**: Cache Everything
- **Edge Cache TTL**: 1 Year (`31536000` seconds)
- **Browser Cache TTL**: Respect origin (`Cache-Control: public, max-age=31536000, immutable`)

### Rule 2: Dynamic & Authenticated Private Endpoints (Strict Bypass)
- **Expression**:
  `(http.request.uri.path contains "/dashboard") or (http.request.uri.path contains "/checkout") or (http.request.uri.path contains "/orders") or (http.request.uri.path contains "/api/student") or (http.request.uri.path contains "/api/payments") or (http.request.uri.path contains "/api/admin") or (http.request.uri.path contains "/api/ai-teacher") or (http.request.uri.path contains "/api/downloads") or (http.request.uri.path contains "/mgmt-sec")`
- **Cache Eligibility**: **Bypass Cache** (Do NOT Cache)
- **Origin Respect**: Respect origin `no-store, private` headers

### Rule 3: HTML SPA Entry Point
- **Expression**:
  `not (http.request.uri.path.extension in {"js" "css" "png" "jpg" "jpeg" "svg" "webp" "avif" "woff" "woff2" "ico"})`
- **Cache Eligibility**: Respect origin (`Cache-Control: public, max-age=0, must-revalidate`)
- **Edge Cache TTL**: 0 seconds (ensures instant deployment propagation)

---

## 3. Web Application Firewall (WAF) & Rate Limiting

### 3.1 Rate Limiting Rules
1. **Turnstile / Download Authorization Gate**:
   - URI Path: `/api/downloads/authorize`
   - Threshold: **10 requests per minute** per IP
   - Action: **Block** (429 Too Many Requests) or Managed Challenge

2. **AI Teacher Query API**:
   - URI Path: `/api/ai-teacher/ask`
   - Threshold: **20 requests per minute** per IP
   - Action: **Managed Challenge**

3. **Payment Signature Verification**:
   - URI Path: `/api/payments/verify-signature`
   - Threshold: **12 requests per minute** per IP
   - Action: **Block**

### 3.2 Security Headers & Managed Rules
- **Cloudflare Managed Ruleset**: Enabled with standard sensitivity.
- **Bot Fight Mode**: Enabled (allows verified search engine crawlers like Googlebot for SEO).
- **Cloudflare Turnstile**:
  - Site Key configured in `VITE_TURNSTILE_SITE_KEY`
  - Secret Key configured in `TURNSTILE_SECRET_KEY`
  - Verification endpoint: `/api/turnstile/verify`

---

## 4. Core Web Vitals Optimization Checklist

| Metric | Target | Implemented Optimization in Codebase |
|---|---|---|
| **LCP** (Largest Contentful Paint) | < 1.2s | Critical route prioritization, selective prefetching on hover, fonts with `display=swap`, early preconnects |
| **INP** (Interaction to Next Paint) | < 100ms | Route-level code splitting via `React.lazy()`, Rollup manualChunks vendor splitting, low-overhead event handlers |
| **CLS** (Cumulative Layout Shift) | 0.000 | `OptimizedImage` with explicit aspect-ratio containers, system font metric fallbacks, reserved space for banners |
| **FID** / TBT | < 150ms | Modular bundle sizes (<60kB gzip for critical chunks), minimal third-party JavaScript |

---

## 5. Cloudflare Speed Features

In the Cloudflare Dashboard under **Speed > Optimization**:
- **Brotli Compression**: **ON**
- **Early Hints (103)**: **ON** (automatically sends preconnects and stylesheet hints)
- **HTTP/3 (with QUIC)**: **ON**
- **0-RTT Connection Resumption**: **ON**

---

## 6. Cloudflare Access / Zero Trust Status

- **Status**: **Explicitly Excluded from Admin URL**
- **Scope**: Cloudflare Access / Zero Trust login protection is NOT deployed in front of the administrator URL (`/mgmt-sec-k92a`).
- **Preserved Edge Features**:
  - Cloudflare DNS (Orange Cloud)
  - Cloudflare CDN & Global Edge Proxy
  - Cloudflare HTTPS (Full Strict & HSTS)
  - Cloudflare WAF & Rate Limiting
  - Cloudflare Turnstile Bot Defense
  - Cloudflare Edge Caching (Cache Rules & Dynamic Bypass)
  - Cloudflare Performance Optimizations (Brotli, HTTP/3, Early Hints)
- **Admin Auth Mechanism**: Direct Firebase Authentication with server-verified custom claims (`admin=true` / `superAdmin=true`).

