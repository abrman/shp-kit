import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { shpRead, shpWrite } from "..";
import buffEqual from "../private/helpers/bufferEqualityCheck";

describe("shpWrite", () => {
  it("Point.001 - Airports of the USA", async () => {
    const geojson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "assets", "airports-of-usa_purl.standofrd.edu-xp070bj0986.json"), {
        encoding: "utf-8",
      })
    );
    const shpBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "Point", "001-Point.shp"));
    const shxBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "Point", "001-Point.shx"));
    const dbfBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "Point", "001-Point.dbf"));

    const { shp, shx, dbf } = await shpWrite(geojson, "Point");
    // fs.writeFile(path.join(__dirname, "output", "001-Point.shp"), shp, () => {});
    // fs.writeFile(path.join(__dirname, "output", "001-Point.shx"), shx, () => {});
    // fs.writeFile(path.join(__dirname, "output", "001-Point.dbf"), dbf, () => {});

    expect(buffEqual("001-Point.shp", shpBuffer, shp)).toBe(true);
    expect(buffEqual("001-Point.shx", shxBuffer, shx)).toBe(true);
    expect(buffEqual("001-Point.dbf", dbfBuffer, dbf, [1, 2, 3])).toBe(true); // [1,2,3] Indexes of current date, 1. Year -1900, 2. Month index (Starting at 1 for January), 3. Day of month
  });

  it("Point.002 - Airports of the USA from MultiPoint Features", async () => {
    const geojson = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "assets", "airports-of-usa_multipoint.purl.standofrd.edu-xp070bj0986.json"),
        {
          encoding: "utf-8",
        }
      )
    );
    const shpBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "Point", "002-Point.shp"));
    const shxBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "Point", "002-Point.shx"));
    const dbfBuffer = fs.readFileSync(path.join(__dirname, "test_results", "write", "Point", "002-Point.dbf"));

    const { shp, shx, dbf } = await shpWrite(geojson, "Point");
    // fs.writeFile(path.join(__dirname, "output", "002-Point.shp"), shp, () => {});
    // fs.writeFile(path.join(__dirname, "output", "002-Point.shx"), shx, () => {});
    // fs.writeFile(path.join(__dirname, "output", "002-Point.dbf"), dbf, () => {});

    expect(buffEqual("002-Point.shp", shpBuffer, shp)).toBe(true);
    expect(buffEqual("002-Point.shx", shxBuffer, shx)).toBe(true);
    expect(buffEqual("002-Point.dbf", dbfBuffer, dbf, [1, 2, 3])).toBe(true); // [1,2,3] Indexes of current date, 1. Year -1900, 2. Month index (Starting at 1 for January), 3. Day of month
  });
});
