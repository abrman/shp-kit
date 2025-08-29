import { Feature, FeatureCollection } from "geojson";
import createDataView from "../private/helpers/createDataView";
import toDataView from "../private/helpers/toDataView";
import readers, { dbf as dbfReader } from "../private/readers";
import { ShapefileTypesNumber, shapefileNumberTypeToStringType } from "../private/helpers/shapefileTypes";
import reprojectGeoJson from "./reprojectGeojson";
import { Buffer } from "buffer";

const defaultOptions = {
  elevationPropertyKey: null as string | null,
  measurePropertyKey: null as string | null,
  originalGeometryPropertyKey: null as string | null,
};

/**
 *
 * @param shp File, Blob, Buffer or BufferArray of the *.shp
 * @param options
 * @param dbf Optional File, Blob, Buffer or BufferArray of the *.dbf file, this is the shapefile database file and will be used to populate features[].properties
 * @param prj Optional File, Blob, Buffer, BufferArray of the *.prj file, or string projection as WKT string or proj4 string. If present, the shapefile will be reprojected into WGS84 coordinate system, which is default for geojson. If unknown, geojson will use original coordinated without transformation
 * @returns geojson FeatureCollection
 */
const shpRead = async (
  shp: File | Blob | ArrayBuffer | Buffer,
  options?: Partial<Options>,
  dbf?: File | Blob | ArrayBuffer | Buffer,
  prj?: File | Blob | ArrayBuffer | Buffer | string
) => {
  const o = { ...defaultOptions, ...(options ? options : {}) };
  const shpView = await toDataView(shp);
  // const prjView = prj && typeof prj !== "string" ? await toDataView(prj) : null;

  // const prjString =
  //   typeof prj === "string"
  //     ? prj
  //     : typeof prj !== "undefined" && prjView
  //     ? // ? Buffer.from(prjView?.buffer.slice(0, prjView.buffer.byteLength)).toString("utf-8")
  //       (() => {
  //         const decoder = new TextDecoder("utf-8");
  //         const decodedString = decoder.decode(prjView?.buffer.slice(0, prjView.buffer.byteLength));
  //         return decodedString;
  //       })()
  //     : null;

  const dbfProps = dbf ? await dbfReader(dbf) : null;

  if (shpView.getInt32(0) !== 9994) throw new Error("Invalid shp file.");

  const shpNumType = shpView.getInt32(32, true) as ShapefileTypesNumber;
  //   const shpType = shapefileNumberTypeToStringType(shpNumType);

  let currByteIndex = 100;
  let currFeatureIndex = 0;

  let output = {
    type: "FeatureCollection",
    features: [],
  } as FeatureCollection;

  while (currByteIndex + 4 < shpView.buffer.byteLength - 1) {
    // const recordNum = shpView.getInt32(currByteIndex); // Record number
    const recordLength = shpView.getInt32(currByteIndex + 4) * 2 + 8; // Record length
    const recordNumType = shpView.getInt32(currByteIndex + 8, true);
    if (recordLength === 0) break;

    const reader = readers[recordNumType as keyof typeof readers];

    // Skip null shapes
    if (recordNumType === 0) {
      currFeatureIndex++;
      currByteIndex += recordLength;
      continue;
    }

    if (!reader) {
      throw new Error("Shapefile type not currently supported");
    }

    const feature = reader(
      shpView,
      o,
      currByteIndex + 8,
      recordLength,
      shapefileNumberTypeToStringType(recordNumType as ShapefileTypesNumber),
      dbfProps ? dbfProps[currFeatureIndex] || {} : {}
    );

    // Only push if geometry is valid
    if (feature && feature.geometry) {
      output.features.push(feature);
    }

    output.features.push(feature);
    currFeatureIndex++;
    currByteIndex += recordLength;
  }

  if (prj instanceof File || prj instanceof Blob) {
    prj = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Error reading Blob as text"));
      reader.readAsText(prj as Blob);
    });
  } else if (prj instanceof ArrayBuffer) {
    prj = new TextDecoder().decode(prj as ArrayBuffer);
  } else if (Buffer.isBuffer(prj)) {
    prj = prj.toString("utf-8");
  }

  if (prj) {
    output = reprojectGeoJson(output, prj as string, "WGS84", o.originalGeometryPropertyKey);
  }

  return output;
};

export type Options = typeof defaultOptions;
export default shpRead;
