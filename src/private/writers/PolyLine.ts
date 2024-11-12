import { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import { ShapefileTypesNumber, shapefileNumberTypeToStringType } from "../helpers/shapefileTypes";
import { Options } from "../../public/shpWrite";
import boundingBoxFromFeaturesList from "../helpers/boundingBoxFromCoordinateList";
import flattenGeojsonFeatureListToSimpleCoordinateList from "../helpers/flattenGeojsonFeatureCoordinates";
import extractFeatureParts from "../helpers/extractFeatureParts";
import breakGeometryCollectionsFromFeatureList from "../helpers/breakGeometryCollectionsFromFeatureList";

const extents = boundingBoxFromFeaturesList;

const filterFeatures = (geojson: FeatureCollection, o: Options) => {
  const features = breakGeometryCollectionsFromFeatureList(geojson.features).filter((f) => {
    return (
      f.geometry.type === "LineString" ||
      (o.bundlePolygons && f.geometry.type === "Polygon") ||
      (o.bundleMultiTypes && f.geometry.type === "MultiLineString") ||
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
  const typeString = shapefileNumberTypeToStringType(shpTypeNumber);
  const coordinates = flattenGeojsonFeatureListToSimpleCoordinateList(features);
  const parts = features.map((f) => extractFeatureParts(f).length).reduce((a, b) => a + b, 0);
  const file_header_length_bytes = 100;
  const records_header_length_bytes = features.length * 8;
  let polyline_record_length_bytes = 44 * features.length + parts * 4 + coordinates.length * 16;
  if (typeString === "PolyLineM") polyline_record_length_bytes += features.length * 16 + coordinates.length * 8;
  if (typeString === "PolyLineZ") polyline_record_length_bytes += features.length * 32 + coordinates.length * 16;
  return file_header_length_bytes + records_header_length_bytes + polyline_record_length_bytes;
};

const shxLength = (
  features: Feature<Geometry, GeoJsonProperties>[],
  shpTypeNumber: ShapefileTypesNumber,
  o: Options
) => {
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

  features.forEach((feature, index) => {
    let featureByteIndex = 8;
    const parts = extractFeatureParts(feature);
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

    // PolyLineM start
    if (shapefileNumberTypeToStringType(shpTypeNumber) === "PolyLineM") {
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
          mValue = mValue.reduce((list, val) => [...list, ...(Array.isArray(val) ? [...val] : [val])], [] as number[]);
          points.forEach((_, i) => {
            let val = mValue[i];
            if (typeof val === "string" && isFinite(val as any)) val = Number(val);
            if (typeof val === "number") shpView.setFloat64(currByteIndex + featureByteIndex + mPropOffset, val, true);
            mPropOffset += 8;
          });
        }
      }
      featureByteIndex += points.length * 8;
    }
    // PolyLineM end

    // PolyLineZ start
    if (shapefileNumberTypeToStringType(shpTypeNumber) === "PolyLineZ") {
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
          zValue = zValue.reduce((list, val) => [...list, ...(Array.isArray(val) ? [...val] : [val])], [] as number[]);
          points.forEach((_, i) => {
            let val = zValue[i];
            if (typeof val === "string" && isFinite(val as any)) val = Number(val);
            if (typeof val === "number") shpView.setFloat64(currByteIndex + featureByteIndex + zPropOffset, val, true);
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
          mValue = mValue.reduce((list, val) => [...list, ...(Array.isArray(val) ? [...val] : [val])], [] as number[]);
          points.forEach((_, i) => {
            let val = mValue[i];
            if (typeof val === "string" && isFinite(val as any)) val = Number(val);
            if (typeof val === "number") shpView.setFloat64(currByteIndex + featureByteIndex + mPropOffset, val, true);
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
  const propList = features.map((f) => {
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
