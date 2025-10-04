# @hiogawa/vite-plugin-fullstack

## SSR Assets API Proposal

This proposal introduces a standardized API for accessing build assets information in SSR environments. This addresses two critical challenges that every SSR framework must solve:

1. **Asset preloading**: Preventing client-side waterfalls by knowing which assets to preload
2. **FOUC prevention**: Ensuring CSS is loaded before the HTML renders

Currently, meta-frameworks implement their own solutions for these problems. This proposal aims to provide a unified primitive that frameworks can adopt, reducing complexity and sharing knowledge across the ecosystem.

## Motivation

This API is part of a larger vision for improving SSR development in Vite. By providing official solutions for common SSR patterns:

- **For existing frameworks**: Opportunity to simplify implementations and provide feedback based on real-world experience
- **For new frameworks**: Lower barrier to entry with standardized patterns
- **For the ecosystem**: Collective knowledge sharing and consistent approaches
- **For Vite/Rolldown**: Reduced API surface area as frameworks adopt higher-level abstractions

## API Documentation

For detailed API documentation, examples, and configuration, see [README.md](./README.md).

## Why This Matters

### The Problem Space

Every SSR framework needs to solve these fundamental problems:

- **FOUC (Flash of Unstyled Content)**: When HTML renders before CSS loads, users see unstyled content briefly
- **Asset Waterfalls**: Without knowing which assets a route needs, browsers must discover and load them sequentially, causing delays

Currently, each framework implements its own solution. This fragmentation means:
- Duplicated effort across frameworks
- Inconsistent approaches and varying quality
- Higher barrier to entry for new frameworks
- Difficult to share improvements

### How This API Helps

The `?assets` import provides a standardized way to:
1. Discover all CSS dependencies for a module to prevent FOUC
2. Preload all JavaScript chunks needed by a route
3. Access client build information from the server environment

This enables frameworks to focus on their unique value rather than reimplementing asset handling.

## Request for Feedback

As this is a proposal for a standardized API, feedback from framework authors and the community is essential:

- **Framework authors**: How does this compare to your current implementation? What's missing?
- **Edge cases**: What platform-specific or use-case-specific concerns should we address?
- **API design**: Is the `?assets` / `?assets=client` / `?assets=ssr` API intuitive and flexible enough?

## Future Vision

This assets API is the first step in a comprehensive SSR framework guide that will standardize solutions for:

- Preventing "optimizing dependencies + reload" on client
- Loading `.env` on server environments
- Pre-rendering and SSG patterns
- Platform deployment (via Nitro integration)
- Common pitfalls and their solutions

The goal is to create official documentation that captures collective knowledge from existing frameworks while making it easier for new frameworks to emerge.

## Get Involved

- Try the prototype: `npm install @hiogawa/vite-plugin-fullstack`
- Explore the [examples](./examples)
- Share feedback via [GitHub issues](https://github.com/hi-ogawa/vite-plugins/issues)
- Join the discussion on Vite's Discord