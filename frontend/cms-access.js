/* =========================================================
   CMS - ACCESS / ROLE / CELL HELPER
   FINAL HARDENED VERSION

   PURPOSE
   ---------------------------------------------------------
   - Current authenticated user
   - Database-backed CMS role
   - Assigned cell for Cell Leaders
   - Cell selector restriction
   - SessionStorage used only as convenience/cache
   - Supabase remains the source of truth

   ADDITIVE HARDENING
   ---------------------------------------------------------
   - Waits for Supabase session restoration before RPC calls
   - Prevents early cms_my_role 401 during INITIAL_SESSION
   - Prevents duplicate simultaneous initialization
   - Preserves existing role/cell/sessionStorage behavior
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       GLOBAL STATE
       ===================================================== */

    window.CMSAccess = {

        role: null,

        userId: null,

        cellId: null,

        cellName: null,

        initialized: false

    };


    /* =====================================================
       INTERNAL STATE
       ===================================================== */

    let cmsAccessInitializationPromise =
        null;


    /* =====================================================
       CLIENT
       ===================================================== */

    function getClient() {

        return (
            window.supabaseClient ||
            null
        );

    }


    /* =====================================================
       WAIT FOR AUTHENTICATED SESSION
       =====================================================

       Supabase may restore the existing session slightly
       after this script starts.

       We therefore:
       1. Check getSession() immediately.
       2. If no session exists yet, wait for auth events.
       3. Continue on SIGNED_IN / INITIAL_SESSION when a
          session is actually available.
       4. Fail cleanly if no session appears.
       ===================================================== */

    async function waitForAuthenticatedSession(
        client
    ) {

        /*
           First check the session immediately.
        */

        const {
            data: initialSessionData,
            error: initialSessionError
        } =
            await client.auth.getSession();


        if (
            initialSessionError
        ) {

            throw initialSessionError;

        }


        const initialSession =
            initialSessionData?.session;


        if (
            initialSession?.user
        ) {

            return initialSession;

        }


        /*
           No session yet.

           Supabase may still be restoring the stored
           authentication session. Wait for auth events.
        */

        return new Promise(
            function (
                resolve,
                reject
            ) {

                let finished =
                    false;


                const timeout =
                    setTimeout(
                        function () {

                            finish(
                                new Error(
                                    "No active CMS session."
                                )
                            );

                        },
                        10000
                    );


                let authSubscription =
                    null;


                function cleanup() {

                    clearTimeout(
                        timeout
                    );


                    try {

                        if (
                            authSubscription &&
                            typeof authSubscription.unsubscribe ===
                                "function"
                        ) {

                            authSubscription.unsubscribe();

                        }

                    }

                    catch {

                        /* cleanup safety */

                    }

                }


                function finish(
                    error,
                    session
                ) {

                    if (
                        finished
                    ) {

                        return;

                    }


                    finished =
                        true;


                    cleanup();


                    if (
                        error
                    ) {

                        reject(
                            error
                        );

                    }

                    else {

                        resolve(
                            session
                        );

                    }

                }


                const {
                    data
                } =
                    client.auth.onAuthStateChange(
                        function (
                            event,
                            session
                        ) {

                            /*
                               We care about a session that is
                               actually available.

                               INITIAL_SESSION can arrive with
                               null, so do not resolve from
                               that event unless a session exists.
                            */

                            if (
                                session?.user
                            ) {

                                if (
                                    event ===
                                        "INITIAL_SESSION" ||
                                    event ===
                                        "SIGNED_IN" ||
                                    event ===
                                        "TOKEN_REFRESHED" ||
                                    event ===
                                        "USER_UPDATED"
                                ) {

                                    finish(
                                        null,
                                        session
                                    );

                                }

                            }

                        }
                    );


                authSubscription =
                    data?.subscription ||
                    null;


                /*
                   Race protection:
                   another part of the CMS may have restored
                   the session between the initial getSession()
                   and listener registration.

                   Check one more time.
                */

                client.auth
                    .getSession()
                    .then(
                        function (
                            result
                        ) {

                            const session =
                                result
                                    ?.data
                                    ?.session;


                            if (
                                session?.user
                            ) {

                                finish(
                                    null,
                                    session
                                );

                            }

                        }
                    )
                    .catch(
                        function (
                            error
                        ) {

                            /*
                               Do not immediately reject if the
                               auth listener is still capable of
                               receiving the session event.

                               The timeout will handle a genuine
                               missing-session situation.
                            */

                            console.warn(
                                "CMS Access: secondary session check warning:",
                                error
                            );

                        }
                    );

            }
        );

    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    async function initializeCMSAccess() {

        /*
           If another CMS module is already initializing
           access, share the same promise.

           This prevents multiple simultaneous calls to:

               cms_my_role
               cms_my_cells

           and keeps the global access state consistent.
        */

        if (
            cmsAccessInitializationPromise
        ) {

            return (
                cmsAccessInitializationPromise
            );

        }


        cmsAccessInitializationPromise =
            initializeCMSAccessInternal();


        try {

            return await
                cmsAccessInitializationPromise;

        }

        finally {

            /*
               Allow future explicit initialization after
               this attempt completes.

               Once initialized successfully, callers still
               receive the populated global CMSAccess state.
            */

            cmsAccessInitializationPromise =
                null;

        }

    }


    /* =====================================================
       INTERNAL INITIALIZATION
       ===================================================== */

    async function initializeCMSAccessInternal() {

        const client =
            getClient();


        if (!client) {

            throw new Error(
                "CMS Supabase client is unavailable."
            );

        }


        /* -------------------------------------------------
           SESSION
           ------------------------------------------------- */

        const session =
            await waitForAuthenticatedSession(
                client
            );


        if (
            !session?.user
        ) {

            throw new Error(
                "No active CMS session."
            );

        }


        window.CMSAccess.userId =
            session.user.id;


        /* -------------------------------------------------
           ROLE
           ------------------------------------------------- */

        /*
           The session is now definitely available.

           Only after this point do we call cms_my_role.
        */

        const {
            data: roleData,
            error: roleError
        } =
            await client.rpc(
                "cms_my_role"
            );


        if (
            roleError
        ) {

            throw roleError;

        }


        const role =
            String(
                roleData || ""
            )
                .trim()
                .toLowerCase();


        window.CMSAccess.role =
            role;


        /* -------------------------------------------------
           CLEAR CELL STATE FIRST
           ------------------------------------------------- */

        window.CMSAccess.cellId =
            null;

        window.CMSAccess.cellName =
            null;


        /* -------------------------------------------------
           CELL LEADER
           ------------------------------------------------- */

        if (
            role ===
            "cell_leader"
        ) {

            const {
                data: cells,
                error: cellError
            } =
                await client.rpc(
                    "cms_my_cells"
                );


            if (
                cellError
            ) {

                throw cellError;

            }


            if (
                !Array.isArray(cells) ||
                !cells.length
            ) {

                throw new Error(
                    "No active cell is assigned to this Cell Leader."
                );

            }


            const myCell =
                cells[0];


            window.CMSAccess.cellId =
                myCell.cell_id ||
                null;


            window.CMSAccess.cellName =
                myCell.cell_name ||
                "";


            /* ------------------------------------------------
               SESSION STORAGE CACHE
               ------------------------------------------------ */

            sessionStorage.setItem(
                "cmsRole",
                "cell_leader"
            );


            sessionStorage.setItem(
                "cmsUserId",
                session.user.id
            );


            sessionStorage.setItem(
                "cmsCellId",
                window.CMSAccess.cellId ||
                ""
            );


            sessionStorage.setItem(
                "cmsCellName",
                window.CMSAccess.cellName ||
                ""
            );

        }


        /* -------------------------------------------------
           COORDINATOR
           ------------------------------------------------- */

        else if (
            role ===
            "coordinator"
        ) {

            sessionStorage.setItem(
                "cmsRole",
                "coordinator"
            );


            sessionStorage.setItem(
                "cmsUserId",
                session.user.id
            );


            sessionStorage.removeItem(
                "cmsCellId"
            );


            sessionStorage.removeItem(
                "cmsCellName"
            );

        }


        /* -------------------------------------------------
           UNKNOWN ROLE
           ------------------------------------------------- */

        else {

            throw new Error(
                "Your account does not have a valid CMS role."
            );

        }


        /* -------------------------------------------------
           GLOBAL DISPLAY STATE
           ------------------------------------------------- */

        window.cmsCurrentRole =
            window.CMSAccess.role;


        window.cmsCurrentCell = {

            cell_id:
                window.CMSAccess.cellId,

            cell_name:
                window.CMSAccess.cellName

        };


        window.CMSAccess.initialized =
            true;


        console.log(
            "CMS Access initialized:",
            window.CMSAccess
        );


        return window.CMSAccess;

    }


    /* =====================================================
       PUBLIC HELPERS
       ===================================================== */

    window.CMSAccess.initialize =
        initializeCMSAccess;


    window.CMSAccess.isCoordinator =
        function () {

            return (
                window.CMSAccess.role ===
                "coordinator"
            );

        };


    window.CMSAccess.isCellLeader =
        function () {

            return (
                window.CMSAccess.role ===
                "cell_leader"
            );

        };


    window.CMSAccess.getCellId =
        function () {

            return (
                window.CMSAccess.cellId
            );

        };


    window.CMSAccess.getCellName =
        function () {

            return (
                window.CMSAccess.cellName
            );

        };


    window.CMSAccess.getUserId =
        function () {

            return (
                window.CMSAccess.userId
            );

        };


    /* =====================================================
       CELL SELECT RESTRICTION
       ===================================================== */

    window.CMSAccess.applyCellRestriction =
        function (
            selectElement
        ) {

            if (
                !selectElement
            ) {

                return;

            }


            if (
                !window.CMSAccess.isCellLeader()
            ) {

                return;

            }


            const cellId =
                window.CMSAccess.getCellId();


            if (
                !cellId
            ) {

                return;

            }


            Array
                .from(
                    selectElement.options
                )
                .forEach(
                    option => {

                        const value =
                            String(
                                option.value
                            );


                        if (
                            value &&
                            value !==
                            String(
                                cellId
                            )
                        ) {

                            option.remove();

                        }

                    }
                );


            selectElement.value =
                cellId;


            selectElement.disabled =
                true;


            selectElement.dataset.cmsLocked =
                "true";

        };


    /* =====================================================
       AUTO INITIALIZE
       ===================================================== */

    async function autoInitialize() {

        try {

            /*
               Wait until Supabase has restored the session
               before touching cms_my_role.
            */

            await initializeCMSAccess();

        }

        catch (error) {

            /*
               Do not destroy the page.

               Other CMS guards/modules may initialize after
               the authentication event becomes available.
            */

            console.error(
                "CMS Access initialization failed:",
                error
            );

        }

    }


    /* =====================================================
       START
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            autoInitialize,
            {
                once: true
            }
        );

    }

    else {

        autoInitialize();

    }


})();