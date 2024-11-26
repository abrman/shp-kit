import * as PolyLineWriter from "./PolyLine";
import * as PolygonWriter from "./Polygon";
import * as PointWriter from "./Point";

const writers = {
  // 0 : "Null Shape",
  1: PointWriter,
  3: PolyLineWriter, //"PolyLine",
  5: PolygonWriter, // "Polygon",
  // 8: "MultiPoint",
  11: PointWriter,
  13: PolyLineWriter, //"PolyLineZ",
  15: PolygonWriter, //"PolygonZ",
  // 18: "MultiPointZ",
  21: PointWriter,
  23: PolyLineWriter, //"PolyLineM",
  25: PolygonWriter, //"PolygonM",
  // 28: "MultiPointM",
  // 31 : "MultiPatch",
} as const;

export { default as dbf } from "./Dbf";
export default writers;
