# Island Framework Example

This example demonstrates an islands architecture implementation using Vite's SSR Assets API (`?assets` query import).

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/island)

## Implementation Overview

The implementation uses a custom Vite plugin that automatically transforms components in the `/islands/` directory to interactive islands, leveraging Vite's `?assets=client` query to get the client entry point for each island component.

## How It's Implemented

### 1. Island Plugin Transform

When you place a component in the `/islands/` directory:

```tsx
// [src/islands/counter.tsx]
export function Counter(props) { ... }
```

The Vite plugin (`src/framework/island/plugin.ts`) transforms the file during SSR to:

```tsx
function Counter() { ... }
const __wrap_Counter = __runtime.createIsland(Counter, "Counter", __assets);
export { __wrap_Counter as Counter };
import __assets from "../islands/counter?assets=client";
import * as __runtime from "/src/framework/island/runtime-server";
```

This transformation:
- Wraps each exported component with `createIsland` for server rendering
- Gets the client-side assets using Vite's `?assets=client` query
- Maintains the original export names for transparent usage

### 2. Server-Side Rendering

The `createIsland` function (`runtime-server.ts`):

```tsx
export function createIsland(Component, exportName, assets) {
  return (props) => {
    const markup = renderToStaticMarkup(<Component {...props} />);
    return (
      <demo-island
        entry={assets.entry}
        export-name={exportName}
        props={JSON.stringify(props)}
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    );
  };
}
```

This creates a custom element `<demo-island>` with:
- Pre-rendered HTML content (for immediate display)
- Client entry point URL (`assets.entry`)
- Component export name and serialized props

### 3. Client-Side Rendering

The client entry (`entry.client.tsx`) registers a web component:

```tsx
customElements.define("demo-island", DemoIsland);
```

The `DemoIsland` class (`runtime-client.ts`):
- Imports the component via `entry` and `export-name` attributes
- Renders the component with `props`

## Key Components

- **`plugin.ts`**: Vite plugin that transforms components in `/islands/` directory and handles raw imports
- **`runtime-server.ts`**: Server-side island wrapper that creates `<demo-island>` elements
- **`runtime-client.ts`**: Client-side web component that hydrates islands
- **`entry.client.tsx`**: Client entry that registers the island web component
- **`/islands/`**: Directory containing all interactive island components
