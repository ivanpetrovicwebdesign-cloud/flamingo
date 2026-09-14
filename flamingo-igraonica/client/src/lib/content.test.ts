import { describe, expect, it } from "vitest";
import { defaultPackages, navItems } from "./content";

describe("Flamingo public content defaults", () => {
  it("keeps every birthday package explicitly priced per person", () => {
    expect(defaultPackages).toHaveLength(3);
    expect(defaultPackages.every((pkg) => pkg.price.includes("po osobi"))).toBe(true);
  });

  it("keeps the main public navigation sections stable", () => {
    expect(navItems.map(([label]) => label)).toEqual([
      "Početna",
      "O nama",
      "Ponude",
      "FAQ",
      "Galerija",
      "Recenzije",
      "Kontakt",
    ]);
  });
});
