import * as pathe from "pathe";

// used for source map path manipulation?
// https://github.com/vitest-dev/vitest/blob/8dabef860a3f51f5a4c4debc10faa1837fdcdd71/packages/vite-node/src/source-map-handler.ts#L81
export const dirname = pathe.dirname;
export default pathe;
