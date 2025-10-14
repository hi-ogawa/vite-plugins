const cartStates: Record<string, boolean> = {};

export const POST = async (request: Request) => {
  await new Promise((r) => setTimeout(r, 200 * (1 + Math.random())));

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const action = formData.get("action") as string;

  if (action === "add") {
    addToCart(name);
  } else if (action === "remove") {
    removeFromCart(name);
  } else {
    throw new Error("invalid action");
  }

  return new Response("ok");
};

function addToCart(name: string) {
  cartStates[name] = true;
}

function removeFromCart(name: string) {
  cartStates[name] = false;
}

// used directly from book-card.tsx
export function isInCart(name: string) {
  return !!cartStates[name];
}
