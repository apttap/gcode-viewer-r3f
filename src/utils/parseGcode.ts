declare type GcodeObj = {
  thumbnails: object;
  layers: object[][];
};

declare type MotionParams = {
  type: string | undefined;
  x: number | undefined;
  y: number | undefined;
  z: number | undefined;
  e: number | undefined;
};

export function parseGcode(gcode: String) {
  let thumbnailSm = gcode.substring(
    gcode.indexOf("thumbnail begin 48x48"),
    gcode.indexOf("thumbnail end")
  );

  let thumbnailLg = gcode.substring(
    gcode.indexOf("thumbnail begin 300x300"),
    gcode.lastIndexOf("thumbnail end")
  );

  function cleanThumbnail(str) {
    let cleanThumb = str.substring(str.indexOf("; "), str.lastIndexOf(";"));
    return cleanThumb.replace(/; /g, "");
  }

  let obj: GcodeObj = {
    thumbnails: {
      sm: cleanThumbnail(thumbnailSm),
      lg: cleanThumbnail(thumbnailLg),
    },
    layers: [],
  };

  function getMotionGcode(str) {
    const lines = str.split("\n");
    let layers: object[][] = [[]];
    let layer = 0;

    lines.forEach((line: string, n: number) => {
      // remove comments (; to EOL)
      const removeCommentRegex = new RegExp(/\s*;.*/g);
      line.replace(removeCommentRegex, "");

      // look at the first 4 characters
      // if it's x/y motion it's the same layer,
      // if it's z-motion create a new layer.

      let motionType = line.substring(0, 4).toUpperCase();

      let splitLine = line.split(" ");

      let motionParams: MotionParams = {
        type: "motion",
        x: undefined,
        y: undefined,
        z: undefined,
        e: undefined,
      };

      splitLine.forEach((command: String, n: number) => {
        let com_type = command.substring(0, 1);

        switch (com_type) {
          case "X":
            motionParams.x = parseFloat(command.substring(1));
            break;
          case "Y":
            motionParams.y = parseFloat(command.substring(1));
            break;
          case "Z":
            motionParams.z = undefined;
            break;
          case "E":
            motionParams.e = parseFloat(command.substring(1));
            motionParams.type = "extrusion";
          default:
            break;
        }
      });

      switch (motionType) {
        case "G1 Z":
          // z adjust / layer change
          layers[layer].push(motionParams);
          ++layer;
          let newLayer: object[] = [];
          layers.push(newLayer);
          break;
        case "G1 X":
          layers[layer].push(motionParams);
          break;
        default:
          break;
      }
    });

    return layers;
  }

  obj.layers = getMotionGcode(gcode);

  return obj;
}
