import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Turn off ESLint rules that conflict with Prettier formatting.
  prettier,
  {
    // Keep the frontend and the admin panel independent of each other.
    files: ["src/**/frontend/**", "src/app/(frontend)/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/admin/*", "@/actions/admin/*"],
              message:
                "Frontend code must not import admin code. Move shared code to components/ui or lib.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/admin/**", "src/app/(admin)/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/frontend/*", "@/actions/frontend/*"],
              message:
                "Admin code must not import frontend code. Move shared code to components/ui or lib.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/generated/**"]),
]);

export default eslintConfig;
