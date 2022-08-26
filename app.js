import {
  AmbientLight,
  AxesHelper,
  BoxBufferGeometry,
  BoxGeometry,
  Clock,
  DirectionalLight,
  EdgesGeometry,
  GridHelper,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  MOUSE,
  Vector2,
  Vector3,
  Vector4,
  Quaternion,
  Matrix4,
  Spherical,
  Box3,
  Sphere,
  Raycaster,
  MathUtils,
} from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import CameraControls from "camera-controls";
const subsetOfTHREE = {
  MOUSE,
  Vector2,
  Vector3,
  Vector4,
  Quaternion,
  Matrix4,
  Spherical,
  Box3,
  Sphere,
  Raycaster,
  MathUtils: {
    DEG2RAD: MathUtils.DEG2RAD,
    clamp: MathUtils.clamp,
  },
};

//Creates the Three.js scene
const scene = new Scene();
const threeCanvas = document.getElementById("three-canvas");

/************** Default cube **************/

const cubeDefault = new BoxGeometry(1, 1, 1);
const materialWhite = new MeshLambertMaterial({
  color: 0xffffff,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
});
const defaultCube = new Mesh(cubeDefault, materialWhite);

const cubeEdge = new BoxBufferGeometry(1, 1, 1);
var geometryEdges = new EdgesGeometry(cubeEdge);
var materialLines = new LineBasicMaterial({ color: 0x000000, linewidth: 2 });
var boxwireframe = new LineSegments(geometryEdges, materialLines);
defaultCube.add(boxwireframe);

scene.add(defaultCube);

//Object to store the size of the viewport
const size = {
  width: window.innerWidth,
  height: window.innerHeight,
};

/************** Camera ******************/

const camera = new PerspectiveCamera(
  75,
  size.width / size.height,

  1,
  1000
);
camera.position.set(10, 8, 10);
camera.lookAt(0, 0, 0);
scene.add(camera);

/************** Lights ******************/

const lightColor = 0xffffff;

const light = new HemisphereLight(lightColor, 0.1);
scene.add(light);

const dirLight = new DirectionalLight(lightColor, 1);
scene.add(dirLight);

/***************** Renderer **************************/

const renderer = new WebGLRenderer({ canvas: threeCanvas, alpha: true });
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0xbebebe, 1);

//Creates grids and axes in the scene
const grid = new GridHelper(50, 30);
scene.add(grid);

const axes = new AxesHelper(2);
axes.material.depthTest = false;
axes.renderOrder = 1;
scene.add(axes);

/************** Controls ****************/

CameraControls.install({ THREE: subsetOfTHREE });
const clock = new Clock();
const cameraControls = new CameraControls(camera, threeCanvas);
cameraControls.dollyToCursor = true;
cameraControls.dampingFactor = 0.2;
//Animation loop

function animate() {
  const delta = clock.getDelta();
  cameraControls.update(delta);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

//Adjust the viewport to the size of the browser
window.addEventListener("resize", () => {
  (size.width = window.innerWidth), (size.height = window.innerHeight);
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  renderer.setSize(size.width, size.height);
});

/****************** Ifc Loader **************************/

import { IFCLoader } from "web-ifc-three/IFCLoader";

const input = document.getElementById("file-input");
const ifcLoader = new IFCLoader();

input.addEventListener(
  "change",
  async (changed) => {
    const ifcURL = URL.createObjectURL(changed.target.files[0]);
    const model = await ifcLoader.loadAsync(ifcURL);
    scene.add(model);
  },
  false
);

/****************** Reset View buttons **********************/

const azimuthPositveX = document.getElementById("azimuth-x-positive");
azimuthPositveX.addEventListener("click", setAzimuthPosX);
function setAzimuthPosX() {
  cameraControls.setLookAt(10, 0, 1, 0, 0, 0, (enableTransition = true));
}

const azimuthNegativeX = document.getElementById("azimuth-x-negative");
azimuthNegativeX.addEventListener("click", setAzimuthNegX);
function setAzimuthNegX() {
  cameraControls.setLookAt(-10, 0, 0, 0, 0, 0, (enableTransition = true));
}

const polarPositive = document.getElementById("polar-positive");
polarPositive.addEventListener("click", setPolarPos);
function setPolarPos() {
  cameraControls.setLookAt(0, 10, 0, 0, 0, 0, (enableTransition = true));
}

const polarNegative = document.getElementById("polar-negative");
polarNegative.addEventListener("click", setPolarNeg);
function setPolarNeg() {
  cameraControls.setLookAt(0, -10, 0, 0, 0, 0, (enableTransition = true));
}

const azimuthPositveZ = document.getElementById("azimuth-z-positive");
azimuthPositveZ.addEventListener("click", setAzimuthPosZ);
function setAzimuthPosZ() {
  cameraControls.setLookAt(0, 0, 10, 0, 0, 0, (enableTransition = true));
}

const azimuthNegativeZ = document.getElementById("azimuth-z-negative");
azimuthNegativeZ.addEventListener("click", setAzimuthNegZ);
function setAzimuthNegZ() {
  cameraControls.setLookAt(0, 0, -10, 0, 0, 0, (enableTransition = true));
}

const azimuthIsometric = document.getElementById("isometric");
azimuthIsometric.addEventListener("click", setAzimuthIso);
function setAzimuthIso() {
  cameraControls.setLookAt(10, 10, 10, 0, 0, 0, (enableTransition = true));
}

/**************************** Toggle ViewButtons *************************/

const viewButton = document.getElementById("viewBtn");
const viewBtnContainer = document.getElementById("navBoxes");

viewButton.addEventListener("click", visibility);
function visibility(event) {
  if (!this.dataset.clicked) {
    this.setAttribute("data-clicked", "true");
    viewBtnContainer.style = "display:inline-flex";
    viewButton.style = "outline-offset: -6px";
  } else {
    this.removeAttribute("data-clicked");
    this.removeAttribute("style");
    viewBtnContainer.removeAttribute("style");
  }
}

const lockedTopView = document.getElementById("view2D");

lockedTopView.addEventListener("click", toGeometryCamera);
function toGeometryCamera(event) {
  if (!this.dataset.clicked) {
    this.style = "outline-offset: -6px";
    this.setAttribute("data-clicked", "true");
    cameraControls.setLookAt(0, 10, 0, 0, 0, 0, (enableTransition = true));
    cameraControls.mouseButtons.left = CameraControls.ACTION.TRUCK;
    // cameraControls.fitToBox(defaultCube, true, {
    //   paddingTop: 0.3,
    //   paddingBottom: 0.3,
    //   paddingLeft: 0.3,
    //   paddingRight: 0.3,
    // });
  } else {
    this.removeAttribute("style");
    this.removeAttribute("data-clicked");
    cameraControls.mouseButtons.left = CameraControls.ACTION.ROTATE;
  }
}
