const POKEMON_URL =
  "https://raw.githubusercontent.com/dai-shi/waku/bdcb7b26ef8c69d95eae44cd9f46841fd4a82631/examples/02_demo/private/pokemon.json";

export async function fetchPokemons(): Promise<PokemonEntry[]> {
  const res = await fetch(POKEMON_URL);
  return res.json();
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
