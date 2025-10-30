import { XsdPlugin } from "./types";

const registry: XsdPlugin[] = [];

export function registerPlugin(plugin: XsdPlugin) {
  registry.push(plugin);
}

export function getPlugins() {
  return registry;
}