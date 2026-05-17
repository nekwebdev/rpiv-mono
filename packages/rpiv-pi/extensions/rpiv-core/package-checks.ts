/**
 * Detect which SIBLINGS are installed by reading ~/.pi/agent/settings.json.
 * Pure utility — no ExtensionAPI.
 */

import { SIBLINGS, type SiblingPlugin, WEB_PROVIDERS } from "./siblings.js";
import { readPiAgentSettings } from "./utils.js";

function installedPackages(): string[] {
	const result = readPiAgentSettings();
	if (!result) return [];
	return result.packages.filter((e): e is string => typeof e === "string");
}

/**
 * Return the SIBLINGS not currently installed.
 * Reads ~/.pi/agent/settings.json once per call — callers that need both the
 * full snapshot and the missing subset should call this once and filter.
 */
export function findMissingSiblings(): SiblingPlugin[] {
	const installed = installedPackages();
	return SIBLINGS.filter((s) => !installed.some((entry) => s.matches.test(entry)));
}

export function findInstalledWebProviders(): SiblingPlugin[] {
	const installed = installedPackages();
	return WEB_PROVIDERS.filter((provider) => installed.some((entry) => provider.matches.test(entry)));
}
