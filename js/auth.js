/*
 * This LocalStorage login is intended only for
 * school demonstrations. It is not secure enough
 * for real authentication.
 */

/* Create sample data only on the first opening */
seedData();

/* =========================================================
   CHECK LOGIN SESSION
========================================================= */

function loggedIn() {
  const session = readStore(
    KEYS.session,
    null,
  );

  return Boolean(session?.loggedIn);
}

/* =========================================================
   DETECT LOGIN PAGE
========================================================= */

/*
 * Checking for the login form works on:
 *
 * - Live Server: /login.html
 * - Vercel: /login
 * - Vercel root rewrite: /
 */

const loginForm =
  document.getElementById("loginForm");

const onLoginPage =
  loginForm !== null;

/* =========================================================
   PAGE PROTECTION
========================================================= */

/* Already logged in: open the dashboard */
if (onLoginPage && loggedIn()) {
  window.location.replace(
    "index.html",
  );
}

/* Not logged in: return to the login page */
if (!onLoginPage && !loggedIn()) {
  window.location.replace(
    "login.html",
  );
}

/* =========================================================
   LOGIN FORM
========================================================= */

if (loginForm) {
  const usernameInput =
    document.getElementById("username");

  const passwordInput =
    document.getElementById("password");

  const rememberInput =
    document.getElementById("remember");

  const togglePasswordButton =
    document.getElementById(
      "togglePassword",
    );

  const loginError =
    document.getElementById("loginError");

  /* Show or hide password */
  togglePasswordButton.addEventListener(
    "click",
    () => {
      const passwordIsHidden =
        passwordInput.type === "password";

      passwordInput.type =
        passwordIsHidden
          ? "text"
          : "password";

      togglePasswordButton.innerHTML = `
        <i
          data-lucide="${
            passwordIsHidden
              ? "eye-off"
              : "eye"
          }"
        ></i>
      `;

      lucide.createIcons();
    },
  );

  /* Remove error when the user types again */
  usernameInput.addEventListener(
    "input",
    () => {
      loginError.textContent = "";
    },
  );

  passwordInput.addEventListener(
    "input",
    () => {
      loginError.textContent = "";
    },
  );

  /* Process login */
  loginForm.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      const settings = getSettings();

      const enteredUsername =
        usernameInput.value.trim();

      const enteredPassword =
        passwordInput.value;

      const correctCredentials =
        enteredUsername ===
          settings.username &&
        enteredPassword ===
          settings.password;

      if (!correctCredentials) {
        loginError.textContent =
          "Incorrect username or password.";

        passwordInput.focus();
        passwordInput.select();

        return;
      }

      const session = {
        loggedIn: true,
        remember:
          rememberInput.checked,
        loginAt:
          new Date().toISOString(),
      };

      const sessionSaved = saveStore(
        KEYS.session,
        session,
      );

      if (!sessionSaved) {
        loginError.textContent =
          "Unable to save the login session.";

        return;
      }

      window.location.replace(
        "index.html",
      );
    },
  );

  lucide.createIcons();
}

/* =========================================================
   SIGN OUT
========================================================= */

function signOut() {
  localStorage.removeItem(
    KEYS.session,
  );

  window.location.replace(
    "login.html",
  );
}