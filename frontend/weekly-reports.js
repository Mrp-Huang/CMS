/* =====================================================
   CMS - WEEKLY REPORTS MANAGEMENT SYSTEM
   FINAL SUPABASE CONNECTED VERSION

   STRUCTURE PRESERVED:

   CELLS
      ↓
   MEMBERS
      ↓
   ATTENDANCE
      ↓
   WEEKLY REPORTS
      ↓
   FOLLOW-UPS / RECORDS / DASHBOARD

   FEATURES:
   - New Report
   - Attendance auto-load
   - Save Draft
   - Submit
   - View
   - Edit
   - Delete
   - Download
   - Print
   - Search
   - Statistics
   - Auto-save draft
   - Restore draft
   - Supabase live data
   - Realtime updates
   - Coordinator access
   - Cell Leader access
   - Cell restriction
   - Existing localStorage compatibility

   IMPORTANT:
   This improves the existing module.
   It does not remove the existing report structure.
   ===================================================== */


/* =====================================================
   SUPABASE
   ===================================================== */

const CMS_WEEKLY_REPORTS_SUPABASE =
    window.supabaseClient || null;


/* =====================================================
   ACCESS
   ===================================================== */

let weeklyReportsAccess = {

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
   DATA
   ===================================================== */

let cells = [];

let members = [];

let attendanceRecords = [];

let weeklyReports = [];


/* =====================================================
   CURRENT VIEW
   ===================================================== */

let currentViewedReportId =
    null;


/* =====================================================
   REALTIME
   ===================================================== */

let weeklyReportsRealtimeChannel =
    null;


/* =====================================================
   ELEMENTS
   ===================================================== */

const reportModal =
    document.getElementById(
        "reportModal"
    );


const viewReportModal =
    document.getElementById(
        "viewReportModal"
    );


const weeklyReportForm =
    document.getElementById(
        "weeklyReportForm"
    );


const reportId =
    document.getElementById(
        "reportId"
    );


const reportCell =
    document.getElementById(
        "reportCell"
    );


const reportDate =
    document.getElementById(
        "reportDate"
    );


const meetingLocation =
    document.getElementById(
        "meetingLocation"
    );


const membersLife =
    document.getElementById(
        "membersLife"
    );


const activityDone =
    document.getElementById(
        "activityDone"
    );


const challengesNeeds =
    document.getElementById(
        "challengesNeeds"
    );


const followUpNeeded =
    document.getElementById(
        "followUpNeeded"
    );


const nextWeekPlan =
    document.getElementById(
        "nextWeekPlan"
    );


const additionalComments =
    document.getElementById(
        "additionalComments"
    );


const reportAttendanceSummary =
    document.getElementById(
        "reportAttendanceSummary"
    );


const reportsTableBody =
    document.getElementById(
        "reportsTableBody"
    );


const reportSearch =
    document.getElementById(
        "reportSearch"
    );


const newReportButton =
    document.getElementById(
        "newReportButton"
    );


const closeReportModalButton =
    document.getElementById(
        "closeReportModal"
    );


const cancelReportButton =
    document.getElementById(
        "cancelReportButton"
    );


const saveDraftButton =
    document.getElementById(
        "saveDraftButton"
    );


const draftSavedMessage =
    document.getElementById(
        "draftSavedMessage"
    );


const totalReports =
    document.getElementById(
        "totalReports"
    );


const submittedReports =
    document.getElementById(
        "submittedReports"
    );


const draftReports =
    document.getElementById(
        "draftReports"
    );


const todayReports =
    document.getElementById(
        "todayReports"
    );


const closeViewReportModal =
    document.getElementById(
        "closeViewReportModal"
    );


const closeViewReportButton =
    document.getElementById(
        "closeViewReportButton"
    );


const viewReportContent =
    document.getElementById(
        "viewReportContent"
    );


const viewReportSubtitle =
    document.getElementById(
        "viewReportSubtitle"
    );


const printReportButton =
    document.getElementById(
        "printReportButton"
    );


const downloadReportButton =
    document.getElementById(
        "downloadReportButton"
    );


/* =====================================================
   SAFE LOCAL ARRAY
   ===================================================== */

function readLocalArray(
    key
) {

    try {

        const parsed =
            JSON.parse(
                localStorage.getItem(
                    key
                ) ||
                "[]"
            );


        return Array.isArray(
            parsed
        )
            ? parsed
            : [];

    }

    catch (error) {

        console.warn(
            "CMS Weekly Reports local storage error:",
            key,
            error
        );


        return [];

    }

}


/* =====================================================
   REFRESH LOCAL CACHE
   ===================================================== */

function refreshLocalData() {

    cells =
        readLocalArray(
            "cmsCells"
        );


    members =
        readLocalArray(
            "cmsMembers"
        );


    attendanceRecords =
        readLocalArray(
            "cmsAttendance"
        );


    weeklyReports =
        readLocalArray(
            "cmsWeeklyReports"
        );

}


/* =====================================================
   SAVE LOCAL REPORT CACHE
   ===================================================== */

function saveLocalReports() {

    try {

        localStorage.setItem(
            "cmsWeeklyReports",
            JSON.stringify(
                weeklyReports
            )
        );

    }

    catch (error) {

        console.warn(
            "CMS Weekly Reports cache save failed:",
            error
        );

    }

}


/* =====================================================
   GENERATE ID
   ===================================================== */

function generateId() {

    return (

        "report_" +

        Date.now() +

        "_" +

        Math.random()
            .toString(36)
            .substring(
                2,
                10
            )

    );

}


/* =====================================================
   TODAY
   ===================================================== */

function getToday() {

    const today =
        new Date();


    return (

        today.getFullYear() +

        "-" +

        String(
            today.getMonth() + 1
        )
        .padStart(
            2,
            "0"
        ) +

        "-" +

        String(
            today.getDate()
        )
        .padStart(
            2,
            "0"
        )

    );

}


/* =====================================================
   FORMAT DATE
   ===================================================== */

function formatDate(
    value
) {

    if (
        !value
    ) {

        return "—";

    }


    const parts =
        String(
            value
        )
        .split(
            "-"
        );


    if (
        parts.length !==
        3
    ) {

        return String(
            value
        );

    }


    return (

        `${parts[2]}/${parts[1]}/${parts[0]}`

    );

}


/* =====================================================
   GET CELL NAME
   ===================================================== */

function getCellName(
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
        "Unknown Cell"

    );

}


/* =====================================================
   STATUS
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
   ESCAPE HTML
   ===================================================== */

