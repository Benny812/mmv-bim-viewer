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

import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";

import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from "three-mesh-bvh";

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

// const cubeDefault = new BoxGeometry(1, 1, 1);
// const materialWhite = new MeshLambertMaterial({
//   color: 0xffffff,
//   polygonOffset: true,
//   polygonOffsetFactor: 1,
//   polygonOffsetUnits: 1,
// });
// const defaultCube = new Mesh(cubeDefault, materialWhite);

// scene.add(defaultCube);

//Object to store the size of the viewport

const size = {
  width: window.innerWidth,
  height: window.innerHeight,
};

/************** Camera ******************/

const aspect = size.width / size.height;
const camera = new PerspectiveCamera(75, aspect);
camera.position.set(10, 8, 10);
camera.lookAt(0, 0, 0);
scene.add(camera);

/************** Lights ******************/

const lightColor = 0xffffff;
const softColor = 0xdcdcdc;

const ambLight = new AmbientLight(lightColor, 0, 5);
// scene.add(ambLight);

const light = new HemisphereLight(lightColor, softColor, 0.9);
scene.add(light);

const dirLight = new DirectionalLight(lightColor, 1);
// scene.add(dirLight);

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

/****************** Ifc Loader from file **************************/

import { IFCLoader } from "web-ifc-three/IFCLoader";

const input = document.getElementById("file-input");
const ifcLoader = new IFCLoader();
const ifcModels = [];

input.addEventListener(
  "change",
  async (changed) => {
    const ifcURL = URL.createObjectURL(changed.target.files[0]);
    const model = await ifcLoader.loadAsync(ifcURL);
    scene.add(model);
    ifcModels.push(model);
  },
  false
);

/****************** Ifc Loader from local resourcefolder **************************/

async function loadIFC() {
  ifcLoader.load("./Resources/temp/01.ifc", (ifcModel) => {
    ifcModels.push(ifcModel);
    scene.add(ifcModel);
  });
}

loadIFC();

/************** Raycaster **************/

const raycaster = new Raycaster();
raycaster.firstHitOnly = true;
const mouse = new Vector2();

/********************** Picking *****************************/

ifcLoader.ifcManager.setupThreeMeshBVH(
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast
);

function cast(event) {
  // Computes the position of the mouse on the screen
  const bounds = threeCanvas.getBoundingClientRect();

  const x1 = event.clientX - bounds.left;
  const x2 = bounds.right - bounds.left;
  mouse.x = (x1 / x2) * 2 - 1;

  const y1 = event.clientY - bounds.top;
  const y2 = bounds.bottom - bounds.top;
  mouse.y = -(y1 / y2) * 2 + 1;

  // Places it on the camera pointing to the mouse
  raycaster.setFromCamera(mouse, camera);

  // Casts a ray
  return raycaster.intersectObjects(ifcModels);
}

/******************* Subset  ***************************/

// Creates subset material
const preselectMat = new MeshLambertMaterial({
  transparent: true,
  opacity: 0.6,
  color: 0xff88ff,
  depthTest: false,
});
const selectMat = new MeshLambertMaterial({
  transparent: true,
  opacity: 0.6,
  color: 0xff00ff,
  depthTest: false,
});

const selectModel = { id: -1 };
window.ondblclick = (event) => highlight(event, selectMat, selectModel);

function pick(event) {
  const found = cast(event)[0];
  if (found) {
    const index = found.faceIndex;
    const geometry = found.object.geometry;
    const ifc = ifcLoader.ifcManager;
    const id = ifc.getExpressId(geometry, index);
    console.log(id);
  }
}

const ifc = ifcLoader.ifcManager;

// Reference to the previous selection
let preselectModel = { id: -1 };

function highlight(event, material, model) {
  const found = cast(event)[0];
  if (found) {
    // Gets model ID
    model.id = found.object.modelID;

    // Gets Express ID
    const index = found.faceIndex;
    const geometry = found.object.geometry;
    const id = ifc.getExpressId(geometry, index);

    // Creates subset
    ifcLoader.ifcManager.createSubset({
      modelID: model.id,
      ids: [id],
      material: material,
      scene: scene,
      removePrevious: true,
    });
  } else {
    // Removes previous highlight
    ifc.removeSubset(model.id, material);
  }
}

window.onmousemove = (event) => highlight(event, preselectMat, preselectModel);

threeCanvas.ondblclick = pick;

/****************** Reset View buttons **********************/

const azimuthPositveX = document.getElementById("azimuth-x-positive");
azimuthPositveX.addEventListener("click", setAzimuthPosX);
function setAzimuthPosX() {
  cameraControls.setLookAt(20, 0, 1, 0, 0, 0, (enableTransition = true));
}

const azimuthNegativeX = document.getElementById("azimuth-x-negative");
azimuthNegativeX.addEventListener("click", setAzimuthNegX);
function setAzimuthNegX() {
  cameraControls.setLookAt(-20, 0, 0, 0, 0, 0, (enableTransition = true));
}

const polarPositive = document.getElementById("polar-positive");
polarPositive.addEventListener("click", setPolarPos);
function setPolarPos() {
  cameraControls.setLookAt(0, 20, 0, 0, 0, 0, (enableTransition = true));
}

const polarNegative = document.getElementById("polar-negative");
polarNegative.addEventListener("click", setPolarNeg);
function setPolarNeg() {
  cameraControls.setLookAt(0, -20, 0, 0, 0, 0, (enableTransition = true));
}

const azimuthPositveZ = document.getElementById("azimuth-z-positive");
azimuthPositveZ.addEventListener("click", setAzimuthPosZ);
function setAzimuthPosZ() {
  cameraControls.setLookAt(0, 0, 20, 0, 0, 0, (enableTransition = true));
}

const azimuthNegativeZ = document.getElementById("azimuth-z-negative");
azimuthNegativeZ.addEventListener("click", setAzimuthNegZ);
function setAzimuthNegZ() {
  cameraControls.setLookAt(0, 0, -20, 0, 0, 0, (enableTransition = true));
}

const azimuthIsometric = document.getElementById("isometric");
azimuthIsometric.addEventListener("click", setAzimuthIso);
function setAzimuthIso() {
  cameraControls.setLookAt(20, 20, 20, 0, 0, 0, (enableTransition = true));
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

    cameraControls.setPosition(0, 10, 0);
    cameraControls.mouseButtons.left = CameraControls.ACTION.TRUCK;
    cameraControls.setLookAt(0, 20, 0, 0, 0, 0, (enableTransition = true));
    // cameraControls.fitToBox(ifcModels[0], true, {
    //   paddingTop: 1,
    //   paddingBottom: 1,
    //   paddingLeft: 0.3,
    //   paddingRight: 0.3,
    // });
  } else {
    this.removeAttribute("style");
    this.removeAttribute("data-clicked");
    cameraControls.mouseButtons.left = CameraControls.ACTION.ROTATE;
  }
}

/********************* Hide object button ***************************/

const hideButton = document.getElementById("hideBtn");
hideButton.addEventListener("click", tempHidingElement);

function tempHidingElement(event) {
  if (!this.dataset.clicked) {
    hideButton.style = "outline-offset: -6px";
    this.setAttribute("data-clicked", "true");
  } else {
    this.removeAttribute("style");
    this.removeAttribute("data-clicked");
  }
}

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
  (threeCanvas.width = window.innerWidth),
    (threeCanvas.height = window.innerHeight);
  camera.aspect = threeCanvas.width / threeCanvas.height;
  camera.updateProjectionMatrix();
  renderer.setSize(threeCanvas.width, threeCanvas.height);
});
