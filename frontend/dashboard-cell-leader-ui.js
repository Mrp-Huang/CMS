/* =========================================================
   CMS - CELL LEADER DASHBOARD UI
   ADDITIVE UI IMPROVEMENT

   IMPORTANT
   ---------------------------------------------------------
   This file DOES NOT replace dashboard-supabase.js.
   It only adapts the existing Dashboard presentation
   after the verified role has been loaded.

   Existing Supabase logic remains untouched.
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       STATE
       ===================================================== */

    let observerStarted = false;

    let dashboardRefreshRequested = false;


    /* =====================================================
       HELPERS
       ===================================================== */

    function isCellLeader() {

        return (
            window.CMSRoleGuard?.role ===
            "cell_leader"
        )
        ||
        (
            window.cmsCurrentRole ===
            "cell_leader"
        );

    }


    function getCellName() {

        return (
            window.cmsCurrentCell?.cell_name ||
            sessionStorage.getItem(
                "cmsCellName"
            ) ||
            "My Cell"
        );

    }


    function setText(
        element,
        text
    ) {

        if (!element) {

            return;

        }


        if (
            element.textContent !==
            text
        ) {

            element.textContent =
                text;

        }

    }


    function getDashboardSections() {

        return Array.from(
            document.querySelectorAll(
                "section.dashboard-section"
            )
        );

    }


    function findSectionByHeading(
        headingText
    ) {

        const target =
            String(
                headingText || ""
            )
                .trim()
                .toLowerCase();


        return getDashboardSections()
            .find(
                section => {

                    const heading =
                        section.querySelector(
                            "h1, h2, h3"
                        );


                    if (!heading) {

                        return false;

                    }


                    return (
                        String(
                            heading.textContent ||
                            ""
                        )
                            .trim()
                            .toLowerCase()
                            ===
                        target
                    );

                }
            )
            ||
            null;

    }


    /* =====================================================
       SIDEBAR
       ===================================================== */

    function fixCellLeaderSidebar() {

        const links =
            document.querySelectorAll(
                ".sidebar-nav a[href]"
            );


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

                    link.style.display =
                        "none";


                    return;

                }


                /* -----------------------------------------
                   DASHBOARD
                   ----------------------------------------- */

                if (
                    href.includes(
                        "dashboard.html"
                    )
                ) {

                    link.style.display =
                        "";


                    link.textContent =
                        "My Dashboard";

                }


                /* -----------------------------------------
                   MEMBERS
                   ----------------------------------------- */

                else if (
                    href.includes(
                        "members.html"
                    )
                ) {

                    link.style.display =
                        "";


                    link.textContent =
                        "My Members";

                }


                /* -----------------------------------------
                   ATTENDANCE
                   ----------------------------------------- */

                else if (
                    href.includes(
                        "attendance.html"
                    )
                ) {

                    link.style.display =
                        "";


                    link.textContent =
                        "Attendance";

                }


                /* -----------------------------------------
                   RECORDS
                   ----------------------------------------- */

                else if (
                    href.includes(
                        "records.html"
                    )
                ) {

                    link.style.display =
                        "";


                    link.textContent =
                        "My Records";

                }


                /* -----------------------------------------
                   WEEKLY REPORTS
                   ----------------------------------------- */

                else if (
                    href.includes(
                        "weekly-reports.html"
                    )
                ) {

                    link.style.display =
                        "";


                    link.textContent =
                        "Weekly Report";

                }


                /* -----------------------------------------
                   FOLLOW-UPS
                   ----------------------------------------- */

                else if (
                    href.includes(
                        "follow-ups.html"
                    )
                ) {

                    link.style.display =
                        "";


                    link.textContent =
                        "Follow-ups";

                }


                /* -----------------------------------------
                   EVANGELISM
                   ----------------------------------------- */

                else if (
                    href.includes(
                        "evangelism.html"
                    )
                ) {

                    link.style.display =
                        "";


                    link.textContent =
                        "Evangelism";

                }


                /* -----------------------------------------
                   VISITORS
                   IMPORTANT:
                   Explicitly restore this link because
                   older dashboard markup marked it
                   data-coordinator-only.
                   ----------------------------------------- */

                else if (
                    href.includes(
                        "visitors.html"
                    )
                ) {

                    link.style.display =
                        "";


                    link.removeAttribute(
                        "data-coordinator-only"
                    );


                    delete link.dataset
                        .cmsHiddenByRole;


                    link.textContent =
                        "Visitors";

                }

            }
        );

    }


    /* =====================================================
       TOP BAR
       ===================================================== */

    function fixTopBar() {

        const cellName =
            getCellName();


        const topBar =
            document.querySelector(
                ".top-bar"
            );


        if (!topBar) {

            return;

        }


        const title =
            topBar.querySelector(
                "h1"
            );


        const subtitle =
            topBar.querySelector(
                "p"
            );


        const userRole =
            topBar.querySelector(
                ".user-info span"
            );


        setText(
            title,
            "My Dashboard"
        );


        setText(
            subtitle,
            `${cellName} — Cell Leader Dashboard`
        );


        setText(
            userRole,
            "Cell Leader"
        );

    }


    /* =====================================================
       WELCOME SECTION
       ===================================================== */

    function fixWelcomeSection() {

        const section =
            document.querySelector(
                ".welcome-section"
            );


        if (!section) {

            return;

        }


        const cellName =
            getCellName();


        const heading =
            section.querySelector(
                "h2"
            );


        const paragraphs =
            section.querySelectorAll(
                "p"
            );


        setText(
            heading,
            "Welcome back! 👋"
        );


        if (
            paragraphs.length
        ) {

            setText(
                paragraphs[0],
                `Welcome to your ${cellName} dashboard. Manage your members, attendance, weekly report, follow-ups, evangelism, visitors and records from one place.`
            );

        }

    }


    /* =====================================================
       MAIN STATISTICS
       ===================================================== */

    function fixStatistics() {

        const mappings = {

            "total-cells": {

                title:
                    "My Cell",

                description:
                    "Assigned cell"

            },

            "total-leaders": {

                title:
                    "Cell Leaders",

                description:
                    "Leaders in my cell"

            },

            "total-members": {

                title:
                    "My Members",

                description:
                    "Members in my cell"

            },

            "attendance-rate": {

                title:
                    "Attendance",

                description:
                    "My cell attendance"

            },

            "total-reports": {

                title:
                    "Weekly Reports",

                description:
                    "My cell reports"

            },

            "pending-reports": {

                title:
                    "Reports to Submit",

                description:
                    "Pending reports"

            },

            "total-followups": {

                title:
                    "Follow-ups",

                description:
                    "My cell follow-ups"

            },

            "pending-followups": {

                title:
                    "Pending Follow-ups",

                description:
                    "Need attention"

            }

        };


        Object.entries(
            mappings
        )
            .forEach(
                (
                    [
                        id,
                        config
                    ]
                ) => {

                    const value =
                        document.getElementById(
                            id
                        );


                    if (!value) {

                        return;

                    }


                    const card =
                        value.closest(
                            ".stat-card"
                        );


                    if (!card) {

                        return;

                    }


                    const heading =
                        card.querySelector(
                            "h3"
                        );


                    const description =
                        card.querySelector(
                            "small"
                        );


                    setText(
                        heading,
                        config.title
                    );


                    setText(
                        description,
                        config.description
                    );

                }
            );

    }


    /* =====================================================
       QUICK ACTIONS
       ===================================================== */

    function fixQuickActions() {

        const section =
            findSectionByHeading(
                "Quick Actions"
            );


        if (!section) {

            return;

        }


        const heading =
            section.querySelector(
                "h2"
            );


        const paragraph =
            section.querySelector(
                "p"
            );


        setText(
            heading,
            "My Cell Actions"
        );


        setText(
            paragraph,
            "Quick access to the tools you use to manage your cell."
        );


        const actions =
            section.querySelector(
                ".dashboard-actions"
            );


        if (!actions) {

            return;

        }


        const links =
            actions.querySelectorAll(
                "a[href]"
            );


        let visitorLinkExists =
            false;


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
                   REMOVE COORDINATOR QUICK ACTIONS
                   ----------------------------------------- */

                if (
                    href.includes(
                        "cells.html"
                    )
                    ||
                    href.includes(
                        "cell-leaders.html"
                    )
                ) {

                    link.style.display =
                        "none";


                    return;

                }


                /* -----------------------------------------
                   MEMBERS
                   ----------------------------------------- */

                if (
                    href.includes(
                        "members.html"
                    )
                ) {

                    link.style.display =
                        "";


                    link.textContent =
                        "👤 My Members";

                }


                /* -----------------------------------------
                   ATTENDANCE
                   ----------------------------------------- */

                else if (
                    href.includes(
                        "attendance.html"
                    )
                ) {

                    link.style.display =
                        "";


                    link.textContent =
                        "📋 Attendance";

                }


                /* -----------------------------------------
                   WEEKLY REPORT
                   ----------------------------------------- */

                else if (
                    href.includes(
                        "weekly-reports.html"
                    )
                ) {

                    link.style.display =
                        "";


                    link.textContent =
                        "📝 Weekly Report";

                }


                /* -----------------------------------------
                   FOLLOW-UPS
                   ----------------------------------------- */

                else if (
                    href.includes(
                        "follow-ups.html"
                    )
                ) {

                    link.style.display =
                        "";


                    link.textContent =
                        "🔄 Follow-ups";

                }


                /* -----------------------------------------
                   EVANGELISM
                   ----------------------------------------- */

                else if (
                    href.includes(
                        "evangelism.html"
                    )
                ) {

                    link.style.display =
                        "";


                    link.textContent =
                        "✝️ Evangelism";

                }


                /* -----------------------------------------
                   RECORDS
                   ----------------------------------------- */

                else if (
                    href.includes(
                        "records.html"
                    )
                ) {

                    link.style.display =
                        "";


                    link.textContent =
                        "📂 My Records";

                }


                /* -----------------------------------------
                   VISITORS
                   ----------------------------------------- */

                else if (
                    href.includes(
                        "visitors.html"
                    )
                ) {

                    visitorLinkExists =
                        true;


                    link.style.display =
                        "";


                    link.textContent =
                        "👥 Visitors";

                }

            }
        );


        /* -------------------------------------------------
           ADD VISITORS QUICK ACTION IF MISSING
           ------------------------------------------------- */

        if (
            !visitorLinkExists
        ) {

            const visitorLink =
                document.createElement(
                    "a"
                );


            visitorLink.href =
                "visitors.html";


            visitorLink.className =
                "dashboard-button";


            visitorLink.textContent =
                "👥 Visitors";


            actions.appendChild(
                visitorLink
            );

        }

    }


    /* =====================================================
       ATTENDANCE SECTION
       ===================================================== */

    function fixAttendanceSection() {

        const section =
            findSectionByHeading(
                "Attendance Overview"
            );


        if (!section) {

            return;

        }


        const paragraph =
            section.querySelector(
                "p"
            );


        setText(
            paragraph,
            "Attendance statistics for your assigned cell."
        );

    }


    /* =====================================================
       EVANGELISM SECTION
       ===================================================== */

    function fixEvangelismSection() {

        const section =
            findSectionByHeading(
                "Evangelism Overview"
            );


        if (!section) {

            return;

        }


        const heading =
            section.querySelector(
                "h2"
            );


        const paragraph =
            section.querySelector(
                "p"
            );


        setText(
            heading,
            "My Cell Evangelism"
        );


        setText(
            paragraph,
            "Evangelism activities and outcomes recorded for your cell."
        );

    }


    /* =====================================================
       WEEKLY REPORTS SECTION
       ===================================================== */

    function fixWeeklyReportsSection() {

        const section =
            findSectionByHeading(
                "Recent Weekly Reports"
            );


        if (!section) {

            return;

        }


        const heading =
            section.querySelector(
                "h2"
            );


        const paragraph =
            section.querySelector(
                "p"
            );


        setText(
            heading,
            "My Cell Weekly Reports"
        );


        setText(
            paragraph,
            "Latest weekly reports for your assigned cell."
        );


        /* -----------------------------------------------
           CHANGE TABLE HEADING "CELL" TO "MY CELL"
           ----------------------------------------------- */

        const firstHeader =
            section.querySelector(
                "thead th"
            );


        if (
            firstHeader
        ) {

            setText(
                firstHeader,
                "My Cell"
            );

        }

    }


    /* =====================================================
       FOLLOW-UP SECTION
       ===================================================== */

    function fixFollowUpsSection() {

        const section =
            findSectionByHeading(
                "Recent Follow-ups"
            );


        if (!section) {

            return;

        }


        const heading =
            section.querySelector(
                "h2"
            );


        const paragraph =
            section.querySelector(
                "p"
            );


        setText(
            heading,
            "My Cell Follow-ups"
        );


        setText(
            paragraph,
            "Members and issues requiring follow-up in your cell."
        );

    }


    /* =====================================================
       HIDE COORDINATOR CELL SECTIONS
       ===================================================== */

    function hideCoordinatorSections() {

        const cellsOverview =
            findSectionByHeading(
                "Cells Overview"
            );


        if (
            cellsOverview
        ) {

            cellsOverview.style.display =
                "none";

        }


        const attention =
            findSectionByHeading(
                "⚠️ Cells Needing Attention"
            );


        if (
            attention
        ) {

            attention.style.display =
                "none";

        }

    }


    /* =====================================================
       OVERALL ANALYTICS
       ===================================================== */

    function fixOverallAnalytics() {

        const section =
            findSectionByHeading(
                "Overall CMS Analytics"
            );


        if (!section) {

            return;

        }


        const heading =
            section.querySelector(
                "h2"
            );


        const paragraph =
            section.querySelector(
                "p"
            );


        setText(
            heading,
            "My Cell Performance"
        );


        setText(
            paragraph,
            "Performance indicators calculated from your cell's live CMS records."
        );


        /* -----------------------------------------------
           RELABEL CARDS
           ----------------------------------------------- */

        const cards =
            section.querySelectorAll(
                ".analytics-card"
            );


        const labels = [

            "Active Members",

            "Report Coverage",

            "Follow-up Completion",

            "Attendance Records",

            "People Reached"

        ];


        cards.forEach(
            (
                card,
                index
            ) => {

                const span =
                    card.querySelector(
                        "span"
                    );


                if (
                    span &&
                    labels[index]
                ) {

                    setText(
                        span,
                        labels[index]
                    );

                }

            }
        );

    }


    /* =====================================================
       RECORDS SECTION
       ===================================================== */

    function fixRecordsSection() {

        const section =
            findSectionByHeading(
                "Records & History"
            );


        if (!section) {

            return;

        }


        const heading =
            section.querySelector(
                "h2"
            );


        const paragraph =
            section.querySelector(
                "p"
            );


        const button =
            section.querySelector(
                "a.view-button"
            );


        setText(
            heading,
            "My Records"
        );


        setText(
            paragraph,
            "Access attendance, reports and follow-up records for your cell."
        );


        setText(
            button,
            "Open My Records"
        );

    }


    /* =====================================================
       ADD VISITOR ANALYTICS
       ===================================================== */

    function ensureVisitorAnalytics() {

        let section =
            document.getElementById(
                "cellLeaderVisitorAnalytics"
            );


        if (
            section
        ) {

            return;

        }


        const attendanceSection =
            findSectionByHeading(
                "Attendance Overview"
            );


        if (
            !attendanceSection
        ) {

            return;

        }


        section =
            document.createElement(
                "section"
            );


        section.id =
            "cellLeaderVisitorAnalytics";


        section.className =
            "dashboard-section";


        section.innerHTML = `

            <div class="section-header">

                <div>

                    <h2>
                        My Cell Visitors
                    </h2>

                    <p>
                        Visitors recorded through your cell attendance.
                    </p>

                </div>

                <a
                    href="visitors.html"
                    class="view-button"
                >
                    View Visitors
                </a>

            </div>


            <div class="analytics-grid">


                <div class="analytics-card">

                    <span>
                        Total Visitors
                    </span>

                    <strong id="dashboard-total-visitors">
                        0
                    </strong>

                </div>


                <div class="analytics-card">

                    <span>
                        Total Visits
                    </span>

                    <strong id="dashboard-visitor-visits">
                        0
                    </strong>

                </div>


                <div class="analytics-card">

                    <span>
                        Converted to Members
                    </span>

                    <strong id="dashboard-converted-visitors">
                        0
                    </strong>

                </div>

            </div>

        `;


        attendanceSection.insertAdjacentElement(
            "afterend",
            section
        );

    }


    /* =====================================================
       APPLY EVERYTHING
       ===================================================== */

    function applyCellLeaderDashboardUI() {

        if (
            !isCellLeader()
        ) {

            return;

        }


        fixCellLeaderSidebar();

        fixTopBar();

        fixWelcomeSection();

        fixStatistics();

        fixQuickActions();

        fixAttendanceSection();

        fixEvangelismSection();

        fixWeeklyReportsSection();

        fixFollowUpsSection();

        hideCoordinatorSections();

        fixOverallAnalytics();

        fixRecordsSection();

        ensureVisitorAnalytics();


        document.body.classList.add(
            "cms-cell-leader-dashboard"
        );


        console.log(
            "CMS Cell Leader Dashboard UI applied:",
            getCellName()
        );

    }


    /* =====================================================
       REFRESH LIVE DASHBOARD
       ===================================================== */

    async function refreshDashboardOnce() {

        if (
            dashboardRefreshRequested
        ) {

            return;

        }


        dashboardRefreshRequested =
            true;


        try {

            if (
                typeof window.refreshCMSDashboard ===
                "function"
            ) {

                await window.refreshCMSDashboard();

            }

        }

        catch (error) {

            console.warn(
                "CMS Cell Leader Dashboard refresh warning:",
                error
            );

        }


        setTimeout(
            function () {

                applyCellLeaderDashboardUI();

            },
            100
        );

    }


    /* =====================================================
       OBSERVE DASHBOARD CHANGES
       ===================================================== */

    function startObserver() {

        if (
            observerStarted
        ) {

            return;

        }


        observerStarted =
            true;


        const target =
            document.querySelector(
                "body"
            );


        if (!target) {

            return;

        }


        const observer =
            new MutationObserver(
                function () {

                    if (
                        isCellLeader()
                    ) {

                        applyCellLeaderDashboardUI();

                    }

                }
            );


        observer.observe(
            target,
            {
                childList: true,
                subtree: true
            }
        );

    }


    /* =====================================================
       WAIT FOR ROLE
       ===================================================== */

    function waitForRole(
        attempts
    ) {

        if (
            isCellLeader()
        ) {

            refreshDashboardOnce();

            startObserver();

            return;

        }


        if (
            attempts >=
            100
        ) {

            return;

        }


        setTimeout(
            function () {

                waitForRole(
                    attempts + 1
                );

            },
            100
        );

    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    function start() {

        waitForRole(
            0
        );

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