function escapeHTML(
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
   ESCAPE ATTRIBUTE
   ===================================================== */

function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


/* =====================================================
   MULTILINE
   ===================================================== */

function formatMultilineText(
    value
) {

    return escapeHTML(
        String(
            value ||
            ""
        )
    )
    .replace(
        /\n/g,
        "<br>"
    );

}


/* =====================================================
   INITIALIZE ACCESS
   ===================================================== */

async function initializeWeeklyReportsAccess() {

    try {

        if (
            window.CMSAccess &&
            typeof window.CMSAccess.initialize ===
                "function"
        ) {

            const access =
                await window.CMSAccess.initialize();


            weeklyReportsAccess = {

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
                "CMS Weekly Reports access:",
                weeklyReportsAccess
            );


            return weeklyReportsAccess;

        }


        if (
            !CMS_WEEKLY_REPORTS_SUPABASE
        ) {

            return weeklyReportsAccess;

        }


        const {
            data:
                sessionData
        } =
            await CMS_WEEKLY_REPORTS_SUPABASE
                .auth
                .getSession();


        const session =
            sessionData?.session;


        if (
            !session?.user?.id
        ) {

            return weeklyReportsAccess;

        }


        weeklyReportsAccess.userId =
            session.user.id;


        const {
            data:
                roleData
        } =
            await CMS_WEEKLY_REPORTS_SUPABASE
                .rpc(
                    "cms_my_role"
                );


        weeklyReportsAccess.role =
            roleData ||
            "none";


        if (
            weeklyReportsAccess.role ===
                "cell_leader"
        ) {

            const {
                data:
                    assignedCells
            } =
                await CMS_WEEKLY_REPORTS_SUPABASE
                    .rpc(
                        "cms_my_cells"
                    );


            if (
                Array.isArray(
                    assignedCells
                ) &&
                assignedCells.length
            ) {

                weeklyReportsAccess.cellId =
                    assignedCells[0].id ||
                    assignedCells[0].cell_id ||
                    null;

                weeklyReportsAccess.cellName =
                    assignedCells[0].name ||
                    null;

            }

        }


        console.log(
            "CMS Weekly Reports fallback access:",
            weeklyReportsAccess
        );


        return weeklyReportsAccess;

    }

    catch (error) {

        console.error(
            "CMS Weekly Reports access error:",
            error
        );


        return weeklyReportsAccess;

    }

}


/* =====================================================
   ROLE HELPERS
   ===================================================== */

function isCoordinator() {

    return (
        weeklyReportsAccess.role ===
        "coordinator"
    );

}


function isCellLeader() {

    return (
        weeklyReportsAccess.role ===
        "cell_leader"
    );

}


/* =====================================================
   ROLE PRESENTATION
   ===================================================== */

function applyRoleRestriction() {

    if (
        !reportCell
    ) {

        return;

    }


    if (
        isCellLeader()
    ) {

        reportCell.disabled =
            true;


        document
            .querySelectorAll(
                ".sidebar a, .sidebar-nav a"
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
   LOAD LIVE CELLS
   ===================================================== */

async function loadLiveCells() {

    if (
        !CMS_WEEKLY_REPORTS_SUPABASE
    ) {

        return false;

    }


    const {
        data,
        error
    } =
        await CMS_WEEKLY_REPORTS_SUPABASE
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
            .eq(
                "active",
                true
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

        console.warn(
            "CMS Weekly Reports: cells load error:",
            error
        );


        return false;

    }


    cells =
        data ||
        [];


    return true;

}


/* =====================================================
   LOAD LIVE MEMBERS
   ===================================================== */

async function loadLiveMembers() {

    if (
        !CMS_WEEKLY_REPORTS_SUPABASE
    ) {

        return false;

    }


    const {
        data,
        error
    } =
        await CMS_WEEKLY_REPORTS_SUPABASE
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
                "active",
                true
            );


    if (
        error
    ) {

        console.warn(
            "CMS Weekly Reports: members load error:",
            error
        );


        return false;

    }


    members =
        data ||
        [];


    return true;

}


/* =====================================================
   LOAD CELLS INTO SELECT
   ===================================================== */

function loadCells() {

    if (
        !reportCell
    ) {

        return;

    }


    reportCell.innerHTML = `

        <option value="">
            Select a cell
        </option>

    `;


    cells.forEach(
        function(cell) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                cell.id;


            option.textContent =
                cell.name;


            reportCell.appendChild(
                option
            );

        }
    );


    if (
        !cells.length
    ) {

        reportCell.innerHTML = `

            <option value="">
                No cells available
            </option>

        `;

    }


    if (
        isCellLeader() &&
        weeklyReportsAccess.cellId
    ) {

        reportCell.value =
            weeklyReportsAccess.cellId;


        reportCell.disabled =
            true;

    }

}


/* =====================================================
   GET LOCAL ATTENDANCE
   ===================================================== */

function findLocalAttendance(
    cellId,
    date
) {

    return attendanceRecords.find(
        function(record) {

            const recordCell =
                record.cellId ||
                record.cell_id;


            const recordDate =
                record.date ||
                record.meetingDate ||
                record.meeting_date;


            return (

                String(
                    recordCell
                ) ===

                String(
                    cellId
                )

                &&

                String(
                    recordDate
                ) ===

                String(
                    date
                )

            );

        }
    ) || null;

}


/* =====================================================
   LOAD LIVE ATTENDANCE
   ===================================================== */

async function loadLiveAttendance(
    cellId,
    date
) {

    if (
        !CMS_WEEKLY_REPORTS_SUPABASE
    ) {

        return null;

    }


    const {
        data:
            attendanceRows,
        error:
            attendanceError
    } =
        await CMS_WEEKLY_REPORTS_SUPABASE
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
            .eq(
                "cell_id",
                cellId
            )
            .eq(
                "meeting_date",
                date
            );


    if (
        attendanceError
    ) {

        console.warn(
            "CMS Weekly Reports: attendance load error:",
            attendanceError
        );


        return null;

    }


    const {
        data:
            session,
        error:
            sessionError
    } =
        await CMS_WEEKLY_REPORTS_SUPABASE
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
                cellId
            )
            .eq(
                "meeting_date",
                date
            )
            .maybeSingle();


    if (
        sessionError
    ) {

        console.warn(
            "CMS Weekly Reports: attendance session error:",
            sessionError
        );

    }


    let present =
        0;


    let absent =
        0;


    let late =
        0;


    let excused =
        0;


    (
        attendanceRows ||
        []
    )
    .forEach(
        function(row) {

            const status =
                normalizeStatus(
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


    const visitors =
        Array.isArray(
            session?.visitors
        )
            ? session.visitors
            : [];


    const membersTotal =
        attendanceRows?.length ||

        members.filter(
            function(member) {

                return (

                    String(
                        member.cell_id
                    ) ===

                    String(
                        cellId
                    )

                );

            }
        ).length;


    const attended =
        present +
        late;


    const rate =
        membersTotal > 0

            ? Math.round(
                (
                    attended /
                    membersTotal
                ) *
                100
            )

            : 0;


    let visitorsPresent =
        0;


    let visitorsAbsent =
        0;


    let visitorsLate =
        0;


    visitors.forEach(
        function(visitor) {

            const status =
                normalizeStatus(
                    visitor.status
                );


            if (
                status ===
                "present"
            ) {

                visitorsPresent++;

            }

            else if (
                status ===
                "absent"
            ) {

                visitorsAbsent++;

            }

            else if (
                status ===
                "late"
            ) {

                visitorsLate++;

            }

        }
    );


    return {

        total:
            membersTotal +
            visitors.length,

        membersTotal:
            membersTotal,

        visitorTotal:
            visitors.length,

        present:
            present,

        absent:
            absent,

        late:
            late,

        excused:
            excused,

        visitorsPresent:
            visitorsPresent,

        visitorsAbsent:
            visitorsAbsent,

        visitorsLate:
            visitorsLate,

        rate:
            rate,

        visitors:
            visitors,

        attendanceRows:
            attendanceRows ||
            [],

        session:
            session ||
            null

    };

}


/* =====================================================
   GET ATTENDANCE FOR REPORT
   ===================================================== */

async function getAttendanceForReport(
    report
) {

    const cellId =
        report.cellId;


    const date =
        report.date;


    /*
       LIVE FIRST
    */

    const live =
        await loadLiveAttendance(
            cellId,
            date
        );


    if (
        live
    ) {

        /*
           Keep old localStorage compatible.
        */

        const compatibleRecord = {

            id:
                live.session?.id ||
                `attendance_${cellId}_${date}`,

            cellId:
                cellId,

            cellName:
                getCellName(
                    cellId
                ),

            date:
                date,

            members:
                live.attendanceRows.map(
                    function(row) {

                        return {

                            memberId:
                                row.member_id,

                            member_id:
                                row.member_id,

                            status:
                                row.status

                        };

                    }
                ),

            visitors:
                live.visitors,

            summary: {

                total:
                    live.membersTotal,

                totalMembers:
                    live.membersTotal,

                present:
                    live.present,

                absent:
                    live.absent,

                late:
                    live.late,

                excused:
                    live.excused,

                rate:
                    live.rate,

                visitors:
                    live.visitorTotal

            }

        };


        const index =
            attendanceRecords.findIndex(
                function(record) {

                    return (

                        String(
                            record.cellId ||
                            record.cell_id
                        ) ===
                        String(
                            cellId
                        )

                        &&

                        String(
                            record.date ||
                            record.meetingDate ||
                            record.meeting_date
                        ) ===
                        String(
                            date
                        )

                    );

                }
            );


        if (
            index >=
            0
        ) {

            attendanceRecords[
                index
            ] =
                compatibleRecord;

        }

        else {

            attendanceRecords.push(
                compatibleRecord
            );

        }


        try {

            localStorage.setItem(
                "cmsAttendance",
                JSON.stringify(
                    attendanceRecords
                )
            );

        }

        catch (error) {

            console.warn(
                "CMS Weekly Reports attendance cache:",
                error
            );

        }


        return live;

    }


    /*
       FALLBACK
    */

    const record =
        findLocalAttendance(
            cellId,
            date
        );


    if (
        !record
    ) {

        return {

            total:
                0,

            membersTotal:
                0,

            visitorTotal:
                0,

            present:
                0,

            absent:
                0,

            late:
                0,

            excused:
                0,

            visitorsPresent:
                0,

            visitorsAbsent:
                0,

            visitorsLate:
                0,

            rate:
                0,

            visitors:
                []

        };

    }


    const memberRecords =
        Array.isArray(
            record.members
        )
            ? record.members
            : [];


    const visitorRecords =
        Array.isArray(
            record.visitors
        )
            ? record.visitors
            : [];


    const summary =
        record.summary ||
        {};


    let present =
        Number(
            summary.present
        ) || 0;


    let absent =
        Number(
            summary.absent
        ) || 0;


    let late =
        Number(
            summary.late
        ) || 0;


    let excused =
        Number(
            summary.excused
        ) || 0;


    if (
        summary.present ===
            undefined &&

        summary.absent ===
            undefined &&

        summary.late ===
            undefined &&

        summary.excused ===
            undefined
    ) {

        present =
            0;

        absent =
            0;

        late =
            0;

        excused =
            0;


        memberRecords.forEach(
            function(member) {

                const status =
                    normalizeStatus(
                        member.status
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

    }


    const membersTotal =
        Number(
            summary.totalMembers ??
            summary.total
        ) ||

        memberRecords.length;


    const visitorTotal =
        visitorRecords.length;


    const rate =
        Number(
            summary.rate
        ) ||

        (
            membersTotal > 0

                ? Math.round(
                    (
                        (
                            present +
                            late
                        )
                        /
                        membersTotal
                    ) *
                    100
                )

                : 0
        );


    let visitorsPresent =
        0;


    let visitorsAbsent =
        0;


    let visitorsLate =
        0;


    visitorRecords.forEach(
        function(visitor) {

            const status =
                normalizeStatus(
                    visitor.status
                );


            if (
                status ===
                "present"
            ) {

                visitorsPresent++;

            }

            else if (
                status ===
                "absent"
            ) {

                visitorsAbsent++;

            }

            else if (
                status ===
                "late"
            ) {

                visitorsLate++;

            }

        }
    );


    return {

        total:
            membersTotal +
            visitorTotal,

        membersTotal:
            membersTotal,

        visitorTotal:
            visitorTotal,

        present:
            present,

        absent:
            absent,

        late:
            late,

        excused:
            excused,

        visitorsPresent:
            visitorsPresent,

        visitorsAbsent:
            visitorsAbsent,

        visitorsLate:
            visitorsLate,

        rate:
            rate,

        visitors:
            visitorRecords

    };

}


/* =====================================================
   LOAD REPORT ATTENDANCE
   ===================================================== */

async function loadReportAttendance() {

    if (
        !reportAttendanceSummary
    ) {

        return;

    }


    const cellId =
        reportCell?.value ||
        "";


    const date =
        reportDate?.value ||
        "";


    if (
        !cellId ||
        !date
    ) {

        reportAttendanceSummary.textContent =
            "Select a cell and date to load attendance.";


        return;

    }


    reportAttendanceSummary.innerHTML =
        "Loading attendance...";


    const attendance =
        await getAttendanceForReport({

            cellId:
                cellId,

            date:
                date

        });


    if (
        attendance.total ===
        0
    ) {

        reportAttendanceSummary.innerHTML = `

            <strong>
                No attendance recorded.
            </strong>

            <br>

            Please record attendance first
            from the Attendance section.

        `;


        return;

    }


    reportAttendanceSummary.innerHTML = `

        <div
            class="attendance-report-grid"
        >

            <div>

                <span>
                    Total
                </span>

                <strong>
                    ${attendance.total}
                </strong>

            </div>


            <div>

                <span>
                    Members
                </span>

                <strong>
                    ${attendance.membersTotal}
                </strong>

            </div>


            <div>

                <span>
                    Present
                </span>

                <strong>
                    ${attendance.present}
                </strong>

            </div>


            <div>

                <span>
                    Absent
                </span>

                <strong>
                    ${attendance.absent}
                </strong>

            </div>


            <div>

                <span>
                    Excused
                </span>

                <strong>
                    ${attendance.excused}
                </strong>

            </div>


            <div>

                <span>
                    Late
                </span>

                <strong>
                    ${attendance.late}
                </strong>

            </div>


            <div>

                <span>
                    Visitors / Newcomers
                </span>

                <strong>
                    ${attendance.visitorTotal}
                </strong>

            </div>


            <div
                class="attendance-rate-box"
            >

                <span>
                    Attendance Rate
                </span>

                <strong>
                    ${attendance.rate}%
                </strong>

            </div>

        </div>

    `;

}


/* =====================================================
   RESET FORM
   ===================================================== */

function resetForm() {

    if (
        weeklyReportForm
    ) {

        weeklyReportForm.reset();

    }


    if (
        reportId
    ) {

        reportId.value =
            "";

    }


    if (
        reportAttendanceSummary
    ) {

        reportAttendanceSummary.textContent =
            "Select a cell and date to load attendance.";

    }


    if (
        draftSavedMessage
    ) {

        draftSavedMessage.textContent =
            "";

    }

}


/* =====================================================
   OPEN NEW REPORT
   ===================================================== */

function openNewReport() {

    refreshLocalData();


    loadCells();


    resetForm();


    if (
        document.getElementById(
            "reportModalTitle"
        )
    ) {

        document.getElementById(
            "reportModalTitle"
        ).textContent =
            "New Weekly Report";

    }


    if (
        reportDate
    ) {

        reportDate.value =
            getToday();

    }


    if (
        isCellLeader() &&
        weeklyReportsAccess.cellId
    ) {

        reportCell.value =
            weeklyReportsAccess.cellId;


        reportCell.disabled =
            true;

    }


    restoreDraft();


    reportModal.style.display =
        "flex";


    loadReportAttendance();

}


/* =====================================================
   CLOSE NEW REPORT MODAL
   ===================================================== */

function closeModal() {

    if (
        reportModal
    ) {

        reportModal.style.display =
            "none";

    }

}


/* =====================================================
   NEW REPORT
   ===================================================== */

if (
    newReportButton
) {

    newReportButton.addEventListener(
        "click",
        openNewReport
    );

}


/* =====================================================
   CLOSE MODAL
   ===================================================== */

if (
    closeReportModalButton
) {

    closeReportModalButton.addEventListener(
        "click",
        closeModal
    );

}


if (
    cancelReportButton
) {

    cancelReportButton.addEventListener(
        "click",
        closeModal
    );

}


if (
    reportModal
) {

    reportModal.addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                reportModal
            ) {

                closeModal();

            }

        }
    );

}


/* =====================================================
   CELL CHANGE
   ===================================================== */

if (
    reportCell
) {

    reportCell.addEventListener(
        "change",
        async function() {

            await loadReportAttendance();


            autoSaveDraft();

        }
    );

}


/* =====================================================
   DATE CHANGE
   ===================================================== */

if (
    reportDate
) {

    reportDate.addEventListener(
        "change",
        async function() {

            await loadReportAttendance();


            autoSaveDraft();

        }
    );

}


/* =====================================================
   COLLECT DATA
   ===================================================== */

function collectReportData(
    status
) {

    const now =
        new Date()
            .toISOString();


    const existing =
        weeklyReports.find(
            function(report) {

                return (

                    String(
                        report.id
                    ) ===

                    String(
                        reportId?.value
                    )

                );

            }
        );


    return {

        id:
            reportId?.value ||
            generateId(),

        cellId:
            reportCell?.value ||
            "",

        cellName:
            getCellName(
                reportCell?.value
            ),

        date:
            reportDate?.value ||
            "",

        meetingLocation:
            meetingLocation?.value
                .trim() ||
            "",

        membersLife:
            membersLife?.value
                .trim() ||
            "",

        activityDone:
            activityDone?.value
                .trim() ||
            "",

        challengesNeeds:
            challengesNeeds?.value
                .trim() ||
            "",

        followUpNeeded:
            followUpNeeded?.value
                .trim() ||
            "",

        nextWeekPlan:
            nextWeekPlan?.value
                .trim() ||
            "",

        additionalComments:
            additionalComments?.value
                .trim() ||
            "",

        status:
            status,

        createdAt:
            existing?.createdAt ||
            now,

        updatedAt:
            now,

        submittedAt:

            status ===
                "Submitted"

                ? (
                    existing?.submittedAt ||
                    now
                )

                : (
                    existing?.submittedAt ||
                    null
                )

    };

}


/* =====================================================
   VALIDATE
   ===================================================== */

function validateReport() {

    if (
        !reportCell?.value
    ) {

        alert(
            "Please select a cell."
        );


        reportCell?.focus();


        return false;

    }


    if (
        !reportDate?.value
    ) {

        alert(
            "Please select the report / meeting date."
        );


        reportDate?.focus();


        return false;

    }


    if (
        !meetingLocation?.value.trim()
    ) {

        alert(
            "Please enter the meeting location."
        );


        meetingLocation?.focus();


        return false;

    }


    if (
        !membersLife?.value.trim()
    ) {

        alert(
            "Please complete Members' Life."
        );


        membersLife?.focus();


        return false;

    }


    if (
        !activityDone?.value.trim()
    ) {

        alert(
            "Please complete Activity Done."
        );


        activityDone?.focus();


        return false;

    }


    return true;

}


/* =====================================================
   DUPLICATE
   ===================================================== */

function findDuplicateReport(
    data
) {

    return weeklyReports.find(
        function(report) {

            return (

                String(
                    report.cellId
                ) ===

                String(
                    data.cellId
                )

                &&

                String(
                    report.date
                ) ===

                String(
                    data.date
                )

                &&

                String(
                    report.id
                ) !==

                String(
                    data.id
                )

            );

        }
    );

}


/* =====================================================
   SUPABASE PAYLOAD
   ===================================================== */

function createSupabaseReportPayload(
    data,
    isNew
) {

    const payload = {

        cell_id:
            data.cellId,

        report_date:
            data.date,

        status:
            data.status,

        meeting_location:
            data.meetingLocation,

        members_life:
            data.membersLife,

        activity_done:
            data.activityDone,

        challenges_needs:
            data.challengesNeeds,

        follow_up_needed:
            data.followUpNeeded,

        next_week_plan:
            data.nextWeekPlan,

        additional_comments:
            data.additionalComments,

        updated_at:
            new Date()
                .toISOString(),

        submitted_at:

            data.status ===
                "Submitted"

                ? (
                    data.submittedAt ||
                    new Date()
                        .toISOString()
                )

                : null

    };


    if (
        isNew
    ) {

        payload.created_by =
            weeklyReportsAccess.userId ||
            null;

    }


    return payload;

}


/* =====================================================
   SAVE REPORT TO SUPABASE
   ===================================================== */

async function saveReportToSupabase(
    data
) {

    if (
        !CMS_WEEKLY_REPORTS_SUPABASE
    ) {

        return null;

    }


    /*
       First identify an existing database row
       by Cell + Date.
    */

    const {
        data:
            existingRows,
        error:
            lookupError
    } =
        await CMS_WEEKLY_REPORTS_SUPABASE
            .from(
                "weekly_reports"
            )
            .select(
                `
                    id,
                    cell_id,
                    report_date,
                    created_by,
                    created_at,
                    submitted_at
                `
            )
            .eq(
                "cell_id",
                data.cellId
            )
            .eq(
                "report_date",
                data.date
            )
            .limit(
                1
            );


    if (
        lookupError
    ) {

        throw lookupError;

    }


    const existing =
        existingRows?.[0] ||
        null;


    /*
       -----------------------------------------
       UPDATE
       -----------------------------------------
    */

    if (
        existing?.id
    ) {

        const payload =
            createSupabaseReportPayload(
                data,
                false
            );


        const {
            data:
                updated,
            error
        } =
            await CMS_WEEKLY_REPORTS_SUPABASE
                .from(
                    "weekly_reports"
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

            throw error;

        }


        return updated;

    }


    /*
       -----------------------------------------
       INSERT
       -----------------------------------------
    */

    const payload =
        createSupabaseReportPayload(
            data,
            true
        );


    const {
        data:
            inserted,
        error
    } =
        await CMS_WEEKLY_REPORTS_SUPABASE
            .from(
                "weekly_reports"
            )
            .insert(
                payload
            )
            .select()
            .single();


    if (
        error
    ) {

        throw error;

    }


    return inserted;

}


/* =====================================================
   SUPABASE → LOCAL OBJECT
   ===================================================== */

function convertSupabaseReport(
    report
) {

    return {

        id:
            report.id,

        cellId:
            report.cell_id,

        cellName:
            getCellName(
                report.cell_id
            ),

        date:
            report.report_date,

        meetingLocation:
            report.meeting_location ||
            "",

        membersLife:
            report.members_life ||
            "",

        activityDone:
            report.activity_done ||
            "",

        challengesNeeds:
            report.challenges_needs ||
            "",

        followUpNeeded:
            report.follow_up_needed ||
            "",

        nextWeekPlan:
            report.next_week_plan ||
            "",

        additionalComments:
            report.additional_comments ||
            "",

        status:
            report.status ||
            "Draft",

        createdBy:
            report.created_by ||
            null,

        createdAt:
            report.created_at ||
            "",

        updatedAt:
            report.updated_at ||
            "",

        submittedAt:
            report.submitted_at ||
            null

    };

}


/* =====================================================
   LOAD ALL LIVE REPORTS
   ===================================================== */

async function loadLiveReports() {

    if (
        !CMS_WEEKLY_REPORTS_SUPABASE
    ) {

        return false;

    }


    let query =
        CMS_WEEKLY_REPORTS_SUPABASE
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
                    ascending:
                        false
                }
            );


    /*
       Cell Leader restriction.
       RLS also protects the database.
    */

    if (
        isCellLeader() &&
        weeklyReportsAccess.cellId
    ) {

        query =
            query.eq(
                "cell_id",
                weeklyReportsAccess.cellId
            );

    }


    const {
        data,
        error
    } =
        await query;


    if (
        error
    ) {

        console.error(
            "CMS Weekly Reports live load error:",
            error
        );


        return false;

    }


    weeklyReports =
        (
            data ||
            []
        )
        .map(
            convertSupabaseReport
        );


    saveLocalReports();


    return true;

}


/* =====================================================
   SAVE REPORT
   ===================================================== */

async function saveReport(
    status
) {

    refreshLocalData();


    const data =
        collectReportData(
            status
        );


    /*
       Local duplicate detection.
    */

    const duplicate =
        findDuplicateReport(
            data
        );


    if (
        duplicate
    ) {

        const shouldUpdate =
            confirm(
                "A report for this cell and date already exists.\n\n" +
                "Do you want to update the existing report?"
            );


        if (
            !shouldUpdate
        ) {

            return;

        }


        data.id =
            duplicate.id;

    }


    try {

        /*
           Supabase is the main source of truth.
        */

        const saved =
            await saveReportToSupabase(
                data
            );


        if (
            saved
        ) {

            const local =
                convertSupabaseReport(
                    saved
                );


            const index =
                weeklyReports.findIndex(
                    function(report) {

                        return (

                            String(
                                report.id
                            ) ===

                            String(
                                data.id
                            )

                            ||

                            (

                                String(
                                    report.cellId
                                ) ===

                                String(
                                    data.cellId
                                )

                                &&

                                String(
                                    report.date
                                ) ===

                                String(
                                    data.date
                                )

                            )

                        );

                    }
                );


            if (
                index >=
                0
            ) {

                weeklyReports[
                    index
                ] =
                    local;

            }

            else {

                weeklyReports.push(
                    local
                );

            }


            saveLocalReports();


            clearTemporaryDraft();


            renderReports(
                reportSearch?.value ||
                ""
            );


            updateStatistics();


            closeModal();


            window.dispatchEvent(
                new Event(
                    "cmsRecordsUpdated"
                )
            );


            alert(

                status ===
                    "Submitted"

                    ? "Weekly report submitted successfully!"

                    : "Weekly report saved as draft."

            );


            console.log(
                "CMS Weekly Reports: Supabase save successful.",
                saved
            );


            return;

        }

    }

    catch (error) {

        console.error(
            "CMS Weekly Reports Supabase save error:",
            error
        );


        /*
           Keep existing local compatibility.
        */

        const localFallback =
            confirm(
                "Supabase could not save this report.\n\n" +
                "Do you want to keep a local backup?"
            );


        if (
            !localFallback
        ) {

            alert(
                error?.message ||
                "Unable to save the weekly report."
            );


            return;

        }

    }


    /*
       -----------------------------------------
       LOCAL FALLBACK
       -----------------------------------------
    */

    const localIndex =
        weeklyReports.findIndex(
            function(report) {

                return (

                    String(
                        report.id
                    ) ===

                    String(
                        data.id
                    )

                );

            }
        );


    if (
        localIndex >=
        0
    ) {

        weeklyReports[
            localIndex
        ] =
            data;

    }

    else {

        weeklyReports.push(
            data
        );

    }


    saveLocalReports();


    clearTemporaryDraft();


    renderReports(
        reportSearch?.value ||
        ""
    );


    updateStatistics();


    closeModal();


    alert(
        status ===
            "Submitted"

            ? "Weekly report saved locally."

            : "Weekly report saved as a local draft."
    );

}


/* =====================================================
   SUBMIT
   ===================================================== */

if (
    weeklyReportForm
) {

    weeklyReportForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            if (
                !validateReport()
            ) {

                return;

            }


            await saveReport(
                "Submitted"
            );

        }
    );

}


