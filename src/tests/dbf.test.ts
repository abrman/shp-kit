import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import shpWrite from "../public/shpWrite";
import buffEqual from "../private/helpers/bufferEqualityCheck";

describe("Dbf", () => {
  it("Dbf.001 - UTF-8 characters", async () => {
    let geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Point A", name_cn: "中文 A", name_gr: "Σημείο", name_ru: "Точка" },
          geometry: {
            type: "Point",
            coordinates: [120.0, 30.0],
          },
        },
      ],
    } as GeoJSON.FeatureCollection;

    const shpBuffer = fs.readFileSync(path.join(__dirname, "test_results", "dbf", "001-Dbf.shp"));
    const shxBuffer = fs.readFileSync(path.join(__dirname, "test_results", "dbf", "001-Dbf.shx"));
    const dbfBuffer = fs.readFileSync(path.join(__dirname, "test_results", "dbf", "001-Dbf.dbf"));

    const { shp, shx, dbf } = await shpWrite(geojson, "PointZ");

    // fs.writeFile(path.join(__dirname, "test_results", "dbf", "001-Dbf-test.shp"), Buffer.from(shp), () => {});
    // fs.writeFile(path.join(__dirname, "test_results", "dbf", "001-Dbf-test.shx"), Buffer.from(shx), () => {});
    // fs.writeFile(path.join(__dirname, "test_results", "dbf", "001-Dbf-test.dbf"), Buffer.from(dbf), () => {});

    expect(buffEqual("001-Dbf.shp", shpBuffer, shp)).toBe(true);
    expect(buffEqual("001-Dbf.shx", shxBuffer, shx)).toBe(true);
    expect(buffEqual("001-Dbf.dbf", dbfBuffer, dbf, [1, 2, 3, 29])).toBe(true); // [29] language bit, updated during UTF-8 support [1,2,3] Indexes of current date, 1. Year -1900, 2. Month index (Starting at 1 for January), 3. Day of month
  });
});
