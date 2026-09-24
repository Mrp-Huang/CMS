/* =====================================================
   CMS - COORDINATOR DASHBOARD
   FINAL CONNECTED VERSION

   Connected modules:
   - Cells
   - Cell Leaders
   - Members
   - Attendance
   - Weekly Reports
   - Follow-ups
   - Evangelism
   - Records

   Main architecture:

   CELLS
      ↓
   LEADERS
      ↓
   MEMBERS
      ↓
   ATTENDANCE
      ↓
   WEEKLY REPORTS
      ↓
   FOLLOW-UPS
      ↓
   EVANGELISM

   Everything is summarized here.
   ===================================================== */


/* =====================================================
   INITIAL LOAD
   ===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadDashboard();

    }
);


/* =====================================================
   MAIN DASHBOARD LOADER
   ===================================================== */

function loadDashboard() {

    try {

        /* =============================================
           LOAD ALL CMS DATA
           ============================================= */

        const cells =
            getStorageArray(
                "cmsCells"
            );


        const leaders =
            getLeaders();


        const members =
            getStorageArray(
                "cmsMembers"
            );


        const attendance =
            getStorageArray(
                "cmsAttendance"
            );


        const reports =
            getStorageArray(
                "cmsWeeklyReports"
            );


        const followUps =
            getFollowUps();


        const evangelism =
            getStorageArray(
                "cmsEvangelism"
            );


        const records =
            getStorageArray(
                "cmsRecords"
            );


        console.log(
            "CMS Dashboard Data:",
            {
                cells,
                leaders,
                members,
                attendance,
                reports,
                followUps,
                evangelism,
                records
            }
        );


        /* =============================================
           BASIC STATISTICS
           ============================================= */

        setText(
            "total-cells",
            cells.length
        );


        setText(
            "total-leaders",
            leaders.length
        );


        setText(
            "total-members",
            members.length
        );


        setText(
            "total-reports",
            reports.length
        );


        setText(
            "total-followups",
            followUps.length
        );


        /* =============================================
           ATTENDANCE
           ============================================= */

        const attendanceStats =
            calculateAttendance(
                attendance
            );


        setText(
            "attendance-rate",
            attendanceStats.rate +
            "%"
        );


        setText(
            "attendance-records",
            attendance.length
        );


        setText(
            "attendance-present",
            attendanceStats.present
        );


        setText(
            "attendance-absent",
            attendanceStats.absent
        );


        setText(
            "attendance-excused",
            attendanceStats.excused
        );


        /* =============================================
           FOLLOW-UPS
           ============================================= */

        const pendingFollowUps =
            followUps.filter(
                isPendingFollowUp
            ).length;


        setText(
            "pending-followups",
            pendingFollowUps
        );


        /* =============================================
           PENDING REPORTS
           ============================================= */

        const pendingReports =
            calculatePendingReports(
                cells,
                reports
            );


        setText(
            "pending-reports",
            pendingReports
        );


        /* =============================================
           EVANGELISM
           ============================================= */

        const evangelismStats =
            calculateEvangelism(
                evangelism
            );


        setText(
            "dashboard-evangelism-activities",
            evangelismStats.activities
        );


        setText(
            "dashboard-evangelism-reached",
            evangelismStats.reached
        );


        setText(
            "dashboard-evangelism-new",
            evangelismStats.newPeople
        );


        setText(
            "dashboard-evangelism-saved",
            evangelismStats.saved
        );


        setText(
            "dashboard-evangelism-progress",
            evangelismStats.inProgress
        );


        setText(
            "dashboard-evangelism-interested",
            evangelismStats.interested
        );


        setText(
            "dashboard-evangelism-followup",
            evangelismStats.followUpNeeded
        );


        setText(
            "dashboard-evangelism-notyet",
            evangelismStats.notYet
        );


        /* =============================================
           RECENT WEEKLY REPORTS
           ============================================= */

        loadRecentReports(
            reports,
            cells
        );


        /* =============================================
           RECENT FOLLOW-UPS
           ============================================= */

        loadRecentFollowUps(
            followUps,
            cells,
            members
        );


        /* =============================================
           CELLS OVERVIEW
           ============================================= */

        loadCellsOverview(
            cells,
            leaders,
            members,
            reports
        );


        /* =============================================
           CELLS NEEDING ATTENTION
           ============================================= */

        loadCellsNeedingAttention(
            cells,
            leaders,
            members,
            attendance,
            reports,
            followUps
        );


        /* =============================================
           OVERALL CMS ANALYTICS
           ============================================= */

        const overallAnalytics =
            calculateOverallAnalytics(
                cells,
                members,
                attendance,
                reports,
                followUps,
                evangelism
            );


        setText(
            "dashboard-active-members",
            overallAnalytics.activeMembers
        );


        setText(
            "dashboard-report-coverage",
            overallAnalytics.reportCoverage +
            "%"
        );


        setText(
            "dashboard-followup-completion",
            overallAnalytics.followUpCompletion +
            "%"
        );


        setText(
            "dashboard-attendance-people",
            overallAnalytics.attendancePeople
        );


        setText(
            "dashboard-total-reached",
            overallAnalytics.peopleReached
        );


        /* =============================================
           RECORDS SUMMARY
           ============================================= */

        const recordsAttendance =
            records.filter(
                record =>
                    record.sourceType ===
                    "Attendance"
            );


        const recordsReports =
            records.filter(
                record =>
                    record.sourceType ===
                    "Weekly Report"
            );


        const recordsFollowUps =
            records.filter(
                record =>
                    record.sourceType ===
                    "Follow-up"
            );


        /*
           Records Center can also derive its
           data directly from cmsAttendance,
           cmsWeeklyReports and cmsFollowUps.

           Therefore we use the original module
           counts as the fallback/source of truth.
        */

        setText(
            "records-attendance",
            attendance.length
        );


        setText(
            "records-reports",
            reports.length
        );


        setText(
            "records-followups",
            followUps.length
        );


        /* =============================================
           LAST UPDATED
           ============================================= */

        setText(
            "lastUpdated",
            new Date().toLocaleString()
        );


        console.log(
            "CMS Dashboard loaded successfully."
        );

    }

    catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

    }

}


