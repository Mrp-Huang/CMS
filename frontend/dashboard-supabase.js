/* =========================================================
   CMS - DASHBOARD SUPABASE ANALYTICS
   ROLE-AWARE LIVE DATABASE VERSION

   COORDINATOR
   ---------------------------------------------------------
   Full CMS dashboard / all cells / all analytics

   CELL LEADER
   ---------------------------------------------------------
   Assigned cell only / own cell analytics

   IMPORTANT:
   ---------------------------------------------------------
   - Existing working logic preserved
   - No MutationObserver
   - No extra dashboard UI script required
   - Cell Leader presentation remains scoped to their cell
   - Coordinators get weekly attendance and report comparisons

   LIVE SOURCES:
   - cells
   - cell_leader_directory
   - members
   - attendance_sessions
   - attendance
   - visitors
   - visitor_visits
   - weekly_reports
   - follow_ups
   - evangelism
   ========================================================= */


/* =========================================================
   SUPABASE
   ========================================================= */

const CMS_DASHBOARD_SUPABASE =
    window.supabaseClient;


/* =========================================================
   STATE
   ========================================================= */

let cmsDashboardData = {

    cells: [],
    leaders: [],
    members: [],
    attendanceSessions: [],
    attendance: [],
    visitors: [],
    visitorVisits: [],
    reports: [],
    followUps: [],
    evangelism: []

};


/* =========================================================
   AUTH / ROLE STATE
   ========================================================= */

let cmsDashboardRole = null;

let cmsDashboardMyCell = null;


/* =========================================================
   DOM HELPERS
   ========================================================= */

function dashboardSetText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value ?? "";

    }

}


function dashboardNumber(
    value
) {

    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : 0;

}


function dashboardDate(
    value
) {

    if (!value) {

        return null;

    }


    const date =
        new Date(value);


    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;

}


function dashboardDaysAgo(
    value
) {

    const date =
        dashboardDate(value);


    if (!date) {

        return Infinity;

    }


    const now =
        new Date();


    return Math.floor(
        (
            now.getTime() -
            date.getTime()
        ) /
        86400000
    );

}


function dashboardStatus(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase();

}


function escapeDashboardHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   ROLE
   ========================================================= */

