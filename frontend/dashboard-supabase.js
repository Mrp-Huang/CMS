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
   - Only Cell Leader presentation is improved
   - Coordinator presentation remains unchanged

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
   LOAD CELLS
   ========================================================= */

async function dashboardLoadCells() {

    const {
        data,
        error
    } =
        await CMS_DASHBOARD_SUPABASE
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
                    ascending: true
                }
            );


    if (error) {

        throw error;

    }


    return data || [];

}


/* =========================================================
   LOAD LEADERS
   ========================================================= */

async function dashboardLoadLeaders() {

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
                    ascending: true
                }
            );


    if (error) {

        throw error;

    }


    return data || [];

}


/* =========================================================
   LOAD MEMBERS
   ========================================================= */

async function dashboardLoadMembers() {

    const {
        data,
        error
    } =
        await CMS_DASHBOARD_SUPABASE
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
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        throw error;

    }


    return data || [];

}


/* =========================================================
   LOAD ATTENDANCE SESSIONS
   ========================================================= */

async function dashboardLoadAttendanceSessions() {

    const {
        data,
        error
    } =
        await CMS_DASHBOARD_SUPABASE
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
            );


    if (error) {

        throw error;

    }


    return data || [];

}


/* =========================================================
   LOAD ATTENDANCE
   ========================================================= */

async function dashboardLoadAttendance() {

    const {
        data,
        error
    } =
        await CMS_DASHBOARD_SUPABASE
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
            );


    if (error) {

        throw error;

    }


    return data || [];

}


/* =========================================================
   LOAD VISITORS
   ========================================================= */

async function dashboardLoadVisitors() {

    const {
        data,
        error
    } =
        await CMS_DASHBOARD_SUPABASE
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
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        throw error;

    }


    return data || [];

}


/* =========================================================
   LOAD VISITOR VISITS
   ========================================================= */

async function dashboardLoadVisitorVisits() {

    const {
        data,
        error
    } =
        await CMS_DASHBOARD_SUPABASE
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
            );


    if (error) {

        throw error;

    }


    return data || [];

}


/* =========================================================
   LOAD REPORTS
   ========================================================= */

async function dashboardLoadReports() {

    const {
        data,
        error
    } =
        await CMS_DASHBOARD_SUPABASE
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
            );


    if (error) {

        throw error;

    }


    return data || [];

}


/* =========================================================
   LOAD FOLLOW-UPS
   ========================================================= */

async function dashboardLoadFollowUps() {

    const {
        data,
        error
    } =
        await CMS_DASHBOARD_SUPABASE
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
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        throw error;

    }


    return data || [];

}


/* =========================================================
   LOAD EVANGELISM
   ========================================================= */

async function dashboardLoadEvangelism() {

    const {
        data,
        error
    } =
        await CMS_DASHBOARD_SUPABASE
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
                "evangelism_date",
                {
                    ascending: false
                }
            );


    if (error) {

        throw error;

    }


    return data || [];

}


/* =========================================================
   ATTENDANCE ANALYTICS
   ========================================================= */

function calculateDashboardAttendance() {

    const rows =
        cmsDashboardData.attendance;


    let present = 0;

    let absent = 0;

    let late = 0;

    let excused = 0;


    rows.forEach(
        row => {

            const status =
                dashboardStatus(
                    row.status
                );


            if (
                status ===
                "present"
            ) {

                present++;

            }

            else if (
                status ===
                "absent"
            ) {

                absent++;

            }

            else if (
                status ===
                "late"
            ) {

                late++;

            }

            else if (
                status ===
                "excused"
            ) {

                excused++;

            }

        }
    );


    const attended =
        present +
        late;


    const total =
        rows.length;


    const rate =
        total > 0
            ? Math.round(
                (
                    attended /
                    total
                ) * 100
            )
            : 0;


    return {

        total,
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
                    );


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


            const latestReport =
                recentReports[0];


            if (
                !latestReport
                ||
                dashboardDaysAgo(
                    latestReport.report_date
                ) > 14
            ) {

                reasons.push(
                    "No recent weekly report"
                );

            }


            const latestAttendance =
                recentAttendanceSessions[0];


            if (
                !latestAttendance
                ||
                dashboardDaysAgo(
                    latestAttendance.meeting_date
                ) > 14
            ) {

                reasons.push(
                    "No recent attendance"
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

                    reasons

                });

            }

        }
    );


    target.innerHTML =
        "";


    if (!rows.length) {

        target.innerHTML = `

            <div class="attention-empty">
                All active cells are currently okay.
            </div>

        `;

        return;

    }


    rows
        .slice(
            0,
            10
        )
        .forEach(
            item => {

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
                                item.cell.name
                            )}
                        </strong>

                        <small>
                            ${item.reasons
                                .map(
                                    reason =>
                                        escapeDashboardHTML(
                                            reason
                                        )
                                )
                                .join(
                                    " • "
                                )}
                        </small>

                    </div>

                `;


                target.appendChild(
                    div
                );

            }
        );

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
            "Leaders in my cell",

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

           IMPORTANT:
           This block remains untouched for Coordinator.
           ================================================= */

        if (
            cmsDashboardRole ===
            "coordinator"
        ) {

            dashboardRenderCellsOverview();

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