/* =====================================================
   SAVE DRAFT
   ===================================================== */

if (
    saveDraftButton
) {

    saveDraftButton.addEventListener(
        "click",
        async function() {

            if (
                !reportCell?.value
            ) {

                alert(
                    "Please select a cell before saving."
                );


                reportCell?.focus();


                return;

            }


            if (
                !reportDate?.value
            ) {

                alert(
                    "Please select a date before saving."
                );


                reportDate?.focus();


                return;

            }


            await saveReport(
                "Draft"
            );

        }
    );

}


/* =====================================================
   AUTO SAVE DRAFT
   ===================================================== */

function autoSaveDraft() {

    if (
        !weeklyReportForm
    ) {

        return;

    }


    const draft = {

        cellId:
            reportCell?.value ||
            "",

        date:
            reportDate?.value ||
            "",

        meetingLocation:
            meetingLocation?.value.trim() ||
            "",

        membersLife:
            membersLife?.value.trim() ||
            "",

        activityDone:
            activityDone?.value.trim() ||
            "",

        challengesNeeds:
            challengesNeeds?.value.trim() ||
            "",

        followUpNeeded:
            followUpNeeded?.value.trim() ||
            "",

        nextWeekPlan:
            nextWeekPlan?.value.trim() ||
            "",

        additionalComments:
            additionalComments?.value.trim() ||
            "",

        savedAt:
            new Date()
                .toISOString()

    };


    try {

        localStorage.setItem(
            "cmsWeeklyReportDraft",
            JSON.stringify(
                draft
            )
        );


        if (
            reportCell?.value ||
            meetingLocation?.value ||
            membersLife?.value ||
            activityDone?.value
        ) {

            if (
                draftSavedMessage
            ) {

                draftSavedMessage.textContent =
                    "Draft saved automatically.";

            }

        }

    }

    catch (error) {

        console.warn(
            "CMS Weekly Reports draft save:",
            error
        );

    }

}


