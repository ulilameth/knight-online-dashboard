// Sunucu bileşenleri için eşya kataloğu (istemci public/katalog.json'u okur).
import "server-only";
import json from "@/design/katalog.json";
import { type Katalog, type KatalogJson, kataloguHazirla } from "./katalog";

let onbellek: Katalog | null = null;
export const katalog = (): Katalog => (onbellek ??= kataloguHazirla(json as unknown as KatalogJson));
