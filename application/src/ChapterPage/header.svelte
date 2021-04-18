<script>
    import { onMount } from 'svelte';

	onMount(async () => {
        //document.addEventListener('contextmenu', event => event.preventDefault());    
    });

    export let userName;

</script>

<style>
    .main {
        width: 100%;
        height: 100px;
        background-color: #70c4bc;
        display: flex;
        justify-content: space-between;
    }
    .profile {
        margin-left: 6%;
        display: flex;
        /* align-content: center; */
    }
    .picture {
        margin: auto;
        margin-top: 12.5px;
        width: 75px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        flex-direction: column;
    }
    .name {
        padding-left: 20px;
        font-size: 18pt;
        font-weight: 500;
    }
    .logout {
        display: flex;
        margin-right: 6%;
    }
    .logout_button {
        margin: auto;
        background-color: #bd53b2;
        border: none;
        color: black;
        padding: 10px 28px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        border-radius: 10px;
        font-size: 22px;
        font-weight: 600;
        transition: 0.3s;
    }
    .logout_button:hover {
        background-color: #ab2048;
    }

    form {
        padding: 10px 28px;
        margin: auto;
    }

</style>

<div class="main">
    <div class="profile">
        <img class="picture" alt="Profile" src="build/prof_icon_fix.png">
        <p class="name">{userName}</p>
    </div>
    <div class="logout">
        <form action="/logout">
            <button class="logout_button">Logout</button>
        </form>
    </div>
</div>