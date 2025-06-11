import handler from "../react-router-vite/entry.rsc";

export default {
  fetch(request: Request) {
    return handler(request);
  },
};
