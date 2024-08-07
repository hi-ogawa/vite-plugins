based on https://github.com/hi-ogawa/reproductions/tree/main/vitest-5704-emscripten-esm-worker

```sh
emcc --version # 3.1.59
emcc lib.cpp -o lib.js -sEXPORT_ES6 -sENVIRONMENT=web,worker --bind
```
