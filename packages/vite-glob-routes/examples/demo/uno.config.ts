import { unocssPresetAntd } from "@hiogawa/unocss-preset-antd";
import {
  defineConfig,
  presetIcons,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss";

export default defineConfig({
  presets: [unocssPresetAntd(), presetUno(), presetIcons()],
  transformers: [transformerDirectives(), transformerVariantGroup()],
});
