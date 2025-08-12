import { logoutUser } from '../../private/userfuncts.js';   // Import log out function from functions.js
import { loginUser } from '../../private/userfuncts.js';    // Import log in function from functions.js
import { RegisterUser } from '../../private/userfuncts.js';    // Import registration function from functions.js

document.addEventListener("DOMContentLoaded", () => {
    const logoutLink = document.getElementById("logoutLink");
    if(logoutLink){
        logoutLink.addEventListener("click", (e) => {
            e.preventDefault(); // Prevents default link behavior
            logoutUser();       // Run logoutUser function when logout link is clicked
        });
    }

    const loginBtn = document.getElementById("login-submit-btn");
    if(loginBtn){
            loginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const username = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            loginUser(username, password);
        }); 
    }

    const registerUserBtn = document.getElementById("login-register-btn"); // Check that we're displaying the registration form
    if(registerUserBtn){
        registerUserBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const name = document.getElementById('RegisterName').value;
            const username = document.getElementById('RegisterEmail').value;
            const password = document.getElementById('RegisterPassword').value;
            const confirmPassword = document.getElementById('RegisterConfirmPassword').value;

            RegisterUser(name, username, password, confirmPassword);    // Call RegisterUser with fields from registration form
        });
    }
});
