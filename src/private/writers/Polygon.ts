import {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
  LineString,
  MultiPolygon,
  Polygon,
  Position,
} from "geojson";
import { ShapefileTypesNumber, shapefileNumberTypeToStringType } from "../helpers/shapefileTypes";
import { Options } from "../../public/shpWrite";
import boundingBoxFromFeaturesList from "../helpers/boundingBoxFromCoordinateList";
import flattenGeojsonFeatureListToSimpleCoordinateList from "../helpers/flattenGeojsonFeatureCoordinates";
import extractFeatureParts from "../helpers/extractFeatureParts";
import breakGeometryCollectionsFromFeatureList from "../helpers/breakGeometryCollectionsFromFeatureList";
import { booleanWithin, lineIntersect, unkinkPolygon, kinks } from "@turf/turf";
import { lineString, polygon } from "@turf/helpers";

const extents = boundingBoxFromFeaturesList;

const determineSiblingPolygonsWithin = (parts: Position[][]) => {
  return parts.map((part, i) => {
    return parts.filter((p, j) => i !== j && booleanWithin(polygon([part]), polygon([p])));
  });
};

// Polygons can contain multiple closed linestrings representing outside loops or holes of a polygon. Since geojson supports MultiPolygon, Shapefile doesn't. That's why we break them down here into individual polygons
const breakIntoSinglePolygons = (
  feature: Feature<Geometry, GeoJsonProperties>
): Feature<GeoJSON.Polygon, GeoJsonProperties>[] => {
  if (feature.geometry.type === "Polygon") return [feature] as Feature<GeoJSON.Polygon, GeoJsonProperties>[];
  if (feature.geometry.type === "MultiPolygon")
    return feature.geometry.coordinates.map((multiPolygonCoordinates) => {
      return {
        type: "Feature",
        properties: feature.properties,
        geometry: {
          type: "Polygon",
          coordinates: multiPolygonCoordinates,
        },
      } as Feature<GeoJSON.Polygon, GeoJsonProperties>;
    });
  if (feature.geometry.type === "GeometryCollection") {
    const features = breakGeometryCollectionsFromFeatureList([feature]) as Feature<Geometry, GeoJsonProperties>[];
    return features.reduce((acc, feature) => {
      return acc.concat(breakIntoSinglePolygons(feature));
    }, [] as Feature<Polygon, GeoJsonProperties>[]) as Feature<GeoJSON.Polygon, GeoJsonProperties>[]; // .flatMap(breakIntoSinglePolygons)
  }
  return [] as Feature<GeoJSON.Polygon, GeoJsonProperties>[];
};

const unkink = (feature: Feature<GeoJSON.Polygon, GeoJsonProperties>, warn: boolean) => {
  if (kinks(feature).features.length > 0) {
    if (warn) {
      console.warn(
        "Provided polygon contained intersecting geometry and was unkinked in order to create valid shapefile. Please correct input or verify output correctness."
      );
    }
    return {
      type: "Feature",
      properties: feature.properties,
      geometry: {
        type: "Polygon",
        coordinates: unkinkPolygon(feature).features.map((f) => f.geometry.coordinates[0]),
      },
    } as Feature<GeoJSON.Polygon, GeoJsonProperties>;
  }
  return feature;
};

const closeUnclosedPolygonsAndRemoveRedundantDuplicatePoints = (
  feature: Feature<GeoJSON.Polygon, GeoJsonProperties>,
  warn: boolean
) => {
  const areCoordinatesEqual = (coord1: GeoJSON.Position, coord2: GeoJSON.Position): boolean => {
    return coord1[0] === coord2[0] && coord1[1] === coord2[1];
  };

  if (!feature.geometry || !feature.geometry.coordinates) {
    if (warn) {
      throw new Error("The provided polygon does not contain valid geometry or coordinates.");
    }
    return feature;
  }

  // Iterate over each ring in the polygon
  feature.geometry.coordinates = feature.geometry.coordinates.map((ring) => {
    const ringWithoutRedundantPoints = ring.filter((coord, index) => {
      return index === 0 || !areCoordinatesEqual(coord, ring[index - 1] as Position);
    });

    if (ringWithoutRedundantPoints.length !== ring.length) {
      if (warn) console.warn("Redundant points (Sibling points with matching coordinates) encountered and removed.");
      ring = ringWithoutRedundantPoints;
    }

    if (ring.length < 3) {
      if (warn) {
        console.warn("A polygon ring must have at least three unique coordinates.");
      }
      return ring; // Skip invalid rings
    }

    // Check if the first and last coordinates are the same
    const first = ring[0] as [number, number];
    const last = ring[ring.length - 1] as [number, number];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      if (warn) {
        console.warn("Closing an unclosed polygon ring.");
      }
      // Close the ring by appending the first coordinate to the end
      ring.push(first);
    } else if (ring.length < 4) {
      console.warn("A polygon ring must have at least three unique coordinates.");
    }
    return ring;
  });

  return feature;
};

