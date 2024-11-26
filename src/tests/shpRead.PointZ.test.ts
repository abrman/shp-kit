import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { shpRead } from "..";

describe("shpRead", () => {
  it("PointZ.001 - Airports of USA", async () => {
    const targetGeoJson = fs.readFileSync(path.join(__dirname, "test_results", "read", "PointZ", "001-PointZ.json"), {
      encoding: "utf-8",
    });

    const shpBuffer = fs.readFileSync(
      path.join(
        __dirname,
        "assets",
        "airports-of-usa_shp_standofrd.edu-xp070bj0986",
        "airports-of-usa_shp_with_elevation.shp"
      )
    );

    const geojson = await shpRead(shpBuffer, {});
    expect(JSON.stringify(geojson)).toBe(targetGeoJson);
    // fs.writeFile(path.join(__dirname, "output", "001-PointZ.json"), JSON.stringify(geojson), () => {});
  });

  it("PointZ.002 - Airports of USA with property data", async () => {
    const targetGeoJson = fs.readFileSync(path.join(__dirname, "test_results", "read", "PointZ", "002-PointZ.json"), {
      encoding: "utf-8",
    });

    const shpBuffer = fs.readFileSync(
      path.join(
        __dirname,
        "assets",
        "airports-of-usa_shp_standofrd.edu-xp070bj0986",
        "airports-of-usa_shp_with_elevation.shp"
      )
    );
    const dbfBuffer = fs.readFileSync(
      path.join(
        __dirname,
        "assets",
        "airports-of-usa_shp_standofrd.edu-xp070bj0986",
        "airports-of-usa_shp_with_elevation.dbf"
      )
    );

    const geojson = await shpRead(shpBuffer, {}, dbfBuffer);
    expect(JSON.stringify(geojson)).toBe(targetGeoJson);
    // fs.writeFile(path.join(__dirname, "output", "002-PointZ.json"), JSON.stringify(geojson), () => {});
  });
});
