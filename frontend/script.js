/* =========================================================
   CMS - AUTHENTICATION SYSTEM
   ========================================================= */


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const loginForm =
        document.getElementById("login-form");

    const activationForm =
        document.getElementById("activation-form");

    if (!loginForm) {
        console.warn(
            "CMS Auth: login form not found."
        );
        return;
    }


    /* =====================================================
       LOGIN ELEMENTS
       ===================================================== */

    const emailInput =
        document.getElementById("email");

    const usernameInput =
        document.getElementById("username");

    const passwordInput =
        document.getElementById("password");

    const emailError =
        document.getElementById("email-error");

    const usernameError =
        document.getElementById("username-error");

    const passwordError =
        document.getElementById("password-error");

    const loginMessage =
        document.getElementById("login-message");


    const coordinatorFields =
        document.getElementById(
            "coordinator-login-fields"
        );

    const cellLeaderFields =
        document.getElementById(
            "cell-leader-login-fields"
        );


    /* =====================================================
       ACTIVATION ELEMENTS
       ===================================================== */

    const showActivation =
        document.getElementById(
            "show-activation"
        );

    const activationPanel =
        document.getElementById(
            "activation-panel"
        );

    const activationName =
        document.getElementById(
            "activation-name"
        );

    const activationCode =
        document.getElementById(
            "activation-code"
        );

    const newUsername =
        document.getElementById(
            "new-username"
        );

    const newPassword =
        document.getElementById(
            "new-password"
        );

    const confirmPassword =
        document.getElementById(
            "confirm-password"
        );

    const activationMessage =
        document.getElementById(
            "activation-message"
        );

    const activateButton =
        document.getElementById(
            "activate-button"
        );


    document.querySelectorAll(
        ".password-toggle-input"
    ).forEach(toggle => {

        toggle.addEventListener("change", () => {

            const target = document.getElementById(
                toggle.dataset.passwordTarget
            );

            if (!target) {
                return;
            }

            target.type = toggle.checked
                ? "text"
                : "password";
        });
    });


    /* =====================================================
       SUPABASE CLIENT
       ===================================================== */

    function getClient() {

        if (
            !window.supabaseClient
        ) {

            console.error(
                "CMS Auth: Supabase client unavailable."
            );

            return null;
        }

        return window.supabaseClient;
    }


    /* =====================================================
       ROLE SELECTION
       ===================================================== */

    const roleInputs =
        document.querySelectorAll(
            'input[name="login-role"]'
        );


    function getSelectedRole() {

        const selected =
            document.querySelector(
                'input[name="login-role"]:checked'
            );

        return selected
            ? selected.value
            : "coordinator";
    }


    function updateLoginFields() {

        const role =
            getSelectedRole();


        if (role === "cell_leader") {

            coordinatorFields.style.display =
                "none";

            cellLeaderFields.style.display =
                "block";

            emailInput.required = false;

            usernameInput.required = true;

        } else {

            coordinatorFields.style.display =
                "block";

            cellLeaderFields.style.display =
                "none";

            emailInput.required = true;

            usernameInput.required = false;

        }


        clearLoginErrors();

    }


    roleInputs.forEach(input => {

        input.addEventListener(
            "change",
            updateLoginFields
        );

    });


    updateLoginFields();


    /* =====================================================
       CLEAR LOGIN ERRORS
       ===================================================== */

    function clearLoginErrors() {

        if (emailError) {
            emailError.textContent = "";
        }

        if (usernameError) {
            usernameError.textContent = "";
        }

        if (passwordError) {
            passwordError.textContent = "";
        }

        if (loginMessage) {
            loginMessage.textContent = "";
            loginMessage.style.color = "";
        }

    }


    /* =====================================================
       LOGIN BUTTON STATE
       ===================================================== */

    function setLoginLoading(
        loading
    ) {

        const button =
            loginForm.querySelector(
                'button[type="submit"]'
            );

        if (!button) {
            return;
        }


        if (loading) {

            button.disabled = true;

            button.dataset.originalText =
                button.textContent;

            button.textContent =
                "LOGGING IN...";

        } else {

            button.disabled = false;

            button.textContent =
                button.dataset.originalText ||
                "LOGIN";

        }

    }


    /* =====================================================
       LOGIN MESSAGE
       ===================================================== */

    function showLoginMessage(
        message,
        color = "red"
    ) {

        loginMessage.textContent =
            message;

        loginMessage.style.color =
            color;

    }


    /* =====================================================
       COORDINATOR LOGIN
       ===================================================== */

    async function coordinatorLogin(
        client,
        email,
        password
    ) {

        console.log(
            "CMS Auth: Coordinator login..."
        );


        const {
            data,
            error
        } =
            await client.auth.signInWithPassword({

                email:
                    email,

                password:
                    password,

            });


        if (error) {

            throw new Error(
                error.message ||
                "Invalid email or password."
            );

        }


        if (!data?.user) {

            throw new Error(
                "Coordinator authentication failed."
            );

        }


        const {
            data: profileData,
            error: profileError
        } =
            await client.rpc(
                "cms_my_profile"
            );


        if (profileError) {

            await client.auth.signOut();

            throw new Error(
                "Unable to load your CMS profile."
            );

        }


        if (
            !profileData ||
            !profileData.length
        ) {

            await client.auth.signOut();

            throw new Error(
                "Your account is not registered in CMS."
            );

        }


        const profile =
            profileData[0];


        if (profile.active === false) {

            await client.auth.signOut();

            throw new Error(
                "Your CMS account is inactive."
            );

        }


        if (
            profile.role !==
            "coordinator"
        ) {

            await client.auth.signOut();

            throw new Error(
                "This account is not a Coordinator account."
            );

        }


        sessionStorage.setItem(
            "cmsRole",
            "coordinator"
        );

        sessionStorage.setItem(
            "cmsUserId",
            data.user.id
        );

        sessionStorage.setItem(
            "cmsUserName",
            profile.full_name || ""
        );


        return profile;

    }


    /* =====================================================
       CELL LEADER LOGIN
       ===================================================== */

    async function cellLeaderLogin(
        client,
        username,
        password
    ) {

        console.log(
            "CMS Auth: Cell Leader login..."
        );


        const {
            data,
            error
        } =
            await client.functions.invoke(
                "cms-cell-leader-login",
                {
                    body: {
                        username:
                            username,

                        password:
                            password,
                    },
                }
            );


        if (error) {

            console.error(
                "Cell Leader login function error:",
                error
            );

            throw new Error(
                "Unable to complete Cell Leader login."
            );

        }


        if (
            !data ||
            !data.success ||
            !data.session ||
            !data.user
        ) {

            throw new Error(
                data?.error ||
                "Invalid username or password."
            );

        }


        /* -------------------------------------------------
           VERY IMPORTANT

           Put the session returned by the secure
           Edge Function into the browser's Supabase
           client.

           This makes auth.uid() available to all later
           CMS modules and RLS policies.
           ------------------------------------------------- */

        const {
            error: sessionError
        } =
            await client.auth.setSession({

                access_token:
                    data.session.access_token,

                refresh_token:
                    data.session.refresh_token,

            });


        if (sessionError) {

            console.error(
                "Unable to establish browser session:",
                sessionError
            );

            throw new Error(
                "Login succeeded, but the CMS session could not be established."
            );

        }


        /* -------------------------------------------------
           STORE CMS SESSION INFO
           ------------------------------------------------- */

        sessionStorage.setItem(
            "cmsRole",
            "cell_leader"
        );

        sessionStorage.setItem(
            "cmsUserId",
            data.user.id
        );

        sessionStorage.setItem(
            "cmsUserName",
            data.user.full_name || ""
        );

        sessionStorage.setItem(
            "cmsUsername",
            data.user.username || username
        );

        sessionStorage.setItem(
            "cmsCellId",
            data.user.cell_id
        );


        /* -------------------------------------------------
           GET ASSIGNED CELL
           ------------------------------------------------- */

        const {
            data: assignedCells,
            error: cellsError
        } =
            await client.rpc(
                "cms_my_cells"
            );


        if (
            cellsError ||
            !assignedCells ||
            !assignedCells.length
        ) {

            await client.auth.signOut();

            throw new Error(
                "Your account has no active cell assignment."
            );

        }


        const assignedCell =
            assignedCells[0];


        sessionStorage.setItem(
            "cmsCellId",
            assignedCell.cell_id
        );

        sessionStorage.setItem(
            "cmsCellName",
            assignedCell.cell_name || ""
        );


        console.log(
            "Assigned Cell:",
            assignedCell
        );


        return data.user;

    }


    /* =====================================================
       MAIN LOGIN
       ===================================================== */

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            clearLoginErrors();


            const role =
                getSelectedRole();


            const email =
                emailInput.value.trim();


            const username =
                usernameInput.value
                    .trim()
                    .toLowerCase();


            const password =
                passwordInput.value;


            /* -------------------------------------------------
               VALIDATION
               ------------------------------------------------- */

            if (
                role ===
                "coordinator" &&
                !email
            ) {

                emailError.textContent =
                    "Please enter your email address.";

                emailInput.focus();

                return;

            }


            if (
                role ===
                "cell_leader" &&
                !username
            ) {

                usernameError.textContent =
                    "Please enter your username.";

                usernameInput.focus();

                return;

            }


            if (!password) {

                passwordError.textContent =
                    "Please enter your password.";

                passwordInput.focus();

                return;

            }


            const client =
                getClient();


            if (!client) {

                showLoginMessage(
                    "System error: Supabase is not connected."
                );

                return;

            }


            setLoginLoading(true);


            try {

                if (
                    role ===
                    "coordinator"
                ) {

                    await coordinatorLogin(
                        client,
                        email,
                        password
                    );

                } else {

                    await cellLeaderLogin(
                        client,
                        username,
                        password
                    );

                }


                showLoginMessage(
                    "Login successful! Opening CMS...",
                    "green"
                );


                console.log(
                    "CMS AUTH SUCCESS:",
                    role
                );


                setTimeout(
                    () => {

                        window.location.href =
                            "dashboard.html";

                    },
                    500
                );


            } catch (error) {

                console.error(
                    "CMS LOGIN ERROR:",
                    error
                );


                showLoginMessage(
                    error.message ||
                    "Unable to complete login."
                );


            } finally {

                setLoginLoading(false);

            }

        }
    );


    /* =====================================================
       SHOW / HIDE ACTIVATION
       ===================================================== */

    if (showActivation) {

        showActivation.addEventListener(
            "click",
            event => {

                event.preventDefault();


                const visible =
                    activationPanel.style.display !==
                    "none";


                activationPanel.style.display =
                    visible
                        ? "none"
                        : "block";


                if (!visible) {

                    activationName.focus();

                }

            }
        );

    }


    /* =====================================================
       CELL LEADER ACCOUNT ACTIVATION
       ===================================================== */

    if (activationForm) {

        activationForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                activationMessage.textContent =
                    "";

                activationMessage.style.color =
                    "";


                const fullName =
                    activationName.value.trim();


                const code =
                    activationCode.value
                        .trim()
                        .toUpperCase();


                const username =
                    newUsername.value
                        .trim()
                        .toLowerCase();


                const password =
                    newPassword.value;


                const confirm =
                    confirmPassword.value;


                /* ---------------------------------------------
                   VALIDATION
                   --------------------------------------------- */

                if (!fullName) {

                    activationMessage.textContent =
                        "Please enter your registered full name.";

                    return;

                }


                if (!code) {

                    activationMessage.textContent =
                        "Please enter your activation code.";

                    return;

                }


                if (!username) {

                    activationMessage.textContent =
                        "Please choose a username.";

                    return;

                }


                if (password.length < 8) {

                    activationMessage.textContent =
                        "Password must contain at least 8 characters.";

                    return;

                }


                if (password !== confirm) {

                    activationMessage.textContent =
                        "Passwords do not match.";

                    return;

                }


                const client =
                    getClient();


                if (!client) {

                    activationMessage.textContent =
                        "System error: Supabase is not connected.";

                    return;

                }


                activateButton.disabled =
                    true;

                activateButton.textContent =
                    "ACTIVATING...";


                try {

                    console.log(
                        "CMS: Cell Leader activation started."
                    );


                    const {
                        data,
                        error
                    } =
                        await client.functions.invoke(
                            "cms-cell-leader-activate",
                            {

                                body: {

                                    full_name:
                                        fullName,

                                    activation_code:
                                        code,

                                    username:
                                        username,

                                    password:
                                        password,

                                },

                            }
                        );


if (error) {

    console.error(
        "CMS ACTIVATION FUNCTION ERROR:",
        error
    );

    console.error(
        "Activation response data:",
        data
    );


    let detailedMessage =
        "Activation service error.";


    if (
        error.context &&
        typeof error.context.json === "function"
    ) {

        try {

            const errorBody =
                await error.context.json();

            console.error(
                "Activation Edge Function response:",
                errorBody
            );


            detailedMessage =
                errorBody?.error ||
                errorBody?.message ||
                detailedMessage;

        }

        catch (
            parseError
        ) {

            console.error(
                "Could not read Edge Function error:",
                parseError
            );

        }

    }


    if (
        error.message
    ) {

        detailedMessage =
            detailedMessage ===
                "Activation service error."

                ? error.message

                : detailedMessage;

    }


    throw new Error(
        detailedMessage
    );

}


                    if (
                        !data ||
                        !data.success
                    ) {

                        throw new Error(
                            data?.error ||
                            "Account activation failed."
                        );

                    }


                    console.log(
                        "CMS: Cell Leader activation successful.",
                        data
                    );


                    activationMessage.textContent =
                        "Account activated successfully! You can now log in.";

                    activationMessage.style.color =
                        "green";


                    /*
                     * Automatically switch to
                     * Cell Leader login.
                     */

                    const cellLeaderRadio =
                        document.querySelector(
                            'input[name="login-role"][value="cell_leader"]'
                        );


                    if (cellLeaderRadio) {

                        cellLeaderRadio.checked =
                            true;

                        updateLoginFields();

                    }


                    usernameInput.value =
                        username;


                    passwordInput.value =
                        "";


                    /*
                     * Close activation panel after
                     * a short delay.
                     */

                    setTimeout(
                        () => {

                            activationPanel.style.display =
                                "none";

                        },
                        1500
                    );


                } catch (error) {

                    console.error(
                        "CMS ACTIVATION ERROR:",
                        error
                    );


                    activationMessage.textContent =
                        error.message ||
                        "Unable to activate account.";

                    activationMessage.style.color =
                        "red";

                } finally {

                    activateButton.disabled =
                        false;

                    activateButton.textContent =
                        "ACTIVATE ACCOUNT";

                }

            }
        );

    }


    /* =====================================================
       FORGOT PASSWORD
       ===================================================== */

    const forgotPassword =
        document.getElementById(
            "forgot-password"
        );


    if (forgotPassword) {

        forgotPassword.addEventListener(
            "click",
            async event => {

                event.preventDefault();


                if (
                    getSelectedRole() !==
                    "coordinator"
                ) {

                    showLoginMessage(
                        "Cell Leader password recovery will be handled from the Cell Leader account settings."
                    );

                    return;

                }


                const email =
                    emailInput.value.trim();


                if (!email) {

                    emailError.textContent =
                        "Enter your Coordinator email first.";

                    emailInput.focus();

                    return;

                }


                const client =
                    getClient();


                if (!client) {

                    showLoginMessage(
                        "System error: Supabase is not connected."
                    );

                    return;

                }


                try {

                    forgotPassword.textContent =
                        "Sending reset link...";

                    forgotPassword.style.pointerEvents =
                        "none";


                    const resetUrl =
                        new URL(
                            "reset-password.html",
                            window.location.href
                        ).toString();


                    const {
                        error
                    } =
                        await client.auth
                            .resetPasswordForEmail(
                                email,
                                {
                                    redirectTo:
                                        resetUrl,
                                }
                            );


                    if (error) {

                        throw error;

                    }


                    showLoginMessage(
                        "Password reset instructions have been sent to your email.",
                        "green"
                    );


                } catch (error) {

                    showLoginMessage(
                        error.message ||
                        "Unable to send password reset email."
                    );


                } finally {

                    forgotPassword.textContent =
                        "Forgot password?";

                    forgotPassword.style.pointerEvents =
                        "";

                }

            }
        );

    }


    /* =====================================================
       EXISTING SESSION
       ===================================================== */

    (async () => {

        const client =
            getClient();


        if (!client) {
            return;
        }


        try {

            const {
                data
            } =
                await client.auth.getSession();


            if (
                data?.session?.user
            ) {

                console.log(
                    "CMS Auth: existing session detected.",
                    data.session.user.id
                );

            }

        } catch (error) {

            console.warn(
                "CMS Auth session check failed:",
                error
            );

        }

    })();

});