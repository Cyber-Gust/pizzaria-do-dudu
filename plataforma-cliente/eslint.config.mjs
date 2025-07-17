import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // A sua configuração base que já existia
  ...compat.extends("next/core-web-vitals"),

  // [ADICIONADO] Objeto de configuração com as regras desabilitadas
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "react-hooks/exhaustive-deps": "off"
    }
  }
];

export default eslintConfig;
