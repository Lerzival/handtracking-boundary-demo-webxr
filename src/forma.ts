import * as THREE from "three";
export function forma(forma: string, x: number, y: number, z: number, reflectivity: boolean) { //dejamos que se puedan especificar dimensiones y si el cubo es reflectivo
    let geometry;
    if (forma == "cubo") {
        geometry = new THREE.BoxGeometry(x, y, z);
    }else if (forma == "esfera") {
        geometry = new THREE.SphereGeometry(x, 32, 32);
    }else{ 
        throw new Error("Forma no soportada. Por favor, elige 'cubo' o 'esfera'.");
    }
    let material;
    if (reflectivity) {
        material = new THREE.MeshPhongMaterial({ color: 0x00ff00 }); //meshPhong hace un cubo reflectivo, más complejo. Si quieres un cubo sin reflejos, meshBasicMaterial
    } else {
        material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    }
    const formaFinal = new THREE.Mesh(geometry, material);
    return formaFinal;
}

export function rotation(forma:THREE.Mesh): void{
    forma.rotation.x += 0.01;
    forma.rotation.y += 0.01;
    forma.rotation.z += 0.01;
}

