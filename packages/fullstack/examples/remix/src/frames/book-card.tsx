import { isInCart } from "../api";
import { CartButton } from "../islands/cart-button";

export function BookCard(props: { name: string }) {
  const inCart = isInCart(props.name); // TODO: support async?
  return (
    <div className="card book-card">
      <h4>{props.name}</h4>
      <CartButton inCart={inCart} name={props.name} />
    </div>
  );
}
