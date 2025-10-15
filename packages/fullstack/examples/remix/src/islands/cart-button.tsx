import type { Remix } from "@remix-run/dom";
import { dom } from "@remix-run/events";

export function CartButton(this: Remix.Handle) {
  let updating = false;

  return (props: { inCart: boolean; name: string }) => {
    const method = "POST";
    const action = "/api";

    return (
      <form
        className="cart-button"
        method={method}
        action={action}
        on={dom.submit(async (event, signal) => {
          event.preventDefault();

          updating = true;
          this.update();

          // TODO: single flight mutation?
          const formData = new FormData(event.currentTarget);
          formData.set("redirect", "none");
          await fetch(action, {
            method,
            body: formData,
            signal,
          });
          if (signal.aborted) return;

          await this.frame.reload();
          if (signal.aborted) return;

          updating = false;
          this.update();
        })}
      >
        <input type="hidden" name="name" value={props.name} />
        <input
          type="hidden"
          name="action"
          value={props.inCart ? "remove" : "add"}
        />
        <button
          type="submit"
          class="btn"
          style={{ opacity: updating ? 0.5 : 1 }}
        >
          {props.inCart ? "Remove from Cart" : "Add to Cart"}
        </button>
      </form>
    );
  };
}
