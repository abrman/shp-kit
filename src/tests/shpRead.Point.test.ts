import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { shpRead } from "..";

describe("shpRead", () => {
  it("Point.001 - Airports of USA", async () => {
    const targetGeoJson = fs.readFileSync(path.join(__dirname, "test_results", "read", "Point", "001-Point.json"), {
      encoding: "utf-8",
    });

    const shpBuffer = fs.readFileSync(
      path.join(__dirname, "assets", "airports-of-usa_shp_standofrd.edu-xp070bj0986", "airports-of-usa_shp.shp")
    );

    const geojson = await shpRead(shpBuffer, {});
    expect(JSON.stringify(geojson)).toBe(targetGeoJson);
    // fs.writeFile(path.join(__dirname, "output", "001-Point.json"), JSON.stringify(geojson), () => {});
  });

  it("Point.002 - Airports of USA with property data", async () => {
    const targetGeoJson = fs.readFileSync(path.join(__dirname, "test_results", "read", "Point", "002-Point.json"), {
      encoding: "utf-8",
    });

    const shpBuffer = fs.readFileSync(
      path.join(__dirname, "assets", "airports-of-usa_shp_standofrd.edu-xp070bj0986", "airports-of-usa_shp.shp")
    );
    const dbfBuffer = fs.readFileSync(
      path.join(__dirname, "assets", "airports-of-usa_shp_standofrd.edu-xp070bj0986", "airports-of-usa_shp.dbf")
    );

    const geojson = await shpRead(shpBuffer, {}, dbfBuffer);
    expect(JSON.stringify(geojson)).toBe(targetGeoJson);
    // fs.writeFile(path.join(__dirname, "output", "002-Point.json"), JSON.stringify(geojson), () => {});
  });
});