/* =====================================================
   LOCAL STORAGE
   ===================================================== */

function getStorageArray(
    key
) {

    try {

        const data =
            localStorage.getItem(
                key
            );


        if (!data) {

            return [];

        }


        const parsed =
            JSON.parse(
                data
            );


        return Array.isArray(
            parsed
        )
            ? parsed
            : [];

    }

    catch (error) {

        console.error(
            "Storage error:",
            key,
            error
        );


        return [];

    }

}


/* =====================================================
   LEADERS
   ===================================================== */

function getLeaders() {

    const primary =
        getStorageArray(
            "cmsCellLeaders"
        );


    if (
        primary.length > 0
    ) {

        return primary;

    }


    return getStorageArray(
        "cmsLeaders"
    );

}


/* =====================================================
   FOLLOW-UPS STORAGE
   ===================================================== */

function getFollowUps() {

    const possibleKeys = [

        "cmsFollowUps",

        "cmsFollowups",

        "followUps",

        "followups"

    ];


    for (
        let i = 0;
        i < possibleKeys.length;
        i++
    ) {

        const data =
            localStorage.getItem(
                possibleKeys[i]
            );


        if (!data) {

            continue;

        }


        try {

            const parsed =
                JSON.parse(
                    data
                );


            if (
                Array.isArray(
                    parsed
                )
            ) {

                return parsed;

            }

        }

        catch (error) {

            console.error(
                "Follow-up parsing error:",
                error
            );

        }

    }


    return [];

}


/* =====================================================
   SET TEXT
   ===================================================== */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* =====================================================
   ATTENDANCE CALCULATION
   ===================================================== */

