data request aka. proxy `loader` call on client side navigation.

```js
// client
// 1. wrapLoaderRequest
// 2. fetch              --> 3
// 6. unwrapLoaderResponse

// server
// 3. unwrapLoaderRequest
// 4. invoke loader
// 5. wrapLoaderResponse --> 6
```
