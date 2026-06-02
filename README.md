# Calnza Global (web.com)

Welcome to the **Calnza Global** repository. This acts as the international gateway and routing portal for Calnza, deployed at `calnza.com`.

## 🌟 Overview

The `web.com` repository is a lightweight, ultra-fast static HTML portal designed to intelligently route users to their appropriate regional storefronts (Pakistan or the United Kingdom).

### Key Features
- **Zero-Dependency Static HTML**: Pure, vanilla HTML/CSS optimized for maximum load speed and perfect Core Web Vitals.
- **Geo-Routing**: Integrates seamlessly with Cloudflare GeoIP headers to automatically highlight the recommended store based on the user's physical location.
- **Persistent Preferences**: Sets a `calnza_region` cookie on the root `.calnza.com` domain, ensuring that users are automatically remembered when navigating across Calnza subdomains.
- **SEO & Social Optimization**: Contains robust Open Graph meta tags, structured data (Organization/OfferCatalog), and hreflang links to ensure global search engine visibility without duplicate content penalties.
- **Responsive Hero Assets**: Preloads device-specific high-resolution imagery (`redirect-pc.png`, `redirect-tablets.png`, `redirect-mobile.png`) to prevent layout shift and flash of unstyled content.

## 📁 Repository Structure

- `calnza-com-redirect.html`: The primary routing interface and landing page.
- `redirect-pc.png`: Desktop hero asset.
- `redirect-tablets.png`: Tablet hero asset.
- `redirect-mobile.png`: Mobile-optimized hero asset.
- `sitemap.xml`: Global sitemap pointing to the regional variants.
- `.github/workflows/`: Lightweight CI pipeline for static HTML validation.

## 🚀 Deployment

This project requires no build step. It can be deployed directly to **Cloudflare Pages**, **Vercel**, or **GitHub Pages**. Ensure that your hosting provider (like Cloudflare) is configured to pass the `?country=` query parameter if you wish to utilize the auto-highlighting feature for incoming visitors.

---
*Calnza — Crafted with precision. Worn with grace.*
