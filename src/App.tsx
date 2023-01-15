import * as THREE from "three";
import { A11yAnnouncer } from "@react-three/a11y";
import { a, config, useSpring } from "@react-spring/three";
import {
  Canvas,
  useFrame,
  useThree,
  extend,
  MeshProps,
} from "@react-three/fiber";
import { Mesh, Vector3, BufferAttribute } from "three";
import { MutableRefObject, useRef, useState, FC, useEffect } from "react";
import {
  OrbitControls,
  Preload,
  shaderMaterial,
  Stats,
} from "@react-three/drei";

import "./App.css";

import vertex from "./shaders/shader.vert";
import fragment from "./shaders/shader.frag";

import { parseGcode } from "./utils/parseGcode.ts";

const ColorShiftMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0.05, 0.2, 0.025),
  },
  vertex,
  fragment
);

ColorShiftMaterial.key = THREE.MathUtils.generateUUID();

extend({ ColorShiftMaterial });

const Controls = () => {
  const control = useRef(null);
  return <OrbitControls ref={control} />;
};

declare interface R3FMeshObj {
  points: object[][];
}

import { OrthographicCamera } from "@react-three/drei";
import { CinematicCamera } from "three-stdlib";

const R3F: FC<R3FMeshObj> = (props) => {
  const meshRef: MutableRefObject<Mesh | null> = useRef(null);
  const [hovered, setHover] = useState(false);

  const [points, setPoints] = useState(undefined);
  const { scale } = useSpring({
    scale: hovered ? 1.1 : 0.75,
    config: config.wobbly,
  });
  const { camera } = useThree();

  useEffect(() => {
    camera.position.z = 400.0;

    if (props.points) {
      //console.log(props.points);

      let z_height = 0.28;

      let vectorPoints = [];

      props.points.layers.forEach((pointArray, layer) => {
        pointArray.forEach((point, n) => {
          vectorPoints.push(point.x, point.y, z_height + 0.2 * layer);
        });
      });

      console.log(vectorPoints);

      setPoints(new BufferAttribute(new Float32Array(vectorPoints), 3));
    }
  }, [props.points]);

  useFrame((state, delta) => {
    // if (meshRef.current) {
    //   meshRef.current.rotation.x = meshRef.current.rotation.y += 0.01;
    // }
    // if (meshRef?.current?.material) {
    //   meshRef.current.material.uniforms.time.value +=
    //     Math.sin(delta / 2) * Math.cos(delta / 2);
    // }
  });

  if (points !== undefined) {
    return (
      <>
        <OrthographicCamera makeDefault zoom={2} />
        <pointLight position={[400, 400, 200]} />
        <ambientLight />
        <mesh>
          <boxGeometry attach="geometry" args={[220, 220, 2]} />
          <meshStandardMaterial attach="material" color={0x444444} />
        </mesh>
        <a.line ref={meshRef}>
          <bufferGeometry>
            <bufferAttribute attach={"attributes-position"} {...points} />
          </bufferGeometry>
          {/* @ts-ignore */}
          {/* <colorShiftMaterial key={ColorShiftMaterial.key} time={3} /> */}
          <lineBasicMaterial attach="material" color="deeppink" />
        </a.line>
      </>
    );
  }
};

function App() {
  const [points, setPoints] = useState(0);

  const [thumbnail, setThumbnails] = useState({ sm: undefined, lg: undefined });

  useEffect(() => {
    fetch("./Benchy.gcode")
      .then((res) => res.text())
      .then((text) => {
        // text is a string
        setPoints(parseGcode(text));
        // setThumbnails({sm: gcode.thumbnails.sm, lg: gcode.thumbnails.lg});
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <div className="App">
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          left: 0,
          top: 0,
        }}
      >
        <Canvas>
          <Controls />
          <R3F {...{ points }} />
        </Canvas>
      </div>
      <h1 style={{position: 'fixed', left: '2rem', bottom: '0rem'}}>gcode viewer</h1>
      <div className="card">
        {thumbnail.lg && (
          <div>
            <img src={`data:image/png;base64, ${thumbnail.lg}`} />
          </div>
        )}
        {thumbnail.sm && (
          <div>
            <img src={`data:image/png;base64, ${thumbnail.sm}`} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
