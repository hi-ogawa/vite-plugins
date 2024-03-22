import { sortBy } from "@hiogawa/utils";

const POKEMON_URL =
  "https://raw.githubusercontent.com/dai-shi/waku/bdcb7b26ef8c69d95eae44cd9f46841fd4a82631/examples/02_demo/private/pokemon.json";

async function fetchPokemons(): Promise<PokemonEntry[]> {
  const res = await fetch(POKEMON_URL);
  return res.json();
}

export async function findManyPokemons() {
  const pokemons = await fetchPokemons();
  return sortBy(pokemons, () => Math.random()).slice(0, 9);
}

export async function findOnePokemon(slug: string) {
  const pokemons = await fetchPokemons();
  return pokemons.find((e) => e.slug === slug);
}

type PokemonEntry = {
  id: number;
  slug: string;
  name: {
    english: string;
    japanese: string;
  };
  type: string[];
  base: Record<string, number>;
};
