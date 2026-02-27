import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        globals: true,
        environment: "node",
        // macOS creates hidden ._* resource-fork files next to new files on some volumes
        exclude: ["**/node_modules/**", "**/.next/**", "**/._*"],
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov"],
            include: ["src/lib/**", "src/app/api/**"],
            exclude: [
                "src/lib/prisma.ts",
                "src/lib/auth.ts",
                "src/lib/gmail.ts",
                "**/._*",
            ],
        },
    },
});
