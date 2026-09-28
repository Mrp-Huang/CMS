/* =====================================================
   CMS - ATTENDANCE MANAGEMENT SYSTEM
   STABLE SUPABASE VERSION

   EXISTING STRUCTURE PRESERVED:

   Cells
      ↓
   Members
      ↓
   Attendance
      ↓
   Records / Weekly Reports / Dashboard

   PRESERVED:
   - Cell selection
   - Meeting date
   - Cell Leader restriction
   - Registered members
   - Member attendance status
   - Automatic member counters
   - Automatic attendance percentage
   - Visitors / Newcomers
   - Visitor Year of Study
   - Visitor Combination
   - Visitor Association / Belongs To
   - Returning visitor recognition
   - Visitor history
   - visitor_visits
   - attendance_sessions.visitors snapshot
   - localStorage backup

   MEMBER SUMMARY:
   Total Members
   Present
   Absent
   Late
   Excused
   Attendance Rate

   NEW:
   Visitors / Newcomers counter

   RATE RULE:
   (Present + Late) / Total Registered Members × 100

   Visitors are counted separately and do NOT change
   the registered-member attendance rate.
   ===================================================== */


/* =====================================================
   SUPABASE CLIENT
   ===================================================== */

const cmsAttendanceSupabase =
    window.supabaseClient || null;


/* =====================================================
   STATE
   ===================================================== */

let cells = [];

let members = [];

let currentAttendanceRows = [];

let currentVisitors = [];

let currentSession = null;

let currentAttendanceCellId = "";

let currentAttendanceDate = "";

let attendanceAccess = {

    role:
        "none",

    userId:
        null,

    cellId:
        null,

    cellName:
        null

};


/* =====================================================
   DOM ELEMENTS
   ===================================================== */

const attendanceCell =
    document.getElementById(
        "attendanceCell"
    );


const attendanceDate =
    document.getElementById(
        "attendanceDate"
    );


const loadMembersButton =
    document.getElementById(
        "loadMembersButton"
    );


const attendanceMembersBody =
    document.getElementById(
        "attendanceMembersBody"
    );


const visitorsBody =
    document.getElementById(
        "visitorsBody"
    );


const addVisitorButton =
    document.getElementById(
        "addVisitorButton"
    );


const saveAttendanceButton =
    document.getElementById(
        "saveAttendanceButton"
    );


const totalMembers =
    document.getElementById(
        "totalMembers"
    );


const presentCount =
    document.getElementById(
        "presentCount"
    );


const absentCount =
    document.getElementById(
        "absentCount"
    );


const lateCount =
    document.getElementById(
        "lateCount"
    );


const excusedCount =
    document.getElementById(
        "excusedCount"
    );


const attendanceRate =
    document.getElementById(
        "attendanceRate"
    );


/*
   The original Attendance HTML does not contain
   visitorCount, so we create its card safely
   from JavaScript.
*/

let visitorCount = null;


/* =====================================================
   SUPABASE CHECK
   ===================================================== */

if (
    !cmsAttendanceSupabase
) {

    console.error(
        "CMS Attendance: Supabase client is not available."
    );

}


/* =====================================================
   DATABASE ERROR
   ===================================================== */

function attendanceError(
    action,
    error
) {

    console.error(
        `CMS Attendance - ${action}:`,
        error
    );


    const message =
        error?.message ||
        error?.details ||
        error?.hint ||
        "Unexpected database error.";


    alert(
        `Unable to ${action}.\n\n${message}`
    );

}


/* =====================================================
   ACCESS INITIALIZATION
   ===================================================== */

async function initializeAttendanceAccess() {

    try {

        if (
            window.CMSAccess &&
            typeof window.CMSAccess.initialize ===
                "function"
        ) {

            const access =
                await window.CMSAccess.initialize();


            attendanceAccess = {

                role:
                    access?.role ||
                    "none",

                userId:
                    access?.userId ||
                    null,

                cellId:
                    access?.cellId ||
                    null,

                cellName:
                    access?.cellName ||
                    null

            };


            console.log(
                "CMS Attendance access:",
                attendanceAccess
            );


            return attendanceAccess;

        }


        if (
            !cmsAttendanceSupabase
        ) {

            return attendanceAccess;

        }


        const {
            data:
                sessionData
        } =
            await cmsAttendanceSupabase
                .auth
                .getSession();


        const session =
            sessionData?.session;


        if (
            !session?.user?.id
        ) {

            return attendanceAccess;

        }


        attendanceAccess.userId =
            session.user.id;


        const {
            data:
                roleData,
            error:
                roleError
        } =
            await cmsAttendanceSupabase
                .rpc(
                    "cms_my_role"
                );


        if (
            roleError
        ) {

            console.warn(
                "CMS Attendance role check:",
                roleError
            );

        }


        attendanceAccess.role =
            roleData ||
            "none";


        if (
            attendanceAccess.role ===
                "cell_leader"
        ) {

            const {
                data:
                    cellData,
                error:
                    cellError
            } =
                await cmsAttendanceSupabase
                    .rpc(
                        "cms_my_cells"
                    );


            if (
                !cellError &&
                Array.isArray(
                    cellData
                ) &&
                cellData.length
            ) {

                attendanceAccess.cellId =
                    cellData[0].id ||
                    cellData[0].cell_id ||
                    null;


                attendanceAccess.cellName =
                    cellData[0].name ||
                    null;

            }

        }


        console.log(
            "CMS Attendance fallback access:",
            attendanceAccess
        );


        return attendanceAccess;

    }

    catch (error) {

        console.error(
            "CMS Attendance access initialization error:",
            error
        );


        return attendanceAccess;

    }

}


/* =====================================================
   ROLE HELPERS
   ===================================================== */

function isAttendanceCoordinator() {

    return (
        attendanceAccess.role ===
        "coordinator"
    );

}


function isAttendanceCellLeader() {

    return (
        attendanceAccess.role ===
        "cell_leader"
    );

}


/* =====================================================
   ROLE PRESENTATION
   ===================================================== */

function applyAttendanceRolePresentation() {

    if (
        !attendanceCell
    ) {

        return;

    }


    if (
        isAttendanceCellLeader()
    ) {

        attendanceCell.disabled =
            true;


        document
            .querySelectorAll(
                ".sidebar a, .sidebar nav a"
            )
            .forEach(
                function(link) {

                    const href =
                        link.getAttribute(
                            "href"
                        );


                    if (
                        href ===
                            "cells.html" ||

                        href ===
                            "cell-leaders.html"
                    ) {

                        link.style.display =
                            "none";

                    }

                }
            );

    }

}


/* =====================================================
   CREATE VISITOR SUMMARY CARD
   ===================================================== */

