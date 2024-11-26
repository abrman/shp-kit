import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { shpWrite } from "..";
import buffEqual from "../private/helpers/bufferEqualityCheck";

describe("shpWrite", () => {
  it("PolyLine.001 - default options", async () => {
    const geojson = JSON.parse(fs.readFileSync(path.join(__dirname, "assets", "example.json"), { encoding: "utf-8" }));
    const shpBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLine", "001-PolyLine.shp"));
    const shxBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLine", "001-PolyLine.shx"));
    const dbfBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLine", "001-PolyLine.dbf"));

    const { shp, shx, dbf } = await shpWrite(geojson, "PolyLine");

    expect(buffEqual("001-PolyLine.shp", shpBuffer, shp)).toBe(true);
    expect(buffEqual("001-PolyLine.shx", shxBuffer, shx)).toBe(true);
    expect(buffEqual("001-PolyLine.dbf", dbfBuffer, dbf, [1, 2, 3])).toBe(true); // [1,2,3] Indexes of current date, 1. Year -1900, 2. Month index (Starting at 1 for January), 3. Day of month
  });

  it("PolyLine.002 - no multi-types", async () => {
    const geojson = JSON.parse(fs.readFileSync(path.join(__dirname, "assets", "example.json"), { encoding: "utf-8" }));
    const shpBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLine", "002-PolyLine.shp"));
    const shxBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLine", "002-PolyLine.shx"));
    const dbfBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLine", "002-PolyLine.dbf"));

    const { shp, shx, dbf } = await shpWrite(geojson, "PolyLine", {
      bundleMultiTypes: false,
    });

    expect(buffEqual("002-PolyLine.shp", shpBuffer, shp)).toBe(true);
    expect(buffEqual("002-PolyLine.shx", shxBuffer, shx)).toBe(true);
    expect(buffEqual("002-PolyLine.dbf", dbfBuffer, dbf, [1, 2, 3])).toBe(true); // [1,2,3] Indexes of current date, 1. Year -1900, 2. Month index (Starting at 1 for January), 3. Day of month
  });

  it("PolyLine.003 - no polygons parsed as lines", async () => {
    const geojson = JSON.parse(fs.readFileSync(path.join(__dirname, "assets", "example.json"), { encoding: "utf-8" }));
    const shpBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLine", "003-PolyLine.shp"));
    const shxBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLine", "003-PolyLine.shx"));
    const dbfBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLine", "003-PolyLine.dbf"));

    const { shp, shx, dbf } = await shpWrite(geojson, "PolyLine", {
      bundlePolygons: false,
    });

    expect(buffEqual("003-PolyLine.shp", shpBuffer, shp)).toBe(true);
    expect(buffEqual("003-PolyLine.shx", shxBuffer, shx)).toBe(true);
    expect(buffEqual("003-PolyLine.dbf", dbfBuffer, dbf, [1, 2, 3])).toBe(true); // [1,2,3] Indexes of current date, 1. Year -1900, 2. Month index (Starting at 1 for January), 3. Day of month
  });

  it("PolyLine.004 - no polygons parsed as lines or muli-types", async () => {
    const geojson = JSON.parse(fs.readFileSync(path.join(__dirname, "assets", "example.json"), { encoding: "utf-8" }));
    const shpBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLine", "004-PolyLine.shp"));
    const shxBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLine", "004-PolyLine.shx"));
    const dbfBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLine", "004-PolyLine.dbf"));

    const { shp, shx, dbf } = await shpWrite(geojson, "PolyLine", {
      bundleMultiTypes: false,
      bundlePolygons: false,
    });

    expect(buffEqual("004-PolyLine.shp", shpBuffer, shp)).toBe(true);
    expect(buffEqual("004-PolyLine.shx", shxBuffer, shx)).toBe(true);
    expect(buffEqual("004-PolyLine.dbf", dbfBuffer, dbf, [1, 2, 3])).toBe(true); // [1,2,3] Indexes of current date, 1. Year -1900, 2. Month index (Starting at 1 for January), 3. Day of month
  });

  it("PolyLine.005 - additional insignificant invalid options", async () => {
    const geojson = JSON.parse(fs.readFileSync(path.join(__dirname, "assets", "example.json"), { encoding: "utf-8" }));
    const shpBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLine", "001-PolyLine.shp"));
    const shxBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLine", "001-PolyLine.shx"));
    const dbfBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLine", "001-PolyLine.dbf"));

    const { shp, shx, dbf } = await shpWrite(geojson, "PolyLine", {
      elevationPropertyKey: "random", // non-existant
      measurePropertyKey: "letter", // string instead of expected number | number[]
    });

    expect(buffEqual("005-PolyLine.shp", shpBuffer, shp)).toBe(true);
    expect(buffEqual("005-PolyLine.shx", shxBuffer, shx)).toBe(true);
    expect(buffEqual("005-PolyLine.dbf", dbfBuffer, dbf, [1, 2, 3])).toBe(true); // [1,2,3] Indexes of current date, 1. Year -1900, 2. Month index (Starting at 1 for January), 3. Day of month
  });
});
