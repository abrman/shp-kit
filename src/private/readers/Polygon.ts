import { Feature } from "geojson";
import { ShapefileTypesString } from "../helpers/shapefileTypes";
import { Options } from "../../public/shpRead";

const getOptionalViewFloat64 = (view: DataView, target: number, lastValidByte: number, little: boolean) => {
  if (target > view.byteLength - 1 || target > lastValidByte) return 0;
  return view.getFloat64(target, little);
};

const Polygon = (
  shpView: DataView,
  o: Options,
  currByteIndex: number,
  recordLength: number,
  shpType: ShapefileTypesString,
  properties: {
    [key: string]: any;
  }
) => {
  const recordEndByte = currByteIndex + recordLength;
  //significant header information
  const partsLength = shpView.getInt32(currByteIndex + 36, true);
  const pointsLength = shpView.getInt32(currByteIndex + 40, true);
  currByteIndex += 44;
  const partsSeparators = [...Array(partsLength)].map((_, i) => shpView.getInt32(currByteIndex + 4 * i, true));
  partsSeparators.push(pointsLength);

  currByteIndex += 4 * partsLength;

  let points = [...Array(pointsLength)].map((_, i) => {
    return [shpView.getFloat64(currByteIndex + 16 * i, true), shpView.getFloat64(currByteIndex + 16 * i + 8, true)];
  });

  currByteIndex += 16 * pointsLength;

  let mValues: number[] | null = null;
  let zValues: number[] | null = null;
  if (shpType === "PolygonM") {
    currByteIndex += 32; // min-max
    mValues = [...Array(pointsLength)].map((_, i) => {
      return shpView.getFloat64(currByteIndex + 8 * i, true);
    });
  }
  if (shpType === "PolygonZ") {
    currByteIndex += 16; // min-max
    zValues = [...Array(pointsLength)].map((_, i) => {
      return getOptionalViewFloat64(shpView, currByteIndex + 8 * i, recordEndByte, true);
    });
    currByteIndex += pointsLength * 8 + 16;
    mValues = [...Array(pointsLength)].map((_, i) => {
      return getOptionalViewFloat64(shpView, currByteIndex + 8 * i, recordEndByte, true);
    });

    if (!o.elevationPropertyKey) {
      points = points.map((pt, i) => [pt[0] as number, pt[1] as number, (zValues as number[])[i] as number]);
    }
  }

  const coordinates = partsSeparators.reduce(
    (list, v, i, a) =>
      i === 0 ? list : [...list, [...Array(v - (a[i - 1] as number))].map((_, j) => points[(a[i - 1] as number) + j])],
    [] as any[]
  );

  const output = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates,
    },
    properties: {
      ...properties,
      ...(o.elevationPropertyKey && zValues
        ? {
            [o.elevationPropertyKey]:
              zValues && [...new Set(zValues)].length === 1
                ? zValues[0]
                : partsSeparators.reduce(
                    (list, v, i, a) =>
                      i === 0
                        ? list
                        : [
                            ...list,
                            [...Array(v - (a[i - 1] as number))].map((_, j) =>
                              zValues ? zValues[(a[i - 1] as number) + j] : 0
                            ),
                          ],
                    [] as any[]
                  ),
          }
        : {}),
      ...(o.measurePropertyKey && mValues
        ? {
            [o.measurePropertyKey]:
              mValues && [...new Set(mValues)].length === 1
                ? mValues[0]
                : partsSeparators.reduce(
                    (list, v, i, a) =>
                      i === 0
                        ? list
                        : [
                            ...list,
                            [...Array(v - (a[i - 1] as number))].map((_, j) =>
                              mValues ? mValues[(a[i - 1] as number) + j] : 0
                            ),
                          ],
                    [] as any[]
                  ),
          }
        : {}),
    },
  } as Feature;
  return output as Feature;
};

export default Polygon;