function createVisitorSummaryCard() {

    /*
       Already created?
       Do nothing.
    */

    if (
        document.getElementById(
            "attendanceVisitorSummaryCard"
        )
    ) {

        visitorCount =
            document.getElementById(
                "visitorCount"
            );


        return;

    }


    /*
       Find the existing summary container.
    */

    const summaryContainer =
        document.querySelector(
            ".attendance-summary"
        );


    if (
        !summaryContainer
    ) {

        return;

    }


    /*
       Create card using the exact same
       summary-card class used by the
       existing Attendance design.
    */

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "summary-card";


    card.id =
        "attendanceVisitorSummaryCard";


    card.innerHTML = `

        <span>
            Visitors / Newcomers
        </span>

        <strong id="visitorCount">
            0
        </strong>

    `;


    /*
       Add visitor card before the
       Attendance Rate card so the
       layout remains logical.
    */

    if (
        attendanceRate
    ) {

        const rateCard =
            attendanceRate.closest(
                ".summary-card"
            );


        if (
            rateCard
        ) {

            summaryContainer.insertBefore(
                card,
                rateCard
            );

        }

        else {

            summaryContainer.appendChild(
                card
            );

        }

    }

    else {

        summaryContainer.appendChild(
            card
        );

    }


    visitorCount =
        document.getElementById(
            "visitorCount"
        );

}


/* =====================================================
   ADD SMALL RESPONSIVE SUMMARY STYLE
   ===================================================== */

function addVisitorSummaryStyles() {

    if (
        document.getElementById(
            "cmsVisitorSummaryStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "cmsVisitorSummaryStyles";


    style.textContent = `

        .attendance-summary
        #attendanceVisitorSummaryCard {
            min-width: 0;
        }

        .attendance-summary
        #attendanceVisitorSummaryCard
        span {
            line-height: 1.25;
        }

        .attendance-summary
        #attendanceVisitorSummaryCard
        strong {
            display: block;
        }

    `;


    document.head.appendChild(
        style
    );

}


/* =====================================================
   LOAD CELLS
   ===================================================== */

async function loadAttendanceCells() {

    if (
        !cmsAttendanceSupabase
    ) {

        return false;

    }


    const {
        data,
        error
    } =
        await cmsAttendanceSupabase
            .from(
                "cells"
            )
            .select(
                "id,name,active,created_at"
            )
            .order(
                "created_at",
                {
                    ascending:
                        true
                }
            );


    if (
        error
    ) {

        attendanceError(
            "load Cells",
            error
        );


        return false;

    }


    cells =
        data ||
        [];


    renderAttendanceCellOptions();


    return true;

}


/* =====================================================
   RENDER CELL OPTIONS
   ===================================================== */

function renderAttendanceCellOptions() {

    if (
        !attendanceCell
    ) {

        return;

    }


    attendanceCell.innerHTML =
        "";


    const firstOption =
        document.createElement(
            "option"
        );


    firstOption.value =
        "";


    firstOption.textContent =
        "Select a cell";


    attendanceCell.appendChild(
        firstOption
    );


    cells
        .filter(
            function(cell) {

                return (
                    cell.active !==
                    false
                );

            }
        )
        .forEach(
            function(cell) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    cell.id;


                option.textContent =
                    cell.name;


                attendanceCell.appendChild(
                    option
                );

            }
        );


    if (
        isAttendanceCellLeader() &&
        attendanceAccess.cellId
    ) {

        attendanceCell.value =
            attendanceAccess.cellId;


        attendanceCell.disabled =
            true;

    }

}


/* =====================================================
   CELL NAME
   ===================================================== */

function getAttendanceCellName(
    cellId
) {

    const cell =
        cells.find(
            function(item) {

                return (
                    String(
                        item.id
                    ) ===
                    String(
                        cellId
                    )
                );

            }
        );


    return (
        cell?.name ||
        "Unknown cell"
    );

}


/* =====================================================
   LOAD ATTENDANCE
   ===================================================== */

async function loadAttendanceMembers() {

    if (
        !cmsAttendanceSupabase
    ) {

        alert(
            "Supabase is not connected."
        );


        return;

    }


    const selectedCellId =

        isAttendanceCellLeader()

            ? attendanceAccess.cellId

            : (
                attendanceCell?.value ||
                ""
            );


    const selectedDate =
        attendanceDate?.value ||
        "";


    if (
        !selectedCellId
    ) {

        alert(
            "Please select a cell."
        );


        return;

    }


    if (
        !selectedDate
    ) {

        alert(
            "Please select a meeting date."
        );


        return;

    }


    currentAttendanceCellId =
        selectedCellId;


    currentAttendanceDate =
        selectedDate;


    /* ==============================================
       LOAD MEMBERS
       ============================================== */

    const {
        data:
            memberData,
        error:
            memberError
    } =
        await cmsAttendanceSupabase
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
                    year_of_study,
                    combination,
                    active
                `
            )
            .eq(
                "cell_id",
                selectedCellId
            )
            .eq(
                "active",
                true
            )
            .order(
                "first_name",
                {
                    ascending:
                        true
                }
            );


    if (
        memberError
    ) {

        attendanceError(
            "load Members",
            memberError
        );


        return;

    }


    members =
        memberData ||
        [];


    /* ==============================================
       LOAD SESSION
       ============================================== */

    const {
        data:
            sessionData,
        error:
            sessionError
    } =
        await cmsAttendanceSupabase
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
                    created_by,
                    created_at,
                    updated_at
                `
            )
            .eq(
                "cell_id",
                selectedCellId
            )
            .eq(
                "meeting_date",
                selectedDate
            )
            .maybeSingle();


    if (
        sessionError
    ) {

        attendanceError(
            "load Attendance Session",
            sessionError
        );


        return;

    }


    currentSession =
        sessionData ||
        null;


    /* ==============================================
       LOAD ATTENDANCE

       First use session_id.
       Then also check Cell + Date so old
       existing records continue to work.
       ============================================== */

    let attendanceData =
        [];


    if (
        currentSession?.id
    ) {

        const {
            data:
                sessionRows,
            error:
                sessionRowsError
        } =
            await cmsAttendanceSupabase
                .from(
                    "attendance"
                )
                .select(
                    `
                        id,
                        cell_id,
                        member_id,
                        meeting_date,
                        status,
                        session_id
                    `
                )
                .eq(
                    "session_id",
                    currentSession.id
                );


        if (
            sessionRowsError
        ) {

            console.warn(
                "CMS Attendance session lookup:",
                sessionRowsError
            );

        }


        attendanceData =
            sessionRows ||
            [];

    }


    const {
        data:
            dateRows,
        error:
            dateRowsError
    } =
        await cmsAttendanceSupabase
            .from(
                "attendance"
            )
            .select(
                `
                    id,
                    cell_id,
                    member_id,
                    meeting_date,
                    status,
                    session_id
                `
            )
            .eq(
                "cell_id",
                selectedCellId
            )
            .eq(
                "meeting_date",
                selectedDate
            );


    if (
        dateRowsError
    ) {

        console.warn(
            "CMS Attendance date lookup:",
            dateRowsError
        );

    }


    const attendanceMap =
        new Map();


    (
        attendanceData ||
        []
    )
    .forEach(
        function(row) {

            attendanceMap.set(
                String(
                    row.id
                ),
                row
            );

        }
    );


    (
        dateRows ||
        []
    )
    .forEach(
        function(row) {

            attendanceMap.set(
                String(
                    row.id
                ),
                row
            );

        }
    );


    attendanceData =
        Array.from(
            attendanceMap.values()
        );


    /* ==============================================
       BUILD MEMBER ROWS
       ============================================== */

    currentAttendanceRows =
        members.map(
            function(member) {

                const saved =
                    attendanceData.find(
                        function(record) {

                            return (
                                String(
                                    record.member_id
                                ) ===
                                String(
                                    member.id
                                )
                            );

                        }
                    );


                return {

                    id:
                        saved?.id ||
                        null,

                    memberId:
                        member.id,

                    cellId:
                        member.cell_id,

                    name:
                        [
                            member.first_name,
                            member.last_name
                        ]
                        .filter(
                            Boolean
                        )
                        .join(" ")
                        .trim(),

                    phone:
                        member.phone ||
                        "",

                    year:
                        member.year_of_study ||
                        "",

                    combination:
                        member.combination ||
                        "",

                    status:
                        saved?.status ||
                        "Present"

                };

            }
        );


    renderAttendanceMembers();


    await loadVisitorsForAttendance(
        selectedCellId,
        selectedDate
    );


    updateAttendanceSummary();


    console.log(
        "CMS Attendance: members loaded:",
        members.length
    );


    console.log(
        "CMS Attendance: saved attendance rows:",
        attendanceData.length
    );

}


