<script>
    import { onMount } from 'svelte';
    import Header from './header.svelte'
    import Tile from './tile.svelte'

	onMount(async () => {
        //document.addEventListener('contextmenu', event => event.preventDefault());       
	});
	
	let tiles = [
        { name: 'Chapter 1 - Basic Gates' },
        { name: 'Chapter 2 - Basic Circuits' },
    ];
</script>

<style>
    .main {
        width: 100%;
		height: 100%; 
        background-color: #1F2933;
    }
</style>

<div class="main">
    <Header></Header>
{#each tiles as tile, i}
        <Tile tileInfo={tile}></Tile>
    {/each}
</div>