import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Public example kernels remain plain JS; reject unbound animation/plugin globals.
  { files: ["src/sections/projects/2-experiment/components/**/*.logic.js"], rules: { "no-undef": "error" } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".artifacts/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated Pano2VR/WebXR distribution, retained from Artefact Studio.
    "public/assets/projects/tour/viewer/pano2vr_player.js",
    "public/assets/projects/tour/viewer/skin.js",
    "public/assets/projects/tour/viewer/webxr/**",
  ]),
]);

export default eslintConfig;
