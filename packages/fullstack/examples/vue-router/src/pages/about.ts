import { defineComponent, h } from "vue";

export default defineComponent(() => {
  return () => {
    return h("main", [
      h("h1", "About"),
      h("div", { class: "card" }, [
        h(
          "p",
          "This is a simple Vue Router demo app built with Vite Plugin Fullstack.",
        ),
        h("p", "It demonstrates basic routing and server-side rendering."),
      ]),
    ]);
  };
});