/* =====================================================
   MEMBER TABLE HEADER
   ===================================================== */

function updateMemberAttendanceHeader() {

    if (
        !attendanceMembersBody
    ) {

        return;

    }


    const table =
        attendanceMembersBody.closest(
            "table"
        );


    const thead =
        table?.querySelector(
            "thead"
        );


    if (
        !thead
    ) {

        return;

    }


    /*
       IMPORTANT:

       No redundant Action column.
    */

    thead.innerHTML = `

        <tr>

            <th
                style="
                    width:6%;
                    text-align:center;
                "
            >
                #
            </th>

            <th
                style="width:36%;"
            >
                Member
            </th>

            <th
                style="width:18%;"
            >
                Year
            </th>

            <th
                style="width:20%;"
            >
                Combination
            </th>

            <th
                style="width:20%;"
            >
                Status
            </th>

        </tr>

    `;

}


/* =====================================================
   TABLE STYLES
   ===================================================== */

function addAttendanceTableStyles() {

    if (
        document.getElementById(
            "cmsAttendanceTableStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "cmsAttendanceTableStyles";


    style.textContent = `

        .attendance-members-table {
            width: 100%;
            table-layout: fixed;
        }

        .attendance-members-table
        th,
        .attendance-members-table
        td {
            vertical-align: middle;
        }

        .attendance-visitors-table {
            width: 100%;
            table-layout: fixed;
        }

        .attendance-visitors-table
        th,
        .attendance-visitors-table
        td {
            padding: 9px 7px;
            vertical-align: middle;
        }

        .attendance-visitors-table
        input,
        .attendance-visitors-table
        select {
            width: 100%;
            min-width: 0;
            max-width: 100%;
            box-sizing: border-box;
            padding: 7px 6px;
            font-size: 12px;
        }

        .attendance-visitors-table
        .remove-button {
            width: 100%;
            white-space: nowrap;
            padding: 7px 6px;
            font-size: 12px;
            box-sizing: border-box;
            cursor: pointer;
        }

        .attendance-visitors-table
        th:nth-child(1),
        .attendance-visitors-table
        td:nth-child(1) {
            width: 4%;
            text-align: center;
        }

        .attendance-visitors-table
        th:nth-child(2),
        .attendance-visitors-table
        td:nth-child(2) {
            width: 16%;
        }

        .attendance-visitors-table
        th:nth-child(3),
        .attendance-visitors-table
        td:nth-child(3) {
            width: 12%;
        }

        .attendance-visitors-table
        th:nth-child(4),
        .attendance-visitors-table
        td:nth-child(4) {
            width: 10%;
        }

        .attendance-visitors-table
        th:nth-child(5),
        .attendance-visitors-table
        td:nth-child(5) {
            width: 12%;
        }

        .attendance-visitors-table
        th:nth-child(6),
        .attendance-visitors-table
        td:nth-child(6) {
            width: 20%;
        }

        .attendance-visitors-table
        th:nth-child(7),
        .attendance-visitors-table
        td:nth-child(7) {
            width: 14%;
        }

        .attendance-visitors-table
        th:nth-child(8),
        .attendance-visitors-table
        td:nth-child(8) {
            width: 12%;
        }

        @media (
            max-width: 900px
        ) {

            .attendance-visitors-table {
                table-layout: auto;
                min-width: 850px;
            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* =====================================================
   RENDER REGISTERED MEMBERS
   ===================================================== */

function renderAttendanceMembers() {

    if (
        !attendanceMembersBody
    ) {

        return;

    }


    updateMemberAttendanceHeader();


    addAttendanceTableStyles();


    const table =
        attendanceMembersBody.closest(
            "table"
        );


    if (
        table
    ) {

        table.classList.add(
            "attendance-members-table"
        );

    }


    attendanceMembersBody.innerHTML =
        "";


    if (
        !currentAttendanceRows.length
    ) {

        attendanceMembersBody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty-row"
                >

                    No active members found
                    for this cell.

                </td>

            </tr>

        `;


        return;

    }


    currentAttendanceRows.forEach(
        function(row, index) {

            const tr =
                document.createElement(
                    "tr"
                );


            tr.innerHTML = `

                <td
                    style="
                        text-align:center;
                        font-weight:600;
                    "
                >

                    ${index + 1}

                </td>


                <td>

                    <strong>

                        ${escapeAttendanceHTML(
                            row.name
                        )}

                    </strong>

                </td>


                <td>

                    ${escapeAttendanceHTML(
                        row.year ||
                        "—"
                    )}

                </td>


                <td>

                    ${escapeAttendanceHTML(
                        row.combination ||
                        "—"
                    )}

                </td>


                <td>

                    <select
                        class="attendance-status-select"
                        data-member-index="${index}"
                    >

                        <option
                            value="Present"
                            ${
                                row.status ===
                                "Present"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Present
                        </option>

                        <option
                            value="Absent"
                            ${
                                row.status ===
                                "Absent"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Absent
                        </option>

                        <option
                            value="Late"
                            ${
                                row.status ===
                                "Late"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Late
                        </option>

                        <option
                            value="Excused"
                            ${
                                row.status ===
                                "Excused"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Excused
                        </option>

                    </select>

                </td>

            `;


            attendanceMembersBody.appendChild(
                tr
            );

        }
    );


    attendanceMembersBody
        .querySelectorAll(
            ".attendance-status-select"
        )
        .forEach(
            function(select) {

                select.addEventListener(
                    "change",
                    function() {

                        const index =
                            Number(
                                this.dataset
                                    .memberIndex
                            );


                        if (
                            currentAttendanceRows[
                                index
                            ]
                        ) {

                            currentAttendanceRows[
                                index
                            ].status =
                                this.value;

                        }


                        updateAttendanceSummary();

                    }
                );

            }
        );

}


/* =====================================================
   CREATE VISITOR
   ===================================================== */

function createVisitorObject() {

    return {

        id:
            `visitor_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 8)}`,

        visitorId:
            null,

        name:
            "",

        phone:
            "",

        year:
            "",

        combination:
            "",

        association:
            "",

        status:
            "Present"

    };

}


/* =====================================================
   NORMALIZE VISITOR
   ===================================================== */

function normalizeVisitorObject(
    visitor
) {

    return {

        id:
            visitor?.id ||

            `visitor_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 8)}`,

        visitorId:
            visitor?.visitorId ||

            visitor?.visitor_id ||

            null,

        name:
            visitor?.name ||

            visitor?.full_name ||

            visitor?.fullName ||

            "",

        phone:
            visitor?.phone ||

            "",

        year:
            visitor?.year ||

            visitor?.year_of_study ||

            "",

        combination:
            visitor?.combination ||

            "",

        association:
            visitor?.association ||

            visitor?.belongsTo ||

            visitor?.belongs_to ||

            "",

        status:
            visitor?.status ||

            visitor?.attendance_status ||

            "Present"

    };

}


/* =====================================================
   VISITOR TABLE HEADER
   ===================================================== */

function updateVisitorTableHeader() {

    if (
        !visitorsBody
    ) {

        return;

    }


    const table =
        visitorsBody.closest(
            "table"
        );


    const thead =
        table?.querySelector(
            "thead"
        );


    if (
        !thead
    ) {

        return;

    }


    thead.innerHTML = `

        <tr>

            <th>
                #
            </th>

            <th>
                Visitor Name
            </th>

            <th>
                Phone
            </th>

            <th>
                Year
            </th>

            <th>
                Combination
            </th>

            <th>
                Association / Belongs To
            </th>

            <th>
                Status
            </th>

            <th>
                Action
            </th>

        </tr>

    `;

}


/* =====================================================
   LOAD VISITORS
   ===================================================== */

async function loadVisitorsForAttendance(
    cellId,
    meetingDate
) {

    currentVisitors =
        [];


    if (
        !cmsAttendanceSupabase
    ) {

        return;

    }


    const {
        data:
            visitData,
        error:
            visitError
    } =
        await cmsAttendanceSupabase
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
                    notes,

                    visitors (
                        id,
                        full_name,
                        phone,
                        year_of_study,
                        combination,
                        association,
                        notes,
                        cell_id,
                        converted_to_member,
                        member_id,
                        first_visit_date,
                        last_visit_date,
                        visit_count,
                        active
                    )
                `
            )
            .eq(
                "cell_id",
                cellId
            )
            .eq(
                "visit_date",
                meetingDate
            )
            .order(
                "id",
                {
                    ascending:
                        true
                }
            );


    if (
        visitError
    ) {

        console.warn(
            "CMS Attendance visitor lookup:",
            visitError
        );

    }


    if (
        Array.isArray(
            visitData
        ) &&
        visitData.length
    ) {

        currentVisitors =
            visitData.map(
                function(record) {

                    const visitor =
                        record.visitors ||
                        {};


                    return {

                        id:
                            `visitor_${record.id}`,

                        visitorId:
                            record.visitor_id,

                        name:
                            visitor.full_name ||
                            "",

                        phone:
                            visitor.phone ||
                            "",

                        year:
                            visitor.year_of_study ||
                            "",

                        combination:
                            visitor.combination ||
                            "",

                        association:
                            visitor.association ||
                            "",

                        status:
                            record.status ||
                            "Present"

                    };

                }
            );

    }

    else if (
        Array.isArray(
            currentSession?.visitors
        )
    ) {

        currentVisitors =
            currentSession
                .visitors
                .map(
                    normalizeVisitorObject
                );

    }


    renderVisitors();


    console.log(
        "CMS Attendance: visitors loaded:",
        currentVisitors.length
    );

}


/* =====================================================
   RENDER VISITORS
   ===================================================== */

function renderVisitors() {

    if (
        !visitorsBody
    ) {

        return;

    }


    updateVisitorTableHeader();


    addAttendanceTableStyles();


    const table =
        visitorsBody.closest(
            "table"
        );


    if (
        table
    ) {

        table.classList.add(
            "attendance-visitors-table"
        );

    }


    visitorsBody.innerHTML =
        "";


    if (
        !currentVisitors.length
    ) {

        visitorsBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="empty-row"
                >

                    No visitors added.

                </td>

            </tr>

        `;


        return;

    }


    currentVisitors.forEach(
        function(visitor, index) {

            const tr =
                document.createElement(
                    "tr"
                );


            tr.innerHTML = `

                <td
                    style="
                        text-align:center;
                        font-weight:600;
                    "
                >

                    ${index + 1}

                </td>


                <td>

                    <input
                        type="text"
                        class="visitor-name-input"
                        data-index="${index}"
                        value="${escapeAttribute(
                            visitor.name
                        )}"
                        placeholder="Full name"
                    >

                </td>


                <td>

                    <input
                        type="tel"
                        class="visitor-phone-input"
                        data-index="${index}"
                        value="${escapeAttribute(
                            visitor.phone
                        )}"
                        placeholder="Phone"
                    >

                </td>


                <td>

                    <select
                        class="visitor-year-input"
                        data-index="${index}"
                    >

                        <option
                            value=""
                            ${
                                !visitor.year
                                    ? "selected"
                                    : ""
                            }
                        >
                            Year
                        </option>

                        <option
                            value="Year 1"
                            ${
                                visitor.year ===
                                "Year 1"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Year 1
                        </option>

                        <option
                            value="Year 2"
                            ${
                                visitor.year ===
                                "Year 2"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Year 2
                        </option>

                        <option
                            value="Year 3"
                            ${
                                visitor.year ===
                                "Year 3"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Year 3
                        </option>

                        <option
                            value="Year 4"
                            ${
                                visitor.year ===
                                "Year 4"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Year 4
                        </option>

                        <option
                            value="Other"
                            ${
                                visitor.year ===
                                "Other"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Other
                        </option>

                    </select>

                </td>


                <td>

                    <input
                        type="text"
                        class="visitor-combination-input"
                        data-index="${index}"
                        value="${escapeAttribute(
                            visitor.combination
                        )}"
                        placeholder="e.g. CSE"
                    >

                </td>


                <td>

                    <input
                        type="text"
                        class="visitor-association-input"
                        data-index="${index}"
                        value="${escapeAttribute(
                            visitor.association
                        )}"
                        placeholder="School / Church / Group"
                    >

                </td>


                <td>

                    <select
                        class="visitor-status-input"
                        data-index="${index}"
                    >

                        <option
                            value="Present"
                            ${
                                visitor.status ===
                                "Present"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Present
                        </option>

                        <option
                            value="Absent"
                            ${
                                visitor.status ===
                                "Absent"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Absent
                        </option>

                        <option
                            value="Late"
                            ${
                                visitor.status ===
                                "Late"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Late
                        </option>

                    </select>

                </td>


                <td>

                    <button
                        type="button"
                        class="remove-visitor-button remove-button"
                        data-index="${index}"
                    >

                        Remove

                    </button>

                </td>

            `;


            visitorsBody.appendChild(
                tr
            );

        }
    );


    bindVisitorInputEvents();

}