async function dashboardLoadRole() {

    const {
        data,
        error
    } =
        await CMS_DASHBOARD_SUPABASE
            .rpc(
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


/* =========================================================
   ASSIGNED CELL
   ========================================================= */

async function dashboardLoadMyCell() {

    const {
        data,
        error
    } =
        await CMS_DASHBOARD_SUPABASE
            .rpc(
                "cms_my_cells"
            );


    if (error) {

        throw error;

    }


    if (
        !data ||
        !data.length
    ) {

        return null;

    }


    return data[0];

}


/* =========================================================
   WORKSPACE UI
   ========================================================= */

function dashboardApplyWorkspaceUI() {

    document.body.classList.remove(
        "cms-coordinator-mode",
        "cms-cell-leader-mode"
    );


    if (
        cmsDashboardRole ===
        "cell_leader"
    ) {

        document.body.classList.add(
            "cms-cell-leader-mode"
        );


        window.cmsCurrentRole =
            "cell_leader";


        window.cmsCurrentCell =
            cmsDashboardMyCell;


        if (cmsDashboardMyCell) {

            sessionStorage.setItem(
                "cmsCellId",
                cmsDashboardMyCell.cell_id ||
                ""
            );


            sessionStorage.setItem(
                "cmsCellName",
                cmsDashboardMyCell.cell_name ||
                ""
            );

        }


        /*
         * Only presentation/navigation changes here.
         * No data is removed.
         */

        dashboardUpdateCellLeaderHeading();

        dashboardHideCoordinatorNavigation();

        dashboardRestoreCellLeaderVisitors();

    }

    else {

        document.body.classList.add(
            "cms-coordinator-mode"
        );


        window.cmsCurrentRole =
            "coordinator";


        window.cmsCurrentCell =
            null;

    }

}


/* =========================================================
   CELL LEADER HEADING
   ========================================================= */

function dashboardUpdateCellLeaderHeading() {

    if (
        cmsDashboardRole !==
        "cell_leader"
    ) {

        return;

    }


    if (
        !cmsDashboardMyCell
    ) {

        return;

    }


    const cellName =
        cmsDashboardMyCell.cell_name ||
        "My Cell";


    /*
     * IMPORTANT:
     * Only target the top bar.
     * Do not search every h1/h2 on the page.
     * This prevents repeated/incorrect heading changes.
     */

    const topBar =
        document.querySelector(
            ".top-bar"
        );


    if (topBar) {

        const title =
            topBar.querySelector(
                "h1"
            );


        const subtitle =
            topBar.querySelector(
                "p"
            );


        const roleLabel =
            topBar.querySelector(
                ".user-info span"
            );


        if (title) {

            title.textContent =
                "My Dashboard";

        }


        if (subtitle) {

            subtitle.textContent =
                `${cellName} — Cell Leader Dashboard`;

        }


        if (roleLabel) {

            roleLabel.textContent =
                "Cell Leader";

        }

    }


    /*
     * Existing optional current-cell element.
     */

    const currentCellDisplay =
        document.getElementById(
            "currentCellDisplay"
        );


    if (currentCellDisplay) {

        currentCellDisplay.textContent =
            cellName;

    }

}


/* =========================================================
   HIDE COORDINATOR-ONLY NAVIGATION
   ========================================================= */

function dashboardHideCoordinatorNavigation() {

    if (
        cmsDashboardRole !==
        "cell_leader"
    ) {

        return;

    }


    /*
     * We use href rather than text.
     * This prevents accidental hiding of unrelated elements.
     */

    document
        .querySelectorAll(
            ".sidebar-nav a[href]"
        )
        .forEach(
            link => {

                const href =
                    String(
                        link.getAttribute(
                            "href"
                        ) ||
                        ""
                    )
                        .toLowerCase();


                /* =========================================
                   CELLS
                   ========================================= */

                if (
                    href.includes(
                        "cells.html"
                    )
                ) {

                    link.style.display =
                        "none";

                    return;

                }


                /* =========================================
                   CELL LEADERS
                   ========================================= */

                if (
                    href.includes(
                        "cell-leaders.html"
                    )
                    ||
                    href.includes(
                        "cell_leaders"
                    )
                ) {

                    link.style.display =
                        "none";

                    return;

                }


                /* =========================================
                   CMS AI
                   ========================================= */

                if (
                    href.includes(
                        "cms-ai.html"
                    )
                ) {

                    link.style.display =
                        "none";

                    return;

                }


                /* =========================================
                   SETTINGS
                   ========================================= */

                if (
                    href.includes(
                        "settings.html"
                    )
                ) {

                    link.style.display =
                        "none";

                    return;

                }


                /*
                 * Everything else stays visible.
                 */

                link.style.display =
                    "";

            }
        );


    /*
     * Make sure the Cell Leader labels are exactly
     * what we agreed.
     */

    document
        .querySelectorAll(
            ".sidebar-nav a[href]"
        )
        .forEach(
            link => {

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
                        "attendance.html"
                    )
                ) {

                    link.textContent =
                        "Attendance";

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

}


/* =========================================================
   RESTORE CELL LEADER VISITORS
   ========================================================= */

function dashboardRestoreCellLeaderVisitors() {

    if (
        cmsDashboardRole !==
        "cell_leader"
    ) {

        return;

    }


    /*
     * Sidebar Visitors link.
     */

    document
        .querySelectorAll(
            'a[href*="visitors.html"]'
        )
        .forEach(
            link => {

                link.removeAttribute(
                    "data-coordinator-only"
                );


                delete link.dataset
                    .cmsHiddenByRole;


                link.style.display =
                    "";


                link.textContent =
                    "Visitors";

            }
        );


    /*
     * Existing Dashboard Visitor stat cards /
     * sections that may have coordinator-only
     * markup from the old dashboard HTML.
     */

    document
        .querySelectorAll(
            "[data-coordinator-only='true']"
        )
        .forEach(
            element => {

                const containsVisitors =
                    (
                        element.id ===
                        "total-visitors"
                    )
                    ||
                    (
                        element.id ===
                        "dashboard-total-visitors"
                    )
                    ||
                    (
                        element.querySelector(
                            'a[href*="visitors.html"]'
                        )
                    )
                    ||
                    String(
                        element.textContent ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            "visitors"
                        );


                if (
                    containsVisitors
                ) {

                    element.removeAttribute(
                        "data-coordinator-only"
                    );


                    element.style.display =
                        "";

                }

            }
        );


    /*
     * Specifically restore visitor stat card
     * if its data attribute was present.
     */

    const totalVisitorValue =
        document.getElementById(
            "total-visitors"
        );


    if (totalVisitorValue) {

        const card =
            totalVisitorValue.closest(
                ".stat-card, .card, .dashboard-card"
            );


        if (card) {

            card.removeAttribute(
                "data-coordinator-only"
            );


            card.style.display =
                "";

        }

    }


    /*
     * Restore Visitor Overview section.
     */

    const visitorOverviewCandidates =
        document.querySelectorAll(
            "section.dashboard-section"
        );


    visitorOverviewCandidates.forEach(
        section => {

            const heading =
                section.querySelector(
                    "h2"
                );


            const headingText =
                String(
                    heading?.textContent ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            if (
                headingText.includes(
                    "visitor"
                )
            ) {

                section.removeAttribute(
                    "data-coordinator-only"
                );


                section.style.display =
                    "";

            }

        }
    );

}


/* =========================================================
   PAGINATED DATA LOADER
   ========================================================= */

async function dashboardFetchAllRows(
    createQuery
) {

    const pageSize =
        500;


    const rows =
        [];


    for (
        let offset = 0;
        ;
        offset += pageSize
    ) {

        const {
            data,
            error
        } =
            await createQuery()
                .range(
                    offset,
                    offset + pageSize - 1
                );


        if (error) {

            throw error;

        }


        const page =
            data || [];


        rows.push(
            ...page
        );


        if (
            page.length <
            pageSize
        ) {

            return rows;

        }

    }

}


/* =========================================================
   LOAD CELLS
   ========================================================= */

async function dashboardLoadCells() {

    return dashboardFetchAllRows(
        () =>
            CMS_DASHBOARD_SUPABASE
            .from(
                "cells"
            )
            .select(
                `
                id,
                name,
                description,
                active,
                created_at,
                updated_at
                `
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
    );

}


/* =========================================================
   LOAD LEADERS
   ========================================================= */
async function dashboardLoadLeaders() {

    /* =====================================================
       CELL LEADER WORKSPACE
       -----------------------------------------------------
       A Cell Leader must see ALL active leaders assigned
       to the SAME cell, not only themselves.
       ===================================================== */

    if (
        cmsDashboardRole ===
        "cell_leader"
        &&
        cmsDashboardMyCell?.cell_id
    ) {

        const {
            data,
            error
        } =
            await CMS_DASHBOARD_SUPABASE
                .rpc(
                    "cms_my_cell_leaders"
                );


        if (
            error
        ) {

            throw error;

        }


        return (
            data ||
            []
        );

    }


    /* =====================================================
       COORDINATOR
       -----------------------------------------------------
       Coordinators load all cell leaders.
       ===================================================== */

    const {
        data,
        error
    } =
        await CMS_DASHBOARD_SUPABASE

            .from(
                "cell_leader_directory"
            )

            .select(
                `
                id,
                full_name,
                email,
                phone,
                cell_id,
                active,
                created_at
                `
            )

            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (
        error
    ) {

        throw error;

    }


    return (
        data ||
        []
    );

}


/* =========================================================
   LOAD MEMBERS
   ========================================================= */

async function dashboardLoadMembers() {

    return dashboardFetchAllRows(
        () =>
            CMS_DASHBOARD_SUPABASE
            .from(
                "members"
            )
            .select(
                `
                id,
                cell_id,
                first_name,
                last_name,
                phone,
                email,
                gender,
                year_of_study,
                combination,
                date_joined,
                active,
                created_at,
                updated_at
                `
            )
            .order(
                "date_joined",
                {
                    ascending: false
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
    );

}


/* =========================================================
   LOAD ATTENDANCE SESSIONS
   ========================================================= */

async function dashboardLoadAttendanceSessions() {

    return dashboardFetchAllRows(
        () =>
            CMS_DASHBOARD_SUPABASE
            .from(
                "attendance_sessions"
            )
            .select(
                `
                id,
                cell_id,
                meeting_date,
                visitors,
                notes,
                created_at
                `
            )
            .order(
                "meeting_date",
                {
                    ascending: false
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
    );

}


/* =========================================================
   LOAD ATTENDANCE
   ========================================================= */

async function dashboardLoadAttendance() {

    return dashboardFetchAllRows(
        () =>
            CMS_DASHBOARD_SUPABASE
            .from(
                "attendance"
            )
            .select(
                `
                id,
                session_id,
                cell_id,
                member_id,
                meeting_date,
                status,
                created_at,
                updated_at
                `
            )
            .order(
                "meeting_date",
                {
                    ascending: false
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
    );

}


/* =========================================================
   LOAD VISITORS
   ========================================================= */

async function dashboardLoadVisitors() {

    return dashboardFetchAllRows(
        () =>
            CMS_DASHBOARD_SUPABASE
            .from(
                "visitors"
            )
            .select(
                `
                id,
                full_name,
                phone,
                year_of_study,
                combination,
                association,
                cell_id,
                first_visit_date,
                last_visit_date,
                visit_count,
                converted_to_member,
                member_id,
                active,
                created_at,
                updated_at
                `
            )
            .order(
                "last_visit_date",
                {
                    ascending: false
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
    );

}

/* =========================================================
   LOAD VISITOR VISITS
   ========================================================= */

async function dashboardLoadVisitorVisits() {

    return dashboardFetchAllRows(
        () =>
            CMS_DASHBOARD_SUPABASE
            .from(
                "visitor_visits"
            )
            .select(
                `
                id,
                visitor_id,
                cell_id,
                attendance_session_id,
                visit_date,
                status,
                created_at,
                updated_at
                `
            )
            .order(
                "visit_date",
                {
                    ascending: false
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
    );

}


/* =========================================================
   LOAD REPORTS
   ========================================================= */

async function dashboardLoadReports() {

    return dashboardFetchAllRows(
        () =>
            CMS_DASHBOARD_SUPABASE
            .from(
                "weekly_reports"
            )
            .select(
                `
                id,
                cell_id,
                report_date,
                status,
                meeting_location,
                members_life,
                activity_done,
                challenges_needs,
                follow_up_needed,
                next_week_plan,
                additional_comments,
                created_by,
                created_at,
                updated_at,
                submitted_at
                `
            )
            .order(
                "report_date",
                {
                    ascending: false
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
    );

}


/* =========================================================
   LOAD FOLLOW-UPS
   ========================================================= */

async function dashboardLoadFollowUps() {

    return dashboardFetchAllRows(
        () =>
            CMS_DASHBOARD_SUPABASE
            .from(
                "follow_ups"
            )
            .select(
                `
                id,
                cell_id,
                member_id,
                report_id,
                subject,
                description,
                priority,
                status,
                due_date,
                assigned_to,
                action_taken,
                next_action,
                completed_at,
                created_at,
                updated_at
                `
            )
            .order(
                "due_date",
                {
                    ascending: false
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
    );

}


/* =========================================================
   LOAD EVANGELISM
   ========================================================= */

async function dashboardLoadEvangelism() {

    return dashboardFetchAllRows(
        () =>
            CMS_DASHBOARD_SUPABASE
            .from(
                "evangelism"
            )
            .select(
                `
                id,
                cell_id,
                leader_id,
                evangelism_date,
                location,
                people_reached,
                decisions,
                follow_up_needed,
                notes,
                created_at,
                updated_at,
                evangelism_type,
                new_people,
                saved,
                in_progress,
                interested,
                not_yet,
                people,
                details,
                next_action
                `
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
    );

}

/* =========================================================
   ATTENDANCE ANALYTICS
   ========================================================= */

function calculateDashboardAttendance() {

    const rows =
        Array.isArray(
            cmsDashboardData.attendance
        )
            ? cmsDashboardData.attendance
            : [];


    const sessions =
        Array.isArray(
            cmsDashboardData.attendanceSessions
        )
            ? cmsDashboardData.attendanceSessions
            : [];


    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;


    /* =====================================================
       COUNT MEMBER ATTENDANCE STATUS
       ===================================================== */

    rows.forEach(
        function(row) {

            const status =
                dashboardStatus(
                    row.status
                );


            if (
                status === "present"
            ) {

                present++;

            }

            else if (
                status === "absent"
            ) {

                absent++;

            }

            else if (
                status === "late"
            ) {

                late++;

            }

            else if (
                status === "excused"
            ) {

                excused++;

            }

        }
    );


    const attended =
        present +
        late;


    /*
       IMPORTANT:

       "total" now means REAL ATTENDANCE SESSIONS,
       not individual member attendance rows.
    */
    const total =
        sessions.length;


    /*
       Attendance percentage still uses
       the individual member attendance rows,
       because that is what determines the
       actual attendance rate.
    */
    const totalPeople =
        present +
        absent +
        late +
        excused;


    const rate =
        totalPeople > 0
            ? Math.round(
                (
                    attended /
                    totalPeople
                ) * 100
            )
            : 0;


    return {

        total,

        sessions:
            total,

        peopleRows:
            rows.length,

        present,

        absent,

        late,

        excused,

        rate

    };

}

/* =========================================================
   EVANGELISM ANALYTICS
   ========================================================= */

function calculateDashboardEvangelism() {

    const rows =
        cmsDashboardData.evangelism;


    let reached = 0;

    let newPeople = 0;

    let saved = 0;

    let inProgress = 0;

    let interested = 0;

    let followUpNeeded = 0;

    let notYet = 0;


    rows.forEach(
        row => {

            reached +=
                dashboardNumber(
                    row.people_reached
                );


            newPeople +=
                dashboardNumber(
                    row.new_people
                );


            saved +=
                dashboardNumber(
                    row.saved
                );


            inProgress +=
                dashboardNumber(
                    row.in_progress
                );


            interested +=
                dashboardNumber(
                    row.interested
                );


            followUpNeeded +=
                dashboardNumber(
                    row.follow_up_needed
                );


            notYet +=
                dashboardNumber(
                    row.not_yet
                );

        }
    );


    return {

        activities:
            rows.length,

        reached,

        newPeople,

        saved,

        inProgress,

        interested,

        followUpNeeded,

        notYet

    };

}


/* =========================================================
   FOLLOW-UP ANALYTICS
   ========================================================= */

function calculateDashboardFollowUps() {

    const rows =
        cmsDashboardData.followUps;


    const pending =
        rows.filter(
            row =>
                dashboardStatus(
                    row.status
                ) ===
                "pending"
        ).length;


    const inProgress =
        rows.filter(
            row =>
                dashboardStatus(
                    row.status
                ) ===
                "in progress"
        ).length;


    const completed =
        rows.filter(
            row =>
                dashboardStatus(
                    row.status
                ) ===
                "completed"
        ).length;


    const total =
        rows.length;


    const completionRate =
        total > 0
            ? Math.round(
                (
                    completed /
                    total
                ) * 100
            )
            : 0;


    return {

        total,

        pending,

        inProgress,

        completed,

        completionRate

    };

}


/* =========================================================
   REPORT ANALYTICS
   ========================================================= */

function calculateDashboardReports() {

    const reports =
        cmsDashboardData.reports;


    const submitted =
        reports.filter(
            report =>
                dashboardStatus(
                    report.status
                ) ===
                "submitted"
        ).length;


    const drafts =
        reports.filter(
            report =>
                dashboardStatus(
                    report.status
                ) ===
                "draft"
        ).length;


    const activeCells =
        cmsDashboardData.cells
            .filter(
                cell =>
                    cell.active !==
                    false
            ).length;


    const cellsWithReports =
        new Set(
            reports.map(
                report =>
                    String(
                        report.cell_id
                    )
            )
        );


    const coverage =
        activeCells > 0
            ? Math.round(
                (
                    cellsWithReports.size /
                    activeCells
                ) * 100
            )
            : 0;


    return {

        total:
            reports.length,

        submitted,

        drafts,

        coverage

    };

}


/* =========================================================
   ACTIVE MEMBERS
   ========================================================= */

function dashboardGetActiveMembers() {

    return cmsDashboardData.members
        .filter(
            member =>
                member.active !==
                false
        );

}


/* =========================================================
   ATTENDANCE PEOPLE
   ========================================================= */

function dashboardGetAttendancePeople() {

    const ids =
        new Set();


    cmsDashboardData.attendance
        .forEach(
            row => {

                if (
                    row.member_id
                ) {

                    ids.add(
                        String(
                            row.member_id
                        )
                    );

                }

            }
        );


    return ids.size;

}


/* =========================================================
   CELL NAME
   ========================================================= */

function dashboardCellName(
    cellId
) {

    const cell =
        cmsDashboardData.cells
            .find(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        cellId
                    )
            );


    return (
        cell?.name ||
        "Unknown Cell"
    );

}


/* =========================================================
   MEMBER NAME
   ========================================================= */

function dashboardMemberName(
    memberId
) {

    const member =
        cmsDashboardData.members
            .find(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        memberId
                    )
            );


    if (!member) {

        return "Unknown Member";

    }


    return [

        member.first_name,

        member.last_name

    ]
        .filter(Boolean)
        .join(" ")
        .trim()
        ||
        "Unknown Member";

}


/* =========================================================
   VISITOR NAME
   ========================================================= */

function dashboardVisitorName(
    visitorId
) {

    const visitor =
        cmsDashboardData.visitors
            .find(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        visitorId
                    )
            );


    if (!visitor) {

        return "Unknown Visitor";

    }


    return (
        visitor.full_name ||
        "Unknown Visitor"
    );

}


/* =========================================================
   RECENT REPORTS
   ========================================================= */

function dashboardRenderRecentReports() {

    const tableBody =
        document.getElementById(
            "weeklyReportsTableBody"
        );


    const oldContainer =
        document.getElementById(
            "recentReports"
        );


    const reports =
        cmsDashboardData.reports
            .slice(
                0,
                5
            );


    if (
        tableBody
    ) {

        tableBody.innerHTML =
            "";


        if (!reports.length) {

            tableBody.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        class="empty-row"
                    >
                        No weekly reports available.
                    </td>

                </tr>

            `;

            return;

        }


        reports.forEach(
            report => {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${escapeDashboardHTML(
                            dashboardCellName(
                                report.cell_id
                            )
                        )}
                    </td>

                    <td>
                        ${escapeDashboardHTML(
                            report.report_date ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeDashboardHTML(
                            report.activity_done ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeDashboardHTML(
                            report.follow_up_needed ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeDashboardHTML(
                            report.status ||
                            "—"
                        )}
                    </td>

                `;


                tableBody.appendChild(
                    row
                );

            }
        );


        return;

    }


    if (
        !oldContainer
    ) {

        return;

    }


    oldContainer.innerHTML =
        "";


    if (!reports.length) {

        oldContainer.innerHTML =
            "<p>No weekly reports available.</p>";

        return;

    }


    reports.forEach(
        report => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "dashboard-list-item";


            row.innerHTML = `

                <div>

                    <strong>
                        ${escapeDashboardHTML(
                            dashboardCellName(
                                report.cell_id
                            )
                        )}
                    </strong>

                    <small>
                        ${escapeDashboardHTML(
                            report.report_date ||
                            ""
                        )}
                    </small>

                </div>

                <span>
                    ${escapeDashboardHTML(
                        report.status ||
                        ""
                    )}
                </span>

            `;


            oldContainer.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   RECENT FOLLOW-UPS
   ========================================================= */

function dashboardRenderRecentFollowUps() {

    const tableBody =
        document.getElementById(
            "followUpsTableBody"
        );


    const oldContainer =
        document.getElementById(
            "recentFollowUps"
        );


    const rows =
        cmsDashboardData.followUps
            .slice(
                0,
                5
            );


    if (
        tableBody
    ) {

        tableBody.innerHTML =
            "";


        if (!rows.length) {

            tableBody.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        class="empty-row"
                    >
                        No follow-ups available.
                    </td>

                </tr>

            `;

            return;

        }


        rows.forEach(
            rowData => {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${escapeDashboardHTML(
                            dashboardMemberName(
                                rowData.member_id
                            )
                        )}
                    </td>

                    <td>
                        ${escapeDashboardHTML(
                            dashboardCellName(
                                rowData.cell_id
                            )
                        )}
                    </td>

                    <td>
                        ${escapeDashboardHTML(
                            rowData.due_date ||
                            rowData.created_at ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeDashboardHTML(
                            rowData.subject ||
                            rowData.description ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeDashboardHTML(
                            rowData.status ||
                            "—"
                        )}
                    </td>

                `;


                tableBody.appendChild(
                    row
                );

            }
        );


        return;

    }


    if (
        !oldContainer
    ) {

        return;

    }


    oldContainer.innerHTML =
        "";


    if (!rows.length) {

        oldContainer.innerHTML =
            "<p>No follow-ups available.</p>";

        return;

    }


    rows.forEach(
        rowData => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "dashboard-list-item";


            div.innerHTML = `

                <div>

                    <strong>
                        ${escapeDashboardHTML(
                            dashboardMemberName(
                                rowData.member_id
                            )
                        )}
                    </strong>

                    <small>
                        ${escapeDashboardHTML(
                            dashboardCellName(
                                rowData.cell_id
                            )
                        )}
                    </small>

                </div>

                <span>
                    ${escapeDashboardHTML(
                        rowData.status ||
                        ""
                    )}
                </span>

            `;


            oldContainer.appendChild(
                div
            );

        }
    );

}


/* =========================================================
   CELLS OVERVIEW
   ========================================================= */

function dashboardRenderCellsOverview() {

    const tableBody =
        document.getElementById(
            "cellsOverviewBody"
        );


    const oldContainer =
        document.getElementById(
            "cellsOverview"
        );


    if (
        tableBody
    ) {

        tableBody.innerHTML =
            "";


        cmsDashboardData.cells
            .forEach(
                cell => {

                    const membersCount =
                        cmsDashboardData.members
                            .filter(
                                member =>
                                    String(
                                        member.cell_id
                                    ) ===
                                    String(
                                        cell.id
                                    )
                                    &&
                                    member.active !==
                                    false
                            )
                            .length;


                    const leadersCount =
                        cmsDashboardData.leaders
                            .filter(
                                leader =>
                                    String(
                                        leader.cell_id
                                    ) ===
                                    String(
                                        cell.id
                                    )
                            )
                            .length;


                    const reportsCount =
                        cmsDashboardData.reports
                            .filter(
                                report =>
                                    String(
                                        report.cell_id
                                    ) ===
                                    String(
                                        cell.id
                                    )
                            )
                            .length;


                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `

                        <td>
                            ${escapeDashboardHTML(
                                cell.name ||
                                "Unknown Cell"
                            )}
                        </td>

                        <td>
                            ${leadersCount}
                        </td>

                        <td>
                            ${membersCount}
                        </td>

                        <td>
                            ${reportsCount}
                        </td>

                        <td>
                            ${cell.active !== false
                                ? "Active"
                                : "Inactive"}
                        </td>

                    `;


                    tableBody.appendChild(
                        row
                    );

                }
            );


        return;

    }


    if (
        !oldContainer
    ) {

        return;

    }


    oldContainer.innerHTML =
        "";


    cmsDashboardData.cells
        .forEach(
            cell => {

                const membersCount =
                    cmsDashboardData.members
                        .filter(
                            member =>
                                String(
                                    member.cell_id
                                ) ===
                                String(
                                    cell.id
                                )
                                &&
                                member.active !==
                                false
                        )
                        .length;


                const leadersCount =
                    cmsDashboardData.leaders
                        .filter(
                            leader =>
                                String(
                                    leader.cell_id
                                ) ===
                                String(
                                    cell.id
                                )
                        )
                        .length;


                const reportsCount =
                    cmsDashboardData.reports
                        .filter(
                            report =>
                                String(
                                    report.cell_id
                                ) ===
                                String(
                                    cell.id
                                )
                        )
                        .length;


                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "dashboard-list-item";


                row.innerHTML = `

                    <div>

                        <strong>
                            ${escapeDashboardHTML(
                                cell.name
                            )}
                        </strong>

                        <small>
                            ${membersCount}
                            member(s)
                            ·
                            ${leadersCount}
                            leader(s)
                            ·
                            ${reportsCount}
                            report(s)
                        </small>

                    </div>

                `;


                oldContainer.appendChild(
                    row
                );

            }
        );

}


/* =========================================================
   CELLS NEEDING ATTENTION
   ========================================================= */

function dashboardRenderCellsNeedingAttention() {

    const container =
        document.getElementById(
            "cells-needing-attention"
        );


    const oldContainer =
        document.getElementById(
            "cellsNeedingAttention"
        );


    const target =
        container ||
        oldContainer;


    if (!target) {

        return;

    }


    const rows = [];


    const activeCells =
        cmsDashboardData.cells
            .filter(
                cell =>
                    cell.active !== false
            );


    activeCells.forEach(
        cell => {

            const members =
                cmsDashboardData.members
                    .filter(
                        member =>
                            String(
                                member.cell_id
                            ) ===
                            String(
                                cell.id
                            )
                            &&
                            member.active !==
                            false
                    );


            const leaders =
                cmsDashboardData.leaders
                    .filter(
                        leader =>
                            String(
                                leader.cell_id
                            ) ===
                            String(
                                cell.id
                            )
                            &&
                            leader.active !==
                            false
                    );

            const leaderNames =
                leaders
                    .map(
                        leader =>
                            String(
                                leader.full_name || ""
                            ).trim()
                    )
                    .filter(Boolean);


            const recentReports =
                cmsDashboardData.reports
                    .filter(
                        report =>
                            String(
                                report.cell_id
                            ) ===
                            String(
                                cell.id
                            )
                    );


            const recentAttendanceSessions =
                cmsDashboardData.attendanceSessions
                    .filter(
                        session =>
                            String(
                                session.cell_id
                            ) ===
                            String(
                                cell.id
                            )
                    );


            const openFollowUps =
                cmsDashboardData.followUps
                    .filter(
                        item =>
                            String(
                                item.cell_id
                            ) ===
                            String(
                                cell.id
                            )
                            &&
                            dashboardStatus(
                                item.status
                            ) !==
                            "completed"
                    );


            const reasons = [];


            if (
                members.length ===
                0
            ) {

                reasons.push(
                    "No active members"
                );

            }


            if (
                leaders.length ===
                0
            ) {

                reasons.push(
                    "No cell leader assigned"
                );

            }


            const latestAttendance =
                recentAttendanceSessions
                    .filter(
                        session =>
                            dashboardDateKey(
                                session.meeting_date
                            )
                    )
                    .sort(
                        (left, right) =>
                            dashboardDateKey(
                                right.meeting_date
                            ).localeCompare(
                                dashboardDateKey(
                                    left.meeting_date
                                )
                            )
                            ||
                            String(
                                right.created_at || ""
                            ).localeCompare(
                                String(
                                    left.created_at || ""
                                )
                            )
                    )[0] ||
                null;


            const latestMeetingAttendance =
                latestAttendance
                    ? cmsDashboardData.attendance
                        .filter(
                            record =>
                                String(
                                    record.session_id
                                ) ===
                                String(
                                    latestAttendance.id
                                )
                        )
                    : [];

            const activeMemberIds =
                new Set(
                    members.map(
                        member =>
                            String(
                                member.id
                            )
                    )
                );


            const markedMemberIds =
                new Set(
                    latestMeetingAttendance
                        .filter(
                            record =>
                                record.member_id !==
                                null
                                &&
                                record.member_id !==
                                undefined
                                &&
                                activeMemberIds.has(
                                    String(
                                        record.member_id
                                    )
                                )
                        )
                        .map(
                            record =>
                                String(
                                    record.member_id
                                )
                        )
                );


            const latestReport =
                latestAttendance
                    ? recentReports.find(
                        report =>
                            dashboardDateKey(
                                report.report_date
                            ) ===
                            dashboardDateKey(
                                latestAttendance.meeting_date
                            )
                            &&
                            dashboardIsSubmittedReport(
                                report
                            )
                    )
                    : null;


            const meetingDateKey =
                dashboardDateKey(
                    latestAttendance?.meeting_date
                );


            const nextMeetingDueDate =
                meetingDateKey
                    ? dashboardAddDaysToDateKey(
                        meetingDateKey,
                        7
                    )
                    : "";


            const weeklyCycleOverdue =
                Boolean(
                    nextMeetingDueDate
                    &&
                    dashboardTodayDateKey() >=
                    nextMeetingDueDate
                );


            const reportIssueReason =
                !latestReport
                    ? "No submitted report for latest meeting"
                    : weeklyCycleOverdue
                        ? `No report for weekly meeting due ${dashboardFormatDateKey(nextMeetingDueDate)}`
                        : "";


            const reportIssue =
                !latestReport ||
                weeklyCycleOverdue;


            const attendanceIssue =
                !latestAttendance ||
                (
                    members.length > 0
                        ? markedMemberIds.size <
                            members.length
                        : latestMeetingAttendance.length === 0
                ) ||
                weeklyCycleOverdue;


            const attendanceIssueReason =
                !latestAttendance
                    ? "No meeting attendance recorded"
                    : latestMeetingAttendance.length === 0 ||
                        (
                            members.length > 0 &&
                            markedMemberIds.size === 0
                        )
                        ? "No attendance recorded for latest meeting"
                        : members.length > 0 &&
                            markedMemberIds.size < members.length
                            ? "Attendance incomplete for latest meeting"
                            : `No attendance for weekly meeting due ${dashboardFormatDateKey(nextMeetingDueDate)}`;


            const meetingDate =
                latestAttendance
                    ? dashboardFormatDateKey(
                        dashboardDateKey(
                            latestAttendance.meeting_date
                        )
                    )
                    : "No meeting recorded";


            if (reportIssue) {

                reasons.push(
                    reportIssueReason
                );

            }


            if (attendanceIssue) {

                reasons.push(
                    attendanceIssueReason
                );

            }


            if (
                openFollowUps.length >=
                3
            ) {

                reasons.push(
                    `${openFollowUps.length} open follow-ups`
                );

            }


            if (
                reasons.length
            ) {

                rows.push({

                    cell,

                    meetingDate,
                    leaderNames,
                    reasons,
                    reportIssue,
                    reportIssueReason,
                    attendanceIssue,
                    attendanceIssueReason

                });

            }

        }
    );


    target.innerHTML =
        "";


    if (!rows.length) {

        target.innerHTML = `

            <div class="attention-empty">
                All active cells have attendance and submitted reports for their latest recorded meeting.
            </div>

        `;

        return;

    }


    const table = document.createElement("table");
    table.className = "attention-table";
    table.innerHTML = `
        <thead>
            <tr>
                <th scope="col">Cell</th>
                <th scope="col">Meeting date</th>
                <th scope="col">Members</th>
                <th scope="col">Leader(s)</th>
                <th scope="col">Weekly report</th>
                <th scope="col">Attendance</th>
                <th scope="col">Follow-ups</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tableBody = table.querySelector("tbody");

    rows
        .forEach(item => {
            const reasonSet = new Set(item.reasons);
            const status = reason => reasonSet.has(reason)
                ? `<span class="attention-status attention-status-warning">${escapeDashboardHTML(reason)}</span>`
                : `<span class="attention-status attention-status-ok">No issue</span>`;

            const followUpReason = item.reasons.find(
                reason => reason.endsWith("open follow-ups")
            );

            const row = document.createElement("tr");
            row.innerHTML = `
                <th scope="row">${escapeDashboardHTML(item.cell.name)}</th>
                <td>${escapeDashboardHTML(item.meetingDate)}</td>
                <td>${status("No active members")}</td>
                <td>${item.leaderNames.length
                    ? `<span class="attention-leader-names">${item.leaderNames.map(escapeDashboardHTML).join(", ")}</span>${item.reportIssue
                        ? `<span class="attention-status attention-status-warning">Report pending</span>`
                        : ""}`
                    : status("No cell leader assigned")}</td>
                <td>${item.reportIssue
                    ? `<span class="attention-status attention-status-warning">${escapeDashboardHTML(item.reportIssueReason)}</span>`
                    : `<span class="attention-status attention-status-ok">Submitted</span>`}</td>
                <td>${item.attendanceIssue
                    ? `<span class="attention-status attention-status-warning">${escapeDashboardHTML(item.attendanceIssueReason)}</span>`
                    : `<span class="attention-status attention-status-ok">Recorded</span>`}</td>
                <td>${followUpReason
                    ? `<span class="attention-status attention-status-warning">${escapeDashboardHTML(followUpReason)}</span>`
                    : `<span class="attention-status attention-status-ok">No open follow-ups</span>`}</td>
            `;

            tableBody.appendChild(row);
        });

    target.appendChild(table);

}


/* =========================================================
   MEETING DATE HELPERS
   ========================================================= */

function dashboardDateKey(
    value
) {

    if (!value) {

        return "";

    }


    const dateKey =
        String(value)
            .slice(0, 10);


    return /^\d{4}-\d{2}-\d{2}$/.test(dateKey)
        ? dateKey
        : "";

}


function dashboardFormatDateKey(
    dateKey
) {

    if (!dateKey) {

        return "Unknown date";

    }


    const date =
        new Date(
            `${dateKey}T00:00:00`
        );


    return Number.isNaN(
        date.getTime()
    )
        ? dateKey
        : date.toLocaleDateString(
            undefined,
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

}


function dashboardAddDaysToDateKey(
    dateKey,
    days
) {

    const date =
        new Date(
            `${dateKey}T00:00:00Z`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    date.setUTCDate(
        date.getUTCDate() +
        days
    );


    return date.toISOString()
        .slice(0, 10);

}


function dashboardTodayDateKey() {

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


function dashboardIsSubmittedReport(
    report
) {

    return dashboardStatus(
        report.status
    ) === "submitted"
        ||
        Boolean(
            report.submitted_at
        );

}


function dashboardRenderWeeklyCellComparison() {

    const container =
        document.getElementById(
            "weekly-cell-comparison"
        );

    const select =
        document.getElementById(
            "meeting-week-select"
        );

    const summary =
        document.getElementById(
            "meeting-week-summary"
        );


    if (
        !container ||
        !select ||
        !summary
    ) {

        return;

    }


    const previousDate =
        select.value;


    const activeCells =
        cmsDashboardData.cells
            .filter(
                cell =>
                    cell.active !== false
            )
            .sort(
                (left, right) =>
                    String(left.name || "")
                        .localeCompare(
                            String(right.name || "")
                        )
            );


    const activeCellIds =
        new Set(
            activeCells.map(
                cell =>
                    String(
                        cell.id
                    )
            )
        );


    const meetingDates =
        Array.from(
            new Set(
                cmsDashboardData.attendanceSessions
                    .filter(
                        session =>
                            activeCellIds.has(
                                String(
                                    session.cell_id
                                )
                            )
                    )
                    .map(
                        session =>
                            dashboardDateKey(
                                session.meeting_date
                            )
                    )
                    .filter(Boolean)
            )
        )
            .sort()
            .reverse();


    select.innerHTML =
        meetingDates
            .map(
                dateKey =>
                    `<option value="${escapeDashboardHTML(dateKey)}">${escapeDashboardHTML(dashboardFormatDateKey(dateKey))}</option>`
            )
            .join("");


    if (!meetingDates.length) {

        summary.textContent =
            "No cell meeting dates have been recorded yet.";

        container.innerHTML = `
            <div class="attention-empty">
                Record meeting attendance to start comparing cells.
            </div>
        `;

        return;

    }


    select.value =
        meetingDates.includes(previousDate)
            ? previousDate
            : meetingDates[0];


    const selectedDate =
        select.value;

    const weekStartValue =
        new Date(
            `${selectedDate}T00:00:00Z`
        );


    weekStartValue.setUTCDate(
        weekStartValue.getUTCDate() - 6
    );


    const weekStart =
        weekStartValue.toISOString()
            .slice(0, 10);


    const comparisonRows =
        activeCells.map(
            cell => {
                const meetings =
                    cmsDashboardData.attendanceSessions
                        .filter(
                            session => {
                                const meetingDate =
                                    dashboardDateKey(
                                        session.meeting_date
                                    );

                                return String(
                                    session.cell_id
                                ) ===
                                String(
                                    cell.id
                                )
                                    &&
                                    meetingDate >= weekStart
                                    &&
                                    meetingDate <= selectedDate;
                            }
                        )
                        .sort(
                            (left, right) =>
                                dashboardDateKey(
                                    right.meeting_date
                                ).localeCompare(
                                    dashboardDateKey(
                                        left.meeting_date
                                    )
                                )
                                ||
                                String(
                                    right.created_at || ""
                                ).localeCompare(
                                    String(
                                        left.created_at || ""
                                    )
                                )
                        );

                const members =
                    cmsDashboardData.members
                        .filter(
                            member =>
                                String(
                                    member.cell_id
                                ) ===
                                String(
                                    cell.id
                                )
                                &&
                                member.active !==
                                false
                        );


                const activeMemberIds =
                    new Set(
                        members.map(
                            member =>
                                String(
                                    member.id
                                )
                        )
                    );


                const meetingStats =
                    meetings.map(
                        meeting => {
                            const meetingAttendance =
                                cmsDashboardData.attendance
                                    .filter(
                                        record =>
                                            String(
                                                record.session_id
                                            ) ===
                                            String(
                                                meeting.id
                                            )
                                    );

                            const presentMemberIds =
                                new Set(
                                    meetingAttendance
                                        .filter(
                                            record =>
                                                dashboardStatus(
                                                    record.status
                                                ) === "present"
                                                &&
                                                record.member_id !==
                                                null
                                                &&
                                                record.member_id !==
                                                undefined
                                                &&
                                                activeMemberIds.has(
                                                    String(
                                                        record.member_id
                                                    )
                                                )
                                        )
                                        .map(
                                            record =>
                                                String(
                                                    record.member_id
                                                )
                                        )
                                );

                            return {
                                meeting,
                                presentCount:
                                    presentMemberIds.size,
                                attendancePercent:
                                    members.length
                                        ? presentMemberIds.size /
                                            members.length *
                                            100
                                        : 0
                            };
                        }
                    );

                const averageAttendancePercent =
                    meetingStats.length
                        ? Math.round(
                            meetingStats.reduce(
                                (sum, item) =>
                                    sum +
                                    item.attendancePercent,
                                0
                            ) /
                            meetingStats.length
                        )
                        : 0;

                const typicalAttendance =
                    meetingStats.length
                        ? Math.round(
                            meetingStats.reduce(
                                (sum, item) =>
                                    sum +
                                    item.presentCount,
                                0
                            ) /
                            meetingStats.length
                        )
                        : 0;

                const submittedMeetingDates =
                    new Set(
                        cmsDashboardData.reports
                            .filter(
                                report =>
                                    String(
                                        report.cell_id
                                    ) ===
                                    String(
                                        cell.id
                                    )
                                    &&
                                    dashboardIsSubmittedReport(
                                        report
                                    )
                            )
                            .map(
                                report =>
                                    dashboardDateKey(
                                        report.report_date
                                    )
                            )
                            .filter(Boolean)
                    );

                const submittedReportCount =
                    new Set(
                        meetingStats
                            .filter(
                                item =>
                                    submittedMeetingDates.has(
                                        dashboardDateKey(
                                            item.meeting.meeting_date
                                        )
                                    )
                            )
                            .map(
                                item =>
                                    dashboardDateKey(
                                        item.meeting.meeting_date
                                    )
                            )
                    ).size;

                const reportPercent =
                    meetings.length
                        ? Math.round(
                            submittedReportCount /
                            meetings.length *
                            100
                        )
                        : 0;


                return {
                    cell,
                    averageAttendancePercent,
                    typicalAttendance,
                    meetingCount: meetings.length,
                    submittedReportCount,
                    reportPercent,
                    latestMeetingDate: meetings.length
                        ? dashboardDateKey(
                            meetings[0].meeting_date
                        )
                        : ""
                };
            }
        );


    const meetingCount =
        comparisonRows.filter(
            item =>
                item.meetingCount > 0
        ).length;


    summary.textContent =
        `Attendance by cell for meetings from ${dashboardFormatDateKey(weekStart)} to ${dashboardFormatDateKey(selectedDate)}. Attendance is the average percentage present per meeting; typical attendance is the average number present. Reports count only when submitted for the meeting date.`;


    container.innerHTML =
        "";


    if (!comparisonRows.length) {

        container.innerHTML = `
            <div class="attention-empty">
                No active cells are available to compare.
            </div>
        `;

        return;

    }


    container.innerHTML = `
        <div class="weekly-comparison-table-wrap">
            <table class="weekly-comparison-table">
                <thead>
                    <tr>
                        <th scope="col">Cell</th>
                        <th scope="col">Avg. attendance</th>
                        <th scope="col">Typical attendance</th>
                        <th scope="col">Meetings</th>
                        <th scope="col">Reports submitted</th>
                        <th scope="col">Attendance profile</th>
                    </tr>
                </thead>
                <tbody>
                    ${comparisonRows
                        .map(
                            item => `
                                <tr>
                                    <th scope="row">
                                        <span class="weekly-comparison-cell">${escapeDashboardHTML(item.cell.name)}</span>
                                        <small>${item.latestMeetingDate
                                            ? `Latest meeting ${escapeDashboardHTML(dashboardFormatDateKey(item.latestMeetingDate))}`
                                            : "No meeting this week"}</small>
                                    </th>
                                    <td>${item.averageAttendancePercent}%</td>
                                    <td>${item.typicalAttendance} present</td>
                                    <td>${item.meetingCount}</td>
                                    <td>
                                        <span class="weekly-comparison-report">${item.submittedReportCount}/${item.meetingCount} (${item.reportPercent}%)</span>
                                    </td>
                                    <td>
                                        <div
                                            class="weekly-comparison-track"
                                            role="progressbar"
                                            aria-label="${escapeDashboardHTML(item.cell.name)} average attendance"
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                            aria-valuenow="${item.averageAttendancePercent}"
                                        >
                                            <div class="weekly-comparison-bar" style="width: ${item.averageAttendancePercent}%"></div>
                                        </div>
                                    </td>
                                </tr>
                            `
                        )
                        .join("")}
                </tbody>
            </table>
        </div>
    `;


    summary.textContent +=
        ` ${meetingCount} of ${comparisonRows.length} active cells recorded a meeting in this week.`;


    select.onchange =
        dashboardRenderWeeklyCellComparison;

}


/* =========================================================
   VISITOR ANALYTICS
   ========================================================= */


function calculateDashboardVisitors() {

    const visitors =
        cmsDashboardData.visitors ||
        [];


    const visits =
        cmsDashboardData.visitorVisits ||
        [];


    const converted =
        visitors.filter(
            visitor =>
                visitor.converted_to_member ===
                true
        );


    return {

        total:
            visitors.filter(
                visitor =>
                    visitor.active !== false
            ).length,

        visits:
            visits.length,

        converted:
            converted.length

    };

}


/* =========================================================
   OVERALL ANALYTICS
   ========================================================= */

function calculateDashboardOverall() {

    const activeMembers =
        dashboardGetActiveMembers()
            .length;


    const attendancePeople =
        dashboardGetAttendancePeople();


    const reportStats =
        calculateDashboardReports();


    const followUpStats =
        calculateDashboardFollowUps();


    const evangelismStats =
        calculateDashboardEvangelism();


    return {

        activeMembers,

        attendancePeople,

        reportCoverage:
            reportStats.coverage,

        followUpCompletion:
            followUpStats.completionRate,

        peopleReached:
            evangelismStats.reached

    };

}


/* =========================================================
   CELL LEADER DASHBOARD PRESENTATION
   ========================================================= */

function dashboardApplyCellLeaderPresentation() {

    if (
        cmsDashboardRole !==
        "cell_leader"
    ) {

        return;

    }


    if (
        !cmsDashboardMyCell
    ) {

        return;

    }


    const cellName =
        cmsDashboardMyCell.cell_name ||
        "My Cell";

/* =====================================================
   SHOW ALL LEADERS ASSIGNED TO MY CELL
   ===================================================== */

const myCellId =
    cmsDashboardMyCell.cell_id;


const myCellLeaders =
    (cmsDashboardData.leaders || [])
        .filter(
            leader =>
                String(
                    leader.cell_id
                ) ===
                String(
                    myCellId
                )
        );


const leadersCardValue =
    document.getElementById(
        "total-leaders"
    );


if (leadersCardValue) {

    leadersCardValue.textContent =
        myCellLeaders.length;

}
    /* =====================================================
       TOP BAR
       ===================================================== */

    dashboardUpdateCellLeaderHeading();


    /* =====================================================
       WELCOME
       ===================================================== */

    const welcomeSection =
        document.querySelector(
            ".welcome-section"
        );


    if (welcomeSection) {

        const heading =
            welcomeSection.querySelector(
                "h2"
            );


        const paragraphs =
            welcomeSection.querySelectorAll(
                "p"
            );


        if (heading) {

            heading.textContent =
                "Welcome back! 👋";

        }


        if (
            paragraphs[0]
        ) {

            paragraphs[0].textContent =
                `Welcome to your ${cellName} dashboard. Manage your members, attendance, weekly report, follow-ups, evangelism, visitors and records from one place.`;

        }

    }


    /* =====================================================
       SIDEBAR
       ===================================================== */

    dashboardHideCoordinatorNavigation();

    dashboardRestoreCellLeaderVisitors();


    /* =====================================================
       CORE STAT CARDS
       ===================================================== */

    const labelMappings = {

        "total-cells":
            "My Cell",

        "total-leaders":
            "Cell Leaders",

        "total-members":
            "My Members",

        "total-reports":
            "Weekly Reports",

        "total-followups":
            "Follow-ups"

    };


    const descriptionMappings = {

        "total-cells":
            "Assigned cell",

        "total-leaders":
            myCellLeaders.length === 0
                ? "No leader assigned"
                : `Leaders: ${
                    myCellLeaders
                        .map(
                            leader =>
                                leader.full_name ||
                                "—"
                        )
                        .join(
                            " & "
                        )
                }`,

        "total-members":
            "Members in my cell",

        "total-reports":
            "Reports from my cell",

        "total-followups":
            "Follow-ups from my cell"

    };


    Object.entries(
        labelMappings
    )
        .forEach(
            ([id, label]) => {

                const valueElement =
                    document.getElementById(
                        id
                    );


                if (!valueElement) {

                    return;

                }


                const card =
                    valueElement.closest(
                        ".stat-card, .card, .dashboard-card"
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


                if (heading) {

                    heading.textContent =
                        label;

                }


                if (description) {

                    description.textContent =
                        descriptionMappings[id] ||
                        description.textContent;

                }

            }
        );

/* =====================================================
   SHARED CELL LEADERS
   -----------------------------------------------------
   Show the active leaders assigned to this same cell.
   The number comes from the shared Supabase data.
   ===================================================== */

const cellLeadersValueElement =
    document.getElementById(
        "total-leaders"
    );


if (
    cellLeadersValueElement
) {

    const cellLeadersCard =
        cellLeadersValueElement.closest(
            ".stat-card, .card, .dashboard-card"
        );


    if (
        cellLeadersCard
    ) {

        const cellLeadersDescription =
            cellLeadersCard.querySelector(
                "small"
            );


        const sharedCellLeaders =
            (
                cmsDashboardData?.leaders ||
                []
            )
                .filter(
                    leader => {

                        return (
                            String(
                                leader.cell_id
                            ) ===
                            String(
                                cmsDashboardMyCell.cell_id
                            )
                            &&
                            leader.active !== false
                        );

                    }
                );


        const leaderNames =
            sharedCellLeaders
                .map(
                    leader =>
                        String(
                            leader.full_name ||
                            ""
                        ).trim()
                )
                .filter(
                    Boolean
                );


        if (
            cellLeadersDescription
        ) {

            cellLeadersDescription.textContent =

                leaderNames.length

                    ? leaderNames.join(
                        " • "
                    )

                    : "No active co-leader";

        }

    }

}
    /* =====================================================
       VISITOR STAT CARD
       ===================================================== */

    const totalVisitorsElement =
        document.getElementById(
            "total-visitors"
        );


    if (totalVisitorsElement) {

        const visitorCard =
            totalVisitorsElement.closest(
                ".stat-card, .card, .dashboard-card"
            );


        if (visitorCard) {

            visitorCard.removeAttribute(
                "data-coordinator-only"
            );


            visitorCard.style.display =
                "";


            const heading =
                visitorCard.querySelector(
                    "h3"
                );


            const description =
                visitorCard.querySelector(
                    "small"
                );


            if (heading) {

                heading.textContent =
                    "Visitors";

            }


            if (description) {

                description.textContent =
                    "Visitors in my cell";

            }

        }

    }


    /* =====================================================
       QUICK ACTIONS
       ===================================================== */

    const quickActions =
        document.querySelector(
            ".dashboard-actions"
        );


    if (quickActions) {

        quickActions
            .querySelectorAll(
                "a[href]"
            )
            .forEach(
                link => {

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


                    link.style.display =
                        "";


                    if (
                        href.includes(
                            "members.html"
                        )
                    ) {

                        link.textContent =
                            "👤 My Members";

                    }

                    else if (
                        href.includes(
                            "attendance.html"
                        )
                    ) {

                        link.textContent =
                            "📋 Attendance";

                    }

                    else if (
                        href.includes(
                            "weekly-reports.html"
                        )
                    ) {

                        link.textContent =
                            "📝 Weekly Report";

                    }

                    else if (
                        href.includes(
                            "follow-ups.html"
                        )
                    ) {

                        link.textContent =
                            "🔄 Follow-ups";

                    }

                    else if (
                        href.includes(
                            "evangelism.html"
                        )
                    ) {

                        link.textContent =
                            "✝️ Evangelism";

                    }

                    else if (
                        href.includes(
                            "records.html"
                        )
                    ) {

                        link.textContent =
                            "📂 My Records";

                    }

                    else if (
                        href.includes(
                            "visitors.html"
                        )
                    ) {

                        link.removeAttribute(
                            "data-coordinator-only"
                        );


                        link.style.display =
                            "";


                        link.textContent =
                            "👥 Visitors";

                    }

                }
            );


        /*
         * Do not create duplicate visitor buttons.
         * Only restore an existing button.
         */

        const existingVisitorLink =
            quickActions.querySelector(
                'a[href*="visitors.html"]'
            );


        if (
            existingVisitorLink
        ) {

            existingVisitorLink.removeAttribute(
                "data-coordinator-only"
            );


            existingVisitorLink.style.display =
                "";


            existingVisitorLink.textContent =
                "👥 Visitors";

        }

    }


    /* =====================================================
       ATTENDANCE SECTION
       ===================================================== */

    const dashboardSections =
        Array.from(
            document.querySelectorAll(
                "section.dashboard-section"
            )
        );


    function findSectionByText(
        text
    ) {

        const target =
            String(
                text || ""
            )
                .trim()
                .toLowerCase();


        return dashboardSections.find(
            section => {

                const heading =
                    section.querySelector(
                        "h2"
                    );


                if (!heading) {

                    return false;

                }


                return String(
                    heading.textContent ||
                    ""
                )
                    .trim()
                    .toLowerCase()
                    .includes(
                        target
                    );

            }
        ) || null;

    }


    const attendanceSection =
        findSectionByText(
            "attendance overview"
        );


    if (
        attendanceSection
    ) {

        const paragraph =
            attendanceSection.querySelector(
                "p"
            );


        if (paragraph) {

            paragraph.textContent =
                `Attendance statistics for ${cellName}.`;

        }

    }


    /* =====================================================
       EVANGELISM SECTION
       ===================================================== */

    const evangelismSection =
        findSectionByText(
            "evangelism overview"
        );


    if (
        evangelismSection
    ) {

        const heading =
            evangelismSection.querySelector(
                "h2"
            );


        const paragraph =
            evangelismSection.querySelector(
                "p"
            );


        if (heading) {

            heading.textContent =
                "My Cell Evangelism";

        }


        if (paragraph) {

            paragraph.textContent =
                `Evangelism activities and outcomes recorded for ${cellName}.`;

        }

    }


    /* =====================================================
       WEEKLY REPORTS SECTION
       ===================================================== */

    const reportsSection =
        findSectionByText(
            "recent weekly reports"
        );


    if (
        reportsSection
    ) {

        const heading =
            reportsSection.querySelector(
                "h2"
            );


        const paragraph =
            reportsSection.querySelector(
                "p"
            );


        if (heading) {

            heading.textContent =
                "My Cell Weekly Reports";

        }


        if (paragraph) {

            paragraph.textContent =
                `Latest weekly reports submitted for ${cellName}.`;

        }

    }


    /* =====================================================
       FOLLOW-UPS SECTION
       ===================================================== */

    const followUpsSection =
        findSectionByText(
            "recent follow-ups"
        );


    if (
        followUpsSection
    ) {

        const heading =
            followUpsSection.querySelector(
                "h2"
            );


        const paragraph =
            followUpsSection.querySelector(
                "p"
            );


        if (heading) {

            heading.textContent =
                "My Cell Follow-ups";

        }


        if (paragraph) {

            paragraph.textContent =
                `Members and issues requiring follow-up in ${cellName}.`;

        }

    }


    /* =====================================================
       VISITORS SECTION
       ===================================================== */

    const visitorSection =
        dashboardSections.find(
            section => {

                const heading =
                    section.querySelector(
                        "h2"
                    );


                return String(
                    heading?.textContent ||
                    ""
                )
                    .toLowerCase()
                    .includes(
                        "visitor"
                    );

            }
        );


    if (
        visitorSection
    ) {

        visitorSection.removeAttribute(
            "data-coordinator-only"
        );


        visitorSection.style.display =
            "";


        const heading =
            visitorSection.querySelector(
                "h2"
            );


        const paragraph =
            visitorSection.querySelector(
                "p"
            );


        const button =
            visitorSection.querySelector(
                'a[href*="visitors.html"]'
            );


        if (heading) {

            heading.textContent =
                "My Cell Visitors";

        }


        if (paragraph) {

            paragraph.textContent =
                `Visitors recorded through ${cellName} attendance.`;

        }


        if (button) {

            button.style.display =
                "";


            button.removeAttribute(
                "data-coordinator-only"
            );


            button.textContent =
                "View Visitors";

        }

    }


    /* =====================================================
       HIDE COORDINATOR SYSTEM PANELS
       ===================================================== */

    dashboardSections.forEach(
        section => {

            const heading =
                section.querySelector(
                    "h2"
                );


            const text =
                String(
                    heading?.textContent ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            if (
                text.includes(
                    "cells overview"
                )
                ||
                text.includes(
                    "cells needing attention"
                )
            ) {

                section.style.display =
                    "none";

            }

        }
    );


    /* =====================================================
       MY CELL PERFORMANCE
       ===================================================== */

    const performanceSection =
        findSectionByText(
            "overall cms analytics"
        );


    if (
        performanceSection
    ) {

        const heading =
            performanceSection.querySelector(
                "h2"
            );


        const paragraph =
            performanceSection.querySelector(
                "p"
            );


        if (heading) {

            heading.textContent =
                "My Cell Performance";

        }


        if (paragraph) {

            paragraph.textContent =
                `Performance indicators calculated from ${cellName} records.`;

        }

    }


    /* =====================================================
       MY RECORDS
       ===================================================== */

    const recordsSection =
        findSectionByText(
            "records & history"
        );


    if (
        recordsSection
    ) {

        const heading =
            recordsSection.querySelector(
                "h2"
            );


        const paragraph =
            recordsSection.querySelector(
                "p"
            );


        const button =
            recordsSection.querySelector(
                'a[href*="records.html"]'
            );


        if (heading) {

            heading.textContent =
                "My Records";

        }


        if (paragraph) {

            paragraph.textContent =
                `Access attendance, reports and follow-up records for ${cellName}.`;

        }


        if (button) {

            button.textContent =
                "Open My Records";

        }

    }


    /*
     * Final explicit restoration of Visitor navigation.
     */

    dashboardRestoreCellLeaderVisitors();


    document.body.classList.add(
        "cms-cell-leader-dashboard"
    );


    console.log(
        "CMS Dashboard: Cell Leader presentation applied:",
        cellName
    );

}


/* =========================================================
   LOAD DASHBOARD
   ========================================================= */

async function loadCMSDashboardFromSupabase() {

    if (
        !CMS_DASHBOARD_SUPABASE
    ) {

        console.error(
            "CMS Dashboard: Supabase client not available."
        );

        return false;

    }


    console.log(
        "CMS Dashboard: loading live Supabase analytics..."
    );


    try {

        /* =================================================
           ROLE
           ================================================= */

        cmsDashboardRole =
            await dashboardLoadRole();


        console.log(
            "CMS Dashboard role:",
            cmsDashboardRole
        );


        /* =================================================
           CELL LEADER ASSIGNMENT
           ================================================= */

        if (
            cmsDashboardRole ===
            "cell_leader"
        ) {

            cmsDashboardMyCell =
                await dashboardLoadMyCell();


            if (
                !cmsDashboardMyCell
            ) {

                throw new Error(
                    "Cell Leader has no active cell assignment."
                );

            }

        }

        else {

            cmsDashboardMyCell =
                null;

        }


        /* =================================================
           WORKSPACE UI
           ================================================= */

        dashboardApplyWorkspaceUI();


        /* =================================================
           LOAD LIVE DATA
           ================================================= */

        const [

            cells,
            leaders,
            members,
            attendanceSessions,
            attendance,
            visitors,
            visitorVisits,
            reports,
            followUps,
            evangelism

        ] =
            await Promise.all([

                dashboardLoadCells(),

                dashboardLoadLeaders(),

                dashboardLoadMembers(),

                dashboardLoadAttendanceSessions(),

                dashboardLoadAttendance(),

                dashboardLoadVisitors(),

                dashboardLoadVisitorVisits(),

                dashboardLoadReports(),

                dashboardLoadFollowUps(),

                dashboardLoadEvangelism()

            ]);


        cmsDashboardData = {

            cells,
            leaders,
            members,
            attendanceSessions,
            attendance,
            visitors,
            visitorVisits,
            reports,
            followUps,
            evangelism

        };


        console.log(
            "CMS Dashboard: live Supabase data loaded."
        );


        console.log({

            role:
                cmsDashboardRole,

            myCell:
                cmsDashboardMyCell?.cell_name ||
                null,

            cells:
                cells.length,

            leaders:
                leaders.length,

            members:
                members.length,

            attendanceSessions:
                attendanceSessions.length,

            attendance:
                attendance.length,

            visitors:
                visitors.length,

            visitorVisits:
                visitorVisits.length,

            weeklyReports:
                reports.length,

            followUps:
                followUps.length,

            evangelism:
                evangelism.length

        });


        /* =================================================
           CORE COUNTS
           ================================================= */

        dashboardSetText(
            "total-cells",
            cells.length
        );


        dashboardSetText(
            "total-leaders",
            leaders.length
        );


        dashboardSetText(
            "total-members",
            members.length
        );


        const visitorStats =
            calculateDashboardVisitors();


        dashboardSetText(
            "total-visitors",
            visitorStats.total
        );


        dashboardSetText(
            "dashboard-total-visitors",
            visitorStats.total
        );


        dashboardSetText(
            "dashboard-visitor-visits",
            visitorStats.visits
        );


        dashboardSetText(
            "dashboard-converted-visitors",
            visitorStats.converted
        );


        dashboardSetText(
            "total-reports",
            reports.length
        );


        dashboardSetText(
            "total-followups",
            followUps.length
        );


        /* =================================================
           ATTENDANCE
           ================================================= */

        const attendanceStats =
            calculateDashboardAttendance();


        dashboardSetText(
            "attendance-rate",
            attendanceStats.rate +
            "%"
        );


        dashboardSetText(
            "attendance-records",
            attendanceStats.total
        );


        dashboardSetText(
            "attendance-present",
            attendanceStats.present
        );


        dashboardSetText(
            "attendance-absent",
            attendanceStats.absent
        );


        dashboardSetText(
            "attendance-excused",
            attendanceStats.excused
        );


        /* =================================================
           FOLLOW-UPS
           ================================================= */

        const followUpStats =
            calculateDashboardFollowUps();


        dashboardSetText(
            "pending-followups",
            followUpStats.pending
        );


        /* =================================================
           REPORTS
           ================================================= */

        const reportStats =
            calculateDashboardReports();


        dashboardSetText(
            "pending-reports",
            reportStats.drafts
        );


        /* =================================================
           EVANGELISM
           ================================================= */

        const evangelismStats =
            calculateDashboardEvangelism();


        dashboardSetText(
            "dashboard-evangelism-activities",
            evangelismStats.activities
        );


        dashboardSetText(
            "dashboard-evangelism-reached",
            evangelismStats.reached
        );


        dashboardSetText(
            "dashboard-evangelism-new",
            evangelismStats.newPeople
        );


        dashboardSetText(
            "dashboard-evangelism-saved",
            evangelismStats.saved
        );


        dashboardSetText(
            "dashboard-evangelism-progress",
            evangelismStats.inProgress
        );


        dashboardSetText(
            "dashboard-evangelism-interested",
            evangelismStats.interested
        );


        dashboardSetText(
            "dashboard-evangelism-followup",
            evangelismStats.followUpNeeded
        );


        dashboardSetText(
            "dashboard-evangelism-notyet",
            evangelismStats.notYet
        );


        /* =================================================
           OVERALL
           ================================================= */

        const overall =
            calculateDashboardOverall();


        dashboardSetText(
            "dashboard-active-members",
            overall.activeMembers
        );


        dashboardSetText(
            "dashboard-report-coverage",
            overall.reportCoverage +
            "%"
        );


        dashboardSetText(
            "dashboard-followup-completion",
            overall.followUpCompletion +
            "%"
        );


        dashboardSetText(
            "dashboard-attendance-people",
            overall.attendancePeople
        );


        dashboardSetText(
            "dashboard-total-reached",
            overall.peopleReached
        );


        /* =================================================
           RECORDS SUMMARY
           ================================================= */

        dashboardSetText(
            "records-attendance",
            attendanceStats.total
        );


        dashboardSetText(
            "records-reports",
            reports.length
        );


        dashboardSetText(
            "records-followups",
            followUps.length
        );


        /* =================================================
           OPTIONAL TABLES
           ================================================= */

        dashboardRenderRecentReports();

        dashboardRenderRecentFollowUps();


        /* =================================================
           COORDINATOR SYSTEM OVERVIEW

           Coordinator-only views show all-cell summaries and
           meeting-date reporting status.
           ================================================= */

        if (
            cmsDashboardRole ===
            "coordinator"
        ) {

            dashboardRenderCellsOverview();

            dashboardRenderWeeklyCellComparison();

            dashboardRenderCellsNeedingAttention();

        }


        /* =================================================
           CELL LEADER PRESENTATION ONLY
           ================================================= */

        if (
            cmsDashboardRole ===
            "cell_leader"
        ) {

            dashboardApplyCellLeaderPresentation();

        }


        /* =================================================
           LAST UPDATED
           ================================================= */

        dashboardSetText(
            "lastUpdated",
            new Date()
                .toLocaleString()
        );


        console.log(
            cmsDashboardRole ===
                "cell_leader"
                ? `CMS Dashboard: MY CELL analytics complete — ${cmsDashboardMyCell?.cell_name || ""}`
                : "CMS Dashboard: LIVE ANALYTICS COMPLETE."
        );


        return true;


    }

    catch (error) {

        console.error(
            "CMS Dashboard: live analytics failed:",
            error
        );


        return false;

    }

}


/* =========================================================
   PUBLIC REFRESH
   ========================================================= */

window.refreshCMSDashboard =
    loadCMSDashboardFromSupabase;


/* =========================================================
   REALTIME REFRESH
   ========================================================= */

let cmsDashboardRefreshTimer =
    null;


function scheduleCMSDashboardRefresh() {

    clearTimeout(
        cmsDashboardRefreshTimer
    );


    cmsDashboardRefreshTimer =
        setTimeout(
            function () {

                loadCMSDashboardFromSupabase();

            },
            500
        );

}


/* =========================================================
   REALTIME
   ========================================================= */

function subscribeCMSDashboardRealtime() {

    if (
        !CMS_DASHBOARD_SUPABASE
    ) {

        return;

    }


    CMS_DASHBOARD_SUPABASE

        .channel(
            "cms-dashboard-live"
        )

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "cells"
            },
            scheduleCMSDashboardRefresh
        )

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "cell_leader_directory"
            },
            scheduleCMSDashboardRefresh
        )

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "members"
            },
            scheduleCMSDashboardRefresh
        )

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "attendance_sessions"
            },
            scheduleCMSDashboardRefresh
        )

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "attendance"
            },
            scheduleCMSDashboardRefresh
        )

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "visitors"
            },
            scheduleCMSDashboardRefresh
        )

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "visitor_visits"
            },
            scheduleCMSDashboardRefresh
        )

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "weekly_reports"
            },
            scheduleCMSDashboardRefresh
        )

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "follow_ups"
            },
            scheduleCMSDashboardRefresh
        )

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "evangelism"
            },
            scheduleCMSDashboardRefresh
        )

        .subscribe(
            function (
                status
            ) {

                console.log(
                    "CMS Dashboard realtime:",
                    status
                );

            }
        );

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

async function initializeCMSDashboard() {

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            async function () {

                await loadCMSDashboardFromSupabase();

                subscribeCMSDashboardRealtime();

            },
            {
                once: true
            }
        );


        return;

    }


    await loadCMSDashboardFromSupabase();

    subscribeCMSDashboardRealtime();

}


/* =========================================================
   START
   ========================================================= */

initializeCMSDashboard();