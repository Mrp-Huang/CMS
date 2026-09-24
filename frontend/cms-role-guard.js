/* =========================================================
   CMS - ROLE GUARD
   FINAL HARDENED VERSION

   PURPOSE
   ---------------------------------------------------------
   - Detect current CMS role from Supabase
   - Store role/session information
   - Prepare Coordinator / Cell Leader workspace
   - Never trust sessionStorage alone
   - Supabase RPC remains the source of truth
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       STATE
       ===================================================== */

    window.CMSRoleGuard = {

        role: null,

        userId: null,

        cellId: null,

        cellName: null,

        initialized: false

    };


    /* =====================================================
       SUPABASE
       ===================================================== */

    function getClient() {

        return (
            window.supabaseClient ||
            null
        );

    }


    /* =====================================================
       GET CURRENT SESSION
       ===================================================== */

    async function getCurrentSession() {

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
       GET ROLE
       ===================================================== */

    async function getCMSRole() {

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
       GET MY CELL
       ===================================================== */

    async function getMyCell() {

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
                "cms_my_cells"
            );


        if (error) {

            throw error;

        }


        if (
            !Array.isArray(data) ||
            !data.length
        ) {

            return null;

        }


        return data[0];

    }


    /* =====================================================
       APPLY COORDINATOR
       ===================================================== */

    function applyCellLeaderSidebar() {

        document
            .querySelectorAll(
                ".sidebar-nav a[href]"
            )
            .forEach(
                function (link) {

                    const href =
                        String(
                            link.getAttribute(
                                "href"
                            ) ||
                            ""
                        )
                            .toLowerCase();


                    if (
                        href.includes(
                            "cells.html"
                        ) ||
                        href.includes(
                            "cell-leaders.html"
                        ) ||
                        href.includes(
                            "settings.html"
                        )
                    ) {

                        link.style.display =
                            "none";


                        return;

                    }


                    link.style.display =
                        "";


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
                            "records.html"
                        )
                    ) {

                        link.textContent =
                            "My Records";

                    }

                    else if (
                        href.includes(
                            "weekly-reports.html"
                        )
                    ) {

                        link.textContent =
                            "Weekly Report";

                    }

                }
            );

    }

    function applyCoordinator(
        session
    ) {

        window.CMSRoleGuard.role =
            "coordinator";


        window.CMSRoleGuard.userId =
            session?.user?.id ||
            null;


        window.CMSRoleGuard.cellId =
            null;


        window.CMSRoleGuard.cellName =
            null;


        window.CMSRoleGuard.initialized =
            true;


        document.body.classList.add(
            "cms-coordinator-mode"
        );


        document.body.classList.remove(
            "cms-cell-leader-mode"
        );


        sessionStorage.setItem(
            "cmsRole",
            "coordinator"
        );


        if (
            session?.user?.id
        ) {

            sessionStorage.setItem(
                "cmsUserId",
                session.user.id
            );

        }


        window.cmsCurrentRole =
            "coordinator";


        window.cmsCurrentCell =
            null;


        console.log(
            "CMS Role Guard: Coordinator workspace."
        );

    }


    /* =====================================================
       APPLY CELL LEADER
       ===================================================== */

    async function applyCellLeader(
        session
    ) {

        const myCell =
            await getMyCell();


        if (!myCell) {

            throw new Error(
                "Cell Leader has no active cell assignment."
            );

        }


        window.CMSRoleGuard.role =
            "cell_leader";


        window.CMSRoleGuard.userId =
            session?.user?.id ||
            null;


        window.CMSRoleGuard.cellId =
            myCell.cell_id ||
            null;


        window.CMSRoleGuard.cellName =
            myCell.cell_name ||
            "";


        window.CMSRoleGuard.initialized =
            true;


        document.body.classList.add(
            "cms-cell-leader-mode"
        );


        document.body.classList.remove(
            "cms-coordinator-mode"
        );


        sessionStorage.setItem(
            "cmsRole",
            "cell_leader"
        );


        sessionStorage.setItem(
            "cmsUserId",
            session?.user?.id ||
            ""
        );


        sessionStorage.setItem(
            "cmsCellId",
            myCell.cell_id ||
            ""
        );


        sessionStorage.setItem(
            "cmsCellName",
            myCell.cell_name ||
            ""
        );


        window.cmsCurrentRole =
            "cell_leader";


        window.cmsCurrentCell =
            myCell;


        console.log(
            "CMS Role Guard: Cell Leader workspace.",
            myCell
        );


        return myCell;

    }


    /* =====================================================
       APPLY ROLE
       ===================================================== */

    async function applyCMSRole() {

        try {

            const session =
                await getCurrentSession();


            /* ---------------------------------------------
               NO SESSION
               --------------------------------------------- */

            if (!session?.user) {

                console.warn(
                    "CMS Role Guard: no authenticated session."
                );

                return null;

            }


            /* ---------------------------------------------
               ROLE FROM DATABASE
               --------------------------------------------- */

            const role =
                await getCMSRole();


            if (!role) {

                console.warn(
                    "CMS Role Guard: no CMS role found."
                );

                return null;

            }


            console.log(
                "CMS Role Guard: role =",
                role
            );


            /* ---------------------------------------------
               COORDINATOR
               --------------------------------------------- */

            if (
                role ===
                "coordinator"
            ) {

                applyCoordinator(
                    session
                );

                return role;

            }


            /* ---------------------------------------------
               CELL LEADER
               --------------------------------------------- */

            if (
                role ===
                "cell_leader"
            ) {

                await applyCellLeader(
                    session
                );


                applyCellLeaderSidebar();

                return role;

            }


            /* ---------------------------------------------
               UNKNOWN ROLE
               --------------------------------------------- */

            console.warn(
                "CMS Role Guard: unknown role:",
                role
            );


            return null;

        }

        catch (error) {

            console.error(
                "CMS Role Guard: initialization failed:",
                error
            );


            return null;

        }

    }


    /* =====================================================
       PUBLIC
       ===================================================== */

    window.CMSRoleGuard.initialize =
        applyCMSRole;


    window.CMSRoleGuard.getRole =
        function () {

            return (
                window.CMSRoleGuard.role
            );

        };


    window.CMSRoleGuard.isCoordinator =
        function () {

            return (
                window.CMSRoleGuard.role ===
                "coordinator"
            );

        };


    window.CMSRoleGuard.isCellLeader =
        function () {

            return (
                window.CMSRoleGuard.role ===
                "cell_leader"
            );

        };


    window.CMSRoleGuard.getCellId =
        function () {

            return (
                window.CMSRoleGuard.cellId
            );

        };


    window.CMSRoleGuard.getCellName =
        function () {

            return (
                window.CMSRoleGuard.cellName
            );

        };


    /* =====================================================
       START
       ===================================================== */

    async function start() {

        await applyCMSRole();

    }


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

 