/* =====================================================
   VISITOR EVENTS
   ===================================================== */

function bindVisitorInputEvents() {

    function bindTextInput(
        selector,
        property
    ) {

        visitorsBody
            .querySelectorAll(
                selector
            )
            .forEach(
                function(input) {

                    input.addEventListener(
                        "input",
                        function() {

                            const index =
                                Number(
                                    this.dataset
                                        .index
                                );


                            if (
                                currentVisitors[
                                    index
                                ]
                            ) {

                                currentVisitors[
                                    index
                                ][property] =
                                    this.value.trim();

                            }

                        }
                    );

                }
            );

    }


    bindTextInput(
        ".visitor-name-input",
        "name"
    );


    bindTextInput(
        ".visitor-phone-input",
        "phone"
    );


    bindTextInput(
        ".visitor-combination-input",
        "combination"
    );


    bindTextInput(
        ".visitor-association-input",
        "association"
    );


    visitorsBody
        .querySelectorAll(
            ".visitor-year-input"
        )
        .forEach(
            function(input) {

                input.addEventListener(
                    "change",
                    function() {

                        const index =
                            Number(
                                this.dataset
                                    .index
                            );


                        if (
                            currentVisitors[
                                index
                            ]
                        ) {

                            currentVisitors[
                                index
                            ].year =
                                this.value;

                        }

                    }
                );

            }
        );


    visitorsBody
        .querySelectorAll(
            ".visitor-status-input"
        )
        .forEach(
            function(input) {

                input.addEventListener(
                    "change",
                    function() {

                        const index =
                            Number(
                                this.dataset
                                    .index
                            );


                        if (
                            currentVisitors[
                                index
                            ]
                        ) {

                            currentVisitors[
                                index
                            ].status =
                                this.value;

                        }


                        updateAttendanceSummary();

                    }
                );

            }
        );


    visitorsBody
        .querySelectorAll(
            ".remove-visitor-button"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        const index =
                            Number(
                                this.dataset
                                    .index
                            );


                        currentVisitors.splice(
                            index,
                            1
                        );


                        renderVisitors();


                        updateAttendanceSummary();

                    }
                );

            }
        );

}


