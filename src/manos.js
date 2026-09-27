import { forma } from './forma.js';

export function configurarManos(renderer, scene) {
const hand1 = renderer.xr.getHand(0);
const hand2 = renderer.xr.getHand(1);

const hands = [hand1, hand2];

for (let i = 0; i < hands.length; i++) {
    const hand = hands[i];

    hand.addEventListener('connected', () => { //cuando está conectado, lanza una función sin parametros. Esta es la lógica que hace que las formas se peguen a las articulaciones en el instante en el que se conectan las manos
        if (hand.children.length > 0 && hand.children[0].children.length === 0) {

            for (let j = 0; j < 25; j++) {

                const esfera = forma("cubo", 0.01, 0.01, 0.01, true);        
                esfera.material.color.setHex(0x550000);
                esfera.matrixAutoUpdate = false;
        
                hand.children[j].add(esfera);
            }
        }
    });
 scene.add(hand);
}
}   
