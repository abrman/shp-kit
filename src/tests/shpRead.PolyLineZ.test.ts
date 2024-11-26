import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { shpRead } from "..";

describe("shpRead", () => {
  it("PolyLineZ.001 - Simple 3D arrow with properties", async () => {
    const targetGeoJson = fs.readFileSync(
      path.join(__dirname, "test_results", "read", "PolyLineZ", "001-PolyLineZ.json"),
      {
        encoding: "utf-8",
      }
    );

    const shpBuffer = fs.readFileSync(
      path.join(__dirname, "assets", "statue_of_liberty_arrow_polylineZ", "ARR-3D.shp")
    );
    const dbfBuffer = fs.readFileSync(
      path.join(__dirname, "assets", "statue_of_liberty_arrow_polylineZ", "ARR-3D.dbf")
    );

    const geojson = await shpRead(shpBuffer, {}, dbfBuffer);
    expect(JSON.stringify(geojson)).toBe(targetGeoJson);
    // fs.writeFile(path.join(__dirname, "output", "001-PolyLineZ.json"), JSON.stringify(geojson), () => {});
  });
  it("PolyLineZ.002 - Simple 3D arrow with projection", async () => {
    const targetGeoJson = fs.readFileSync(
      path.join(__dirname, "test_results", "read", "PolyLineZ", "002-PolyLineZ.json"),
      {
        encoding: "utf-8",
      }
    );

    const shpBuffer = fs.readFileSync(
      path.join(__dirname, "assets", "statue_of_liberty_arrow_polylineZ", "ARR-3D.shp")
    );
    const dbfBuffer = fs.readFileSync(
      path.join(__dirname, "assets", "statue_of_liberty_arrow_polylineZ", "ARR-3D.dbf")
    );
    const prjBuffer = fs.readFileSync(
      path.join(__dirname, "assets", "statue_of_liberty_arrow_polylineZ", "ARR-3D.prj")
    );

    const geojson = await shpRead(shpBuffer, {}, dbfBuffer, prjBuffer);
    expect(JSON.stringify(geojson)).toBe(targetGeoJson);
    // fs.writeFile(path.join(__dirname, "output", "002-PolyLineZ.json"), JSON.stringify(geojson), () => {});
  });
  it("PolyLineZ.003 - Simple 3D arrow with projection and originalRawGeometry", async () => {
    const targetGeoJson = fs.readFileSync(
      path.join(__dirname, "test_results", "read", "PolyLineZ", "003-PolyLineZ.json"),
      {
        encoding: "utf-8",
      }
    );

    const shpBuffer = fs.readFileSync(
      path.join(__dirname, "assets", "statue_of_liberty_arrow_polylineZ", "ARR-3D.shp")
    );
    const dbfBuffer = fs.readFileSync(
      path.join(__dirname, "assets", "statue_of_liberty_arrow_polylineZ", "ARR-3D.dbf")
    );
    const prjBuffer = fs.readFileSync(
      path.join(__dirname, "assets", "statue_of_liberty_arrow_polylineZ", "ARR-3D.prj")
    );

    const geojson = await shpRead(shpBuffer, { originalGeometryPropertyKey: "_raw" }, dbfBuffer, prjBuffer);
    expect(JSON.stringify(geojson)).toBe(targetGeoJson);
    // fs.writeFile(path.join(__dirname, "output", "002-PolyLineZ.json"), JSON.stringify(geojson), () => {});
  });
});
