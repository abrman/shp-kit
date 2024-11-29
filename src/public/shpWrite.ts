import type { FeatureCollection } from "geojson";
import createDataView from "../private/helpers/createDataView";
import { ShapefileTypesString, shapefileTypeToNumberType } from "../private/helpers/shapefileTypes";
import writers, { dbf as dbfWrite } from "../private/writers";

const defaultOptions = {
  bundlePolygons: true,
  bundleMultiTypes: true,
  elevationPropertyKey: null as null | string,
  measurePropertyKey: null as null | string,
};

/**
 *
 * @param geojson FeatureCollection of objects to be converted into a shapefile
 * @param type One of Shapefile defined types: "Null Shape" | "Point" | "PolyLine" | "Polygon" | "MultiPoint" | "PointZ" | "PolyLineZ" | "PolygonZ" | "MultiPointZ" | "PointM" | "PolyLineM" | "PolygonM" | "MultiPointM" | "MultiPatch"
 * @param options Options on how the geojson should be interpreted, which features to include as which types, and which properties to use as elevation or measurements. Consult type definitions or documentation for more information.
 * @returns object containing buffers for shapefile's shp, shx, and dbf files.
 */
const shpWrite = async (geojson: FeatureCollection, type: ShapefileTypesString, options?: Partial<Options>) => {
  const o: Options = { ...defaultOptions, ...options };
  const numType = shapefileTypeToNumberType(type);
  if (!numType) throw new Error("Invalid shapefile type");

  const writer = writers[numType as keyof typeof writers];
  if (!writer) throw new Error(`Shapefile type ${type} not currently supported`);

  const { extents, shpLength, shxLength, filterFeatures, write, dbfProps } = writer;

  const features = filterFeatures(geojson, o);

  const shp = createDataView(shpLength(features, numType, o));
  const shx = createDataView(shxLength(features, numType, o));

  // Headers start
  const staticFileCode = 9994;
  const fileLength = shp.byteLength / 2; // Length of file in 16-bit words
  const shapefileVersion = 1000;
  const bb = extents(features, numType, o);

  shp.setInt32(0, staticFileCode);
  shp.setInt32(24, fileLength);
  shp.setInt32(28, shapefileVersion, true);
  shp.setInt32(32, numType, true);

  shp.setFloat64(36, bb.xmin, true);
  shp.setFloat64(44, bb.ymin, true);
  shp.setFloat64(52, bb.xmax, true);
  shp.setFloat64(60, bb.ymax, true);

  if (typeof bb.zmin == "number" && typeof bb.zmax == "number") {
    shp.setFloat64(68, bb.zmin, true);
    shp.setFloat64(76, bb.zmax, true);
  }

  if (typeof bb.mmin == "number" && typeof bb.mmax == "number") {
    shp.setFloat64(84, bb.mmin, true);
    shp.setFloat64(92, bb.mmax, true);
  }

  //Duplicate header to Shx (headers are identical)
  for (let i = 0; i < 100; i++) shx.setUint8(i, shp.getUint8(i));
  shx.setInt32(24, shx.byteLength / 2);
  // Headers end

  write(shp, shx, features, numType, o);

  const propList = dbfProps(features, numType, o);
  const dbf = dbfWrite(propList);

  return {
    shp: shp.buffer,
    shx: shx.buffer,
    dbf: dbf.buffer,
  };
};

export type Options = typeof defaultOptions;
export default shpWrite;