function calculateAttendance(
    attendance
) {

    let present = 0;

    let absent = 0;

    let excused = 0;

    let late = 0;


    attendance.forEach(
        function(record) {

            /* =========================================
               MODERN SUMMARY
               ========================================= */

            if (
                record &&
                record.summary
            ) {

                present +=
                    Number(
                        record.summary.present
                    ) || 0;


                absent +=
                    Number(
                        record.summary.absent
                    ) || 0;


                excused +=
                    Number(
                        record.summary.excused
                    ) || 0;


                late +=
                    Number(
                        record.summary.late
                    ) || 0;


                return;

            }


            /* =========================================
               DIRECT SUMMARY
               ========================================= */

            if (
                record &&
                (
                    record.present !==
                        undefined ||

                    record.absent !==
                        undefined ||

                    record.excused !==
                        undefined ||

                    record.late !==
                        undefined
                )
            ) {

                present +=
                    Number(
                        record.present
                    ) || 0;


                absent +=
                    Number(
                        record.absent
                    ) || 0;


                excused +=
                    Number(
                        record.excused
                    ) || 0;


                late +=
                    Number(
                        record.late
                    ) || 0;


                return;

            }


            /* =========================================
               MEMBER ENTRIES
               ========================================= */

            const entries =
                record?.members ||
                record?.entries ||
                record?.attendance ||
                record?.records ||
                [];


            if (
                !Array.isArray(
                    entries
                )
            ) {

                return;

            }


            entries.forEach(
                function(entry) {

                    const status =
                        getAttendanceStatus(
                            entry
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
                        "excused"
                    ) {

                        excused++;

                    }


                    else if (
                        status ===
                        "late"
                    ) {

                        late++;

                    }

                }
            );

        }
    );


    const totalPeople =
        present +
        absent +
        excused +
        late;


    const attended =
        present +
        late;


    const rate =
        totalPeople > 0

            ? Math.round(
                (
                    attended /
                    totalPeople
                ) *
                100
            )

            : 0;


    return {

        present,

        absent,

        excused,

        late,

        totalPeople,

        rate

    };

}


/* =====================================================
   ATTENDANCE STATUS
   ===================================================== */

function getAttendanceStatus(
    record
) {

    if (!record) {

        return "other";

    }


    const value =
        String(

            record.status ??

            record.attendance_status ??

            record.attendanceStatus ??

            record.attended ??

            record.value ??

            ""

        )
        .trim()
        .toLowerCase();


    if (

        value === "present" ||

        value === "p" ||

        value === "yes" ||

        value === "attended" ||

        value === "true"

    ) {

        return "present";

    }


    if (

        value === "absent" ||

        value === "a" ||

        value === "no" ||

        value === "false"

    ) {

        return "absent";

    }


    if (

        value === "excused" ||

        value === "e"

    ) {

        return "excused";

    }


    if (

        value === "late" ||

        value === "l"

    ) {

        return "late";

    }


    return "other";

}


/* =====================================================
   EVANGELISM CALCULATION
   ===================================================== */

function calculateEvangelism(
    evangelism
) {

    let reached = 0;

    let newPeople = 0;

    let saved = 0;

    let inProgress = 0;

    let interested = 0;

    let followUpNeeded = 0;

    let notYet = 0;


    evangelism.forEach(
        function(record) {

            /*
               Individual people are the source
               of truth when detailed people exist.
            */

            const people =
                Array.isArray(
                    record.people
                )
                    ? record.people
                    : [];


            if (
                people.length > 0
            ) {

                reached +=
                    people.length;


                people.forEach(
                    function(person) {

                        if (
                            person.isNew ===
                            true
                        ) {

                            newPeople++;

                        }


                        switch (
                            person.outcome
                        ) {

                            case "Saved":

                                saved++;
                                break;


                            case "In Progress":

                                inProgress++;
                                break;


                            case "Interested":

                                interested++;
                                break;


                            case "Follow-up Needed":

                                followUpNeeded++;
                                break;


                            case "Not Yet / No Decision":

                                notYet++;
                                break;

                        }

                    }
                );

            }

            else {

                reached +=
                    getNumber(
                        record,
                        [
                            "peopleReached",
                            "people_reached",
                            "reached"
                        ]
                    );


                newPeople +=
                    getNumber(
                        record,
                        [
                            "newPeople",
                            "new_people",
                            "new"
                        ]
                    );


                saved +=
                    getNumber(
                        record,
                        [
                            "saved",
                            "peopleSaved",
                            "people_saved"
                        ]
                    );


                inProgress +=
                    getNumber(
                        record,
                        [
                            "inProgress",
                            "in_progress"
                        ]
                    );


                interested +=
                    getNumber(
                        record,
                        [
                            "interested",
                            "peopleInterested",
                            "people_interested"
                        ]
                    );


                followUpNeeded +=
                    getNumber(
                        record,
                        [
                            "followUpNeeded",
                            "followupNeeded",
                            "followup_needed",
                            "follow_up_needed",
                            "followUp"
                        ]
                    );


                notYet +=
                    getNumber(
                        record,
                        [
                            "notYet",
                            "not_yet",
                            "noDecision",
                            "no_decision"
                        ]
                    );

            }

        }
    );


    return {

        activities:
            evangelism.length,

        reached,

        newPeople,

        saved,

        inProgress,

        interested,

        followUpNeeded,

        notYet

    };

}


