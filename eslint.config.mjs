import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Three.js objects are mutable by design; mutating them inside useFrame is the
    // React Three Fiber idiom and never touches React state.
    files: ["components/three/**/*.tsx", "components/**/*Scene.tsx"],
    rules: { "react-hooks/immutability": "off", "react-hooks/purity": "off" },
  },
]);

export default eslintConfig;
