import handler from "../src/framework/entry.rsc.single";

export default {
  fetch(request: Request) {
    return handler(request);
  },
};
