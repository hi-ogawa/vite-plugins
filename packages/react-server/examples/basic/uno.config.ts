import { unocssPresetAntd } from "@hiogawa/unocss-preset-antd";
import {
  defineConfig,
  presetIcons,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss";

export default defineConfig({
  content: {
    // cheat/simple integration by extracting unocss via glob.
    // note that react-server code is not transformed via unocss
    // so variant group won't work.
    filesystem: ["src/**/*.tsx"],
  },
  presets: [unocssPresetAntd(), presetUno(), presetIcons()],
  transformers: [transformerDirectives(), transformerVariantGroup()],
});
