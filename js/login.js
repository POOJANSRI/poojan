// // js/login.js

// // --- SET YOUR ADMIN CREDENTIALS HERE ---
// const ADMIN_USER = "admin";
// const ADMIN_PASS = "acse2026"; 
// // ---------------------------------------

// const loginForm = document.getElementById("login-form");
// const errorMsg = document.getElementById("error-msg");

// loginForm.addEventListener("submit", function(event) {
//     event.preventDefault(); // Prevent page refresh

//     const userEntry = document.getElementById("username").value;
//     const passEntry = document.getElementById("password").value;

//     // Check if credentials match
//     if (userEntry === ADMIN_USER && passEntry === ADMIN_PASS) {
//         // Success! Set a "token" in localStorage to prove they are logged in
//         localStorage.setItem("acseAdminLoggedIn", "true");
        
//         // Redirect them to the actual admin dashboard
//         window.location.href = "admin.html";
//     } else {
//         // Fail! Show the error message
//         errorMsg.style.display = "block";
//         document.getElementById("password").value = ""; // Clear the password box
//     }
// }); 

const ADMIN_USER = "admin";
const ADMIN_PASS = "acse2026"; 

const loginForm = document.getElementById("login-form");
const errorMsg = document.getElementById("error-msg");

loginForm.addEventListener("submit", function(event) {
    event.preventDefault(); 

    const userEntry = document.getElementById("username").value;
    const passEntry = document.getElementById("password").value;

    if (userEntry === ADMIN_USER && passEntry === ADMIN_PASS) {
        localStorage.setItem("acseAdminLoggedIn", "true");
        window.location.href = "admin.html";
    } else {
        errorMsg.style.display = "block";
        document.getElementById("password").value = ""; 
    }
});