/* =====================================================
   AUTO SAVE INPUT
   ===================================================== */

if (
    weeklyReportForm
) {

    weeklyReportForm.addEventListener(
        "input",
        autoSaveDraft
    );

}


/* =====================================================
   RESTORE DRAFT
   ===================================================== */

function restoreDraft() {

    const saved =
        localStorage.getItem(
            "cmsWeeklyReportDraft"
        );


    if (
        !saved
    ) {

        return;

    }


    try {

        const draft =
            JSON.parse(
                saved
            );


        if (
            draft.cellId
        ) {

            reportCell.value =
                draft.cellId;

        }


        if (
            draft.date
        ) {

            reportDate.value =
                draft.date;

        }


        meetingLocation.value =
            draft.meetingLocation ||
            "";


        membersLife.value =
            draft.membersLife ||
            "";


        activityDone.value =
            draft.activityDone ||
            "";


        challengesNeeds.value =
            draft.challengesNeeds ||
            "";


        followUpNeeded.value =
            draft.followUpNeeded ||
            "";


        nextWeekPlan.value =
            draft.nextWeekPlan ||
            "";


        additionalComments.value =
            draft.additionalComments ||
            "";


        if (
            draft.cellId ||
            draft.meetingLocation ||
            draft.membersLife ||
            draft.activityDone
        ) {

            if (
                draftSavedMessage
            ) {

                draftSavedMessage.textContent =
                    "Previous unsent draft restored.";

            }

        }

    }

    catch (error) {

        console.error(
            "CMS Weekly Reports draft restore:",
            error
        );


        localStorage.removeItem(
            "cmsWeeklyReportDraft"
        );

    }

}


