<script>
    import { onMount } from 'svelte';

	onMount(async () => {
        //document.addEventListener('contextmenu', event => event.preventDefault());       
    });

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
        background-color: #c49270; /* Green */
        border: none;
        color: black;
        padding: 10px 28px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        border-radius: 10%;
        font-size: 22px;
        font-weight: 600;
    }

</style>

<div class="main">
    <div class="profile">
        <img class="picture" alt="Profile" src="build/prof_icon_fix.png">
        <p class="name">User Name</p>
    </div>
    <div class="logout">
        <button class="logout_button">Logout</button>
    </div>
</div>