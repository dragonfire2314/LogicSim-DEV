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
    };

    let gates = [
        { realPosition: new Vector(0,0), screenPosition: new Vector(0,0) },
        { realPosition: new Vector(50,0), screenPosition: new Vector(0,0) }
    ];

    let screenPos = new Vector(0, 0);
    let isGrabbing = false;
    let begGrabPos;
    let endGrabPos

    function mouseDown(event) {
        isGrabbing = true;
        begGrabPos = new Vector(event.pageX, event.pageY);
    }
    function mouseUp(event) {
        isGrabbing = false;
        endGrabPos = new Vector(event.pageX, event.pageY);

        begGrabPos.sub(endGrabPos);
        screenPos.add(begGrabPos);

        for (var i = 0; i < gates.length; i++) {
            var temp = new Vector(screenPos.x, screenPos.y);
            temp.sub(gates[i].realPosition);
            gates[i].screenPosition = temp;
        }
    }
    function mouseMove(event) {
        if (isGrabbing) {
            
        }
    }
</script>

<style>
	
</style>

<svelte:window on:mousedown={mouseDown} on:mouseup={mouseUp} on:mousemove={mouseMove}/>

{#each gates as gate, i}
    <Gate x_pos={gate.screenPosition.x} y_pos={gate.screenPosition.y} image={"./build/ADN.svg"}/>
{/each}