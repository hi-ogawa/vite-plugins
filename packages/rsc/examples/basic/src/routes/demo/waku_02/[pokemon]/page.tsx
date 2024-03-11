import { fetchPokemons } from "../utils";

export default async function Page() {
  const pokemons = await fetchPokemons();

  // TODO: dynamic path param
  const pokemon = pokemons.find((e) => e.slug === "pikachu");

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* TODO: not found error convention? */}
      {!pokemon && <>Not Found : pikachu</>}
      {pokemon && <pre>{JSON.stringify(pokemon, null, 2)}</pre>}
    </div>
  );
}
