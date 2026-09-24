/* =========================================================
   CMS - PAGE GUARD
   FINAL AUTHENTICATION / AUTHORIZATION HARDENING

   PURPOSE
   ---------------------------------------------------------
   1. Protect CMS pages at URL level
   2. Verify the role from Supabase
   3. Redirect unauthorized users
   4. Hide coordinator-only sidebar items
   5. Adjust Cell Leader sidebar labels
   6. Keep existing module logic untouched

   IMPORTANT:
   Supabase/RLS remains the real backend security layer.
   This file only handles page/navigation protection.
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIGURATION
       ===================================================== */

    const PAGE_RULES = {

        /* -------------------------------------------------
           COORDINATOR ONLY
           ------------------------------------------------- */

        "cells.html": [
            "coordinator"
        ],

        "cell-leaders.html": [
            "coordinator"
        ],


        /* -------------------------------------------------
           SHARED
           ------------------------------------------------- */

        "dashboard.html": [
            "coordinator",
            "cell_leader"
        ],

        "members.html": [
            "coordinator",
            "cell_leader"
        ],

        "attendance.html": [
            "coordinator",
            "cell_leader"
        ],

        "weekly-reports.html": [
            "coordinator",
            "cell_leader"
        ],

        "follow-ups.html": [
            "coordinator",
            "cell_leader"
        ],

        "evangelism.html": [
            "coordinator",
            "cell_leader"
        ],

        "records.html": [
            "coordinator",
            "cell_leader"
        ],

        "visitors.html": [
            "coordinator",
            "cell_leader"
        ],

        "settings.html": [
            "coordinator"
        ]

    };


    /* =====================================================
       LOGIN / DEFAULT PAGES
       ===================================================== */

    const LOGIN_PAGE =
        "index.html";

    const DEFAULT_PAGE =
        "dashboard.html";


    /* =====================================================
       SUPABASE CLIENT
       ===================================================== */

    function getClient() {

        return (
            window.supabaseClient ||
            null
        );

    }


    /* =====================================================
       CURRENT PAGE
       ===================================================== */

    function getCurrentPage() {

        const path =
            window.location.pathname;


        const filename =
            path
                .split("/")
                .pop()
                .toLowerCase();


        return (
            filename ||
            "index.html"
        );

    }


    /* =====================================================
       REDIRECT
       ===================================================== */

    function redirectToLogin() {

        const current =
            getCurrentPage();


        if (
            current ===
            LOGIN_PAGE
        ) {

            return;

        }


        window.location.replace(
            LOGIN_PAGE
        );

    }


    function redirectToDashboard() {

        const current =
            getCurrentPage();


        if (
            current ===
            DEFAULT_PAGE
        ) {

            return;

        }


        window.location.replace(
            DEFAULT_PAGE
        );

    }


    /* =====================================================
       GET SESSION
       ===================================================== */

    async function getSession() {

        const client =
            getClient();


        if (!client) {

            throw new Error(
                "Supabase client unavailable."
            );

        }


        const {
            data,
            error
        } =
            await client.auth.getSession();


        if (error) {

            throw error;

        }


        return (
            data?.session ||
            null
        );

    }


    /* =====================================================
       GET ROLE FROM DATABASE
       ===================================================== */

    async function getRole() {

        const client =
            getClient();


        if (!client) {

            throw new Error(
                "Supabase client unavailable."
            );

        }


        const {
            data,
            error
        } =
            await client.rpc(
                "cms_my_role"
            );


        if (error) {

            throw error;

        }


        return String(
            data || ""
        )
            .trim()
            .toLowerCase();

    }


    /* =====================================================
       PAGE RULE
       ===================================================== */

    function getPageRule(
        page
    ) {

        return (
            PAGE_RULES[page] ||
            null
        );

    }


    /* =====================================================
       HIDE ELEMENT
       ===================================================== */

    function hideNavigationElement(
        element
    ) {

        if (!element) {

            return;

        }


        element.dataset.cmsHiddenByRole =
            "true";


        element.style.display =
            "none";

    }


    /* =====================================================
       SHOW ELEMENT
       ===================================================== */

    function showNavigationElement(
        element
    ) {

        if (!element) {

            return;

        }


        delete element.dataset
            .cmsHiddenByRole;


        element.style.removeProperty(
            "display"
        );

    }


    /* =====================================================
       FIND SIDEBAR LINKS
       ===================================================== */

    function getNavigationLinks() {

        return Array.from(
            document.querySelectorAll(
                ".sidebar-nav a[href]"
            )
        );

    }


    /* =====================================================
       COORDINATOR NAVIGATION
       ===================================================== */

    function applyCoordinatorNavigation() {

        const links =
            getNavigationLinks();


        links.forEach(
            link => {

                showNavigationElement(
                    link
                );


                const href =
                    String(
                        link.getAttribute(
                            "href"
                        ) || ""
                    )
                        .toLowerCase();


                /* -----------------------------------------
                   COORDINATOR LABELS
                   ----------------------------------------- */

                if (
                    href.includes(
                        "dashboard.html"
                    )
                ) {

                    link.textContent =
                        "Dashboard";

                }


                if (
                    href.includes(
                        "members.html"
                    )
                ) {

                    link.textContent =
                        "Members";

                }


                if (
                    href.includes(
                        "weekly-reports.html"
                    )
                ) {

                    link.textContent =
                        "Weekly Reports";

                }


                if (
                    href.includes(
                        "records.html"
                    )
                ) {

                    link.textContent =
                        "Records";

                }

            }
        );


        console.log(
            "CMS Page Guard: Coordinator sidebar applied."
        );

    }


    /* =====================================================
       CELL LEADER NAVIGATION
       ===================================================== */

    function applyCellLeaderNavigation() {

        const links =
            getNavigationLinks();


        links.forEach(
            link => {

                const href =
                    String(
                        link.getAttribute(
                            "href"
                        ) || ""
                    )
                        .toLowerCase();


                /* -----------------------------------------
                   HIDE COORDINATOR-ONLY
                   ----------------------------------------- */

                if (
                    href.includes(
                        "cells.html"
                    )
                    ||
                    href.includes(
                        "cell-leaders.html"
                    )
                    ||
                    href.includes(
                        "settings.html"
                    )
                ) {

                    hideNavigationElement(
                        link
                    );


                    return;

                }


                /* -----------------------------------------
                   CELL LEADER LABELS
                   ----------------------------------------- */

                if (
                    href.includes(
                        "dashboard.html"
                    )
                ) {

                    link.textContent =
                        "My Dashboard";

                }


                else if (
                    href.includes(
                        "members.html"
                    )
                ) {

                    link.textContent =
                        "My Members";

                }


                else if (
                    href.includes(
                        "weekly-reports.html"
                    )
                ) {

                    link.textContent =
                        "Weekly Report";

                }


                else if (
                    href.includes(
                        "records.html"
                    )
                ) {

                    link.textContent =
                        "My Records";

                }


                else if (
                    href.includes(
                        "attendance.html"
                    )
                ) {

                    link.textContent =
                        "Attendance";

                }


                else if (
                    href.includes(
                        "follow-ups.html"
                    )
                ) {

                    link.textContent =
                        "Follow-ups";

                }


                else if (
                    href.includes(
                        "evangelism.html"
                    )
                ) {

                    link.textContent =
                        "Evangelism";

                }


                else if (
                    href.includes(
                        "visitors.html"
                    )
                ) {

                    link.textContent =
                        "Visitors";

                }

            }
        );


        /* -------------------------------------------------
           ALSO HIDE ANY ELEMENT EXPLICITLY MARKED
           COORDINATOR-ONLY
           ------------------------------------------------- */

        document
            .querySelectorAll(
                "[data-coordinator-only='true']"
            )
            .forEach(
                element => {

                    const href =
                        String(
                            element.getAttribute(
                                "href"
                            ) || ""
                        )
                            .toLowerCase();


                    const isCoordinatorOnlyPage =
                        href.includes(
                            "cells.html"
                        )
                        ||
                        href.includes(
                            "cell-leaders.html"
                        )
                        ||
                        href.includes(
                            "settings.html"
                        );


                    if (
                        isCoordinatorOnlyPage
                    ) {

                        hideNavigationElement(
                            element
                        );

                    }

                    else {

                        element.removeAttribute(
                            "data-coordinator-only"
                        );

                        showNavigationElement(
                            element
                        );

                    }

                }
            );


        console.log(
            "CMS Page Guard: Cell Leader sidebar applied."
        );

    }


    /* =====================================================
       APPLY SIDEBAR BY ROLE
       ===================================================== */

    function applyRoleNavigation(
        role
    ) {

        if (
            role ===
            "coordinator"
        ) {

            applyCoordinatorNavigation();

            return;

        }


        if (
            role ===
            "cell_leader"
        ) {

            applyCellLeaderNavigation();

            return;

        }

    }


    /* =====================================================
       GET MY CELL
       Used only for Cell Leader display
       ===================================================== */

    async function loadMyCellForNavigation() {

        const client =
            getClient();


        if (!client) {

            return null;

        }


        try {

            const {
                data,
                error
            } =
                await client.rpc(
                    "cms_my_cells"
                );


            if (error) {

                console.warn(
                    "CMS Page Guard: My Cell loading warning:",
                    error
                );


                return null;

            }


            if (
                !Array.isArray(data) ||
                !data.length
            ) {

                return null;

            }


            return data[0];

        }

        catch (error) {

            console.warn(
                "CMS Page Guard: My Cell loading failed:",
                error
            );


            return null;

        }

    }


    /* =====================================================
       CELL LEADER TOP-LEVEL DISPLAY
       ===================================================== */

    async function applyCellLeaderCellInformation() {

        const myCell =
            await loadMyCellForNavigation();


        if (!myCell) {

            return;

        }


        const cellName =
            myCell.cell_name ||
            "My Cell";


        /* -------------------------------------------------
           STORE FOR OTHER CMS MODULES
           ------------------------------------------------- */

        window.cmsCurrentCell =
            myCell;


        window.cmsCurrentRole =
            "cell_leader";


        sessionStorage.setItem(
            "cmsCellId",
            myCell.cell_id ||
            ""
        );


        sessionStorage.setItem(
            "cmsCellName",
            cellName
        );


        /* -------------------------------------------------
           OPTIONAL CELL NAME ELEMENTS
           ------------------------------------------------- */

        const possibleElements = [

            "#currentCellDisplay",

            "#myCellName",

            ".current-cell-name",

            "[data-cms-current-cell]"

        ];


        possibleElements.forEach(
            selector => {

                document
                    .querySelectorAll(
                        selector
                    )
                    .forEach(
                        element => {

                            element.textContent =
                                cellName;

                        }
                    );

            }
        );

    }


    /* =====================================================
       VERIFY SESSION
       ===================================================== */

    async function enforcePageAccess() {

        const page =
            getCurrentPage();


        /* -------------------------------------------------
           LOGIN PAGE
           ------------------------------------------------- */

        if (
            page ===
            LOGIN_PAGE
        ) {

            return;

        }


        /* -------------------------------------------------
           PAGE NOT LISTED
           ------------------------------------------------- */

        const allowedRoles =
            getPageRule(
                page
            );


        if (!allowedRoles) {

            return;

        }


        /* -------------------------------------------------
           SESSION
           ------------------------------------------------- */

        let session = null;


        try {

            session =
                await getSession();

        }

        catch (error) {

            console.error(
                "CMS Page Guard: session check failed:",
                error
            );


            redirectToLogin();

            return;

        }


        if (!session?.user) {

            console.warn(
                "CMS Page Guard: no authenticated session."
            );


            redirectToLogin();

            return;

        }


        /* -------------------------------------------------
           DATABASE ROLE
           ------------------------------------------------- */

        let role = "";


        try {

            role =
                await getRole();

        }

        catch (error) {

            console.error(
                "CMS Page Guard: role check failed:",
                error
            );


            redirectToLogin();

            return;

        }


        /* -------------------------------------------------
           VALID ROLE
           ------------------------------------------------- */

        if (
            role !==
            "coordinator"
            &&
            role !==
            "cell_leader"
        ) {

            console.warn(
                "CMS Page Guard: invalid CMS role."
            );


            try {

                await getClient()
                    .auth
                    .signOut();

            }

            catch (error) {

                console.warn(
                    "CMS Page Guard: sign-out warning:",
                    error
                );

            }


            redirectToLogin();

            return;

        }


        /* -------------------------------------------------
           PAGE ACCESS
           ------------------------------------------------- */

        if (
            !allowedRoles.includes(
                role
            )
        ) {

            console.warn(
                "CMS Page Guard: unauthorized page access.",
                {
                    page,
                    role
                }
            );


            redirectToDashboard();

            return;

        }


        /* -------------------------------------------------
           VERIFIED SESSION INFO
           ------------------------------------------------- */

        sessionStorage.setItem(
            "cmsRole",
            role
        );


        sessionStorage.setItem(
            "cmsUserId",
            session.user.id
        );


        /* -------------------------------------------------
           ROLE-SPECIFIC SIDEBAR
           ------------------------------------------------- */

        applyRoleNavigation(
            role
        );


        /* -------------------------------------------------
           CELL LEADER CELL INFORMATION
           ------------------------------------------------- */

        if (
            role ===
            "cell_leader"
        ) {

            await applyCellLeaderCellInformation();

        }


        console.log(
            "CMS Page Guard: access granted.",
            {
                page,
                role
            }
        );

    }


    /* =====================================================
       AUTH STATE LISTENER
       ===================================================== */

    function listenForAuthChanges() {

        const client =
            getClient();


        if (!client) {

            return;

        }


        client.auth.onAuthStateChange(
            function (
                event
            ) {

                console.log(
                    "CMS Page Guard auth event:",
                    event
                );


                if (
                    event ===
                    "SIGNED_OUT"
                ) {

                    redirectToLogin();

                }

            }
        );

    }


    /* =====================================================
       START
       ===================================================== */

    async function start() {

        await enforcePageAccess();

        listenForAuthChanges();

    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            start,
            {
                once: true
            }
        );

    }

    else {

        start();

    }


})();