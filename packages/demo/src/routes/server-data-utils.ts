import { tinyassert } from "@hiogawa/utils";
import type { QueryObserverOptions } from "@tanstack/react-query";
import { z } from "zod";

const Z_POKOMON_OUTPUT = z.object({
  types: z.any().array(),
  stats: z.any().array(),
  sprites: z.object({
    front_default: z.string(),
  }),
});

type PokemonOutput = z.infer<typeof Z_POKOMON_OUTPUT>;

async function fetchPokomonApi(): Promise<PokemonOutput> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/pikachu`);
  tinyassert(res.ok);
  return Z_POKOMON_OUTPUT.parse(await res.json());
}

export function pokomenQueryOption() {
  return {
    queryKey: ["/server-data-pokemon"],
    queryFn: () => fetchPokomonApi(),
    staleTime: Infinity,
  } satisfies QueryObserverOptions;
}

// in this simple case, the query is already isomporhic.
// in really, such case is too rare, and usually we would use one more fetching abstraction (e.g. trpc)
// so that client facing API and server call can be reasonably uniformized.
export function pokomenQueryOptionSSR() {
  return pokomenQueryOption();
}
