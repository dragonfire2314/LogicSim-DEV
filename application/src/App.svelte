<script>
	import LogicSim from './logicSim/logicSim.svelte';
	import Chapter from './ChapterPage/chapter.svelte'

	function appState(NewState, NewData, inProgress) {
		state = NewState;
		data = NewData;
		Progress = inProgress;
	}

	var state = 0;
	var data;
	var Progress = false;

</script>

<style>
	:global(body) {
		/* this will apply to <body> */
		padding: 0;
	}
</style>

{#if state === 0 }
	<Chapter applicationState={appState} externalData={data}></Chapter>
{:else}
	<LogicSim applicationState={appState} externalData={data} inProgress={Progress}></LogicSim>
{/if}