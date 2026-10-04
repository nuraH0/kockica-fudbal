const KORISNICKO_IME = "adoramic";
const SIFRA = "adisara";

const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");

loginForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value;

    if (
        username === KORISNICKO_IME &&
        password === SIFRA
    ) {

        sessionStorage.setItem(
            "adminLoggedIn",
            "true"
        );

        window.location.href = "admin.html";

    } else {

        loginError.style.display = "block";

    }

});