/* =====================================================
   ADD VISITOR BUTTON
   ===================================================== */

if (
    addVisitorButton
) {

    addVisitorButton.addEventListener(
        "click",
        function() {

            if (
                !currentAttendanceCellId ||
                !currentAttendanceDate
            ) {

                alert(
                    "Please select a cell and meeting date, then click Load Members first."
                );


                return;

            }


            currentVisitors.push(
                createVisitorObject()
            );


            renderVisitors();


            updateAttendanceSummary();

        }
    );

}


/* =====================================================
   FIND EXISTING VISITOR
   ===================================================== */

async function findExistingVisitor(
    visitor,
    cellId
) {

    if (
        !cmsAttendanceSupabase
    ) {

        return null;

    }


    const normalizedPhone =
        normalizePhone(
            visitor.phone
        );


    if (
        normalizedPhone
    ) {

        const {
            data,
            error
        } =
            await cmsAttendanceSupabase
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
                        converted_to_member,
                        member_id,
                        first_visit_date,
                        last_visit_date,
                        visit_count,
                        active
                    `
                )
                .eq(
                    "cell_id",
                    cellId
                )
                .eq(
                    "phone",
                    visitor.phone.trim()
                )
                .limit(
                    1
                );


        if (
            !error &&
            Array.isArray(data) &&
            data.length
        ) {

            return data[0];

        }

    }


    const normalizedName =
        normalizeText(
            visitor.name
        );


    if (
        !normalizedName
    ) {

        return null;

    }


    const {
        data,
        error
    } =
        await cmsAttendanceSupabase
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
                    converted_to_member,
                    member_id,
                    first_visit_date,
                    last_visit_date,
                    visit_count,
                    active
                `
            )
            .eq(
                "cell_id",
                cellId
            );


    if (
        error ||
        !Array.isArray(data)
    ) {

        return null;

    }


    return (

        data.find(
            function(item) {

                return (

                    normalizeText(
                        item.full_name
                    ) ===
                    normalizedName

                    &&

                    normalizeText(
                        item.year_of_study
                    ) ===
                    normalizeText(
                        visitor.year
                    )

                    &&

                    normalizeText(
                        item.combination
                    ) ===
                    normalizeText(
                        visitor.combination
                    )

                );

            }
        )

        ||

        null

    );

}


/* =====================================================
   DUPLICATE VISITOR CHECK
   ===================================================== */

function hasDuplicateVisitor(
    visitor,
    ignoreIndex
) {

    const phone =
        normalizePhone(
            visitor.phone
        );


    const name =
        normalizeText(
            visitor.name
        );


    const year =
        normalizeText(
            visitor.year
        );


    const combination =
        normalizeText(
            visitor.combination
        );


    return currentVisitors.some(
        function(existing, index) {

            if (
                index ===
                ignoreIndex
            ) {

                return false;

            }


            if (
                phone &&
                normalizePhone(
                    existing.phone
                ) ===
                phone
            ) {

                return true;

            }


            return (

                name &&
                year &&
                combination

                &&

                normalizeText(
                    existing.name
                ) ===
                name

                &&

                normalizeText(
                    existing.year
                ) ===
                year

                &&

                normalizeText(
                    existing.combination
                ) ===
                combination

            );

        }
    );

}


/* =====================================================
   SAVE VISITOR MASTER
   ===================================================== */

async function saveVisitorMaster(
    visitor,
    cellId,
    meetingDate
) {

    let existing =
        null;


    if (
        visitor.visitorId
    ) {

        existing = {

            id:
                visitor.visitorId

        };

    }

    else {

        existing =
            await findExistingVisitor(
                visitor,
                cellId
            );

    }


    const payload = {

        full_name:
            visitor.name.trim(),

        phone:
            visitor.phone.trim() ||
            null,

        year_of_study:
            visitor.year ||
            null,

        combination:
            visitor.combination.trim() ||
            null,

        association:
            visitor.association.trim() ||
            null,

        cell_id:
            cellId,

        active:
            true,

        updated_at:
            new Date()
                .toISOString()

    };


    if (
        existing?.id
    ) {

        const {
            data,
            error
        } =
            await cmsAttendanceSupabase
                .from(
                    "visitors"
                )
                .update(
                    payload
                )
                .eq(
                    "id",
                    existing.id
                )
                .select()
                .single();


        if (
            error
        ) {

            attendanceError(
                "update Visitor",
                error
            );


            throw error;

        }


        return data;

    }


    payload.first_visit_date =
        meetingDate;


    payload.last_visit_date =
        meetingDate;


    payload.visit_count =
        0;


    payload.converted_to_member =
        false;


    const {
        data,
        error
    } =
        await cmsAttendanceSupabase
            .from(
                "visitors"
            )
            .insert(
                payload
            )
            .select()
            .single();


    if (
        error
    ) {

        attendanceError(
            "create Visitor",
            error
        );


        throw error;

    }


    return data;

}


/* =====================================================
   SAVE VISITOR VISIT
   ===================================================== */

async function saveVisitorVisit(
    visitor,
    visitorMaster,
    sessionId,
    cellId,
    meetingDate
) {

    if (
        !visitorMaster?.id
    ) {

        return;

    }


    const {
        data:
            existingVisit,
        error:
            lookupError
    } =
        await cmsAttendanceSupabase
            .from(
                "visitor_visits"
            )
            .select(
                "id"
            )
            .eq(
                "visitor_id",
                visitorMaster.id
            )
            .eq(
                "cell_id",
                cellId
            )
            .eq(
                "visit_date",
                meetingDate
            )
            .maybeSingle();


    if (
        lookupError
    ) {

        console.warn(
            "CMS Attendance visitor visit lookup:",
            lookupError
        );

    }


    const payload = {

        visitor_id:
            visitorMaster.id,

        cell_id:
            cellId,

        attendance_session_id:
            sessionId ||
            null,

        visit_date:
            meetingDate,

        status:
            visitor.status ||
            "Present"

    };


    if (
        existingVisit?.id
    ) {

        const {
            error
        } =
            await cmsAttendanceSupabase
                .from(
                    "visitor_visits"
                )
                .update(
                    payload
                )
                .eq(
                    "id",
                    existingVisit.id
                );


        if (
            error
        ) {

            attendanceError(
                "update Visitor Visit",
                error
            );


            throw error;

        }

    }

    else {

        const {
            error
        } =
            await cmsAttendanceSupabase
                .from(
                    "visitor_visits"
                )
                .insert(
                    payload
                );


        if (
            error
        ) {

            attendanceError(
                "save Visitor Visit",
                error
            );


            throw error;

        }

    }


    visitor.visitorId =
        visitorMaster.id;

}


