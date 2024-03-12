import { tinyassert } from "@hiogawa/utils";
import { Link } from "../../../../components/link";
import type { PageRouteProps } from "../../../../lib/routing";
import { fetchPokemons } from "../utils";

export default async function Page(props: PageRouteProps) {
  const pokemons = await fetchPokemons();
  tinyassert("pokemon" in props.match.params);
  const slug = props.match.params["pokemon"];
  const e = pokemons.find((e) => e.slug === slug);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <Link href="/demo/waku_02" className="antd-btn antd-btn-default px-2">
        Home
      </Link>

      {/* TODO: not found error convention? */}
      {!e && <>Not Found : {slug}</>}

      {e && (
        <div className="flex flex-col items-center">
          <img
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${e.id}.png`}
            alt={e.slug}
            className="w-50 aspect-square"
          />
          <div className="flex flex-col items-center gap-0.5 text-lg">
            <span>{e.name.english}</span>
            <span>{e.name.japanese}</span>
            <span>Types: {e.type.join(", ")}</span>
            {Object.entries(e.base).map(([k, v]) => (
              <div key={k}>
                {k}: {v}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
