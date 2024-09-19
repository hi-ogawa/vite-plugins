import { changeCount, getCount } from "./_action";
import { ClientCounter } from "./_client";

export default async function Page() {
  return (
    <>
      <ClientCounter />
      <form action={changeCount}>
        <p>Server Counter: {await getCount()}</p>
        <button name="change" value={-1}>
          -1
        </button>
        <button name="change" value={+1}>
          +1
        </button>
      </form>
    </>
  );
}