/* =====================================================
   REFRESH VISITOR STATISTICS
   ===================================================== */

async function refreshVisitorStatistics(
    visitorId
) {

    if (
        !visitorId
    ) {

        return;

    }


    const {
        data:
            visits,
        error
    } =
        await cmsAttendanceSupabase
            .from(
                "visitor_visits"
            )
            .select(
                "visit_date"
            )
            .eq(
                "visitor_id",
                visitorId
            )
            .order(
                "visit_date",
                {
                    ascending:
                        true
                }
            );


    if (
        error
    ) {

        console.warn(
            "CMS Attendance visitor statistics:",
            error
        );


        return;

    }


    const list =
        visits ||
        [];


    if (
        !list.length
    ) {

        return;

    }


    await cmsAttendanceSupabase
        .from(
            "visitors"
        )
        .update(
            {

                first_visit_date:
                    list[0]
                        .visit_date,

                last_visit_date:
                    list[
                        list.length - 1
                    ]
                        .visit_date,

                visit_count:
                    list.length,

                updated_at:
                    new Date()
                        .toISOString()

            }
        )
        .eq(
            "id",
            visitorId
        );

}


/* =====================================================
   REMOVE DELETED VISITOR VISITS
   ===================================================== */

async function removeDeletedVisitorVisits(
    sessionId,
    currentVisitorIds
) {

    if (
        !sessionId
    ) {

        return;

    }


    const {
        data:
            existingVisits,
        error
    } =
        await cmsAttendanceSupabase
            .from(
                "visitor_visits"
            )
            .select(
                "id,visitor_id"
            )
            .eq(
                "attendance_session_id",
                sessionId
            );


    if (
        error
    ) {

        console.warn(
            "CMS Attendance deleted visitor lookup:",
            error
        );


        return;

    }


    const keepIds =
        new Set(
            (
                currentVisitorIds ||
                []
            )
            .filter(
                Boolean
            )
            .map(
                String
            )
        );


    for (
        const record of
            existingVisits ||
            []
    ) {

        if (
            !keepIds.has(
                String(
                    record.visitor_id
                )
            )
        ) {

            const {
                error:
                    deleteError
            } =
                await cmsAttendanceSupabase
                    .from(
                        "visitor_visits"
                    )
                    .delete()
                    .eq(
                        "id",
                        record.id
                    );


            if (
                deleteError
            ) {

                console.warn(
                    "CMS Attendance visitor delete:",
                    deleteError
                );

            }

            else {

                await refreshVisitorStatistics(
                    record.visitor_id
                );

            }

        }

    }

}


/* =====================================================
   SAVE VISITORS
   ===================================================== */

async function saveVisitorsToSupabase(
    sessionId,
    cellId,
    meetingDate
) {

    const savedVisitorIds =
        [];


    for (
        const visitor of
            currentVisitors
    ) {

        visitor.name =
            visitor.name.trim();


        visitor.phone =
            visitor.phone.trim();


        visitor.combination =
            visitor.combination.trim();


        visitor.association =
            visitor.association.trim();


        if (
            !visitor.name
        ) {

            throw new Error(
                "Every visitor must have a name."
            );

        }


        const master =
            await saveVisitorMaster(
                visitor,
                cellId,
                meetingDate
            );


        visitor.visitorId =
            master.id;


        savedVisitorIds.push(
            master.id
        );


        await saveVisitorVisit(
            visitor,
            master,
            sessionId,
            cellId,
            meetingDate
        );

    }


    await removeDeletedVisitorVisits(
        sessionId,
        savedVisitorIds
    );


    for (
        const visitorId of
            savedVisitorIds
    ) {

        await refreshVisitorStatistics(
            visitorId
        );

    }


    return savedVisitorIds;

}


/* =====================================================
   SAVE ATTENDANCE
   ===================================================== */

if (
    saveAttendanceButton
) {

    saveAttendanceButton.addEventListener(
        "click",
        saveAttendance
    );

}


