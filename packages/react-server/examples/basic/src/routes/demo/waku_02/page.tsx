import { Link } from "@hiogawa/react-server/client";
import { findManyPokemons } from "./_utils";

export default async function Page() {
  const pokemons = await findManyPokemons();

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <Link href="/demo/waku_02" className="antd-btn antd-btn-default px-2">
        Random
      </Link>
      <div className="grid grid-cols-3 gap-4">
        {pokemons.map((e) => (
          <Link
            key={e.id}
            href={`/demo/waku_02/${e.slug}`}
            className="flex flex-col items-center justify-center px-4 border antd-menu-item w-40 h-40"
          >
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${e.id}.png`}
              alt={e.slug}
              className="w-23 h-23 aspect-square"
            />
            <div className="flex flex-col items-center gap-0.5">
              <span>{e.name.english}</span>
              <span>{e.name.japanese}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
