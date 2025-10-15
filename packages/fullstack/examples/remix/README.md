# Remix Example

The demo of Remix hydrated components and Frames with framework-like convention. `?assets=client` API is used for hydrated compoments.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/remix)

(TODO: Frame reloading is failing on Stackblitz)

## How it works

### `src/islands` Convention

Components in the `src/islands/` directory are automatically transformed into interactive islands using Remix's hydration system. The Vite plugin transforms these components during SSR:

**Transform Input:**

```tsx
// src/islands/counter.tsx
export function Counter(props) { ... }
```

**Transform Output:**

```tsx
import * as __dom from "@remix-run/dom";
import __assets from "src/islands/counter.tsx?assets=client";

function CartButton(props) { ... }
const __wrap_CartButton = __dom.hydrated(__assets.entry + "#CartButton", CartButton);
export { __wrap_CartButton as CartButton };
```

The `hydrated()` function enables selective hydration - the component is pre-rendered on the server and then hydrated on the client for interactivity. This is useful for:

- Interactive UI components (buttons, forms, etc.)
- Components with client-side state management
- Components that need event handlers

### `src/frames` Convention

Components in the `src/frames/` directory are wrapped with Remix's `Frame` component for partial server-side rendering. The plugin transforms these components to enable independent reloading:

**Transform Input:**

```tsx
// src/frames/book-card.tsx
export function BookCard(props) { ... }
```

**Transform Output:**

```tsx
import * as __dom from "@remix-run/dom";
import * as __dom_jsx from "@remix-run/dom/jsx-runtime";

function BookCard(props) { ... }
const __wrap_BookCard = createFrameWrapper(BookCard, "book-card.tsx", "BookCard", __dom, __dom_jsx);
export { __wrap_BookCard as BookCard };
```

The frame wrapper renders the component via a `<Frame src="/__frame?..." />`. On the server (see `entry.server.tsx`), `resolveFrame` renders the original component `BookCard` directly. On the client (see `entry.client.tsx`), `resolveFrame` fetches partial HTML of `BookCard` as the server reuses its `resolveFrame` logic for handling the `__frame` endpoint.

This enables:

- Partial page updates without full page reloads
- Server-side rendering of dynamic content
- Independent frame reloading from islands (e.g., `this.frame.reload()` in cart-button.tsx)