/* =====================================================
   CLEAR DRAFT
   ===================================================== */

function clearTemporaryDraft() {

    localStorage.removeItem(
        "cmsWeeklyReportDraft"
    );


    if (
        draftSavedMessage
    ) {

        draftSavedMessage.textContent =
            "";

    }

}


/* =====================================================
   CACHED ATTENDANCE
   ===================================================== */

function getCachedAttendanceSummary(
    report
) {

    const record =
        findLocalAttendance(
            report.cellId,
            report.date
        );


    if (
        record?.summary
    ) {

        return {

            membersTotal:
                Number(
                    record.summary.totalMembers ??
                    record.summary.total
                ) || 0,

            visitorTotal:
                Number(
                    record.summary.visitors
                ) ||

                (
                    Array.isArray(
                        record.visitors
                    )
                        ? record.visitors.length
                        : 0
                ),

            present:
                Number(
                    record.summary.present
                ) || 0,

            absent:
                Number(
                    record.summary.absent
                ) || 0,

            late:
                Number(
                    record.summary.late
                ) || 0,

            excused:
                Number(
                    record.summary.excused
                ) || 0,

            rate:
                Number(
                    record.summary.rate
                ) || 0

        };

    }


    return {

        membersTotal:
            Array.isArray(
                record?.members
            )
                ? record.members.length
                : 0,

        visitorTotal:
            Array.isArray(
                record?.visitors
            )
                ? record.visitors.length
                : 0,

        present:
            Number(
                record?.summary?.present
            ) || 0,

        absent:
            Number(
                record?.summary?.absent
            ) || 0,

        late:
            Number(
                record?.summary?.late
            ) || 0,

        excused:
            Number(
                record?.summary?.excused
            ) || 0,

        rate:
            Number(
                record?.summary?.rate
            ) || 0

    };

}


/* =====================================================
   RENDER REPORTS
   ===================================================== */

