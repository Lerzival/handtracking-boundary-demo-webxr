import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import {forma, rotation} from "./forma.js";
import { configurarManos } from "./manos.js";
import { interaction } from "./controller.js";

// Create a Three.js scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth/window.innerHeight, 0.01, 20
);

const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement); //metes el renderer en la escena de la web

const cubo = forma("cubo", 0.1, 0.1, 0.1, true);

//añadimos el cubo a la escena
scene.add(cubo); 

// medimos el cubo MIENTRAS AÚN ES VISIBLE para que Box3 no devuelva 0
const cajaMedicion = new THREE.Box3().setFromObject(cubo);
const MITAD_ALTURA = (cajaMedicion.max.y - cajaMedicion.min.y) / 2;
cubo.visible = false;


document.body.appendChild(ARButton.createButton(renderer, 
  {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["hand-tracking"]
  }
));

const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
scene.add(light);

// ⬇️ MODIFICACIÓN: Añadimos la diana verde y la lógica para crear el cubo ⬇️
const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
);
reticle.matrixAutoUpdate = false;
reticle.visible = false;
scene.add(reticle);

let cuboColocado = false;
const controller1 = renderer.xr.getController(1);
scene.add(controller1);
controller1.addEventListener('select', () => {
    if (reticle.visible && !cuboColocado) {
        cubo.position.setFromMatrixPosition(reticle.matrix);
        // Calculamos la altura real del objeto con una caja para apoyarlo bien
        const caja = new THREE.Box3().setFromObject(cubo);
        cubo.position.y += (caja.max.y - caja.min.y) / 2;
        
        cubo.visible = true;
        reticle.visible = false;
        cuboColocado = true;
    }
});

let hitTestSource = null;
let hitTestSourceRequested = false;
// ⬆️ FIN MODIFICACIÓN ⬆️

configurarManos(renderer, scene);
const comprobarColisiones = interaction(renderer, scene, cubo);

// ⬇️ MODIFICACIÓN: El render ahora recibe (timestamp, frame) para el escáner ⬇️
function render(timestamp, frame) {
    
    // Motor del Hit-Test (Escáner de suelo)
    if (frame && !cuboColocado) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (hitTestSourceRequested === false) {
            session.requestReferenceSpace('viewer').then((viewerSpace) => {
                session.requestHitTestSource({ space: viewerSpace }).then((source) => {
                    hitTestSource = source;
                });
            });
            session.addEventListener('end', () => {
                hitTestSourceRequested = false;
                hitTestSource = null;
            });
            hitTestSourceRequested = true;
        }

        if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                reticle.visible = true;
                reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
            } else {
                reticle.visible = false;
            }
        }
    }

    // Aquí mantienes tus funciones habituales
    if (cuboColocado) {
        comprobarColisiones(); 
    }
    
    renderer.render(scene, camera);
}
// ⬆️ FIN MODIFICACIÓN ⬆️

renderer.setAnimationLoop(render);