async function saveAttendance() {

    if (
        !cmsAttendanceSupabase
    ) {

        alert(
            "Supabase is not connected."
        );


        return;

    }


    const selectedCellId =

        isAttendanceCellLeader()

            ? attendanceAccess.cellId

            : (
                attendanceCell?.value ||
                ""
            );


    const selectedDate =
        attendanceDate?.value ||
        "";


    if (
        !selectedCellId
    ) {

        alert(
            "Please select a cell."
        );


        return;

    }


    if (
        !selectedDate
    ) {

        alert(
            "Please select a meeting date."
        );


        return;

    }


    if (
        !members.length
    ) {

        alert(
            "Please load the members before saving attendance."
        );


        return;

    }


    /* ==============================================
       VISITOR VALIDATION
       ============================================== */

    for (
        let i = 0;
        i < currentVisitors.length;
        i++
    ) {

        const visitor =
            currentVisitors[i];


        if (
            !visitor.name.trim()
        ) {

            alert(
                "Please enter a name for every visitor."
            );


            return;

        }


        if (
            hasDuplicateVisitor(
                visitor,
                i
            )
        ) {

            alert(
                `The visitor "${visitor.name}" appears more than once in this attendance record.`
            );


            return;

        }

    }


    const originalText =
        saveAttendanceButton.textContent;


    saveAttendanceButton.disabled =
        true;


    saveAttendanceButton.textContent =
        "SAVING...";


    try {

        let sessionId =
            currentSession?.id ||
            null;


        /* ==========================================
           CREATE SESSION
           ========================================== */

       if (
    !sessionId
) {

    const {
        data:
            createdSession,
        error
    } =
        await cmsAttendanceSupabase
            .from(
                "attendance_sessions"
            )
            .insert(
                {
                    cell_id:
                        selectedCellId,

                    meeting_date:
                        selectedDate,

                    visitors:
                        [],

                    notes:
                        null,

                    created_by:
                        attendanceAccess.userId ||
                        null
                }
            )
            .select()
            .single();


    /*
       Another leader may have created
       the same cell/date at almost the
       same time.

       Because of the unique index,
       Supabase returns 23505.

       In that situation, simply load
       the existing shared session.
    */

    if (
        error &&
        error.code === "23505"
    ) {

        const {
            data:
                existingSession,
            error:
                existingSessionError
        } =
            await cmsAttendanceSupabase
                .from(
                    "attendance_sessions"
                )
                .select()
                .eq(
                    "cell_id",
                    selectedCellId
                )
                .eq(
                    "meeting_date",
                    selectedDate
                )
                .maybeSingle();


        if (
            existingSessionError ||
            !existingSession
        ) {

            attendanceError(
                "load shared Attendance Session",
                existingSessionError ||
                {
                    message:
                        "The shared attendance session could not be found."
                }
            );

            return;

        }


        currentSession =
            existingSession;


        sessionId =
            existingSession.id;

    }

    else if (
        error
    ) {

        attendanceError(
            "create Attendance Session",
            error
        );

        return;

    }

    else {

        currentSession =
            createdSession;


        sessionId =
            createdSession.id;

    }

}


        /* ==========================================
           LOAD EXISTING MEMBER ATTENDANCE
           ========================================== */

        const {
            data:
                existingRows,
            error:
                existingError
        } =
            await cmsAttendanceSupabase
                .from(
                    "attendance"
                )
                .select(
                    "id,member_id,session_id,cell_id,meeting_date"
                )
                .eq(
                    "cell_id",
                    selectedCellId
                )
                .eq(
                    "meeting_date",
                    selectedDate
                );


        if (
            existingError
        ) {

            attendanceError(
                "load existing Attendance",
                existingError
            );


            return;

        }


        const existingByMember =
            new Map();


        (
            existingRows ||
            []
        )
        .forEach(
            function(row) {

                existingByMember.set(
                    String(
                        row.member_id
                    ),
                    row
                );

            }
        );


        const keptMemberIds =
            new Set();


        /* ==========================================
           SAVE MEMBERS
           ========================================== */

        for (
            const row of
                currentAttendanceRows
        ) {

            keptMemberIds.add(
                String(
                    row.memberId
                )
            );


            const payload = {

                cell_id:
                    selectedCellId,

                member_id:
                    row.memberId,

                meeting_date:
                    selectedDate,

                status:
                    row.status,

                session_id:
                    sessionId

            };


            const existing =
                existingByMember.get(
                    String(
                        row.memberId
                    )
                );


            if (
                existing?.id
            ) {

                const {
                    data,
                    error
                } =
                    await cmsAttendanceSupabase
                        .from(
                            "attendance"
                        )
                        .update(
                            payload
                        )
                        .eq(
                            "id",
                            existing.id
                        )
                        .select()
                        .single();


                if (
                    error
                ) {

                    attendanceError(
                        "update Member Attendance",
                        error
                    );


                    return;

                }


                row.id =
                    data.id;

            }

            else {

                const {
                    data,
                    error
                } =
                    await cmsAttendanceSupabase
                        .from(
                            "attendance"
                        )
                        .insert(
                            payload
                        )
                        .select()
                        .single();


                if (
                    error
                ) {

                    attendanceError(
                        "save Member Attendance",
                        error
                    );


                    return;

                }


                row.id =
                    data.id;

            }

        }


        /* ==========================================
           DELETE REMOVED MEMBER ROWS
           ========================================== */

        for (
            const existing of
                (
                    existingRows ||
                    []
                )
        ) {

            if (
                !keptMemberIds.has(
                    String(
                        existing.member_id
                    )
                )
            ) {

                const {
                    error
                } =
                    await cmsAttendanceSupabase
                        .from(
                            "attendance"
                        )
                        .delete()
                        .eq(
                            "id",
                            existing.id
                        );


                if (
                    error
                ) {

                    console.warn(
                        "CMS Attendance removed member record:",
                        error
                    );

                }

            }

        }


        /* ==========================================
           SAVE VISITORS
           ========================================== */

        await saveVisitorsToSupabase(
            sessionId,
            selectedCellId,
            selectedDate
        );


        /* ==========================================
           SAVE VISITOR SNAPSHOT
           ========================================== */

        const visitorSnapshot =
            currentVisitors.map(
                function(visitor) {

                    return {

                        id:
                            visitor.visitorId ||
                            visitor.id,

                        visitorId:
                            visitor.visitorId ||
                            null,

                        name:
                            visitor.name,

                        phone:
                            visitor.phone,

                        year:
                            visitor.year,

                        combination:
                            visitor.combination,

                        association:
                            visitor.association,

                        status:
                            visitor.status

                    };

                }
            );


        const {
            data:
                finalSession,
            error:
                sessionError
        } =
            await cmsAttendanceSupabase
                .from(
                    "attendance_sessions"
                )
                .update(
                    {

                        visitors:
                            visitorSnapshot

                    }
                )
                .eq(
                    "id",
                    sessionId
                )
                .select()
                .single();


        if (
            sessionError
        ) {

            attendanceError(
                "update Attendance Session",
                sessionError
            );


            return;

        }


        currentSession =
            finalSession;


        /* ==========================================
           LOCAL BACKUP
           ========================================== */

        saveAttendanceLocalBackup(
            selectedCellId,
            selectedDate
        );


        /* ==========================================
           UPDATE COUNTERS
           ========================================== */

        updateAttendanceSummary();


        alert(
            "Attendance saved successfully."
        );


        console.log(
            "CMS Attendance: attendance saved successfully.",
            {

                cellId:
                    selectedCellId,

                date:
                    selectedDate,

                registeredMembers:
                    currentAttendanceRows.length,

                visitors:
                    currentVisitors.length,

                attendanceRate:
                    `${calculateCurrentAttendanceSummary().rate}%`

            }
        );


        /*
           Reload the meeting from Supabase so the
           interface reflects the saved data.
        */

        await loadAttendanceMembers();

    }

    catch (error) {

        console.error(
            "CMS Attendance save error:",
            error
        );


        alert(
            error?.message ||
            "Unable to save attendance."
        );

    }

    finally {

        saveAttendanceButton.disabled =
            false;


        saveAttendanceButton.textContent =
            originalText ||
            "SAVE ATTENDANCE";

    }

}


/* =====================================================
   LOCAL BACKUP
   ===================================================== */

function saveAttendanceLocalBackup(
    cellId,
    date
) {

    try {

        let records =
            [];


        try {

            const parsed =
                JSON.parse(
                    localStorage.getItem(
                        "cmsAttendance"
                    ) ||
                    "[]"
                );


            if (
                Array.isArray(
                    parsed
                )
            ) {

                records =
                    parsed;

            }

        }

        catch (error) {

            console.warn(
                "CMS Attendance backup parse:",
                error
            );

        }


        const summary =
            calculateCurrentAttendanceSummary();


        const record = {

            id:
                currentSession?.id ||
                `attendance_${Date.now()}`,

            cellId:
                cellId,

            cellName:
                getAttendanceCellName(
                    cellId
                ),

            date:
                date,

            members:

                currentAttendanceRows.map(
                    function(row) {

                        return {

                            memberId:
                                row.memberId,

                            name:
                                row.name,

                            phone:
                                row.phone,

                            year:
                                row.year,

                            combination:
                                row.combination,

                            status:
                                row.status

                        };

                    }
                ),

            visitors:

                currentVisitors.map(
                    function(visitor) {

                        return {

                            id:
                                visitor.visitorId ||
                                visitor.id,

                            visitorId:
                                visitor.visitorId ||
                                null,

                            name:
                                visitor.name,

                            phone:
                                visitor.phone,

                            year:
                                visitor.year,

                            combination:
                                visitor.combination,

                            association:
                                visitor.association,

                            status:
                                visitor.status

                        };

                    }
                ),

            summary: {

                total:
                    summary.totalMembers,

                totalMembers:
                    summary.totalMembers,

                present:
                    summary.present,

                absent:
                    summary.absent,

                late:
                    summary.late,

                excused:
                    summary.excused,

                rate:
                    summary.rate,

                visitors:
                    summary.visitors

            },

            updatedAt:
                new Date()
                    .toISOString()

        };


        const existingIndex =
            records.findIndex(
                function(item) {

                    return (

                        String(
                            item.cellId
                        ) ===
                        String(
                            cellId
                        )

                        &&

                        String(
                            item.date
                        ) ===
                        String(
                            date
                        )

                    );

                }
            );


        if (
            existingIndex >=
            0
        ) {

            records[
                existingIndex
            ] =
                record;

        }

        else {

            records.push(
                record
            );

        }


        localStorage.setItem(
            "cmsAttendance",
            JSON.stringify(
                records
            )
        );

    }

    catch (error) {

        console.warn(
            "CMS Attendance local backup failed:",
            error
        );

    }

}


