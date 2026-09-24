document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("reset-password-form");
    const passwordInput = document.getElementById("new-password");
    const confirmInput = document.getElementById("confirm-password");
    const message = document.getElementById("reset-message");
    const submitButton = document.getElementById("reset-submit");

    if (!form || !passwordInput || !confirmInput || !message || !submitButton) {
        return;
    }

    function setMessage(text, isSuccess = false) {
        message.textContent = text;
        message.classList.toggle("success", isSuccess);
    }

    function parseRecoveryTokens() {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const queryParams = new URLSearchParams(window.location.search);

        const accessToken =
            hashParams.get("access_token") ||
            queryParams.get("access_token");

        const refreshToken =
            hashParams.get("refresh_token") ||
            queryParams.get("refresh_token");

        if (!accessToken || !refreshToken) {
            return null;
        }

        return {
            access_token: accessToken,
            refresh_token: refreshToken
        };
    }

    async function activateRecoverySession() {
        const client = window.supabaseClient;

        if (!client) {
            throw new Error("Supabase client unavailable.");
        }

        const tokens = parseRecoveryTokens();

        if (tokens) {
            const { error } = await client.auth.setSession(tokens);

            if (error) {
                throw error;
            }

            const cleanedUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanedUrl);
        } else {
            const { data } = await client.auth.getSession();

            if (!data?.session?.user) {
                throw new Error("This password reset link is invalid or expired.");
            }
        }
    }

    document.querySelectorAll(".password-toggle-input").forEach(toggle => {
        toggle.addEventListener("change", () => {
            const target = document.getElementById(toggle.dataset.passwordTarget);

            if (!target) {
                return;
            }

            target.type = toggle.checked ? "text" : "password";
        });
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;

        if (!password || !confirmPassword) {
            setMessage("Please enter and confirm your new password.");
            return;
        }

        if (password.length < 8) {
            setMessage("Password must contain at least 8 characters.");
            passwordInput.focus();
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            confirmInput.focus();
            return;
        }

        const client = window.supabaseClient;

        if (!client) {
            setMessage("System error: Supabase is not connected.");
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "UPDATING...";
        setMessage("");

        try {
            await activateRecoverySession();

            const { error } = await client.auth.updateUser({
                password
            });

            if (error) {
                throw error;
            }

            setMessage("Password updated successfully. Redirecting to login...", true);

            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500);
        } catch (error) {
            console.error("CMS password reset failed:", error);
            setMessage(error.message || "Unable to update password.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "UPDATE PASSWORD";
        }
    });

    setMessage("");
});
