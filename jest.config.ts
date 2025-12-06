import type { Config } from "jest";

const config: Config = {
	testEnvironment: "node",
	roots: ["<rootDir>/src"],
	testMatch: ["**/*.test.ts"],
	transform: {
		"^.+\\.ts$": [
			"@swc/jest",
			{
				jsc: {
					parser: {
						syntax: "typescript",
					},
					target: "esnext",
				},
			},
		],
	},
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	collectCoverageFrom: ["src/**/*.ts", "!src/**/*.test.ts"],
};

export default config;