function adjustPolygonOrientation(coordinates: Position[], isClockwise: boolean): Position[] {
  const isPolygonClockwise = (coordinates: Position[]) => {
    let sum = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const [x1, y1] = coordinates[i] as [number, number];
      const [x2, y2] = coordinates[i + 1] as [number, number];
      sum += (x2 - x1) * (y2 + y1);
    }
    return sum > 0; // Clockwise if sum is positive
  };
  // Ensure the polygon is closed
  if (
    coordinates.length > 0 &&
    ((coordinates[0] as Position)[0] !== (coordinates[coordinates.length - 1] as Position)[0] ||
      (coordinates[0] as Position)[1] !== (coordinates[coordinates.length - 1] as Position)[1])
  ) {
    coordinates.push(coordinates[0] as Position);
  }

  if (isPolygonClockwise(coordinates) === isClockwise) return coordinates; // Orientation matches; no adjustment needed

  return [...coordinates].reverse(); // Reverse the order of coordinates to match desired orientation
}

const filterFeatures = (geojson: FeatureCollection, o: Options) => {
  const features = breakGeometryCollectionsFromFeatureList(geojson.features).filter((f) => {
    return (
      (o.bundlePolygons && f.geometry.type === "Polygon") ||
      (o.bundleMultiTypes && o.bundlePolygons && f.geometry.type === "MultiPolygon")
    );
  });
  return features as Feature<Geometry, GeoJsonProperties>[];
};

const shpLength = (
  features: Feature<Geometry, GeoJsonProperties>[],
  shpTypeNumber: ShapefileTypesNumber,
  o: Options
) => {
  features = features
    .reduce((acc, feature) => {
      return acc.concat(breakIntoSinglePolygons(feature));
    }, [] as Feature<Polygon, GeoJsonProperties>[]) // .flatMap(breakIntoSinglePolygons)
    .map((f) => closeUnclosedPolygonsAndRemoveRedundantDuplicatePoints(f, false))
    .map((f) => unkink(f, false));
  const typeString = shapefileNumberTypeToStringType(shpTypeNumber);
  const coordinates = flattenGeojsonFeatureListToSimpleCoordinateList(features);
  const parts = features.map((f) => extractFeatureParts(f).length).reduce((a, b) => a + b, 0);
  const file_header_length_bytes = 100;
  const records_header_length_bytes = features.length * 8;
  let polygon_record_length_bytes = 44 * features.length + parts * 4 + coordinates.length * 16;
  if (typeString === "PolygonM") polygon_record_length_bytes += features.length * 16 + coordinates.length * 8;
  if (typeString === "PolygonZ") polygon_record_length_bytes += features.length * 32 + coordinates.length * 16;
  return file_header_length_bytes + records_header_length_bytes + polygon_record_length_bytes;
};

const shxLength = (
  features: Feature<Geometry, GeoJsonProperties>[],
  shpTypeNumber: ShapefileTypesNumber,
  o: Options
) => {
  features = features.reduce((acc, feature) => {
    return acc.concat(breakIntoSinglePolygons(feature));
  }, [] as Feature<Polygon, GeoJsonProperties>[]); // .flatMap(breakIntoSinglePolygons);
  const file_header_length_bytes = 100;
  const records_length_bytes = features.length * 8;
  return file_header_length_bytes + records_length_bytes;
};