/* =====================================================
   NUMBER HELPER
   ===================================================== */

function getNumber(
    object,
    keys
) {

    if (!object) {

        return 0;

    }


    for (
        let i = 0;
        i < keys.length;
        i++
    ) {

        const value =
            object[
                keys[i]
            ];


        if (

            value !==
                undefined &&

            value !==
                null &&

            value !== ""

        ) {

            const number =
                Number(
                    value
                );


            if (
                !Number.isNaN(
                    number
                )
            ) {

                return number;

            }

        }

    }


    return 0;

}


/* =====================================================
   OVERALL CMS ANALYTICS
   ===================================================== */

function calculateOverallAnalytics(
    cells,
    members,
    attendance,
    reports,
    followUps,
    evangelism
) {

    /* =========================================
       ACTIVE MEMBERS
       ========================================= */

    const activeMembers =
        members.filter(
            function(member) {

                const status =
                    String(

                        member.status ??

                        member.memberStatus ??

                        member.state ??

                        "active"

                    )
                    .trim()
                    .toLowerCase();


                return !(

                    status ===
                        "inactive" ||

                    status ===
                        "left" ||

                    status ===
                        "removed" ||

                    status ===
                        "deleted" ||

                    status ===
                        "moved to another cell"

                );

            }
        ).length;


    /* =========================================
       REPORT COVERAGE
       ========================================= */

    let reportCoverage = 0;


    if (
        cells.length > 0
    ) {

        const cellsWithReports =
            cells.filter(
                function(cell) {

                    return reports.some(
                        function(report) {

                            return sameCell(
                                report,
                                cell
                            );

                        }
                    );

                }
            ).length;


        reportCoverage =
            Math.round(
                (
                    cellsWithReports /
                    cells.length
                ) *
                100
            );

    }


    /* =========================================
       FOLLOW-UP COMPLETION
       ========================================= */

    let followUpCompletion = 0;


    if (
        followUps.length >
        0
    ) {

        const completed =
            followUps.filter(
                function(followUp) {

                    return !isPendingFollowUp(
                        followUp
                    );

                }
            ).length;


        followUpCompletion =
            Math.round(
                (
                    completed /
                    followUps.length
                ) *
                100
            );

    }


    /* =========================================
       ATTENDANCE
       ========================================= */

    const attendanceStats =
        calculateAttendance(
            attendance
        );


    const attendancePeople =
        attendanceStats.totalPeople;


    /* =========================================
       EVANGELISM
       ========================================= */

    const evangelismStats =
        calculateEvangelism(
            evangelism
        );


    return {

        activeMembers,

        reportCoverage,

        followUpCompletion,

        attendancePeople,

        peopleReached:
            evangelismStats.reached

    };

}


/* =====================================================
   PENDING REPORTS
   ===================================================== */

function calculatePendingReports(
    cells,
    reports
) {

    if (
        cells.length ===
        0
    ) {

        return 0;

    }


    let count = 0;


    cells.forEach(
        function(cell) {

            const hasReport =
                reports.some(
                    function(report) {

                        return sameCell(
                            report,
                            cell
                        );

                    }
                );


            if (
                !hasReport
            ) {

                count++;

            }

        }
    );


    return count;

}


/* =====================================================
   RECENT WEEKLY REPORTS
   ===================================================== */

