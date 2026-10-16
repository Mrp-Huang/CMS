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

        const stopButton =
            document.getElementById("cmsAIStopButton");

        const clearButton =
            document.getElementById("cmsAIClearButton");

        const form =
            document.getElementById("cmsAIForm");

        const status =
            document.getElementById("cmsAIStatus");

        const answer =
            document.getElementById("cmsAIAnswer");

        const emptyState =
            document.getElementById("cmsAIEmptyState");

        if (
            !supabase ||
            !questionInput ||
            !askButton ||
            !stopButton ||
            !clearButton ||
            !form ||
            !status ||
            !answer
        ) {
            return;
        }

        const emptyStateTemplate =
            emptyState?.cloneNode(true) || null;

        let conversationHistory = [];
        let requestSequence = 0;
        let activeController = null;
        let requestPending = false;
        let accessGranted = false;

        function appendInlineMarkdown(parent, value) {

            const tokenPattern =
                /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\n]+\*|_[^_\n]+_)/g;

            let lastIndex = 0;
            let match;

            while ((match = tokenPattern.exec(value)) !== null) {
                if (match.index > lastIndex) {
                    parent.append(
                        document.createTextNode(
                            value.slice(lastIndex, match.index)
                        )
                    );
                }

                const token = match[0];
                const content = token.slice(
                    token.startsWith("**") || token.startsWith("__") ||
                        token.startsWith("`")
                        ? 2
                        : 1,
                    token.startsWith("**") || token.startsWith("__")
                        ? -2
                        : -1
                );

                const element =
                    document.createElement(
                        token.startsWith("**") || token.startsWith("__")
                            ? "strong"
                            : token.startsWith("`")
                                ? "code"
                                : "em"
                    );

                element.textContent = content;
                parent.append(element);
                lastIndex = tokenPattern.lastIndex;
            }

            if (lastIndex < value.length) {
                parent.append(
                    document.createTextNode(value.slice(lastIndex))
                );
            }
        }

        function isTableSeparator(line) {
            const cells =
                line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|");

            return cells.length > 1 &&
                cells.every(cell => /^\s*:?-{3,}:?\s*$/.test(cell));
        }

        function tableCells(line) {
            return line
                .trim()
                .replace(/^\|/, "")
                .replace(/\|$/, "")
                .split("|")
                .map(cell => cell.trim().replace(/\\\|/g, "|"));
        }

        function isListLine(line) {
            return /^\s*(?:[-*+]|\d+[.)])\s+/.test(line);
        }

        function isBlockStart(lines, index) {
            const line = lines[index];

            return /^#{1,3}\s+/.test(line) ||
                /^\s*>\s?/.test(line) ||
                isListLine(line) ||
                (line.includes("|") &&
                    index + 1 < lines.length &&
                    isTableSeparator(lines[index + 1]));
        }

        function appendMarkdownTable(parent, lines, startIndex) {

            const wrapper =
                document.createElement("div");
            wrapper.className = "cms-ai-table-wrap";

            const table =
                document.createElement("table");
            table.className = "cms-ai-table";

            const headerCells =
                tableCells(lines[startIndex]);

            const header =
                document.createElement("thead");
            const headerRow =
                document.createElement("tr");

            headerCells.forEach(value => {
                const cell =
                    document.createElement("th");
                cell.scope = "col";
                appendInlineMarkdown(cell, value);
                headerRow.append(cell);
            });

            header.append(headerRow);
            table.append(header);

            const body =
                document.createElement("tbody");

            let index = startIndex + 2;

            while (index < lines.length && lines[index].includes("|")) {
                const values = tableCells(lines[index]);
                const row =
                    document.createElement("tr");

                headerCells.forEach((_, columnIndex) => {
                    const cell =
                        document.createElement("td");

                    appendInlineMarkdown(
                        cell,
                        values[columnIndex] || ""
                    );
                    row.append(cell);
                });

                body.append(row);
                index += 1;
            }

            table.append(body);
            wrapper.append(table);
            parent.append(wrapper);

            return index;
        }

        function renderAssistantMarkdown(body, markdown) {

            body.replaceChildren();

            const lines =
                markdown.replace(/\r\n?/g, "\n").split("\n");

            let index = 0;

            while (index < lines.length) {

                const line = lines[index];

                if (!line.trim()) {
                    index += 1;
                    continue;
                }

                if (
                    line.includes("|") &&
                    index + 1 < lines.length &&
                    isTableSeparator(lines[index + 1])
                ) {
                    index = appendMarkdownTable(body, lines, index);
                    continue;
                }

                const heading =
                    line.match(/^(#{1,3})\s+(.+)$/);

                if (heading) {
                    const element =
                        document.createElement(`h${heading[1].length + 1}`);
                    appendInlineMarkdown(element, heading[2]);
                    body.append(element);
                    index += 1;
                    continue;
                }

                if (/^\s*>\s?/.test(line)) {
                    const quote =
                        document.createElement("blockquote");

                    while (
                        index < lines.length &&
                        /^\s*>\s?/.test(lines[index])
                    ) {
                        const paragraph =
                            document.createElement("p");
                        appendInlineMarkdown(
                            paragraph,
                            lines[index].replace(/^\s*>\s?/, "")
                        );
                        quote.append(paragraph);
                        index += 1;
                    }

                    body.append(quote);
                    continue;
                }

                if (isListLine(line)) {
                    const ordered =
                        /^\s*\d+[.)]\s+/.test(line);
                    const list =
                        document.createElement(ordered ? "ol" : "ul");

                    while (
                        index < lines.length &&
                        isListLine(lines[index]) &&
                        /^\s*\d+[.)]\s+/.test(lines[index]) === ordered
                    ) {
                        const item =
                            document.createElement("li");
                        const content =
                            lines[index].replace(
                                /^\s*(?:[-*+]|\d+[.)])\s+/,
                                ""
                            );
                        appendInlineMarkdown(item, content);
                        list.append(item);
                        index += 1;
                    }

                    body.append(list);
                    continue;
                }

                const paragraph =
                    document.createElement("p");

                while (
                    index < lines.length &&
                    lines[index].trim() &&
                    !isBlockStart(lines, index)
                ) {
                    if (paragraph.childNodes.length) {
                        paragraph.append(
                            document.createElement("br")
                        );
                    }
                    appendInlineMarkdown(paragraph, lines[index]);
                    index += 1;
                }

                if (!paragraph.childNodes.length) {
                    appendInlineMarkdown(paragraph, lines[index]);
                    index += 1;
                }

                body.append(paragraph);
            }
        }

        function addMessage(role, text, isError = false) {

            if (role === "user") {
                answer
                    .querySelectorAll(".cms-ai-response-actions button")
                    .forEach(button => {
                        button.disabled = true;
                    });
            }

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
            if (role === "assistant" && !isError) {
                renderAssistantMarkdown(body, text);
            } else {
                body.textContent = text;
            }

            content.append(label, body);
            message.append(avatar, content);
            answer.append(message);
            answer.scrollTop =
                answer.scrollHeight;

            return {
                message,
                content,
                body
            };
        }

        function showAccessMessage(message) {

            answer.replaceChildren();
            addMessage("assistant", message, true);
        }

        function updateControls() {

            askButton.disabled =
                !accessGranted || requestPending;

            stopButton.hidden =
                !requestPending;

            clearButton.disabled =
                requestPending;

            document
                .querySelectorAll(".cms-ai-suggestion")
                .forEach((suggestion) => {
                    suggestion.disabled =
                        !accessGranted || requestPending;
                });
        }

        function removeResponseExtras(content) {

            content
                .querySelectorAll("[data-cms-ai-extras]")
                .forEach(element => element.remove());
        }

        function addResponseActions(content, actions) {

            const wrapper =
                document.createElement("div");

            wrapper.className =
                "cms-ai-response-actions";
            wrapper.dataset.cmsAiExtras = "true";

            actions.forEach(({ label, callback }) => {

                const button =
                    document.createElement("button");

                button.type = "button";
                button.className =
                    "cms-ai-tool-button";
                button.textContent = label;
                button.addEventListener("click", callback);
                wrapper.append(button);
            });

            content.append(wrapper);
        }

        function addSources(content, sources) {

            if (!Array.isArray(sources) || sources.length === 0) {
                return;
            }

            const details =
                document.createElement("details");

            details.className =
                "cms-ai-sources";
            details.dataset.cmsAiExtras = "true";

            const summary =
                document.createElement("summary");

            summary.textContent =
                `Data sources (${sources.length})`;

            const list =
                document.createElement("ul");

            sources.forEach(source => {

                if (!source || typeof source.label !== "string") {
                    return;
                }

                const item =
                    document.createElement("li");

                const loaded =
                    Number.isFinite(source.recordsLoaded)
                        ? source.recordsLoaded
                        : 0;

                const total =
                    Number.isFinite(source.recordsTotal)
                        ? ` of ${source.recordsTotal}`
                        : "";

                const dateRange =
                    source.dateRange &&
                    typeof source.dateRange.from === "string" &&
                    typeof source.dateRange.to === "string"
                        ? ` · ${source.dateRange.from} to ${source.dateRange.to}`
                        : "";

                item.textContent =
                    `${source.label}: ${loaded}${total} records${dateRange}`;

                if (source.truncated) {
                    item.classList.add("cms-ai-source-warning");
                    item.textContent +=
                        " (retrieval limit reached; some records may be missing)";
                }

                list.append(item);
            });

            if (!list.childElementCount) {
                return;
            }

            details.append(summary, list);
            content.append(details);
        }

        function showTyping(body) {

            body.replaceChildren();

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

            body.append(typing);
        }

        async function errorMessage(error) {

            if (error?.name === "AbortError") {
                return "Response stopped. You can retry this question.";
            }

            if (
                error?.context &&
                typeof error.context.clone === "function"
            ) {
                try {
                    const payload =
                        await error.context.clone().json();

                    if (
                        typeof payload?.error === "string" &&
                        payload.error.trim()
                    ) {
                        return payload.error;
                    }
                } catch (responseError) {
                    console.error(
                        "CMS AI error response:",
                        responseError
                    );
                }
            }

            return error?.message ||
                "Unable to contact CMS AI.";
        }

        async function requestAI(question, options = {}) {

            if (!accessGranted || requestPending) {
                return;
            }

            const baseHistory =
                options.baseHistory || conversationHistory.slice();

            const historyForRequest =
                baseHistory.slice(-8);

            const response =
                options.response || addMessage("assistant", "");

            if (options.showUserMessage !== false) {
                addMessage("user", question);
            }

            response.message.classList.remove("is-error");
            removeResponseExtras(response.content);
            showTyping(response.body);

            requestPending = true;
            const currentRequest =
                ++requestSequence;
            const controller =
                new AbortController();

            activeController = controller;
            updateControls();
            status.textContent =
                "Reviewing live CMS data...";

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
                                question,
                                history: historyForRequest
                            },
                            headers: {
                                Authorization:
                                    `Bearer ${accessToken}`
                            },
                            signal: controller.signal
                        }
                    );

                if (currentRequest !== requestSequence) {
                    return;
                }

                if (error) {
                    throw error;
                }

                if (!data || !data.success) {
                    throw new Error(
                        data?.error ||
                        "CMS AI did not return an answer."
                    );
                }

                const answerText =
                    typeof data.answer === "string" &&
                    data.answer.trim()
                        ? data.answer
                        : "No answer returned.";

                renderAssistantMarkdown(
                    response.body,
                    answerText
                );

                addSources(
                    response.content,
                    data.sources
                );

                const updatedHistory = [
                    ...baseHistory,
                    {
                        role: "user",
                        content: question
                    },
                    {
                        role: "assistant",
                        content: answerText
                    }
                ];

                conversationHistory =
                    updatedHistory;

                addResponseActions(
                    response.content,
                    [
                        {
                            label: "Copy",
                            callback: async () => {
                                try {
                                    await navigator.clipboard.writeText(
                                        answerText
                                    );
                                    status.textContent =
                                        "Response copied.";
                                } catch (error) {
                                    console.error(
                                        "CMS AI clipboard:",
                                        error
                                    );
                                    status.textContent =
                                        "Could not copy the response. Check browser clipboard permissions.";
                                }
                            }
                        },
                        {
                            label: "Regenerate",
                            callback: () => requestAI(
                                question,
                                {
                                    baseHistory,
                                    response,
                                    showUserMessage: false
                                }
                            )
                        }
                    ]
                );

                status.textContent =
                    "Response complete. Ask another question anytime.";

                if (questionInput.value.trim() === question) {
                    questionInput.value = "";
                }

            } catch (error) {

                if (currentRequest !== requestSequence) {
                    return;
                }

                const wasAborted =
                    controller.signal.aborted ||
                    error?.name === "AbortError";

                response.body.textContent =
                    wasAborted
                        ? "Response stopped. You can retry this question."
                        : await errorMessage(error);

                if (!wasAborted) {
                    response.message.classList.add("is-error");
                }

                addResponseActions(
                    response.content,
                    [
                        {
                            label: "Retry",
                            callback: () => requestAI(
                                question,
                                {
                                    baseHistory,
                                    response,
                                    showUserMessage: false
                                }
                            )
                        }
                    ]
                );

                status.textContent =
                    wasAborted
                        ? "Request stopped."
                        : "CMS AI could not complete that request.";

                if (!wasAborted) {
                    console.error("CMS AI request:", error);
                }

            } finally {

                if (currentRequest === requestSequence) {
                    requestPending = false;
                    activeController = null;
                    updateControls();
                }
            }
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
                questionInput.disabled = true;
                clearButton.disabled = true;
                updateControls();
                return;
            }

            accessGranted = true;
            updateControls();

        } catch (error) {

            console.error("CMS AI role check:", error);
            showAccessMessage(
                "Unable to verify Coordinator access."
            );
            questionInput.disabled = true;
            clearButton.disabled = true;
            updateControls();
            return;
        }

        form.addEventListener(
            "submit",
            function(event) {
                event.preventDefault();

                const question =
                    questionInput.value.trim();

                if (!question) {
                    status.textContent =
                        "Enter a question to get started.";
                    questionInput.focus();
                    return;
                }

                if (question.length > 1500) {
                    status.textContent =
                        "Please keep your question under 1,500 characters.";
                    questionInput.focus();
                    return;
                }

                requestAI(question);
            }
        );

        answer.addEventListener(
            "click",
            function(event) {

                const suggestion =
                    event.target.closest(".cms-ai-suggestion");

                if (!suggestion || requestPending) {
                    return;
                }

                questionInput.value =
                    suggestion.dataset.question || "";

                requestAI(questionInput.value.trim());
            }
        );

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

        stopButton.addEventListener(
            "click",
            function() {
                activeController?.abort();
            }
        );

        clearButton.addEventListener(
            "click",
            function() {

                requestSequence += 1;
                activeController?.abort();
                activeController = null;
                requestPending = false;
                conversationHistory = [];
                answer.replaceChildren();

                if (emptyStateTemplate) {
                    answer.append(
                        emptyStateTemplate.cloneNode(true)
                    );
                }

                questionInput.value = "";
                status.textContent =
                    "AI can make mistakes. Please verify important information.";
                updateControls();
                questionInput.focus();
            }
        );
    }
);
