import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		name: 'world'
	}
});

export default app;

/*
STRUCTURE
	-Chapter Page
		-Lesson Page
	
	-Simulator
	-Lesson

INFORMATION
	-Pages are accesses through my own routing system
	-This comunicates with the server via a restful API
	-When the simulator is loaded information 
*/