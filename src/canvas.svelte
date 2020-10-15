<script>
    import { onMount } from 'svelte';
    import Gate from './gate.svelte';
    import Wire from './wire.svelte';
    import { NAND } from './js/gates.js'

    class Vector {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        add(v) {
            this.x += v.x;
            this.y += v.y;
        }
        sub(v) {
            this.x -= v.x;
            this.y -= v.y;
        }
        scale(n) {
            this.x *= n;
            this.y *= n;
        }
    };

    let gates = [
        //{ id: '0', position: new Vector(64,32),  image: "./build/AND_GATE.svg", gate: new NAND() },
        //{ id: '1', position: new Vector(128,0), image: "./build/AND_GATE.svg",  gate: new NAND() }
    ];

    let wires = [
        
    ];

    let mousePosition;
    let workspaceDom;
    let zoomLayerDom;

    let gridSpacing;

    let isPlacing = false;
    let placingGate;

    let scale = 1;
    let screenPos = new Vector(0, 0);
    let isGrabbing = false;
    let begGrabPos;
    let endGrabPos;

    onMount(async () => {
        //Call the update function on all the gates that already exist
    });

    function mouseDown(event) {
        //Placing a gate
        if (isPlacing) {
            //Add to list of gates
            gates = [...gates, placingGate];
            isPlacing = false;
            //Update simulator
            placingGate.gate.update();
        }
        if (event.button === 2) {
            //Moving around the workspace
            isGrabbing = true;
            begGrabPos = new Vector(event.pageX, event.pageY);
        }
    }
    function mouseUp(event) {
        if (event.button === 2) {
            //Moving around the workspace
            isGrabbing = false;
            endGrabPos = new Vector(event.pageX, event.pageY);

            begGrabPos.sub(endGrabPos);
            screenPos.sub(begGrabPos);

            document.getElementById("zoomLayer").style.left = screenPos.x + "px";
            document.getElementById("zoomLayer").style.top = screenPos.y + "px";
        }
    }
    function mouseMove(event) {
        //Keep mouse position
        mousePosition = new Vector(event.pageX, event.pageY);
        //Move the gate being placed to the cursor when the mouse moves
        if (isPlacing) {
            //Lock to grid movement
            let zoomLayerOffset = offset(zoomLayerDom);
            zoomLayerOffset.left *= (1/scale);
            zoomLayerOffset.top *= (1/scale);
            let gatePos = new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top);
            placingGate.position = new Vector(Math.round((gatePos.x / 32) - 0.5) * 32, Math.round((gatePos.y / 32) - 0.5) * 32);
        }
        //Move the wire being placed
        if (isWire) {
            let zoomLayerOffset = offset(zoomLayerDom);
            zoomLayerOffset.left *= (1/scale);
            zoomLayerOffset.top *= (1/scale);
            let wirePos = new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top);
            placingWire.endPos = new Vector(wirePos.x, wirePos.y);
        }
        //Moving around the workspace
        if (isGrabbing) {
            endGrabPos = new Vector(event.pageX, event.pageY);

            var begGrabCopy = new Vector(begGrabPos.x, begGrabPos.y);

            begGrabCopy.sub(endGrabPos);
            screenPos.sub(begGrabCopy);

            document.getElementById("zoomLayer").style.left = screenPos.x + "px";
            document.getElementById("zoomLayer").style.top = screenPos.y + "px";

            begGrabPos = new Vector(endGrabPos.x, endGrabPos.y);
        }
    }
    
    function keypressing(event) {
        if (event.key === '=') { //Plus key
            if (scale < 3)
                scale += 0.25;
        }
        else if (event.key === '-') { //Minus key
            if (scale > 0.25)
                scale -= 0.25;
        }
        document.getElementById("zoomLayer").style.transform = "scale(" + scale + ")";
    }

    export function addGate(gateType) {
        switch (gateType) {
        case "AND":
            let zoomLayerOffset = offset(zoomLayerDom);
            zoomLayerOffset.left *= (1/scale);
            zoomLayerOffset.top *= (1/scale);
            placingGate = { 
                position: new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top), 
                image: "./build/AND_GATE.svg",
                gate: new NAND()
            }
            isPlacing = true;
            break;
        case "NAND":
            break;
        }
    }


    let isWire = false;
    let placingWire;

    export function outputCallback(x_pos, y_pos, outWire) {
        isWire = true;
        placingWire = {
            startPos: new Vector(x_pos, y_pos),
            endPos: new Vector(x_pos, y_pos),
            wire: outWire
        };
    }

    export function inputCallback(x_pos, y_pos, inWireIndex, inGate) {
        if (isWire) {
            isWire = false;
            placingWire.endPos = new Vector(x_pos, y_pos);
            wires = [...wires, placingWire];
            //Connect simulator
            placingWire.wire.gate = inGate;
            placingWire.wire.port = inGate.Inputs[inWireIndex];
            placingWire.wire.port.setState(placingWire.wire.getState());
            
            //Update the simulator
            placingWire.wire.gate.update();
        }
    }

    export function debugGates() {
        //Print info about all gates
        console.log("Gate debug:");
        console.log("Gates: ");
        for(var i = 0; i < gates.length; i++)
            console.log(gates[i].gate)
    }

    function offset(el) {
        var rect = el.getBoundingClientRect(),
        scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
    }
</script>

<style>
	div {
        width: 100%;
        height: 100%;

        position: relative;

        transform: scale(1);
    }
    .workspace {
        background-color: #d6d6d6;
    }
    #zoomLayer {
        background-image: url(./grid.png);
        width: 2048px;
        height: 2048px;
    }
    .wire {
        position: relative;
        z-index: -2;
    }
</style>

<svelte:window on:mousedown={mouseDown} on:mouseup={mouseUp} on:mousemove={mouseMove} on:keypress={keypressing}/>

<div class="workspace" bind:this={workspaceDom}>
    <div id="zoomLayer" bind:this={zoomLayerDom}>
        <div class="wire">
            <svg width="2048" height="2048">
                {#each wires as wire, i}
                    <Wire start_x_pos={wires[i].startPos.x} start_y_pos={wires[i].startPos.y}
                        end_x_pos={wires[i].endPos.x} end_y_pos={wires[i].endPos.y} wire={placingWire.wire}
                    />
                {/each}
                {#if isWire}
                    <Wire start_x_pos={placingWire.startPos.x} start_y_pos={placingWire.startPos.y}
                        end_x_pos={placingWire.endPos.x} end_y_pos={placingWire.endPos.y} wire={placingWire.wire}
                    />
                {/if}
            </svg>
        </div>
        {#each gates as gate, i}
            <Gate x_pos={gates[i].position.x} y_pos={gates[i].position.y}
                image={gates[i].image} gate={gates[i].gate} outputCallback={outputCallback} inputCallback={inputCallback}
            />
        {/each}
        {#if isPlacing}
            <Gate x_pos={placingGate.position.x} y_pos={placingGate.position.y} image={placingGate.image} gate={placingGate.gate}/>
        {/if}
    </div>
</div>