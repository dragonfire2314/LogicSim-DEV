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
        { realPosition: new Vector(0,0), screenPosition: new Vector(0,0) },
        { realPosition: new Vector(50,0), screenPosition: new Vector(50,0) }
    ];

    let scale = 1;
    let screenPos = new Vector(0, 0);
    let isGrabbing = false;
    let begGrabPos;
    let endGrabPos;

    function mouseDown(event) {
        //Moving around the workspace
        isGrabbing = true;
        begGrabPos = new Vector(event.pageX, event.pageY);
    }
    function mouseUp(event) {
        //Moving around the workspace
        isGrabbing = false;
        endGrabPos = new Vector(event.pageX, event.pageY);

        begGrabPos.sub(endGrabPos);
        begGrabPos.scale(1/scale); //Scale by the zoom factor
        screenPos.add(begGrabPos);

        for (var i = 0; i < gates.length; i++) {
            var temp = new Vector(gates[i].realPosition.x, gates[i].realPosition.y);
            temp.sub(screenPos);
            gates[i].screenPosition = temp;
        }
    }
    function mouseMove(event) {
        //Moving around the workspace
        if (isGrabbing) {
            endGrabPos = new Vector(event.pageX, event.pageY);

            var begGrabCopy = new Vector(begGrabPos.x, begGrabPos.y);

            begGrabCopy.sub(endGrabPos);
            begGrabCopy.scale(1/scale); //Scale by the zoom factor
            screenPos.add(begGrabCopy);

            begGrabPos = new Vector(endGrabPos.x, endGrabPos.y);

            for (var i = 0; i < gates.length; i++) {
                var temp = new Vector(gates[i].realPosition.x, gates[i].realPosition.y);
                temp.sub(screenPos);
                gates[i].screenPosition = temp;
            }
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
</script>

<style>
	
</style>

<svelte:window on:mousedown={mouseDown} on:mouseup={mouseUp} on:mousemove={mouseMove} on:keypress={keypressing}/>

<div id="zoomLayer">
    {#each gates as gate, i}
        <Gate x_pos={gates[i].screenPosition.x} y_pos={gates[i].screenPosition.y} image={"./build/ADN.svg"}/>
    {/each}
</div>