/* =====================================================
   ATTENDANCE SUMMARY

   REGISTERED MEMBERS ONLY FOR RATE.
   ===================================================== */

function calculateCurrentAttendanceSummary() {

    let present =
        0;


    let absent =
        0;


    let late =
        0;


    let excused =
        0;


    /* ---------------------------------------------
       REGISTERED MEMBERS
       --------------------------------------------- */

    currentAttendanceRows.forEach(
        function(row) {

            const status =
                normalizeStatus(
                    row.status
                );


            if (
                status ===
                    "present" ||

                status ===
                    "p"
            ) {

                present++;

            }

            else if (
                status ===
                    "absent" ||

                status ===
                    "a"
            ) {

                absent++;

            }

            else if (
                status ===
                    "late" ||

                status ===
                    "l"
            ) {

                late++;

            }

            else if (
                status ===
                    "excused" ||

                status ===
                    "e"
            ) {

                excused++;

            }

        }
    );


    /*
       REGISTERED MEMBER TOTAL

       Visitors are deliberately NOT added here.
    */

    const totalMembers =
        currentAttendanceRows.length;


    const attended =
        present +
        late;


    const rate =
        totalMembers > 0

            ? Math.round(
                (
                    attended /
                    totalMembers
                ) *
                100
            )

            : 0;


    /*
       VISITOR COUNT IS SEPARATE.
    */

    const visitors =
        currentVisitors.length;


    return {

        totalMembers:
            totalMembers,

        present:
            present,

        absent:
            absent,

        late:
            late,

        excused:
            excused,

        attended:
            attended,

        rate:
            rate,

        visitors:
            visitors

    };

}


/* =====================================================
   UPDATE ALL SUMMARY CARDS
   ===================================================== */

function updateAttendanceSummary() {

    /*
       Make sure the visitor card exists.
    */

    createVisitorSummaryCard();


    addVisitorSummaryStyles();


    const summary =
        calculateCurrentAttendanceSummary();


    /* ---------------------------------------------
       REGISTERED MEMBERS
       --------------------------------------------- */

    if (
        totalMembers
    ) {

        totalMembers.textContent =
            summary.totalMembers;

    }


    /* ---------------------------------------------
       PRESENT
       --------------------------------------------- */

    if (
        presentCount
    ) {

        presentCount.textContent =
            summary.present;

    }


    /* ---------------------------------------------
       ABSENT
       --------------------------------------------- */

    if (
        absentCount
    ) {

        absentCount.textContent =
            summary.absent;

    }


    /* ---------------------------------------------
       LATE
       --------------------------------------------- */

    if (
        lateCount
    ) {

        lateCount.textContent =
            summary.late;

    }


    /* ---------------------------------------------
       EXCUSED
       --------------------------------------------- */

    if (
        excusedCount
    ) {

        excusedCount.textContent =
            summary.excused;

    }


    /* ---------------------------------------------
       VISITORS / NEWCOMERS
       --------------------------------------------- */

    if (
        visitorCount
    ) {

        visitorCount.textContent =
            summary.visitors;

    }


    /* ---------------------------------------------
       ATTENDANCE RATE
       --------------------------------------------- */

    if (
        attendanceRate
    ) {

        attendanceRate.textContent =
            `${summary.rate}%`;

    }


    console.log(
        "CMS Attendance automatic summary:",
        {

            totalMembers:
                summary.totalMembers,

            present:
                summary.present,

            absent:
                summary.absent,

            late:
                summary.late,

            excused:
                summary.excused,

            visitors:
                summary.visitors,

            attendanceRate:
                `${summary.rate}%`

        }
    );


    return summary;

}


/* =====================================================
   CELL CHANGE
   ===================================================== */

if (
    attendanceCell
) {

    attendanceCell.addEventListener(
        "change",
        function() {

            currentAttendanceRows =
                [];


            currentVisitors =
                [];


            currentSession =
                null;


            currentAttendanceCellId =
                "";


            renderAttendanceMembers();


            renderVisitors();


            updateAttendanceSummary();

        }
    );

}


/* =====================================================
   DATE CHANGE
   ===================================================== */

if (
    attendanceDate
) {

    attendanceDate.addEventListener(
        "change",
        function() {

            currentAttendanceRows =
                [];


            currentVisitors =
                [];


            currentSession =
                null;


            currentAttendanceDate =
                "";


            currentAttendanceCellId =
                "";


            renderAttendanceMembers();


            renderVisitors();


            updateAttendanceSummary();

        }
    );

}


/* =====================================================
   LOAD BUTTON
   ===================================================== */

if (
    loadMembersButton
) {

    loadMembersButton.addEventListener(
        "click",
        async function() {

            await loadAttendanceMembers();

        }
    );

}


/* =====================================================
   TEXT NORMALIZATION
   ===================================================== */

function normalizeText(
    value
) {

    return String(
        value ||
        ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            " "
        );

}


/* =====================================================
   PHONE NORMALIZATION
   ===================================================== */

function normalizePhone(
    value
) {

    return String(
        value ||
        ""
    )
        .replace(
            /[^0-9+]/g,
            ""
        )
        .trim();

}


/* =====================================================
   STATUS NORMALIZATION
   ===================================================== */

function normalizeStatus(
    value
) {

    return String(
        value ||
        ""
    )
        .trim()
        .toLowerCase();

}


/* =====================================================
   HTML ESCAPE
   ===================================================== */

function escapeAttendanceHTML(
    value
) {

    return String(
        value ??
        ""
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


/* =====================================================
   ATTRIBUTE ESCAPE
   ===================================================== */

function escapeAttribute(
    value
) {

    return escapeAttendanceHTML(
        value
    );

}


/* =====================================================
   INITIALIZATION
   ===================================================== */

async function initializeAttendance() {

    console.log(
        "CMS Attendance: initializing..."
    );


    if (
        !cmsAttendanceSupabase
    ) {

        console.error(
            "CMS Attendance: Supabase unavailable."
        );


        return;

    }


    await initializeAttendanceAccess();


    /*
       Create the visitor summary card BEFORE
       the first summary calculation.
    */

    createVisitorSummaryCard();


    addVisitorSummaryStyles();


    await loadAttendanceCells();


    applyAttendanceRolePresentation();


    addAttendanceTableStyles();


    updateMemberAttendanceHeader();


    updateVisitorTableHeader();


    renderAttendanceMembers();


    renderVisitors();


    updateAttendanceSummary();


    console.log(
        "CMS Attendance module loaded successfully."
    );


    console.log(
        "CMS Attendance access:",
        attendanceAccess
    );

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
        initializeAttendance
    );

}

else {

    initializeAttendance();

}