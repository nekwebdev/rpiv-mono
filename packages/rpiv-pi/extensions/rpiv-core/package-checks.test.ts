import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { findInstalledWebProviders, findMissingSiblings } from "./package-checks.js";
import { SIBLINGS, WEB_PROVIDERS } from "./siblings.js";

const SETTINGS_PATH = join(process.env.HOME!, ".pi", "agent", "settings.json");

function writeSettings(contents: unknown) {
	mkdirSync(dirname(SETTINGS_PATH), { recursive: true });
	writeFileSync(SETTINGS_PATH, JSON.stringify(contents), "utf-8");
}

describe("findMissingSiblings", () => {
	it("returns all required siblings when settings.json is missing", () => {
		expect(findMissingSiblings()).toHaveLength(SIBLINGS.length);
	});

	it("returns all required siblings when JSON is invalid", () => {
		mkdirSync(dirname(SETTINGS_PATH), { recursive: true });
		writeFileSync(SETTINGS_PATH, "{not json", "utf-8");
		expect(findMissingSiblings()).toHaveLength(SIBLINGS.length);
	});

	it("returns all required siblings when packages field is absent", () => {
		writeSettings({ other: "data" });
		expect(findMissingSiblings()).toHaveLength(SIBLINGS.length);
	});

	it("returns all required siblings when packages is not an array", () => {
		writeSettings({ packages: "not-array" });
		expect(findMissingSiblings()).toHaveLength(SIBLINGS.length);
	});

	it("filters out non-string entries defensively", () => {
		writeSettings({ packages: [null, 42, "@juicesharp/rpiv-todo"] });
		const missing = findMissingSiblings();
		expect(missing.find((s) => s.matches.test("@juicesharp/rpiv-todo"))).toBeUndefined();
	});

	it("matches case-insensitively", () => {
		writeSettings({ packages: ["@JUICESHARP/RPIV-TODO"] });
		const missing = findMissingSiblings();
		expect(missing.find((s) => s.matches.test("@juicesharp/rpiv-todo"))).toBeUndefined();
	});

	it("rpiv-args word-boundary: treats rpiv-args-extended as non-install", () => {
		writeSettings({ packages: ["@juicesharp/rpiv-args-extended"] });
		const missing = findMissingSiblings();
		expect(missing.find((s) => s.pkg.endsWith("/rpiv-args"))).toBeDefined();
	});

	it("returns [] when all required siblings are installed", () => {
		writeSettings({
			packages: SIBLINGS.map((s) => s.pkg.replace(/^npm:/, "")),
		});
		expect(findMissingSiblings()).toEqual([]);
	});

	it("keeps web provider checks separate from required sibling checks", () => {
		writeSettings({
			packages: SIBLINGS.map((s) => s.pkg.replace(/^npm:/, "")),
		});
		expect(findMissingSiblings()).toEqual([]);
		expect(findInstalledWebProviders()).toEqual([]);
	});
});

describe("findInstalledWebProviders", () => {
	it("returns [] when no web provider is installed", () => {
		writeSettings({ packages: SIBLINGS.map((s) => s.pkg.replace(/^npm:/, "")) });
		expect(findInstalledWebProviders()).toEqual([]);
	});

	it("returns installed web providers", () => {
		writeSettings({ packages: [WEB_PROVIDERS[1]!.pkg.replace(/^npm:/, "")] });
		expect(findInstalledWebProviders()).toEqual([WEB_PROVIDERS[1]]);
	});
});
