<script>
    import Gate from './gate.svelte';

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
        { position: new Vector(64,32),  image: "./build/AND_GATE.svg" },
        { position: new Vector(128,0), image: "./build/AND_GATE.svg" }
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

    function mouseDown(event) {
        //Placing a gate
        if (isPlacing) {
            //Add to list of gates
            gates = [...gates, placingGate];
            console.log(gates);
            isPlacing = false;
        }
        //Moving around the workspace
        isGrabbing = true;
        begGrabPos = new Vector(event.pageX, event.pageY);
    }
    function mouseUp(event) {
        //Moving around the workspace
        isGrabbing = false;
        endGrabPos = new Vector(event.pageX, event.pageY);

        begGrabPos.sub(endGrabPos);
        screenPos.sub(begGrabPos);

        document.getElementById("zoomLayer").style.left = screenPos.x + "px";
        document.getElementById("zoomLayer").style.top = screenPos.y + "px";
    }
    function mouseMove(event) {
        //Keep mouse position
        mousePosition = new Vector(event.pageX, event.pageY);
        //Move the gate being placed to the cursor when the mouse moves
        if (isPlacing) {
            //Look to grid movement
            let zoomLayerOffset = offset(zoomLayerDom);
            zoomLayerOffset.left *= (1/scale);
            zoomLayerOffset.top *= (1/scale);
            let gatePos = new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top);
            placingGate.position = new Vector(Math.round((gatePos.x / 32) - 0.5) * 32, Math.round((gatePos.y / 32) - 0.5) * 32);
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
                image: "./build/AND_GATE.svg"
            }
            isPlacing = true;
            break;
        case "NAND":
            break;
        }
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
        background-color: #d6d6d6;

        position: relative;

        transform: scale(1);
    }
    #zoomLayer {
        background-image: url(./grid.png);
        width: 2048px;
        height: 2048px;
    }
</style>

<svelte:window on:mousedown={mouseDown} on:mouseup={mouseUp} on:mousemove={mouseMove} on:keypress={keypressing}/>

<div class="workspace" bind:this={workspaceDom}>
    <div id="zoomLayer" bind:this={zoomLayerDom}>
        {#each gates as gate, i}
            <Gate x_pos={gates[i].position.x} y_pos={gates[i].position.y} image={gates[i].image}/>
        {/each}
        {#if isPlacing}
            <Gate x_pos={placingGate.position.x} y_pos={placingGate.position.y} image={placingGate.image}/>
        {/if}
    </div>
</div>