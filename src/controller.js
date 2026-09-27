import * as THREE from "three";

export function interaction(renderer, scene, objective){
    const raycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();
    const controladores = [];
    
    let mandos = [];
    let agarrado = null;
    const vecMano1 = new THREE.Vector3();
    const vecMano2 = new THREE.Vector3();
    let anguloActual = 0;
    let anguloAnterior = 0;
    let distanciaActual = 0;
    let distanciaAnterior = 0;
    // Un plano matemático infinito que mira hacia arriba (Eje Y) a la altura 0
    const planoSuelo = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    // Un vector vacío para guardar dónde choca el láser
    const puntoInterseccion = new THREE.Vector3();
    // Un vector para recordar dónde pinchaste exactamente relativo al centro del cubo
    const offsetAgarre = new THREE.Vector3();
    
    // ⬇️ MODIFICACIÓN: Guardaremos a qué altura escaneó el hit-test ⬇️
    let alturaFija = 0;
    // ⬆️ FIN MODIFICACIÓN ⬆️

    for (let i = 0; i < 2; i++) {
        const controller = renderer.xr.getController(i);
        scene.add(controller);

        // Al meter la creación DENTRO del bucle, fabricamos 2 láseres distintos
        const laser = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, -0.1), 
            new THREE.Vector3(0, 0, -0.5)
        ]);
        const material = new THREE.LineBasicMaterial({
            color: 0xffffff,
        });
        const laserFinal = new THREE.Line(laser, material);

        controller.add(laserFinal);

        controller.addEventListener("selectstart", () => {
            // ⬇️ MODIFICACIÓN: Si el cubo aún no ha nacido, el láser no hace nada ⬇️
            if (!objective.visible) return; 
            // ⬆️ FIN MODIFICACIÓN ⬆️

            tempMatrix.identity().extractRotation(controller.matrixWorld); //logica de rotacion. Borras la tempmatrix con la identidad, le pones la rotacion del mando, haces que el rayo salga de una posicion matricial (del mando) y le das una direccion (0,0,-1) que es hacia delante, y la aplicas a la tempmatrix para que el rayo salga hacia delante del mando
            raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
            raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

            const intersecciones = raycaster.intersectObject(objective, true);
            if (intersecciones.length > 0) {
                    if (!mandos.includes(controller)) {
                        agarrado = objective;
                        mandos.push(controller);
                        if (mandos.length === 1) {
                            // ⬇️ MODIFICACIÓN: Alineamos planoSuelo con el cubo antes de intersectar ⬇️
                            alturaFija = agarrado.position.y;
                            planoSuelo.constant = -alturaFija;
                            // ⬆️ FIN MODIFICACIÓN ⬆️

                            if (raycaster.ray.intersectPlane(planoSuelo, puntoInterseccion)) {
                                offsetAgarre.subVectors(agarrado.position, puntoInterseccion);
                            }
                        } else if (mandos.length === 2) {
                    
                            mandos[0].getWorldPosition(vecMano1);
                            mandos[1].getWorldPosition(vecMano2);
                            anguloAnterior = Math.atan2(vecMano2.z - vecMano1.z, vecMano2.x - vecMano1.x);
                            distanciaAnterior = vecMano1.distanceTo(vecMano2);}
                    }
                    }
                });
        controller.addEventListener("selectend", () => {
            const index = mandos.indexOf(controller);
            if (index !== -1) { //miras si el mando está en el array de mandos
                mandos.splice(index, 1); //si lo  está, lo quitas con splice (al que le indicas la posicion y el numero de elementos a cortar a partir de ella) para que el array se reorganice. El que queda es el mando que manda jaja
                
                if (mandos.length === 0) {
                    agarrado = null; //si solo queda un mando (corregido a 0), el objeto deja de estar agarrado y se suelta
                } 
                else if (mandos.length === 1 && agarrado) {
                    tempMatrix.identity().extractRotation(mandos[0].matrixWorld);
                    raycaster.ray.origin.setFromMatrixPosition(mandos[0].matrixWorld);
                    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
                    if (raycaster.ray.intersectPlane(planoSuelo, puntoInterseccion)) {
                        offsetAgarre.subVectors(agarrado.position, puntoInterseccion);
                    }
                }
            }
        });

        controladores.push({
            espacio: controller,
            lineaVisual: laserFinal,
            estaAgarrandoAlgo: () => mandos.includes(controller) //guardas estos valores en un array externo para poder usarlos despues antes de que se destruyan al salir del bucle
        })
    } 

    const comprobarColisiones = () => {
        // ⬇️ MODIFICACIÓN: Si el cubo aún no ha nacido, no colorear láseres ⬇️
        if (!objective.visible) return; 
        // ⬆️ FIN MODIFICACIÓN ⬆️

        for (let i = 0; i < controladores.length; i++) {
            const mando = controladores[i].espacio;
            const laser = controladores[i].lineaVisual;
            const estaAgarrando = controladores[i].estaAgarrandoAlgo();

            if (estaAgarrando) {
                laser.material.color.setHex(0x00ff00); // Cambia el color del láser a verde si está agarrando algo
                continue;
            }

            tempMatrix.identity().extractRotation(mando.matrixWorld);
            raycaster.ray.origin.setFromMatrixPosition(mando.matrixWorld);
            raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

            const intersecciones = raycaster.intersectObject(objective, true);

            if (intersecciones.length > 0) {
                laser.material.color.setHex(0x00cdf8); // Cambia el color del láser a azul celeste si hay colisión
            }else {
                laser.material.color.setHex(0xffffff); // Cambia el color del láser a blanco si no hay colisión
            }
        }

        //lógica de arrastre 
        if (mandos.length === 1 && agarrado) {
            tempMatrix.identity().extractRotation(mandos[0].matrixWorld);
            raycaster.ray.origin.setFromMatrixPosition(mandos[0].matrixWorld);
            raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

            if (raycaster.ray.intersectPlane(planoSuelo, puntoInterseccion)) {
                agarrado.position.copy(puntoInterseccion).add(offsetAgarre);
                // ⬇️ MODIFICACIÓN: Usar alturaFija para que no dependa del geometry.parameters del mesh ⬇️
                agarrado.position.y = alturaFija; 
                // ⬆️ FIN MODIFICACIÓN ⬆️
            }
        }
        // Lógica de rotación con dos mandos
        if (mandos.length === 2 && agarrado) {
            mandos[0].getWorldPosition(vecMano1);
            mandos[1].getWorldPosition(vecMano2);
            
            anguloActual = Math.atan2(vecMano2.z - vecMano1.z, vecMano2.x - vecMano1.x); //calcula el angulo entre ambos mandos en el plano xz
            let deltaAngulo = anguloActual - anguloAnterior;

            if (deltaAngulo > Math.PI) deltaAngulo -= Math.PI * 2;
            if (deltaAngulo < -Math.PI) deltaAngulo += Math.PI * 2;
            
            agarrado.rotation.y += -deltaAngulo; //aplicas el deltaAngulo como una rotación en y sobre el objeto
            anguloAnterior = anguloActual; //actualizas el ángulo para seguir comparando en siguientes frames

            distanciaActual = vecMano1.distanceTo(vecMano2);
            const escala = distanciaActual / distanciaAnterior;

            if (distanciaAnterior > 0) {
                // A. Medimos dónde están apoyados los pies AHORA MISMO
                const cajaAntes = new THREE.Box3().setFromObject(agarrado);
                const nivelSuelo = cajaAntes.min.y;

                // B. Aplicamos tu escala
                agarrado.scale.multiplyScalar(escala);

                // C. Volvemos a medir los pies (se habrán hundido por crecer desde el centro)
                const cajaDespues = new THREE.Box3().setFromObject(agarrado);
                
                // D. Levantamos la figura exactamente lo que se haya hundido
                agarrado.position.y += (nivelSuelo - cajaDespues.min.y);
                
                //Actualizamos el plano invisible para el arrastre 2D
                alturaFija = agarrado.position.y;
                planoSuelo.constant = -alturaFija; // Movemos el plano de colisión a la nueva altura
            }
            distanciaAnterior = distanciaActual;
        }
    };

    return comprobarColisiones;
}
