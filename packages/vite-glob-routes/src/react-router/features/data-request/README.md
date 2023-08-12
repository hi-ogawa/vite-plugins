data request aka. proxy `loader` call on client side navigation.

```js
// client
// 1. wrapLoaderRequest
// 2. fetch              --> 3
// 6. unwrapLoaderResult

// server
// 3. wrapLoaderRequest
// 4. invoke loader
// 5. unwrapLoaderResult --> 6
```