function renderReports(
    searchTerm = ""
) {

    if (
        !reportsTableBody
    ) {

        return;

    }


    reportsTableBody.innerHTML =
        "";


    const search =
        String(
            searchTerm
        )
        .toLowerCase()
        .trim();


    const filtered =
        weeklyReports.filter(
            function(report) {

                const cellName =
                    getCellName(
                        report.cellId
                    )
                    .toLowerCase();


                return (

                    cellName.includes(
                        search
                    )

                    ||

                    String(
                        report.date ||
                        ""
                    )
                    .toLowerCase()
                    .includes(
                        search
                    )

                    ||

                    String(
                        report.meetingLocation ||
                        ""
                    )
                    .toLowerCase()
                    .includes(
                        search
                    )

                    ||

                    String(
                        report.status ||
                        ""
                    )
                    .toLowerCase()
                    .includes(
                        search
                    )

                );

            }
        );


    if (
        filtered.length ===
        0
    ) {

        reportsTableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-message"
                >

                    No weekly reports found.

                </td>

            </tr>

        `;


        return;

    }


    filtered
        .slice()
        .sort(
            function(a, b) {

                return (

                    String(
                        b.date ||
                        ""
                    )
                    .localeCompare(
                        String(
                            a.date ||
                            ""
                        )
                    )

                );

            }
        )
        .forEach(
            function(report) {

                const attendance =
                    getCachedAttendanceSummary(
                        report
                    );


                const row =
                    document.createElement(
                        "tr"
                    );


                const statusClass =
                    report.status ===
                        "Submitted"

                        ? "status-active"

                        : "status-pending";


                row.innerHTML = `

                    <td>

                        <strong>

                            ${escapeHTML(
                                getCellName(
                                    report.cellId
                                )
                            )}

                        </strong>

                    </td>


                    <td>

                        ${formatDate(
                            report.date
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            report.meetingLocation ||
                            "—"
                        )}

                    </td>


                    <td>

                        <strong>

                            ${attendance.rate}%

                        </strong>

                        <small
                            class="attendance-mini"
                        >

                            ${attendance.present}
                            attended /

                            ${attendance.membersTotal}
                            members

                            ${
                                attendance.visitorTotal > 0

                                    ? ` • ${attendance.visitorTotal}
                                       visitor${
                                            attendance.visitorTotal ===
                                            1
                                                ? ""
                                                : "s"
                                        }`

                                    : ""
                            }

                        </small>

                    </td>


                    <td>

                        <span
                            class="${statusClass}"
                        >

                            ${escapeHTML(
                                report.status ||
                                "Draft"
                            )}

                        </span>

                    </td>


                    <td>

                        <div
                            class="report-actions"
                        >

                            <button
                                type="button"
                                class="small-button"
                                data-action="view"
                                data-id="${escapeAttribute(
                                    report.id
                                )}"
                            >
                                View
                            </button>


                            <button
                                type="button"
                                class="small-button"
                                data-action="edit"
                                data-id="${escapeAttribute(
                                    report.id
                                )}"
                            >
                                Edit
                            </button>


                            <button
                                type="button"
                                class="small-button download-button"
                                data-action="download"
                                data-id="${escapeAttribute(
                                    report.id
                                )}"
                            >
                                Download
                            </button>


                            <button
                                type="button"
                                class="small-button danger-button"
                                data-action="delete"
                                data-id="${escapeAttribute(
                                    report.id
                                )}"
                            >
                                Delete
                            </button>

                        </div>

                    </td>

                `;


                reportsTableBody.appendChild(
                    row
                );

            }
        );

}


/* =====================================================
   TABLE ACTIONS
   ===================================================== */

if (
    reportsTableBody
) {

    reportsTableBody.addEventListener(
        "click",
        function(event) {

            const button =
                event.target.closest(
                    "button[data-action]"
                );


            if (
                !button
            ) {

                return;

            }


            const id =
                button.dataset.id;


            const action =
                button.dataset.action;


            if (
                action ===
                "view"
            ) {

                viewReport(
                    id
                );

            }

            else if (
                action ===
                "edit"
            ) {

                editReport(
                    id
                );

            }

            else if (
                action ===
                "download"
            ) {

                downloadReport(
                    id
                );

            }

            else if (
                action ===
                "delete"
            ) {

                deleteReport(
                    id
                );

            }

        }
    );

}


/* =====================================================
   VIEW REPORT
   ===================================================== */

async function viewReport(
    id
) {

    refreshLocalData();


    let report =
        weeklyReports.find(
            function(item) {

                return (

                    String(
                        item.id
                    ) ===

                    String(
                        id
                    )

                );

            }
        );


    /*
       For maximum accuracy, retrieve current row
       from Supabase.
    */

    if (
        CMS_WEEKLY_REPORTS_SUPABASE &&
        id &&
        !String(
            id
        )
        .startsWith(
            "report_"
        )
    ) {

        const {
            data,
            error
        } =
            await CMS_WEEKLY_REPORTS_SUPABASE
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
                .eq(
                    "id",
                    id
                )
                .maybeSingle();


        if (
            !error &&
            data
        ) {

            report =
                convertSupabaseReport(
                    data
                );

        }

    }


    if (
        !report
    ) {

        alert(
            "Report could not be found."
        );


        return;

    }


    currentViewedReportId =
        report.id;


    const attendance =
        await getAttendanceForReport(
            report
        );


    if (
        viewReportSubtitle
    ) {

        viewReportSubtitle.textContent =

            `${getCellName(
                report.cellId
            )} • ${formatDate(
                report.date
            )}`;

    }


    if (
        viewReportContent
    ) {

        viewReportContent.innerHTML = `

            <div
                class="report-view-header"
            >

                <div>

                    <span
                        class="view-label"
                    >
                        CELL
                    </span>

                    <strong>

                        ${escapeHTML(
                            getCellName(
                                report.cellId
                            )
                        )}

                    </strong>

                </div>


                <div>

                    <span
                        class="view-label"
                    >
                        DATE
                    </span>

                    <strong>

                        ${formatDate(
                            report.date
                        )}

                    </strong>

                </div>


                <div>

                    <span
                        class="view-label"
                    >
                        LOCATION
                    </span>

                    <strong>

                        ${escapeHTML(
                            report.meetingLocation ||
                            "—"
                        )}

                    </strong>

                </div>


                <div>

                    <span
                        class="view-label"
                    >
                        STATUS
                    </span>

                    <strong>

                        ${escapeHTML(
                            report.status ||
                            "Draft"
                        )}

                    </strong>

                </div>

            </div>


            <div
                class="view-attendance"
            >

                <h3>
                    Attendance
                </h3>


                <div
                    class="view-attendance-grid"
                >

                    <div>

                        <span>
                            Total
                        </span>

                        <strong>
                            ${attendance.total}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Members
                        </span>

                        <strong>
                            ${attendance.membersTotal}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Present
                        </span>

                        <strong>
                            ${attendance.present}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Absent
                        </span>

                        <strong>
                            ${attendance.absent}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Late
                        </span>

                        <strong>
                            ${attendance.late}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Excused
                        </span>

                        <strong>
                            ${attendance.excused}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Visitors / Newcomers
                        </span>

                        <strong>
                            ${attendance.visitorTotal}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Rate
                        </span>

                        <strong>
                            ${attendance.rate}%
                        </strong>

                    </div>

                </div>

            </div>


            ${createReportViewSection(
                "Members' Life",
                report.membersLife
            )}


            ${createReportViewSection(
                "Activity Done",
                report.activityDone
            )}


            ${createReportViewSection(
                "Challenges / Needs",
                report.challengesNeeds
            )}


            ${createReportViewSection(
                "Follow-up Needed",
                report.followUpNeeded
            )}


            ${createReportViewSection(
                "Next Week's Plan",
                report.nextWeekPlan
            )}


            ${createReportViewSection(
                "Additional Comments",
                report.additionalComments
            )}


            <div
                class="report-meta"
            >

                <div>

                    <strong>
                        Created:
                    </strong>

                    ${
                        report.createdAt
                            ? new Date(
                                report.createdAt
                            ).toLocaleString()
                            : "—"
                    }

                </div>


                <div>

                    <strong>
                        Last Updated:
                    </strong>

                    ${
                        report.updatedAt
                            ? new Date(
                                report.updatedAt
                            ).toLocaleString()
                            : "—"
                    }

                </div>


                <div>

                    <strong>
                        Submitted:
                    </strong>

                    ${
                        report.submittedAt
                            ? new Date(
                                report.submittedAt
                            ).toLocaleString()
                            : "Not submitted"
                    }

                </div>

            </div>

        `;

    }


    if (
        viewReportModal
    ) {

        viewReportModal.style.display =
            "flex";

    }

}


/* =====================================================
   VIEW SECTION
   ===================================================== */

function createReportViewSection(
    title,
    value
) {

    return `

        <div
            class="view-report-section"
        >

            <h3>

                ${escapeHTML(
                    title
                )}

            </h3>

            <p>

                ${formatMultilineText(
                    value ||
                    "No information provided."
                )}

            </p>

        </div>

    `;

}


/* =====================================================
   CLOSE VIEW MODAL
   ===================================================== */

function closeViewModal() {

    if (
        viewReportModal
    ) {

        viewReportModal.style.display =
            "none";

    }


    currentViewedReportId =
        null;

}


if (
    closeViewReportModal
) {

    closeViewReportModal.addEventListener(
        "click",
        closeViewModal
    );

}


if (
    closeViewReportButton
) {

    closeViewReportButton.addEventListener(
        "click",
        closeViewModal
    );

}


if (
    viewReportModal
) {

    viewReportModal.addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                viewReportModal
            ) {

                closeViewModal();

            }

        }
    );

}


/* =====================================================
   EDIT REPORT
   ===================================================== */

async function editReport(
    id
) {

    refreshLocalData();


    loadCells();


    let report =
        weeklyReports.find(
            function(item) {

                return (

                    String(
                        item.id
                    ) ===

                    String(
                        id
                    )

                );

            }
        );


    /*
       Retrieve current Supabase row.
    */

    if (
        CMS_WEEKLY_REPORTS_SUPABASE &&
        id &&
        !String(
            id
        )
        .startsWith(
            "report_"
        )
    ) {

        const {
            data,
            error
        } =
            await CMS_WEEKLY_REPORTS_SUPABASE
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
                .eq(
                    "id",
                    id
                )
                .maybeSingle();


        if (
            !error &&
            data
        ) {

            report =
                convertSupabaseReport(
                    data
                );

        }

    }


    if (
        !report
    ) {

        alert(
            "Report could not be found."
        );


        return;

    }


    /*
       Cell Leader can only edit own cell.
    */

    if (
        isCellLeader() &&
        String(
            report.cellId
        ) !==
        String(
            weeklyReportsAccess.cellId
        )
    ) {

        alert(
            "You can only edit reports for your assigned cell."
        );


        return;

    }


    reportId.value =
        report.id;


    reportCell.value =
        report.cellId;


    reportDate.value =
        report.date;


    meetingLocation.value =
        report.meetingLocation ||
        "";


    membersLife.value =
        report.membersLife ||
        "";


    activityDone.value =
        report.activityDone ||
        "";


    challengesNeeds.value =
        report.challengesNeeds ||
        "";


    followUpNeeded.value =
        report.followUpNeeded ||
        "";


    nextWeekPlan.value =
        report.nextWeekPlan ||
        "";


    additionalComments.value =
        report.additionalComments ||
        "";


    if (
        isCellLeader()
    ) {

        reportCell.value =
            weeklyReportsAccess.cellId;


        reportCell.disabled =
            true;

    }


    if (
        draftSavedMessage
    ) {

        draftSavedMessage.textContent =
            "";

    }


    document.getElementById(
        "reportModalTitle"
    ).textContent =
        "Edit Weekly Report";


    reportModal.style.display =
        "flex";


    await loadReportAttendance();

}


/* =====================================================
   DELETE REPORT
   ===================================================== */

async function deleteReport(
    id
) {

    refreshLocalData();


    const report =
        weeklyReports.find(
            function(item) {

                return (

                    String(
                        item.id
                    ) ===

                    String(
                        id
                    )

                );

            }
        );


    if (
        !report
    ) {

        return;

    }


    if (
        isCellLeader() &&
        String(
            report.cellId
        ) !==
        String(
            weeklyReportsAccess.cellId
        )
    ) {

        alert(
            "You can only delete reports for your assigned cell."
        );


        return;

    }


    const confirmed =
        confirm(

            "Are you sure you want to delete this weekly report?\n\n" +

            `${getCellName(
                report.cellId
            )} - ${formatDate(
                report.date
            )}`

        );


    if (
        !confirmed
    ) {

        return;

    }


    try {

        if (
            CMS_WEEKLY_REPORTS_SUPABASE &&
            id &&
            !String(
                id
            )
            .startsWith(
                "report_"
            )
        ) {

            const {
                error
            } =
                await CMS_WEEKLY_REPORTS_SUPABASE
                    .from(
                        "weekly_reports"
                    )
                    .delete()
                    .eq(
                        "id",
                        id
                    );


            if (
                error
            ) {

                throw error;

            }

        }


        weeklyReports =
            weeklyReports.filter(
                function(item) {

                    return (

                        String(
                            item.id
                        ) !==

                        String(
                            id
                        )

                    );

                }
            );


        saveLocalReports();


        renderReports(
            reportSearch?.value ||
            ""
        );


        updateStatistics();


        closeViewModal();


        window.dispatchEvent(
            new Event(
                "cmsRecordsUpdated"
            )
        );


        alert(
            "Weekly report deleted successfully."
        );


    }

    catch (error) {

        console.error(
            "CMS Weekly Reports delete error:",
            error
        );


        alert(
            error?.message ||
            "Unable to delete weekly report."
        );

    }

}


/* =====================================================
   STATISTICS
   ===================================================== */

function updateStatistics() {

    refreshLocalData();


    if (
        totalReports
    ) {

        totalReports.textContent =
            weeklyReports.length;

    }


    if (
        submittedReports
    ) {

        submittedReports.textContent =
            weeklyReports.filter(
                function(report) {

                    return (
                        report.status ===
                        "Submitted"
                    );

                }
            ).length;

    }


    if (
        draftReports
    ) {

        draftReports.textContent =
            weeklyReports.filter(
                function(report) {

                    return (
                        report.status ===
                        "Draft"
                    );

                }
            ).length;

    }


    if (
        todayReports
    ) {

        todayReports.textContent =
            weeklyReports.filter(
                function(report) {

                    return (

                        String(
                            report.date
                        ) ===
                        getToday()

                    );

                }
            ).length;

    }

}


/* =====================================================
   SEARCH
   ===================================================== */

if (
    reportSearch
) {

    reportSearch.addEventListener(
        "input",
        function() {

            renderReports(
                reportSearch.value
            );

        }
    );

}


/* =====================================================
   DOWNLOAD
   ===================================================== */

if (
    downloadReportButton
) {

    downloadReportButton.addEventListener(
        "click",
        function() {

            if (
                currentViewedReportId
            ) {

                downloadReport(
                    currentViewedReportId
                );

            }

        }
    );

}


async function downloadReport(
    id
) {

    refreshLocalData();


    const report =
        weeklyReports.find(
            function(item) {

                return (

                    String(
                        item.id
                    ) ===

                    String(
                        id
                    )

                );

            }
        );


    if (
        !report
    ) {

        alert(
            "Report could not be found."
        );


        return;

    }


    const attendance =
        await getAttendanceForReport(
            report
        );


    const content = `

