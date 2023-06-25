import { tinyassert } from "@hiogawa/utils";
import type { QueryObserverOptions } from "@tanstack/react-query";

interface PokemonOutput {
  sprites?: { front_default?: string };
}

async function fetchPokomonApi(): Promise<PokemonOutput> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/pikachu`);
  tinyassert(res.ok);
  return res.json();
}

export function pokomenQueryOption() {
  return {
    queryKey: ["/server-data-pokemon"],
    queryFn: () => fetchPokomonApi(),
    staleTime: Infinity,
  } satisfies QueryObserverOptions;
}

// in this special rare case, the query is already isomprhic.
// it would probably require more trick to achive such SSR version
export function pokomenQueryOptionSSR() {
  return pokomenQueryOption();
}