function loadRecentReports(
    reports,
    cells
) {

    const body =
        document.getElementById(
            "weeklyReportsTableBody"
        );


    if (!body) {
        return;
    }


    body.innerHTML =
        "";


    if (
        reports.length ===
        0
    ) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty-message"
                >

                    No weekly reports submitted yet.

                </td>

            </tr>

        `;

        return;

    }


    sortNewestFirst(
        reports
    )
        .slice(
            0,
            5
        )
        .forEach(
            function(report) {

                const cell =
                    findCell(
                        report,
                        cells
                    );


                const activity =

                    report.activityDone ||

                    report.activity ||

                    report.activity_done ||

                    "—";


                const followUp =

                    report.followUpNeeded ??

                    report.followupNeeded ??

                    report.follow_up_needed ??

                    report.followUp ??

                    "";


                const status =

                    report.status ||

                    "Submitted";


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>

                        ${escapeHTML(
                            getCellName(
                                report,
                                cell
                            )
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            getReportDate(
                                report
                            )
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            shorten(
                                activity,
                                60
                            )
                        )}

                    </td>


                    <td>

                        ${
                            hasFollowUpNeed(
                                followUp
                            )

                                ? `

                                    <span
                                        class="status-warning"
                                    >
                                        Needed
                                    </span>

                                  `

                                : `

                                    <span
                                        class="status-ok"
                                    >
                                        No
                                    </span>

                                  `
                        }

                    </td>


                    <td>

                        <span
                            class="status-submitted"
                        >
                            ${escapeHTML(
                                status
                            )}
                        </span>

                    </td>

                `;


                body.appendChild(
                    row
                );

            }
        );

}


/* =====================================================
   RECENT FOLLOW-UPS
   ===================================================== */

function loadRecentFollowUps(
    followUps,
    cells,
    members
) {

    const body =
        document.getElementById(
            "followUpsTableBody"
        );


    if (!body) {
        return;
    }


    body.innerHTML =
        "";


    if (
        followUps.length ===
        0
    ) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty-message"
                >

                    No follow-ups recorded yet.

                </td>

            </tr>

        `;

        return;

    }


    sortNewestFirst(
        followUps
    )
        .slice(
            0,
            5
        )
        .forEach(
            function(followUp) {

                const member =
                    findMember(
                        followUp,
                        members
                    );


                const cell =
                    findCell(
                        followUp,
                        cells
                    );


                const memberName =

                    followUp.memberName ||

                    followUp.member_name ||

                    (
                        typeof followUp.member ===
                        "string"

                            ? followUp.member

                            : ""
                    ) ||

                    followUp.name ||

                    (
                        member
                            ? getMemberName(
                                member
                            )
                            : "Unknown Member"
                    );


                const reason =

                    followUp.reason ||

                    followUp.issue ||

                    followUp.notes ||

                    followUp.description ||

                    "—";


                const status =
                    getFollowUpStatus(
                        followUp
                    );


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>

                        ${escapeHTML(
                            memberName
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            getCellName(
                                followUp,
                                cell
                            )
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            getGenericDate(
                                followUp
                            )
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            shorten(
                                reason,
                                55
                            )
                        )}

                    </td>


                    <td>

                        ${
                            isPendingFollowUp(
                                followUp
                            )

                                ? `

                                    <span
                                        class="status-warning"
                                    >
                                        ${escapeHTML(
                                            status
                                        )}
                                    </span>

                                  `

                                : `

                                    <span
                                        class="status-ok"
                                    >
                                        ${escapeHTML(
                                            status
                                        )}
                                    </span>

                                  `
                        }

                    </td>

                `;


                body.appendChild(
                    row
                );

            }
        );

}


/* =====================================================
   CELLS OVERVIEW
   ===================================================== */

function loadCellsOverview(
    cells,
    leaders,
    members,
    reports
) {

    const body =
        document.getElementById(
            "cellsOverviewBody"
        );


    if (!body) {
        return;
    }


    body.innerHTML =
        "";


    if (
        cells.length ===
        0
    ) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty-message"
                >

                    No cells registered yet.

                </td>

            </tr>

        `;

        return;

    }


    cells.forEach(
        function(cell) {

            const cellMembers =
                members.filter(
                    function(member) {

                        return sameCell(
                            member,
                            cell
                        );

                    }
                );


            const cellLeaders =
                leaders.filter(
                    function(leader) {

                        return sameCell(
                            leader,
                            cell
                        );

                    }
                );


            const cellReports =
                reports.filter(
                    function(report) {

                        return sameCell(
                            report,
                            cell
                        );

                    }
                );


            const leaderName =

                cellLeaders.length > 0

                    ? getLeaderName(
                        cellLeaders[0]
                    )

                    : "No leader";


            let status =
                "Good";


            if (
                cellMembers.length ===
                0
            ) {

                status =
                    "Needs members";

            }

            else if (
                cellLeaders.length ===
                0
            ) {

                status =
                    "No leader";

            }

            else if (
                cellReports.length ===
                0
            ) {

                status =
                    "No report";

            }


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>

                    ${escapeHTML(
                        getCellName(
                            cell,
                            cell
                        )
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        leaderName
                    )}

                </td>


                <td>

                    ${cellMembers.length}

                </td>


                <td>

                    ${cellReports.length}

                </td>


                <td>

                    ${
                        status ===
                        "Good"

                            ? `

                                <span
                                    class="status-ok"
                                >
                                    Good
                                </span>

                              `

                            : `

                                <span
                                    class="status-warning"
                                >
                                    ${escapeHTML(
                                        status
                                    )}
                                </span>

                              `
                    }

                </td>

            `;


            body.appendChild(
                row
            );

        }
    );

}