const write = (
  shpView: DataView,
  shxView: DataView,
  features: Feature<Geometry, GeoJsonProperties>[],
  shpTypeNumber: ShapefileTypesNumber,
  o: Options
) => {
  let currByteIndex = 100;

  features
    .reduce((acc, feature) => {
      return acc.concat(breakIntoSinglePolygons(feature));
    }, [] as Feature<Polygon, GeoJsonProperties>[]) // .flatMap(breakIntoSinglePolygons)
    .map((f) => closeUnclosedPolygonsAndRemoveRedundantDuplicatePoints(f, true))
    .map((f) => unkink(f, true))
    .forEach((feature, index) => {
      let featureByteIndex = 8;
      let parts = extractFeatureParts(feature);
      const partsWithinParentCount = determineSiblingPolygonsWithin(parts).map((f) => f.length);

      parts = parts.map((p, i) => {
        const ancestors = partsWithinParentCount[i];
        const newPart = adjustPolygonOrientation(p, (ancestors || 0) % 2 == 0);
        return newPart;
      });

      const points = flattenGeojsonFeatureListToSimpleCoordinateList([feature]);
      const bb = boundingBoxFromFeaturesList([feature], shpTypeNumber, o);

      shpView.setInt32(currByteIndex + featureByteIndex + 0, shpTypeNumber, true);

      shpView.setFloat64(currByteIndex + featureByteIndex + 4, bb.xmin, true);
      shpView.setFloat64(currByteIndex + featureByteIndex + 12, bb.ymin, true);
      shpView.setFloat64(currByteIndex + featureByteIndex + 20, bb.xmax, true);
      shpView.setFloat64(currByteIndex + featureByteIndex + 28, bb.ymax, true);

      shpView.setInt32(currByteIndex + featureByteIndex + 36, parts.length, true);
      shpView.setInt32(currByteIndex + featureByteIndex + 40, points.length, true);

      featureByteIndex += 44;

      // mark each part with the first point index in given part
      parts
        .map((_, i) => parts.reduce((a, b, j) => (i > j ? a + b.length : a), 0))
        .forEach((part) => {
          shpView.setInt32(currByteIndex + featureByteIndex, part, true);
          featureByteIndex += 4;
        });

      points.forEach((point) => {
        shpView.setFloat64(currByteIndex + featureByteIndex, point[0], true);
        shpView.setFloat64(currByteIndex + featureByteIndex + 8, point[1], true);
        featureByteIndex += 16;
      });

      // PolygonM start
      if (shapefileNumberTypeToStringType(shpTypeNumber) === "PolygonM") {
        shpView.setFloat64(currByteIndex + featureByteIndex + 0, bb.mmin || 0, true);
        shpView.setFloat64(currByteIndex + featureByteIndex + 8, bb.mmax || 0, true);

        featureByteIndex += 16;

        let mPropOffset = 0;
        if (o.measurePropertyKey) {
          let mValue = feature.properties?.[o.elevationPropertyKey as string];
          if (typeof mValue === "string" && isFinite(mValue as any)) mValue = Number(mValue);

          if (typeof mValue === "number") {
            points.forEach((_) => {
              shpView.setFloat64(currByteIndex + featureByteIndex + mPropOffset, mValue, true);
              mPropOffset += 8;
            });
          }

          if (Array.isArray(mValue)) {
            //flatten in case we're dealing with a MultiLineString and values come in an parts array for each line segment
            mValue = mValue.reduce(
              (list, val) => [...list, ...(Array.isArray(val) ? [...val] : [val])],
              [] as number[]
            );
            points.forEach((_, i) => {
              let val = mValue[i];
              if (typeof val === "string" && isFinite(val as any)) val = Number(val);
              if (typeof val === "number")
                shpView.setFloat64(currByteIndex + featureByteIndex + mPropOffset, val, true);
              mPropOffset += 8;
            });
          }
        }
        featureByteIndex += points.length * 8;
      }
      // PolygonM end

      // PolygonZ start
      if (shapefileNumberTypeToStringType(shpTypeNumber) === "PolygonZ") {
        shpView.setFloat64(currByteIndex + featureByteIndex + 0, bb.zmin || 0, true);
        shpView.setFloat64(currByteIndex + featureByteIndex + 8, bb.zmax || 0, true);

        featureByteIndex += 16;

        let zPropOffset = 0;
        if (o.elevationPropertyKey) {
          let zValue = feature.properties?.[o.elevationPropertyKey as string];
          if (typeof zValue === "string" && isFinite(zValue as any)) zValue = Number(zValue);

          if (typeof zValue === "number") {
            points.forEach((_) => {
              shpView.setFloat64(currByteIndex + featureByteIndex + zPropOffset, zValue, true);
              zPropOffset += 8;
            });
          }

          if (Array.isArray(zValue)) {
            //flatten in case we're dealing with a MultiLineString and values come in an parts array for each line segment
            zValue = zValue.reduce(
              (list, val) => [...list, ...(Array.isArray(val) ? [...val] : [val])],
              [] as number[]
            );
            points.forEach((_, i) => {
              let val = zValue[i];
              if (typeof val === "string" && isFinite(val as any)) val = Number(val);
              if (typeof val === "number")
                shpView.setFloat64(currByteIndex + featureByteIndex + zPropOffset, val, true);
              zPropOffset += 8;
            });
          }
        } else {
          points.forEach((point) => {
            shpView.setFloat64(currByteIndex + featureByteIndex + zPropOffset, point[2] || 0, true);
            zPropOffset += 8;
          });
        }
        featureByteIndex += points.length * 8;

        shpView.setFloat64(currByteIndex + featureByteIndex + 0, bb.mmin || 0, true);
        shpView.setFloat64(currByteIndex + featureByteIndex + 8, bb.mmax || 0, true);

        featureByteIndex += 16;

        let mPropOffset = 0;
        if (o.measurePropertyKey) {
          let mValue = feature.properties?.[o.elevationPropertyKey as string];
          if (typeof mValue === "string" && isFinite(mValue as any)) mValue = Number(mValue);

          if (typeof mValue === "number") {
            points.forEach((_) => {
              shpView.setFloat64(currByteIndex + featureByteIndex + mPropOffset, mValue, true);
              mPropOffset += 8;
            });
          }

          if (Array.isArray(mValue)) {
            //flatten in case we're dealing with a MultiLineString and values come in an parts array for each line segment
            mValue = mValue.reduce(
              (list, val) => [...list, ...(Array.isArray(val) ? [...val] : [val])],
              [] as number[]
            );
            points.forEach((_, i) => {
              let val = mValue[i];
              if (typeof val === "string" && isFinite(val as any)) val = Number(val);
              if (typeof val === "number")
                shpView.setFloat64(currByteIndex + featureByteIndex + mPropOffset, val, true);
              mPropOffset += 8;
            });
          }
        }
        featureByteIndex += points.length * 8;
      }
      // PolyLineZ end

      // Record header
      shpView.setInt32(currByteIndex, index + 1); // Record number
      shpView.setInt32(currByteIndex + 4, (featureByteIndex - 8) / 2); // Record length

      //Shx
      shxView.setInt32(100 + index * 8, currByteIndex / 2); // Offset
      shxView.setInt32(100 + index * 8 + 4, (featureByteIndex - 8) / 2); // Content length

      currByteIndex += featureByteIndex;
    });
};

const dbfProps = (
  features: Feature<Geometry, GeoJsonProperties>[],
  shpTypeNumber: ShapefileTypesNumber,
  o: Options
) => {
  let props: any, prop;
  const propList = features
    .reduce((acc, feature) => {
      return acc.concat(breakIntoSinglePolygons(feature));
    }, [] as Feature<Polygon, GeoJsonProperties>[]) // .flatMap(breakIntoSinglePolygons)
    .map((f) => {
      props = {};
      Object.keys(f.properties || []).forEach((key) => {
        prop = (f.properties as any)[key];
        if (typeof prop !== "undefined") {
          props[key] = prop;
        }
      });
      return props;
    });
  return propList;
};

export { write, extents, shpLength, shxLength, filterFeatures, dbfProps };