CELL MANAGEMENT SYSTEM
WEEKLY CELL REPORT
========================================

CELL:
${getCellName(
    report.cellId
)}

DATE:
${formatDate(
    report.date
)}

MEETING LOCATION:
${report.meetingLocation || "—"}

STATUS:
${report.status || "Draft"}


ATTENDANCE
========================================

Total People:
${attendance.total}

Registered Members:
${attendance.membersTotal}

Present:
${attendance.present}

Absent:
${attendance.absent}

Late:
${attendance.late}

Excused:
${attendance.excused}

Visitors / Newcomers:
${attendance.visitorTotal}

Attendance Rate:
${attendance.rate}%


MEMBERS' LIFE
========================================

${report.membersLife || "No information provided."}


ACTIVITY DONE
========================================

${report.activityDone || "No information provided."}


CHALLENGES / NEEDS
========================================

${report.challengesNeeds || "No information provided."}


FOLLOW-UP NEEDED
========================================

${report.followUpNeeded || "No information provided."}


NEXT WEEK'S PLAN
========================================

${report.nextWeekPlan || "No information provided."}


ADDITIONAL COMMENTS
========================================

${report.additionalComments || "No information provided."}


REPORT INFORMATION
========================================

Created:
${
    report.createdAt
        ? new Date(
            report.createdAt
        ).toLocaleString()
        : "—"
}