/* =====================================================
   CELLS NEEDING ATTENTION
   ===================================================== */

function loadCellsNeedingAttention(
    cells,
    leaders,
    members,
    attendance,
    reports,
    followUps
) {

    const container =
        document.getElementById(
            "cells-needing-attention"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (
        cells.length ===
        0
    ) {

        container.innerHTML = `

            <div
                class="attention-empty"
            >

                No cells registered yet.

            </div>

        `;

        return;

    }


    const attention =
        [];


    cells.forEach(
        function(cell) {

            const cellMembers =
                members.filter(
                    function(member) {

                        return sameCell(
                            member,
                            cell
                        );

                    }
                );


            const cellLeaders =
                leaders.filter(
                    function(leader) {

                        return sameCell(
                            leader,
                            cell
                        );

                    }
                );


            const cellReports =
                reports.filter(
                    function(report) {

                        return sameCell(
                            report,
                            cell
                        );

                    }
                );


            const cellFollowUps =
                followUps.filter(
                    function(followUp) {

                        return (

                            sameCell(
                                followUp,
                                cell
                            )

                            &&

                            isPendingFollowUp(
                                followUp
                            )

                        );

                    }
                );


            const cellName =
                getCellName(
                    cell,
                    cell
                );


            if (
                cellMembers.length ===
                0
            ) {

                attention.push({

                    cell:
                        cellName,

                    reason:
                        "No members registered",

                    type:
                        "warning"

                });

            }


            if (
                cellLeaders.length ===
                0
            ) {

                attention.push({

                    cell:
                        cellName,

                    reason:
                        "No cell leader assigned",

                    type:
                        "warning"

                });

            }


            if (
                cellReports.length ===
                0
            ) {

                attention.push({

                    cell:
                        cellName,

                    reason:
                        "No weekly report submitted",

                    type:
                        "report"

                });

            }


            if (
                cellFollowUps.length >
                0
            ) {

                attention.push({

                    cell:
                        cellName,

                    reason:

                        cellFollowUps.length +

                        " pending follow-up" +

                        (
                            cellFollowUps.length ===
                            1
                                ? ""
                                : "s"
                        ),

                    type:
                        "followup"

                });

            }

        }
    );


    if (
        attention.length ===
        0
    ) {

        container.innerHTML = `

            <div
                class="attention-success"
            >

                <strong>
                    ✅ All cells currently look good.
                </strong>


                <p>
                    No major issues were detected from the available CMS records.
                </p>

            </div>

        `;

        return;

    }


    attention
        .slice(
            0,
            12
        )
        .forEach(
            function(item) {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "attention-item";


                div.innerHTML = `

                    <div>

                        <strong>
                            ${escapeHTML(
                                item.cell
                            )}
                        </strong>


                        <span>
                            ${escapeHTML(
                                item.reason
                            )}
                        </span>

                    </div>


                    <span
                        class="attention-type"
                    >

                        ${
                            item.type ===
                            "followup"

                                ? "Follow-up"

                                : item.type ===
                                  "report"

                                    ? "Report"

                                    : "Attention"
                        }

                    </span>

                `;


                container.appendChild(
                    div
                );

            }
        );

}


/* =====================================================
   CELL MATCHING
   ===================================================== */

function sameCell(
    record,
    cell
) {

    if (
        !record ||
        !cell
    ) {

        return false;

    }


    const recordCellId =

        record.cellId ??

        record.cell_id ??

        record.cellID ??

        (
            record.cell &&
            typeof record.cell ===
            "object"
                ? record.cell.id
                : null
        );


    const cellId =

        cell.id ??

        cell.cellId ??

        cell.cell_id;


    if (

        recordCellId != null &&

        cellId != null

    ) {

        if (

            String(
                recordCellId
            ) ===

            String(
                cellId
            )

        ) {

            return true;

        }

    }


    const recordCellName =

        String(

            typeof record.cell ===
            "string"

                ? record.cell

                : record.cellName ??

                  record.cell_name ??

                  ""

        )
        .trim()
        .toLowerCase();


    const cellName =

        String(

            cell.name ??

            cell.cellName ??

            cell.cell_name ??

            ""

        )
        .trim()
        .toLowerCase();


    return (

        recordCellName &&

        cellName &&

        recordCellName ===
        cellName

    );

}


/* =====================================================
   FIND CELL
   ===================================================== */

function findCell(
    record,
    cells
) {

    return (

        cells.find(
            function(cell) {

                return sameCell(
                    record,
                    cell
                );

            }
        )

        ||

        null

    );

}


/* =====================================================
   FIND MEMBER
   ===================================================== */

function findMember(
    record,
    members
) {

    if (!record) {

        return null;

    }


    const memberId =

        record.memberId ??

        record.member_id ??

        record.memberID;


    if (
        memberId != null
    ) {

        const found =
            members.find(
                function(member) {

                    return String(
                        getId(
                            member
                        )
                    ) ===
                    String(
                        memberId
                    );

                }
            );


        if (found) {

            return found;

        }

    }


    const memberName =

        String(

            record.memberName ??

            record.member_name ??

            (
                typeof record.member ===
                "string"

                    ? record.member

                    : ""
            )

        )
        .trim()
        .toLowerCase();


    if (
        memberName
    ) {

        return (

            members.find(
                function(member) {

                    return (

                        getMemberName(
                            member
                        )
                        .trim()
                        .toLowerCase() ===
                        memberName

                    );

                }
            )

            ||

            null

        );

    }


    return null;

}


/* =====================================================
   MEMBER NAME
   ===================================================== */

function getMemberName(
    member
) {

    if (!member) {

        return "Unknown Member";

    }


    return (

        member.name ||

        member.fullName ||

        [
            member.firstName,
            member.lastName
        ]
            .filter(Boolean)
            .join(" ") ||

        [
            member.first_name,
            member.last_name
        ]
            .filter(Boolean)
            .join(" ") ||

        member.email ||

        "Unknown Member"

    );

}


/* =====================================================
   LEADER NAME
   ===================================================== */

function getLeaderName(
    leader
) {

    if (!leader) {

        return "Unknown Leader";

    }


    return (

        leader.name ||

        leader.fullName ||

        [
            leader.firstName,
            leader.lastName
        ]
            .filter(Boolean)
            .join(" ") ||

        [
            leader.first_name,
            leader.last_name
        ]
            .filter(Boolean)
            .join(" ") ||

        leader.email ||

        "Unknown Leader"

    );

}


/* =====================================================
   CELL NAME
   ===================================================== */

function getCellName(
    record,
    cell
) {

    if (
        record
    ) {

        if (
            record.cellName
        ) {

            return record.cellName;

        }


        if (
            record.cell_name
        ) {

            return record.cell_name;

        }


        if (
            typeof record.cell ===
            "string"
        ) {

            return record.cell;

        }

    }


    if (
        cell
    ) {

        return (

            cell.name ||

            cell.cellName ||

            cell.cell_name ||

            "Unknown Cell"

        );

    }


    return "Unknown Cell";

}


/* =====================================================
   REPORT DATE
   ===================================================== */

function getReportDate(
    report
) {

    return (

        report.date ||

        report.reportDate ||

        report.report_date ||

        report.week ||

        report.createdAt ||

        report.created_at ||

        "—"

    );

}


/* =====================================================
   GENERIC DATE
   ===================================================== */

function getGenericDate(
    record
) {

    return (

        record.date ||

        record.followUpDate ||

        record.followupDate ||

        record.follow_up_date ||

        record.createdAt ||

        record.created_at ||

        "—"

    );

}


/* =====================================================
   FOLLOW-UP STATUS
   ===================================================== */

function getFollowUpStatus(
    followUp
) {

    if (!followUp) {

        return "Pending";

    }


    if (
        followUp.completed ===
        true
    ) {

        return "Completed";

    }


    return (

        followUp.status ||

        followUp.followUpStatus ||

        followUp.followupStatus ||

        followUp.state ||

        "Pending"

    );

}


/* =====================================================
   PENDING FOLLOW-UP
   ===================================================== */

function isPendingFollowUp(
    followUp
) {

    if (!followUp) {

        return false;

    }


    if (
        followUp.completed ===
        true
    ) {

        return false;

    }


    const status =

        String(

            followUp.status ??

            followUp.followUpStatus ??

            followUp.followupStatus ??

            followUp.state ??

            ""

        )
        .trim()
        .toLowerCase();


    if (

        status === "completed" ||

        status === "complete" ||

        status === "closed" ||

        status === "done" ||

        status === "resolved"

    ) {

        return false;

    }


    return true;

}


/* =====================================================
   REPORT FOLLOW-UP NEED
   ===================================================== */

function hasFollowUpNeed(
    value
) {

    if (
        typeof value ===
        "boolean"
    ) {

        return value;

    }


    const text =

        String(
            value || ""
        )
        .trim()
        .toLowerCase();


    return (

        text === "yes" ||

        text === "needed" ||

        text === "true" ||

        text === "required" ||

        text === "follow-up" ||

        text === "followup"

    );

}


/* =====================================================
   SORT NEWEST FIRST
   ===================================================== */

function sortNewestFirst(
    array
) {

    return [...array].sort(
        function(a, b) {

            return (

                getRecordTimestamp(
                    b
                )

                -

                getRecordTimestamp(
                    a
                )

            );

        }
    );

}


/* =====================================================
   RECORD TIMESTAMP
   ===================================================== */

function getRecordTimestamp(
    record
) {

    if (!record) {

        return 0;

    }


    const rawDate =

        record.date ||

        record.followUpDate ||

        record.followupDate ||

        record.reportDate ||

        record.report_date ||

        record.createdAt ||

        record.created_at ||

        record.timestamp ||

        0;


    const timestamp =
        new Date(
            rawDate
        ).getTime();


    return Number.isNaN(
        timestamp
    )
        ? 0
        : timestamp;

}


/* =====================================================
   GET ID
   ===================================================== */

function getId(
    object
) {

    if (!object) {

        return null;

    }


    return (

        object.id ??

        object.memberId ??

        object.leaderId ??

        object.cellId ??

        null

    );

}


/* =====================================================
   SHORTEN
   ===================================================== */

function shorten(
    text,
    maxLength
) {

    const value =
        String(
            text || "—"
        );


    if (
        value.length <=
        maxLength
    ) {

        return value;

    }


    return (

        value.substring(
            0,
            maxLength
        ) +

        "..."

    );

}


/* =====================================================
   ESCAPE HTML
   ===================================================== */

function escapeHTML(
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


/* =====================================================
   AUTO REFRESH - OTHER TABS
   ===================================================== */

window.addEventListener(
    "storage",
    function(event) {

        const watchedKeys = [

            "cmsCells",

            "cmsCellLeaders",

            "cmsLeaders",

            "cmsMembers",

            "cmsAttendance",

            "cmsWeeklyReports",

            "cmsFollowUps",

            "cmsFollowups",

            "followUps",

            "followups",

            "cmsEvangelism",

            "cmsRecords"

        ];


        if (
            watchedKeys.includes(
                event.key
            )
        ) {

            loadDashboard();

        }

    }
);


/* =====================================================
   CMS UPDATE EVENT
   ===================================================== */

window.addEventListener(
    "cmsRecordsUpdated",
    function() {

        loadDashboard();

    }
);


/* =====================================================
   REFRESH WHEN WINDOW GETS FOCUS
   ===================================================== */

window.addEventListener(
    "focus",
    function() {

        loadDashboard();

    }
);


/* =====================================================
   REFRESH WHEN PAGE BECOMES VISIBLE
   ===================================================== */

document.addEventListener(
    "visibilitychange",
    function() {

        if (
            document.visibilityState ===
            "visible"
        ) {

            loadDashboard();

        }

    }
);


/* =====================================================
   INITIALIZE
   ===================================================== */

loadDashboard();


/* =====================================================
   DEBUG
   ===================================================== */

console.log(
    "CMS Dashboard Analytics connected successfully."
);