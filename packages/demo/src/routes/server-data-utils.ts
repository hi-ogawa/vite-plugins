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
  // fake 1 second to see spinner
  const [res] = await Promise.all([
    fetch(`https://pokeapi.co/api/v2/pokemon/pikachu`),
    sleep(1000),
  ]);
  tinyassert(res.ok);
  return Z_POKOMON_OUTPUT.parse(await res.json());
}

// in this simple case, the query is already isomporhic.
// in really, such case is too rare, and usually we would use one more fetching abstraction (e.g. trpc)
// so that client facing API and server call can be reasonably uniformized.
export function pokomenQueryOption() {
  return {
    queryKey: ["/server-data-pokemon"],
    queryFn: () => fetchPokomonApi(),
    staleTime: Infinity,
  } satisfies QueryObserverOptions;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}
