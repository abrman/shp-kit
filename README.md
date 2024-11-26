![SHP-KIT Logo](.github/logo.png)

**shp-kit** is a JavaScript library under development, providing functionality to read and write shapefiles from GeoJSON. The library focuses on simplifying the conversion process between GeoJSON and shapefiles, making it easier for developers to work with spatial data.

## Shapefile Types Support

The following table outlines the current support for different types of shapefiles in the library:

| Shapefile Type | Read | Write |
| -------------- | ---- | ----- |
| Point          | ✅   | ✅    |
| PolyLine       | ✅   | ✅    |
| Polygon        | ✅   | ✅    |
| MultiPoint     | ❌   | ❌    |
| PointZ         | ✅   | ✅    |
| PolyLineZ      | ✅   | ✅    |
| PolygonZ       | ✅   | ✅    |
| MultiPointZ    | ❌   | ❌    |
| PointM         | ✅   | ✅    |
| ⚠ PolyLineM    | ✅   | ✅    |
| ⚠ PolygonM     | ✅   | ✅    |
| ⚠ MultiPointM  | ❌   | ❌    |
| MultiPatch     | ❌   | ❌    |

Please note:

1. Types ending with M are outdated, not sufficiently tested, and not recommended for use.
2. The API specified below may change without notice before reaching v1.0.0

## Library Functions

### shpWriteZip

```typescript
shpWriteZip: (
  filename: string, // Shapefile name (with or without extension .zip)
  geojson: FeatureCollection, // GeoJSON feature collection
  type: "Point" | "PolyLine" | "Polygon" | "MultiPoint" | "PointZ" | "PolyLineZ" | "PolygonZ" | "MultiPointZ" | "PointM" | "PolyLineM" | "PolygonM" | "MultiPointM" | "MultiPatch", 
  options?: Partial<Options>, // See available options below
  download?: boolean, // If true, attempts to download the ZIP after generating
  wktProjectionString?: string // If you have a shapefile *.prj compatible WKT projection string, you can include it here. Note: your geojson should be in this projection already. Consider using reprojectGeoJson available below if you need to re-project your data.
) => Promise<Blob>
```

### shpWrite

```typescript
shpWrite: (
    geojson: FeatureCollection, // GeoJSON feature collection
    type: "Point" | "PolyLine" | "Polygon" | "MultiPoint" | "PointZ" | "PolyLineZ" | "PolygonZ" | "MultiPointZ" | "PointM" | "PolyLineM" | "PolygonM" | "MultiPointM" | "MultiPatch",
    options?: Partial<Options> // See available options below
) => Promise<{ // Object containing the most important files in a shapefile, objects are given as Dataviews. Use shp.buffer to do whatever you need from here
  shp: ArrayBuffer,
  shx: ArrayBuffer,
  dbf: ArrayBuffer,
}>
```

Write options and their defaults:

| Key                                                     | Expected type / Default Value | Description                                                                                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bundlePolygons                                          | boolean / true                | If true, Polygons will be interpreted as LineStrings and exported with PolyLine like Shapefile type                                                                                                                                 |
| bundleMultiTypes                                        | boolean / true                | If true, MultiPolyline and MultiPolygons will be parsed as their basic counterpart                                                                                                                                                  |
| elevationPropertyKey                                    | string / null                 | If a Z-type Shapefile is chosen, by default elevation will be searched in feature's coordinates as 3rd element of coordinate array, if elevation is a property of given object, you can set the property name here                  |
| measurePropertyKey                                      | string / null                 | Shapefiles support an additional numeric measure value, as denoted by shapefile types ending with `M`, if a key from feature.properties: `{[key]: value}` is given, this will be used as the `M` value in the written shapefile.    |


### shpReadZip

```typescript
shpReadZip: (
  file: File | Blob | ZipUrl, 
  options?: Partial<Options> // See available options below
  ) => Promise<FeatureCollection> // GeoJSON feature collection
```

### shpRead

```typescript
shpRead: (
  shp: File, // File or Blob
  options?: Partial<Options> // See available options below
  dbf?: File, // optional dbase file that would populate feature properties
  prj?: File | string // optional projection file, or projection string. If present, shpRead will re-project your shapefile into WGS84, alternatively feel free to use reprojectGeojson function also available in this library
) => Promise<FeatureCollection> // GeoJSON feature collection
```

| Key                            | Expected type / Default Value | Description                                                                                                                                                                                             |
| ------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| elevationPropertyKey           | string / null                 | By default where elevation available, it will be set as 3rd element in the coordinates array, if elevationPropertyKey is set, elevation will be added to feature properties under provided key instead. |
| measurePropertyKey             | string / null                 | if measurePropertyKey is set, and measure values available, they will be added to feature properties under provided key.                                                                                |
| originalGeometryPropertyKey    | string / null                 | Key under which you would like the original geometry to be saved. Useful when showing feature on a WGS84 map while showing feature coordinates on select/hover in another coordinate system             |



### reprojectGeoJson

```typescript
reprojectGeoJson: (
  geojson: FeatureCollection, // GeoJSON feature collection
  sourceProjection: string, // Can be either PROJ.4 string or WKT string, such as you find in the *.prj file with your shapefile (if provided)
  targetProjection: string, // Can be either PROJ.4 string or WKT string, such as you find in the *.prj file with your shapefile (if provided)
  originalGeometryPropertyKey?: string // Key under which you would like the original geometry to be saved. Useful when showing feature on a WGS84 map while showing feature coordinates on select/hover in another coordinate system
) => FeatureCollection // GeoJSON feature collection
```
