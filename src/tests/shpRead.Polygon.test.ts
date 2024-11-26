import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { shpRead } from "..";

describe("shpRead", () => {
  it("Polygon.001 - Multipolygons", async () => {
    const targetGeoJson = fs.readFileSync(path.join(__dirname, "test_results", "read", "Polygon", "001-Polygon.json"), {
      encoding: "utf-8",
    });

    const shpBuffer = fs.readFileSync(path.join(__dirname, "assets", "multipolygons", "multipolygons.shp"));
    const dbfBuffer = fs.readFileSync(path.join(__dirname, "assets", "multipolygons", "multipolygons.dbf"));

    const geojson = await shpRead(shpBuffer, {}, dbfBuffer);
    expect(JSON.stringify(geojson)).toBe(targetGeoJson);
    // fs.writeFile(path.join(__dirname, "output", "001-Polygon.json"), JSON.stringify(geojson), () => {});
  });
});
