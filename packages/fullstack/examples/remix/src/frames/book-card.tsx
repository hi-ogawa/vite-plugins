import { CartButton } from "../islands/cart-button";
import { isInCart } from "../routes/api";

export async function BookCard(props: { name: string }) {
  // support async setup is executed during `resolveFrame`
  const inCart = await isInCart(props.name);
  return () => (
    <div className="card book-card">
      <h4>{props.name}</h4>
      <CartButton inCart={inCart} name={props.name} />
    </div>
  );
}
