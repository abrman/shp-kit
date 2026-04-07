declare module "mproj" {
  interface Projection {
    is_latlong: boolean;
    [key: string]: unknown;
  }

  const mproj: {
    pj_init(projString: string): Projection;
    pj_transform(src: Projection, dst: Projection, x: number[], y: number[], z?: number[]): void;
    internal: {
      wkt_to_proj4(wkt: string): string;
    };
  };

  export default mproj;
}
