import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { shpRead, shpWrite } from "..";
import buffEqual from "../private/helpers/bufferEqualityCheck";

describe("shpWrite", () => {
  it("PointZ.001 - Airports of the USA, Elevation from coordinates", async () => {
    const geojson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "assets", "airports-of-usa_purl.standofrd.edu-xp070bj0986.json"), {
        encoding: "utf-8",
      })
    );
    const shpBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PointZ", "001-PointZ.shp"));
    const shxBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PointZ", "001-PointZ.shx"));
    const dbfBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PointZ", "001-PointZ.dbf"));

    const { shp, shx, dbf } = await shpWrite(geojson, "PointZ");
    // fs.writeFile(path.join(__dirname, "output", "001-PointZ.shp"), shp, () => {});
    // fs.writeFile(path.join(__dirname, "output", "001-PointZ.shx"), shx, () => {});
    // fs.writeFile(path.join(__dirname, "output", "001-PointZ.dbf"), dbf, () => {});

    expect(buffEqual("001-PointZ.shp", shpBuffer, shp)).toBe(true);
    expect(buffEqual("001-PointZ.shx", shxBuffer, shx)).toBe(true);
    expect(buffEqual("001-PointZ.dbf", dbfBuffer, dbf, [1, 2, 3])).toBe(true); // [1,2,3] Indexes of current date, 1. Year -1900, 2. Month index (Starting at 1 for January), 3. Day of month
  });

  it("PointZ.002 - Airports of the USA, Elevation from property", async () => {
    const geojson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "assets", "airports-of-usa_purl.standofrd.edu-xp070bj0986.json"), {
        encoding: "utf-8",
      })
    );
    const shpBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PointZ", "002-PointZ.shp"));
    const shxBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PointZ", "002-PointZ.shx"));
    const dbfBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PointZ", "002-PointZ.dbf"));

    const { shp, shx, dbf } = await shpWrite(geojson, "PointZ", {
      elevationPropertyKey: "elev",
    });
    // fs.writeFile(path.join(__dirname, "output", "002-PointZ.shp"), shp, () => {});
    // fs.writeFile(path.join(__dirname, "output", "002-PointZ.shx"), shx, () => {});
    // fs.writeFile(path.join(__dirname, "output", "002-PointZ.dbf"), dbf, () => {});

    expect(buffEqual("002-PointZ.shp", shpBuffer, shp)).toBe(true);
    expect(buffEqual("002-PointZ.shx", shxBuffer, shx)).toBe(true);
    expect(buffEqual("002-PointZ.dbf", dbfBuffer, dbf, [1, 2, 3])).toBe(true); // [1,2,3] Indexes of current date, 1. Year -1900, 2. Month index (Starting at 1 for January), 3. Day of month
  });

  it("PointZ.003 - Airports of the USA from MultiPoint Features, Elevation from coordinates", async () => {
    const geojson = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "assets", "airports-of-usa_multipoint.purl.standofrd.edu-xp070bj0986.json"),
        {
          encoding: "utf-8",
        }
      )
    );
    const shpBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PointZ", "003-PointZ.shp"));
    const shxBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PointZ", "003-PointZ.shx"));
    const dbfBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PointZ", "003-PointZ.dbf"));

    const { shp, shx, dbf } = await shpWrite(geojson, "PointZ");
    // fs.writeFile(path.join(__dirname, "output", "003-PointZ.shp"), shp, () => {});
    // fs.writeFile(path.join(__dirname, "output", "003-PointZ.shx"), shx, () => {});
    // fs.writeFile(path.join(__dirname, "output", "003-PointZ.dbf"), dbf, () => {});

    expect(buffEqual("003-PointZ.shp", shpBuffer, shp)).toBe(true);
    expect(buffEqual("003-PointZ.shx", shxBuffer, shx)).toBe(true);
    expect(buffEqual("003-PointZ.dbf", dbfBuffer, dbf, [1, 2, 3])).toBe(true); // [1,2,3] Indexes of current date, 1. Year -1900, 2. Month index (Starting at 1 for January), 3. Day of month
  });
});
