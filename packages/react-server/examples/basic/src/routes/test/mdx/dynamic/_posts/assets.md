# Static Asset Handling

## Importing Asset as URL

Importing a static asset will return the resolved public URL when it is served:

```js
import imgUrl from './img.png'
document.getElementById('hero-img').src = imgUrl
```

For example, `imgUrl` will be `/img.png` during development, and become `/assets/img.2d8efhg.png` in the production build.

The behavior is similar to webpack's `file-loader`. The difference is that the import can be either using absolute public paths (based on project root during dev) or relative paths.
