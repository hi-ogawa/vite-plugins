import "@hiogawa/tiny-jwt/dist/polyfill-node";
import { createApp, toNodeListener } from "h3";
import h3Handler from "./adapter-h3";

export default toNodeListener(createApp().use(h3Handler));
