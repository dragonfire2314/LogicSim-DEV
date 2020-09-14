<script>
	let x_pos = 200;
    let y_pos = 200;
    

    function movement(event) {
        x_pos = event.pageX;
        y_pos = event.pageY;

        //document.getElementById("moveME").style.left = x_pos + "px";
        //document.getElementById("moveME").style.top = y_pos + "px";
    }
</script>

<style>
	div {
        width: 32px;
        height: 32px;
        background-image: url(./ADN.svg);
        background-repeat: no-repeat;
        background-size: cover;
        position: absolute;
        top: 50px;
    }
</style>

<svelte:window on:mousemove={movement}/>

<div id="moveME"></div>