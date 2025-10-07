# Island Framework Example

This example demonstrates an islands architecture implementation using Vite's SSR Assets API (`?assets` query import).

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/island)

## Implementation Overview

The implementation uses a custom Vite plugin that transforms island imports (`?island`) and leverages Vite's `?assets=client` query to get the client entry point for each island component.

## How It's Implemented

### 1. Island Plugin Transform

When you import a component with `?island`:

```tsx
import Counter from "../components/counter?island";
```

The Vite plugin (`src/framework/island/plugin.ts`) transforms this import during SSR to:

```tsx
import * as module from "../components/counter";
import assets from "../components/counter?assets=client";
import { createIsland } from "/src/framework/island/runtime-server";
export default createIsland(module.default, "default", assets);
```

This transformation:
- Imports the original component module on the server
- Gets the client-side assets using Vite's `?assets=client` query
- Wraps the component with `createIsland` for server rendering

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

- **`plugin.ts`**: Vite plugin that transforms `?island` imports and handles raw imports
- **`runtime-server.ts`**: Server-side island wrapper that creates `<demo-island>` elements
- **`runtime-client.ts`**: Client-side web component that hydrates islands
- **`entry.client.tsx`**: Client entry that registers the island web component

## Technical Details

- Uses Vite's SSR Assets API (`?assets=client`) to get client entry points
- Leverages web components for island hydration
- Props are serialized as JSON attributes on custom elements
- Each island component is code-split automatically
