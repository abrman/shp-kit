import { FeatureCollection } from "geojson";
import mproj from "mproj";

/**
 * @param geojson
 * @param sourceProjection can be a PROJ4 string or WKT string, you will likely have a wkt string available with your LandXML if you used Civil 3D exporter and had your drawing geo-referenced
 * @param targetProjection you will most likely want to use WGS84 for online viewing, however any other projection you might need can be used as long as it's valid
 * @param originalGeometryPropertyKey Key of the property where this function can store the original geometry before reprojecting
 * @returns {FeatureCollection} Geojson FeatureCollection with updated geometry coordinates
 */
const reprojectGeoJson = (
  geojson: FeatureCollection,
  sourceProjection: string,
  targetProjection: string = "WGS84",
  originalGeometryPropertyKey?: string | null
) => {
  const toProj4String = (projection: string) => {
    if (projection.toUpperCase() === "WGS84") return "+proj=longlat +datum=WGS84 +no_defs";
    // WKT strings start with a keyword like PROJCS[ or GEOGCS[
    if (/^(PROJCS|GEOGCS|COMPD_CS|GEOCCS|VERT_CS|LOCAL_CS)\s*\[/i.test(projection.trim()))
      return mproj.internal.wkt_to_proj4(projection);
    return projection;
  };

  const DEG_TO_RAD = Math.PI / 180;
  const RAD_TO_DEG = 180 / Math.PI;

  const src = mproj.pj_init(toProj4String(sourceProjection));
  const dst = mproj.pj_init(toProj4String(targetProjection));

  const transformCoordinates = (coordinates: any[]) => {
    if (Array.isArray(coordinates[0])) {
      coordinates = coordinates.map((subCoordinates) => transformCoordinates(subCoordinates));
    } else {
      const xs = [src.is_latlong ? coordinates[0] * DEG_TO_RAD : coordinates[0]];
      const ys = [src.is_latlong ? coordinates[1] * DEG_TO_RAD : coordinates[1]];
      mproj.pj_transform(src, dst, xs, ys);
      coordinates = [
        dst.is_latlong ? xs[0] * RAD_TO_DEG : xs[0],
        dst.is_latlong ? ys[0] * RAD_TO_DEG : ys[0],
        ...coordinates.slice(2),
      ];
    }
    return coordinates;
  };

  if (!geojson || !geojson.features || !Array.isArray(geojson.features) || !sourceProjection) {
    throw new Error("Invalid GeoJSON or source projection.");
  }

  geojson.features.forEach((feature) => {
    if (originalGeometryPropertyKey) feature.properties = feature.properties || {};

    if (feature.geometry) {
      if (originalGeometryPropertyKey && feature.properties)
        feature.properties[originalGeometryPropertyKey] = JSON.parse(JSON.stringify(feature.geometry));

      if (sourceProjection !== targetProjection) {
        (feature.geometry as any).coordinates = transformCoordinates(
          (feature.geometry as any).coordinates
        );
      }
    }
  });

  return geojson;
};

export default reprojectGeoJson;
