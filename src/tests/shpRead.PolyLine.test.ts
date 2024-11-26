import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { shpRead } from "..";

describe("shpRead", () => {
  it("PolyLine.001 - World boundaries", async () => {
    const targetGeoJson = fs.readFileSync(
      path.join(__dirname, "test_results", "read", "PolyLine", "001-PolyLine.json"),
      {
        encoding: "utf-8",
      }
    );

    const shpBuffer = fs.readFileSync(
      path.join(__dirname, "assets", "ne_10m_admin_0_boundary_lines_land", "ne_10m_admin_0_boundary_lines_land.shp")
    );
    const dbfBuffer = fs.readFileSync(
      path.join(__dirname, "assets", "ne_10m_admin_0_boundary_lines_land", "ne_10m_admin_0_boundary_lines_land.dbf")
    );

    const geojson = await shpRead(shpBuffer, {});
    expect(JSON.stringify(geojson)).toBe(targetGeoJson);
    // fs.writeFile(path.join(__dirname, "output", "001-PolyLine.json"), JSON.stringify(geojson), () => {});
  });

  it("PolyLine.002 - World boundaries with properties data", async () => {
    const targetGeoJson = fs.readFileSync(
      path.join(__dirname, "test_results", "read", "PolyLine", "002-PolyLine.json"),
      {
        encoding: "utf-8",
      }
    );
    const shpBuffer = fs.readFileSync(
      path.join(__dirname, "assets", "ne_10m_admin_0_boundary_lines_land", "ne_10m_admin_0_boundary_lines_land.shp")
    );
    const dbfBuffer = fs.readFileSync(
      path.join(__dirname, "assets", "ne_10m_admin_0_boundary_lines_land", "ne_10m_admin_0_boundary_lines_land.dbf")
    );
    const geojson = await shpRead(shpBuffer, {}, dbfBuffer);
    expect(JSON.stringify(geojson)).toBe(targetGeoJson);
    // fs.writeFile(path.join(__dirname, "output", "002-PolyLine.json"), JSON.stringify(geojson), () => {});
  });
});
