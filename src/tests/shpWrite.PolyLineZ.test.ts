import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { shpWrite } from "..";
import buffEqual from "../private/helpers/bufferEqualityCheck";

describe("shpWrite", () => {
  it("PolyLineZ.001 - LineString, default options", async () => {
    const geojson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "assets", "eldorado_peak_trail.json"), { encoding: "utf-8" })
    );
    const shpBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLineZ", "001-PolyLineZ.shp"));
    const shxBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLineZ", "001-PolyLineZ.shx"));
    const dbfBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLineZ", "001-PolyLineZ.dbf"));

    const { shp, shx, dbf } = await shpWrite(geojson, "PolyLineZ");
    // fs.writeFile(path.join(__dirname, "output", "001-PolyLineZ.shp"), shp, () => {});
    // fs.writeFile(path.join(__dirname, "output", "001-PolyLineZ.shx"), shx, () => {});
    // fs.writeFile(path.join(__dirname, "output", "001-PolyLineZ.dbf"), dbf, () => {});

    expect(buffEqual("001-PolyLineZ.shp", shpBuffer, shp)).toBe(true);
    expect(buffEqual("001-PolyLineZ.shx", shxBuffer, shx)).toBe(true);
    expect(buffEqual("001-PolyLineZ.dbf", dbfBuffer, dbf, [1, 2, 3])).toBe(true); // [1,2,3] Indexes of current date, 1. Year -1900, 2. Month index (Starting at 1 for January), 3. Day of month
  });

  it("PolyLineZ.002 - MultiLineString, default options", async () => {
    const geojson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "assets", "mount_shasta_trails_multiLineString.json"), { encoding: "utf-8" })
    );
    const shpBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLineZ", "002-PolyLineZ.shp"));
    const shxBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLineZ", "002-PolyLineZ.shx"));
    const dbfBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLineZ", "002-PolyLineZ.dbf"));

    const { shp, shx, dbf } = await shpWrite(geojson, "PolyLineZ");
    // fs.writeFile(path.join(__dirname, "output", "002-PolyLineZ.shp"), shp, () => {});
    // fs.writeFile(path.join(__dirname, "output", "002-PolyLineZ.shx"), shx, () => {});
    // fs.writeFile(path.join(__dirname, "output", "002-PolyLineZ.dbf"), dbf, () => {});

    expect(buffEqual("002-PolyLineZ.shp", shpBuffer, shp)).toBe(true);
    expect(buffEqual("002-PolyLineZ.shx", shxBuffer, shx)).toBe(true);
    expect(buffEqual("002-PolyLineZ.dbf", dbfBuffer, dbf, [1, 2, 3])).toBe(true); // [1,2,3] Indexes of current date, 1. Year -1900, 2. Month index (Starting at 1 for January), 3. Day of month
  });

  it("PolyLineZ.003 - MultiLineString, elevation from feature property", async () => {
    const geojson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "assets", "mount_shasta_trails_multiLineString.json"), { encoding: "utf-8" })
    );
    const shpBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLineZ", "003-PolyLineZ.shp"));
    const shxBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLineZ", "003-PolyLineZ.shx"));
    const dbfBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLineZ", "003-PolyLineZ.dbf"));

    const { shp, shx, dbf } = await shpWrite(geojson, "PolyLineZ", {
      elevationPropertyKey: "singularNumberForTest",
    });
    // fs.writeFile(path.join(__dirname, "output", "003-PolyLineZ.shp"), shp, () => {});
    // fs.writeFile(path.join(__dirname, "output", "003-PolyLineZ.shx"), shx, () => {});
    // fs.writeFile(path.join(__dirname, "output", "003-PolyLineZ.dbf"), dbf, () => {});

    expect(buffEqual("003-PolyLineZ.shp", shpBuffer, shp, [73, 74, 81, 82, 22261, 22262, 22269, 22270])).toBe(true);
    expect(buffEqual("003-PolyLineZ.shx", shxBuffer, shx)).toBe(true);
    expect(buffEqual("003-PolyLineZ.dbf", dbfBuffer, dbf, [1, 2, 3])).toBe(true); // [1,2,3] Indexes of current date, 1. Year -1900, 2. Month index (Starting at 1 for January), 3. Day of month
  });

  it("PolyLineZ.004 - MultiLineString, elevation array from feature properties", async () => {
    const geojson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "assets", "mount_shasta_trails_multiLineString.json"), { encoding: "utf-8" })
    );
    const shpBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLineZ", "004-PolyLineZ.shp"));
    const shxBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLineZ", "004-PolyLineZ.shx"));
    const dbfBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "PolyLineZ", "004-PolyLineZ.dbf"));

    const { shp, shx, dbf } = await shpWrite(geojson, "PolyLineZ");
    // fs.writeFile(path.join(__dirname, "output", "004-PolyLineZ.shp"), shp, () => {});
    // fs.writeFile(path.join(__dirname, "output", "004-PolyLineZ.shx"), shx, () => {});
    // fs.writeFile(path.join(__dirname, "output", "004-PolyLineZ.dbf"), dbf, () => {});

    expect(buffEqual("004-PolyLineZ.shp", shpBuffer, shp)).toBe(true);
    expect(buffEqual("004-PolyLineZ.shx", shxBuffer, shx)).toBe(true);
    expect(buffEqual("004-PolyLineZ.dbf", dbfBuffer, dbf, [1, 2, 3])).toBe(true); // [1,2,3] Indexes of current date, 1. Year -1900, 2. Month index (Starting at 1 for January), 3. Day of month
  });
});
