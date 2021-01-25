<script>
	import { onMount } from 'svelte';
	import LogicSim from './logicSim/logicSim.svelte';
	import Chapter from './ChapterPage/chapter.svelte'

	onMount(async () => {
        //document.addEventListener('contextmenu', event => event.preventDefault());       
	});
	
	/*
		Logic for the router
	*/

	
</script>

<style>
	:global(body) {
		/* this will apply to <body> */
		padding: 0;
	}
</style>


<!-- <Chapter></Chapter> -->
<LogicSim></LogicSim>