Last Updated:
${
    report.updatedAt
        ? new Date(
            report.updatedAt
        ).toLocaleString()
        : "—"
}

Submitted:
${
    report.submittedAt
        ? new Date(
            report.submittedAt
        ).toLocaleString()
        : "Not submitted"
}


========================================
Generated by CELL MANAGEMENT SYSTEM
========================================

`;


    const blob =
        new Blob(
            [content],
            {
                type:
                    "text/plain;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    const safeCell =
        getCellName(
            report.cellId
        )
        .replace(
            /[^a-z0-9]/gi,
            "_"
        );


    link.href =
        url;


    link.download =
        `CMS_Weekly_Report_${safeCell}_${report.date}.txt`;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );

}


/* =====================================================
   PRINT
   ===================================================== */

if (
    printReportButton
) {

    printReportButton.addEventListener(
        "click",
        function() {

            if (
                currentViewedReportId
            ) {

                printReport(
                    currentViewedReportId
                );

            }

        }
    );

}


async function printReport(
    id
) {

    refreshLocalData();


    const report =
        weeklyReports.find(
            function(item) {

                return (

                    String(
                        item.id
                    ) ===

                    String(
                        id
                    )

                );

            }
        );


    if (
        !report
    ) {

        return;

    }


    const attendance =
        await getAttendanceForReport(
            report
        );


    const printWindow =
        window.open(
            "",
            "_blank"
        );


    if (
        !printWindow
    ) {

        alert(
            "Please allow pop-ups in your browser to print the report."
        );


        return;

    }


    printWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
CMS Weekly Report
</title>

<style>

body {

    font-family:
        Arial,
        sans-serif;

    padding:
        35px;

    color:
        #222;

    line-height:
        1.6;

}

h1 {

    color:
        #294895;

}

h2 {

    color:
        #294895;

    border-bottom:
        1px solid #ddd;

    padding-bottom:
        6px;

    margin-top:
        25px;

}

.info {

    display:
        grid;

    grid-template-columns:
        1fr 1fr;

    gap:
        10px;

    background:
        #f5f7fb;

    padding:
        15px;

}

.attendance {

    display:
        grid;

    grid-template-columns:
        repeat(4, 1fr);

    gap:
        10px;

}

.box {

    background:
        #f5f7fb;

    padding:
        12px;

    text-align:
        center;

}

.box strong {

    display:
        block;

    font-size:
        20px;

}

.section {

    margin-top:
        20px;

}

.section p {

    white-space:
        pre-wrap;

}

</style>

</head>

<body>


<h1>
CELL MANAGEMENT SYSTEM
</h1>


<div>
WEEKLY CELL REPORT
</div>


<br>


<div class="info">


<div>

<strong>
Cell
</strong>

<br>

${escapeHTML(
    getCellName(
        report.cellId
    )
)}

</div>


<div>

<strong>
Date
</strong>

<br>

${formatDate(
    report.date
)}

</div>


<div>

<strong>
Meeting Location
</strong>

<br>

${escapeHTML(
    report.meetingLocation ||
    "—"
)}

</div>


<div>

<strong>
Status
</strong>

<br>

${escapeHTML(
    report.status ||
    "Draft"
)}

</div>


</div>


<h2>
Attendance
</h2>


<div class="attendance">


<div class="box">

Total

<strong>
${attendance.total}
</strong>

</div>


<div class="box">

Members

<strong>
${attendance.membersTotal}
</strong>

</div>


<div class="box">

Present

<strong>
${attendance.present}
</strong>

</div>


<div class="box">

Absent

<strong>
${attendance.absent}
</strong>

</div>


<div class="box">

Late

<strong>
${attendance.late}
</strong>

</div>


<div class="box">

Excused

<strong>
${attendance.excused}
</strong>

</div>


<div class="box">

Visitors

<strong>
${attendance.visitorTotal}
</strong>

</div>


<div class="box">

Rate

<strong>
${attendance.rate}%
</strong>

</div>


</div>


${printSection(
    "Members' Life",
    report.membersLife
)}


${printSection(
    "Activity Done",
    report.activityDone
)}


${printSection(
    "Challenges / Needs",
    report.challengesNeeds
)}


${printSection(
    "Follow-up Needed",
    report.followUpNeeded
)}


${printSection(
    "Next Week's Plan",
    report.nextWeekPlan
)}


${printSection(
    "Additional Comments",
    report.additionalComments
)}


</body>

</html>

    `);


    printWindow.document.close();


    setTimeout(
        function() {

            printWindow.focus();

            printWindow.print();

        },
        300
    );

}


/* =====================================================
   PRINT SECTION
   ===================================================== */

function printSection(
    title,
    value
) {

    return `

        <div
            class="section"
        >

            <h2>

                ${escapeHTML(
                    title
                )}

            </h2>

            <p>

                ${formatMultilineText(
                    value ||
                    "No information provided."
                )}

            </p>

        </div>

    `;

}


/* =====================================================
   REALTIME
   ===================================================== */

function subscribeWeeklyReportsRealtime() {

    if (
        !CMS_WEEKLY_REPORTS_SUPABASE
    ) {

        return;

    }


    if (
        weeklyReportsRealtimeChannel
    ) {

        try {

            CMS_WEEKLY_REPORTS_SUPABASE
                .removeChannel(
                    weeklyReportsRealtimeChannel
                );

        }

        catch (error) {

            console.warn(
                "CMS Weekly Reports realtime cleanup:",
                error
            );

        }


        weeklyReportsRealtimeChannel =
            null;

    }


    weeklyReportsRealtimeChannel =

        CMS_WEEKLY_REPORTS_SUPABASE
            .channel(
                "cms-weekly-reports-live"
            )

            .on(
                "postgres_changes",
                {
                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "weekly_reports"

                },
                async function(payload) {

                    console.log(
                        "CMS Weekly Reports realtime:",
                        payload.eventType
                    );


                    await loadLiveReports();


                    renderReports(
                        reportSearch?.value ||
                        ""
                    );


                    updateStatistics();

                }
            )

            .subscribe(
                function(status) {

                    console.log(
                        "CMS Weekly Reports realtime:",
                        status
                    );

                }
            );

}


/* =====================================================
   ESC KEY
   ===================================================== */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        if (
            reportModal &&
            reportModal.style.display ===
                "flex"
        ) {

            closeModal();

        }


        if (
            viewReportModal &&
            viewReportModal.style.display ===
                "flex"
        ) {

            closeViewModal();

        }

    }
);


/* =====================================================
   INITIALIZATION
   ===================================================== */

async function initializeWeeklyReports() {

    console.log(
        "CMS Weekly Reports: initializing..."
    );


    refreshLocalData();


    /*
       Access
    */

    await initializeWeeklyReportsAccess();


    /*
       Live reference data
    */

    if (
        CMS_WEEKLY_REPORTS_SUPABASE
    ) {

        await loadLiveCells();

        await loadLiveMembers();

    }


    /*
       Cell selector
    */

    loadCells();


    /*
       Role restriction
    */

    applyRoleRestriction();


    /*
       Live reports
    */

    if (
        CMS_WEEKLY_REPORTS_SUPABASE
    ) {

        await loadLiveReports();

    }


    /*
       Render
    */

    renderReports();


    updateStatistics();


    /*
       Realtime
    */

    subscribeWeeklyReportsRealtime();


    console.log(
        "CMS Weekly Reports module loaded successfully."
    );


    console.log(
        "CMS Weekly Reports access:",
        weeklyReportsAccess
    );


    console.log(
        "CMS Weekly Reports data:",
        {

            cells:
                cells.length,

            members:
                members.length,

            reports:
                weeklyReports.length,

            supabase:
                !!CMS_WEEKLY_REPORTS_SUPABASE

        }
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
        initializeWeeklyReports
    );

}

else {

    initializeWeeklyReports();

}