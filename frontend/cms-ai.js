/* =====================================================
   CMS AI ASSISTANT
   Coordinator-only
   ===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        const supabase =
            window.supabaseClient;

        const questionInput =
            document.getElementById("cmsAIQuestion");

        const askButton =
            document.getElementById("cmsAIAskButton");

        const form =
            document.getElementById("cmsAIForm");

        const status =
            document.getElementById("cmsAIStatus");

        const answer =
            document.getElementById("cmsAIAnswer");

        if (
            !supabase ||
            !questionInput ||
            !askButton ||
            !form ||
            !status ||
            !answer
        ) {
            return;
        }

        function addMessage(role, text, isError = false) {

            const message =
                document.createElement("article");

            message.className =
                `cms-ai-message cms-ai-message-${role}`;

            if (isError) {
                message.classList.add("is-error");
            }

            const avatar =
                document.createElement("div");

            avatar.className =
                "cms-ai-message-avatar";
            avatar.setAttribute("aria-hidden", "true");
            avatar.textContent =
                role === "user" ? "👤" : "🤖";

            const content =
                document.createElement("div");

            content.className =
                "cms-ai-message-content";

            const label =
                document.createElement("div");

            label.className =
                "cms-ai-message-label";
            label.textContent =
                role === "user" ? "You" : "CMS AI";

            const body =
                document.createElement("div");

            body.className =
                "cms-ai-message-body";
            body.textContent =
                text;

            content.append(label, body);
            message.append(avatar, content);
            answer.append(message);
            answer.scrollTop =
                answer.scrollHeight;

            return {
                message,
                body
            };
        }

        function showAccessMessage(message) {

            answer.replaceChildren();
            addMessage("assistant", message, true);
        }

        try {

            let role =
                null;

            if (
                window.CMSAccess &&
                typeof window.CMSAccess.initialize === "function"
            ) {
                const access =
                    await window.CMSAccess.initialize();

                role =
                    access?.role || null;
            }

            if (!role) {
                const { data } =
                    await supabase.rpc("cms_my_role");

                role =
                    data;
            }

            if (role !== "coordinator") {
                showAccessMessage(
                    "CMS AI is available to Coordinators only."
                );
                askButton.disabled = true;
                questionInput.disabled = true;
                document
                    .querySelectorAll(".cms-ai-suggestion")
                    .forEach((suggestion) => {
                        suggestion.disabled = true;
                    });
                return;
            }

        } catch (error) {

            console.error("CMS AI role check:", error);
            showAccessMessage(
                "Unable to verify Coordinator access."
            );
            askButton.disabled = true;
            questionInput.disabled = true;
            document
                .querySelectorAll(".cms-ai-suggestion")
                .forEach((suggestion) => {
                    suggestion.disabled = true;
                });
            return;
        }

        async function askAI(event) {

            if (event) {
                event.preventDefault();
            }

            if (askButton.disabled) {
                return;
            }

            const question =
                questionInput.value.trim();

            if (!question) {
                status.textContent =
                    "Enter a question to get started.";
                questionInput.focus();
                return;
            }

            askButton.disabled = true;
            questionInput.disabled = true;
            document
                .querySelectorAll(".cms-ai-suggestion")
                .forEach((suggestion) => {
                    suggestion.disabled = true;
                });

            const emptyState =
                document.getElementById("cmsAIEmptyState");

            if (emptyState) {
                emptyState.remove();
            }

            addMessage("user", question);

            const response =
                addMessage("assistant", "");

            const typing =
                document.createElement("span");

            typing.className =
                "cms-ai-typing";
            typing.setAttribute(
                "aria-label",
                "CMS AI is reviewing live CMS data"
            );

            for (let index = 0; index < 3; index += 1) {
                typing.append(document.createElement("span"));
            }

            response.body.append(typing);
            status.textContent =
                "Reviewing live CMS data...";

            let requestSucceeded =
                false;

            try {

                const {
                    data: sessionData,
                    error: sessionError
                } =
                    await supabase.auth.getSession();

                if (
                    sessionError ||
                    !sessionData?.session
                ) {
                    throw new Error(
                        "Your CMS session has expired. Please log in again."
                    );
                }

                const accessToken =
                    sessionData.session.access_token;

                const {
                    data,
                    error
                } =
                    await supabase.functions.invoke(
                        "cms-ai-assistant",
                        {
                            body: {
                                question
                            },
                            headers: {
                                Authorization:
                                    `Bearer ${accessToken}`
                            }
                        }
                    );

                if (error) {
                    throw error;
                }

                if (!data || !data.success) {
                    throw new Error(
                        data?.error ||
                        "CMS AI did not return an answer."
                    );
                }

                response.body.textContent =
                    data.answer || "No answer returned.";

                requestSucceeded =
                    true;

                status.textContent =
                    "Response complete. Ask another question anytime.";

            } catch (error) {

                console.error("CMS AI request:", error);

                response.body.textContent =
                    error?.message ||
                    "Unable to contact CMS AI.";

                response.message.classList.add("is-error");

                status.textContent =
                    "CMS AI could not complete that request.";

            } finally {

                askButton.disabled = false;
                questionInput.disabled = false;
                document
                    .querySelectorAll(".cms-ai-suggestion")
                    .forEach((suggestion) => {
                        suggestion.disabled = false;
                    });

                if (requestSucceeded) {
                    questionInput.value = "";
                }

                questionInput.focus();
            }
        }

        form.addEventListener("submit", askAI);

        document
            .querySelectorAll(".cms-ai-suggestion")
            .forEach(function(suggestion) {

                suggestion.addEventListener(
                    "click",
                    function() {

                        questionInput.value =
                            suggestion.dataset.question || "";

                        askAI();
                    }
                );
            });

        questionInput.addEventListener(
            "keydown",
            function(event) {

                if (
                    event.ctrlKey &&
                    event.key === "Enter"
                ) {
                    event.preventDefault();
                    form.requestSubmit();
                }
            }
        );
    }
);
