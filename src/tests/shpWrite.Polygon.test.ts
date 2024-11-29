import { describe, expect, it, vi, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { shpWrite } from "..";
import buffEqual from "../private/helpers/bufferEqualityCheck";
import { FeatureCollection } from "geojson";

describe("shpWrite", () => {
  const consoleWarnMock = vi.spyOn(console, "warn").mockImplementation(() => undefined);

  it("Polygon.001 - default options", async () => {
    const geojson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "assets", "multipolygons.json"), { encoding: "utf-8" })
    );

    afterAll(() => {
      consoleWarnMock.mockReset();
    });

    const shpBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "Polygon", "001-Polygon.shp"));
    const shxBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "Polygon", "001-Polygon.shx"));
    const dbfBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "Polygon", "001-Polygon.dbf"));

    const { shp, shx, dbf } = await shpWrite(geojson, "Polygon");

    const warnings = [
      "Redundant points (Sibling points with matching coordinates) encountered and removed.",
      "Provided polygon contained intersecting geometry and was unkinked in order to create valid shapefile. Please correct input or verify output correctness.",
    ];
    warnings.forEach((warning, i) => {
      expect(consoleWarnMock).toHaveBeenNthCalledWith(i + 1, warning);
    });
    expect(consoleWarnMock).toHaveBeenCalledTimes(warnings.length);

    expect(buffEqual("001-Polygon.shp", shpBuffer, shp)).toBe(true);
    expect(buffEqual("001-Polygon.shx", shxBuffer, shx)).toBe(true);
    expect(buffEqual("001-Polygon.dbf", dbfBuffer, dbf, [1, 2, 3, 29])).toBe(true); // [29] language bit, updated during UTF-8 support [1,2,3] Indexes of current date, 1. Year -1900, 2. Month index (Starting at 1 for January), 3. Day of month
  });
});
