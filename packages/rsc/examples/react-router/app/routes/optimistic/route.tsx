// TODO: should be probably inline server action
// "use server"
import { ToggleLikedForm } from "./form";

let liked = false;
async function toggleLikedAction() {
  "use server";

  await new Promise((resolve) => setTimeout(resolve, 1000));
  liked = !liked;
}

export function ServerComponent() {
  return (
    <div>
      <h1>Server Component</h1>
      <ToggleLikedForm liked={liked} toggleLikedAction={toggleLikedAction} />
    </div>
  );
}
