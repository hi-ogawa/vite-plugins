import handler from "../src/framework/entry.rsc";

export default {
  fetch(request: Request) {
    return handler(request);
  },
};
