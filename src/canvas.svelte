<script>
    import { onMount } from 'svelte';
    import Gate from './gate.svelte';
    import UserInput from './userInput.svelte';
    import Wire from './wire.svelte';
    import { NAND } from './js/gates.js'
    import { evaluate } from './js/newSim.js'
    import Light from './light.svelte';

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

    const indexBy = (array, prop) => array.reduce((output, item) => {
        output[item[prop]] = item;
        return output;
    }, {});

    let components = [

    ];

    let gates = [
        //{ id: '0', position: new Vector(64,32),  image: "./build/AND_GATE.svg", gate: new NAND() },
        //{ id: '1', position: new Vector(128,0), image: "./build/AND_GATE.svg",  gate: new NAND() }
    ];

    let wires = [
        
    ];

    let nextGateID = 0;

    let mousePosition;
    let workspaceDom;
    let zoomLayerDom;

    let gridSpacing;

    let isPlacing = false;
    let placingGate;
    let placingComponent;

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
            //Add gate to componets array
            components = [...components, placingComponent];
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
        let zoomLayerOffset = offset(zoomLayerDom);
        zoomLayerOffset.left *= (1/scale);
        zoomLayerOffset.top *= (1/scale);

        switch (gateType) {
        case "AND":
            placingGate = { 
                id: nextGateID.toString(),
                position: new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top), 
                image: "./build/NEW_AND.svg",
                inputs: 2,
                outputs: 1,
                logic_button: 0,
                state: 0
            }
            placingComponent = {
                id: nextGateID.toString(),
                type: 'and',
                inputs: [],
                state: 0,
            }
            isPlacing = true;
            nextGateID++;
            break;
        case "NAND":
            placingGate = { 
                id: nextGateID.toString(),
                position: new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top), 
                image: "./build/NEW_NAND.svg",
                inputs: 2,
                outputs: 1,
                logic_button: 0,
                state: 0
            }
            placingComponent = {
                id: nextGateID.toString(),
                type: 'nand',
                inputs: [],
                state: 0,
            }
            isPlacing = true;
            nextGateID++;
            break;
        case "0":
            placingGate = { 
                id: nextGateID.toString(),
                position: new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top), 
                image: "./build/AND_GATE.svg",
                inputs: 0,
                outputs: 1,
                logic_button: 0,
                state: 0
            }
            placingComponent = {
                id: nextGateID.toString(),
                type: 'controlled',
                inputs: [],
                state: 0,
            }
            isPlacing = true;
            nextGateID++;
            break;
        case "1":
            placingGate = { 
                id: nextGateID.toString(),
                position: new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top), 
                image: "./build/AND_GATE.svg",
                inputs: 0,
                outputs: 1,
                logic_button: 0,
                state: 0
            }
            placingComponent = {
                id: nextGateID.toString(),
                type: 'controlled',
                inputs: [],
                state: 1,
            }
            isPlacing = true;
            nextGateID++;
            break;
        case "Logic_Button":
            placingGate = { 
                id: nextGateID.toString(),
                position: new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top), 
                image: "./build/AND_GATE.svg",
                inputs: 0,
                outputs: 1,
                logic_button: 1,
                state: 0
            }
            placingComponent = {
                id: nextGateID.toString(),
                type: 'controlled',
                inputs: [],
                state: 0,
            }
            isPlacing = true;
            nextGateID++;
            break;
        case "Light":
            placingGate = { 
                id: nextGateID.toString(),
                position: new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top), 
                image: "./build/Light.svg",
                inputs: 1,
                outputs: 0,
                logic_button: 2,
                state: 0
            }
            placingComponent = {
                id: nextGateID.toString(),
                type: 'equal',
                inputs: [],
                state: 0,
            }
            isPlacing = true;
            nextGateID++;
            break;
        case "OR":
            placingGate = { 
                id: nextGateID.toString(),
                position: new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top), 
                image: "./build/OR_GATE.svg",
                inputs: 2,
                outputs: 1,
                logic_button: 0,
                state: 0
            }
            placingComponent = {
                id: nextGateID.toString(),
                type: 'or',
                inputs: [],
                state: 0,
            }
            isPlacing = true;
            nextGateID++;
            break;
        case "XOR":
            placingGate = { 
                id: nextGateID.toString(),
                position: new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top), 
                image: "./build/XOR_GATE.svg",
                inputs: 2,
                outputs: 1,
                logic_button: 0,
                state: 0
            }
            placingComponent = {
                id: nextGateID.toString(),
                type: 'xor',
                inputs: [],
                state: 0,
            }
            isPlacing = true;
            nextGateID++;
            break;
        case "NOT":
            placingGate = { 
                id: nextGateID.toString(),
                position: new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top), 
                image: "./build/NOT_GATE.svg",
                inputs: 1,
                outputs: 1,
                logic_button: 0,
                state: 0
            }
            placingComponent = {
                id: nextGateID.toString(),
                type: 'not',
                inputs: [],
                state: 0,
            }
            isPlacing = true;
            nextGateID++;
            break;
        case "NOR":
            placingGate = { 
                id: nextGateID.toString(),
                position: new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top), 
                image: "./build/NOR_GATE.svg",
                inputs: 2,
                outputs: 1,
                logic_button: 0,
                state: 0
            }
            placingComponent = {
                id: nextGateID.toString(),
                type: 'nor',
                inputs: [],
                state: 0,
            }
            isPlacing = true;
            nextGateID++;
            break;
        }
    }

    function getComponent(id) 
    {
        for (let i = 0; i < components.length; i++) { 
            if (components[i].id === id) {
                return components[i];
            }
        }
    }

    let isWire = false;
    let placingWire;
    let outputID;

    export function outputCallback(x_pos, y_pos, id) {
        console.log("Output callback");
        isWire = true;
        outputID = id;
        let internalState = getComponent(id).state;
        placingWire = {
            startPos: new Vector(x_pos, y_pos),
            endPos: new Vector(x_pos, y_pos),
            id: id,
            state: internalState //Should be 'x'?
        };
    }

    export function inputCallback(x_pos, y_pos, inWireIndex, id) {
        console.log("Input callback");
        if (isWire) {
            isWire = false;
            placingWire.endPos = new Vector(x_pos, y_pos);
            wires = [...wires, placingWire];
            //Connect components in the array
            for (let i = 0; i < components.length; i++) { 
                if (components[i].id === id) {
                    components[i].inputs.push(outputID);
                }
            }
        }
    }

    export function debugGates() {
        //Print info about all gates
        console.log("Gate debug:");
        console.log("Components Array: ");
        console.log(components);
    }

    export function simulatate() {
        //Idk does something lol
        const componentLookup = indexBy(components, 'id');
        //Run for 1 step
        for (let iteration = 0; iteration < 1; iteration++) {
            for (let i = 0; i < 5; i++) {
                evaluate(components, componentLookup);
            }
        }
        //Update wire states for rendering purpose (Inefficent temp code)
        for (let w = 0; w < wires.length; w++) { 
            for (let i = 0; i < components.length; i++) { 
                if (components[i].id === wires[w].id) {
                    wires[w].state = components[i].state;
                }
            }
        }
        //Update gate states for rendering purpose (Inefficent temp code)
        for (let w = 0; w < gates.length; w++) { 
            for (let i = 0; i < components.length; i++) { 
                if (components[i].id === gates[w].id) {
                    gates[w].state = components[i].state;
                }
            }
        }
    }

    function switchState(id) {
        console.log("Called");
        let comp = getComponent(id);
        if (comp.state)
            comp.state = 0;
        else
            comp.state = 1;
        //Rerun sim
        simulatate();
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
                        end_x_pos={wires[i].endPos.x} end_y_pos={wires[i].endPos.y} state={wires[i].state}
                    />
                {/each}
                {#if isWire}
                    <Wire start_x_pos={placingWire.startPos.x} start_y_pos={placingWire.startPos.y}
                        end_x_pos={placingWire.endPos.x} end_y_pos={placingWire.endPos.y} state={placingWire.state}
                    />
                {/if}
            </svg>
        </div>
        {#each gates as gate, i}
            {#if gates[i].logic_button === 1}
                <UserInput x_pos={gates[i].position.x} y_pos={gates[i].position.y} image={gates[i].image}
                    outputs={gates[i].outputs} id={gates[i].id} outputCallback={outputCallback} switchState={switchState}
                />
            {:else if gates[i].logic_button === 2}
                <Light x_pos={gates[i].position.x} y_pos={gates[i].position.y} image={gates[i].image}
                    outputs={gates[i].outputs} id={gates[i].id} inputCallback={inputCallback} state={gates[i].state}
                />
            {:else}
                <Gate x_pos={gates[i].position.x} y_pos={gates[i].position.y}
                    image={gates[i].image} inputs={gates[i].inputs} outputs={gates[i].outputs} id={gates[i].id}
                    outputCallback={outputCallback} inputCallback={inputCallback}
                />
            {/if}
        {/each}
        {#if isPlacing}
            {#if isPlacing.logic_button === 1}
                <UserInput x_pos={placingGate.position.x} y_pos={placingGate.position.y} image={placingGate.image}
                    outputs={placingGate.outputs} id={placingGate.id} switchState={switchState}
                />
            {:else if placingGate.logic_button === 2}
                <Light x_pos={placingGate.position.x} y_pos={placingGate.position.y} image={placingGate.image}
                    outputs={placingGate.outputs} id={placingGate.id} inputCallback={inputCallback}
                />
            {:else}
                <Gate x_pos={placingGate.position.x} y_pos={placingGate.position.y} image={placingGate.image}
                    inputs={placingGate.inputs} outputs={placingGate.outputs} id={placingGate.id}
                />
            {/if}
        {/if}
    </div>
</div>