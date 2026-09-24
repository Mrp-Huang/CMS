/* =====================================================
   CMS - WEEKLY REPORTS SUPABASE BRIDGE

   PURPOSE:
   Keep the existing Weekly Reports UI and weekly-reports.js
   untouched while making Supabase the live database.

   SUPABASE:
   - cells
   - members
   - attendance_sessions
   - attendance
   - weekly_reports

   EXISTING UI:
   - continues using cmsCells
   - continues using cmsAttendance
   - continues using cmsWeeklyReports

   IMPORTANT:
   This bridge hydrates those localStorage keys from
   Supabase BEFORE weekly-reports.js is loaded.

   Then every cmsWeeklyReports localStorage save is
   synchronized back to Supabase.
   ===================================================== */


/* =====================================================
   CONFIGURATION
   ===================================================== */

const CMS_WEEKLY_BRIDGE_SUPABASE =
    window.supabaseClient;


/* =====================================================
   STATE
   ===================================================== */

let cmsWeeklyBridgeHydrating = true;

let cmsWeeklyBridgeSyncing = false;


/* =====================================================
   UUID CHECK
   ===================================================== */

function cmsWeeklyBridgeIsUUID(
    value
) {

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        .test(
            String(value || "")
        );

}


/* =====================================================
   SAFE JSON PARSER
   ===================================================== */

function cmsWeeklyBridgeParse(
    value,
    fallback
) {

    try {

        const parsed =
            JSON.parse(
                value
            );


        return parsed;

    }

    catch {

        return fallback;

    }

}


/* =====================================================
   INTERNAL LOCAL STORAGE WRITE
   ===================================================== */

function cmsWeeklyBridgeSetLocal(
    key,
    value
) {

    cmsWeeklyBridgeSyncing =
        true;


    try {

        localStorage.setItem(
            key,
            JSON.stringify(
                value
            )
        );

    }

    finally {

        cmsWeeklyBridgeSyncing =
            false;

    }

}


/* =====================================================
   LOAD CELLS
   ===================================================== */

async function cmsWeeklyBridgeLoadCells() {

    const {
        data,
        error
    } =
        await CMS_WEEKLY_BRIDGE_SUPABASE

            .from("cells")

            .select(
                "id,name,description,active,created_at,updated_at"
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


/* =====================================================
   LOAD MEMBERS
   ===================================================== */

async function cmsWeeklyBridgeLoadMembers() {

    const {
        data,
        error
    } =
        await CMS_WEEKLY_BRIDGE_SUPABASE

            .from("members")

            .select(`
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
                notes,
                created_at,
                updated_at
            `)

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


/* =====================================================
   LOAD ATTENDANCE SESSIONS
   ===================================================== */

async function cmsWeeklyBridgeLoadAttendanceSessions() {

    const {
        data,
        error
    } =
        await CMS_WEEKLY_BRIDGE_SUPABASE

            .from(
                "attendance_sessions"
            )

            .select(`
                id,
                cell_id,
                meeting_date,
                visitors,
                notes
            `)

            .order(
                "meeting_date",
                {
                    ascending: true
                }
            );


    if (error) {

        throw error;

    }


    return data || [];

}


/* =====================================================
   LOAD ATTENDANCE
   ===================================================== */

async function cmsWeeklyBridgeLoadAttendance() {

    const {
        data,
        error
    } =
        await CMS_WEEKLY_BRIDGE_SUPABASE

            .from("attendance")

            .select(`
                id,
                session_id,
                cell_id,
                member_id,
                meeting_date,
                status
            `)

            .order(
                "meeting_date",
                {
                    ascending: true
                }
            );


    if (error) {

        throw error;

    }


    return data || [];

}


/* =====================================================
   LOAD WEEKLY REPORTS
   ===================================================== */

async function cmsWeeklyBridgeLoadReports() {

    const {
        data,
        error
    } =
        await CMS_WEEKLY_BRIDGE_SUPABASE

            .from("weekly_reports")

            .select(`
                id,
                cell_id,
                report_date,
                meeting_location,
                members_life,
                activity_done,
                challenges_needs,
                follow_up_needed,
                next_week_plan,
                additional_comments,
                status,
                created_by,
                created_at,
                updated_at,
                submitted_at
            `)

            .order(
                "report_date",
                {
                    ascending: true
                }
            );


    if (error) {

        throw error;

    }


    return data || [];

}


/* =====================================================
   CONVERT CELLS TO EXISTING CMS SHAPE
   ===================================================== */

function cmsWeeklyBridgeConvertCells(
    dbCells
) {

    return dbCells.map(
        function(cell) {

            return {

                id:
                    cell.id,

                name:
                    cell.name,

                description:
                    cell.description ||
                    "",

                active:
                    cell.active !== false,

                createdAt:
                    cell.created_at,

                updatedAt:
                    cell.updated_at

            };

        }
    );

}


/* =====================================================
   BUILD ATTENDANCE SUMMARY
   ===================================================== */

function cmsWeeklyBridgeAttendanceSummary(
    memberRows,
    visitors
) {

    let present =
        0;

    let absent =
        0;

    let late =
        0;

    let excused =
        0;


    memberRows.forEach(
        function(row) {

            const status =
                String(
                    row.status ||
                    ""
                )
                    .trim()
                    .toLowerCase();


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


    const visitorRows =
        Array.isArray(
            visitors
        )
            ? visitors
            : [];


    let visitorsPresent =
        0;

    let visitorsAbsent =
        0;

    let visitorsLate =
        0;


    visitorRows.forEach(
        function(visitor) {

            const status =
                String(
                    visitor.status ||
                    "Present"
                )
                    .trim()
                    .toLowerCase();


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


    const membersTotal =
        memberRows.length;


    const visitorTotal =
        visitorRows.length;


    const total =
        membersTotal +
        visitorTotal;


    const attended =
        present +
        late +
        visitorsPresent +
        visitorsLate;


    const rate =
        total > 0

            ? Math.round(
                (
                    attended /
                    total
                ) *
                100
            )

            : 0;


    return {

        total,

        membersTotal,

        visitorTotal,

        present,

        absent,

        excused,

        late,

        visitorsPresent,

        visitorsAbsent,

        visitorsLate,

        rate

    };

}


/* =====================================================
   CONVERT DATABASE ATTENDANCE TO cmsAttendance
   ===================================================== */

function cmsWeeklyBridgeConvertAttendance(
    sessions,
    attendanceRows
) {

    return sessions.map(
        function(session) {

            const rows =
                attendanceRows.filter(
                    function(row) {

                        return (
                            String(
                                row.session_id
                            ) ===
                            String(
                                session.id
                            )
                        );

                    }
                );


            const visitors =
                Array.isArray(
                    session.visitors
                )

                    ? session.visitors

                    : [];


            const summary =
                cmsWeeklyBridgeAttendanceSummary(
                    rows,
                    visitors
                );


            return {

                id:
                    String(
                        session.cell_id
                    ) +
                    "_" +
                    String(
                        session.meeting_date
                    ),

                cellId:
                    session.cell_id,

                cellName:
                    "",

                date:
                    session.meeting_date,

                members:
                    rows.map(
                        function(row) {

                            return {

                                memberId:
                                    row.member_id,

                                status:
                                    row.status

                            };

                        }
                    ),

                visitors:
                    JSON.parse(
                        JSON.stringify(
                            visitors
                        )
                    ),

                summary:

                    summary,

                savedAt:
                    null

            };

        }
    );

}


/* =====================================================
   CONVERT WEEKLY REPORTS
   ===================================================== */

function cmsWeeklyBridgeConvertReports(
    dbReports
) {

    return dbReports.map(
        function(report) {

            return {

                id:
                    report.id,

                cellId:
                    report.cell_id,

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

                createdAt:
                    report.created_at,

                updatedAt:
                    report.updated_at,

                submittedAt:
                    report.submitted_at ||
                    null,

                createdBy:
                    report.created_by ||
                    null

            };

        }
    );

}


/* =====================================================
   HYDRATE EXISTING CMS STORAGE
   ===================================================== */

async function cmsWeeklyBridgeHydrate() {

    if (
        !CMS_WEEKLY_BRIDGE_SUPABASE
    ) {

        throw new Error(
            "Supabase client is not available."
        );

    }


    console.log(
        "CMS Weekly Reports: loading live Supabase data..."
    );


    const [
        dbCells,
        dbMembers,
        dbSessions,
        dbAttendance,
        dbReports
    ] =
        await Promise.all([
            cmsWeeklyBridgeLoadCells(),
            cmsWeeklyBridgeLoadMembers(),
            cmsWeeklyBridgeLoadAttendanceSessions(),
            cmsWeeklyBridgeLoadAttendance(),
            cmsWeeklyBridgeLoadReports()
        ]);


    /* =================================================
       CELLS
       ================================================= */

    const cmsCells =
        cmsWeeklyBridgeConvertCells(
            dbCells
        );


    /* =================================================
       ATTENDANCE
       ================================================= */

    const cmsAttendance =
        cmsWeeklyBridgeConvertAttendance(
            dbSessions,
            dbAttendance
        );


    /* Add cell names */

    cmsAttendance.forEach(
        function(record) {

            const cell =
                dbCells.find(
                    function(item) {

                        return (
                            String(
                                item.id
                            ) ===
                            String(
                                record.cellId
                            )
                        );

                    }
                );


            if (cell) {

                record.cellName =
                    cell.name;

            }

        }
    );


    /* =================================================
       REPORTS
       ================================================= */

    const cmsReports =
        cmsWeeklyBridgeConvertReports(
            dbReports
        );


    /* =================================================
       WRITE LIVE DATA TO EXISTING CMS STORAGE
       ================================================= */

    cmsWeeklyBridgeSetLocal(
        "cmsCells",
        cmsCells
    );


    cmsWeeklyBridgeSetLocal(
        "cmsAttendance",
        cmsAttendance
    );


    cmsWeeklyBridgeSetLocal(
        "cmsWeeklyReports",
        cmsReports
    );


    /* Members remain available for other existing code */

    const cmsMembers =
        dbMembers.map(
            function(member) {

                return {

                    id:
                        member.id,

                    name:
                        [
                            member.first_name,
                            member.last_name
                        ]
                            .filter(
                                Boolean
                            )
                            .join(" "),

                    phone:
                        member.phone ||
                        "",

                    email:
                        member.email ||
                        "",

                    gender:
                        member.gender ||
                        "",

                    year:
                        member.year_of_study ||
                        "",

                    combination:
                        member.combination ||
                        "",

                    cellId:
                        member.cell_id,

                    dateJoined:
                        member.date_joined ||
                        "",

                    status:
                        member.active !== false
                            ? "Active"
                            : "Inactive",

                    notes:
                        member.notes ||
                        "",

                    createdAt:
                        member.created_at,

                    updatedAt:
                        member.updated_at

                };

            }
        );


    cmsWeeklyBridgeSetLocal(
        "cmsMembers",
        cmsMembers
    );


    console.log(
        "CMS Weekly Reports: Supabase hydration complete."
    );


    console.log(
        {
            cells:
                cmsCells.length,

            members:
                cmsMembers.length,

            attendanceSessions:
                dbSessions.length,

            attendanceRows:
                dbAttendance.length,

            weeklyReports:
                cmsReports.length

        }
    );

}


/* =====================================================
   REPORT DATA → DATABASE
   ===================================================== */

function cmsWeeklyBridgeReportPayload(
    report
) {

    const session =
        CMS_WEEKLY_BRIDGE_SUPABASE.auth
            .getSession();


    return session.then(
        function(result) {

            const userId =
                result
                    ?.data
                    ?.session
                    ?.user
                    ?.id ||
                null;


            return {

                cell_id:
                    report.cellId,

                report_date:
                    report.date,

                meeting_location:
                    report.meetingLocation ||
                    "",

                members_life:
                    report.membersLife ||
                    "",

                activity_done:
                    report.activityDone ||
                    "",

                challenges_needs:
                    report.challengesNeeds ||
                    null,

                follow_up_needed:
                    report.followUpNeeded ||
                    null,

                next_week_plan:
                    report.nextWeekPlan ||
                    null,

                additional_comments:
                    report.additionalComments ||
                    null,

                status:
                    report.status ||
                    "Draft",

                created_by:
                    report.createdBy ||
                    userId ||
                    null,

                created_at:
                    report.createdAt ||
                    undefined,

                updated_at:
                    report.updatedAt ||
                    new Date()
                        .toISOString(),

                submitted_at:
                    report.status ===
                    "Submitted"

                        ? (
                            report.submittedAt ||
                            new Date()
                                .toISOString()
                        )

                        : null

            };

        }
    );

}


/* =====================================================
   FIND REPORT IN LOCAL DATA
   ===================================================== */

function cmsWeeklyBridgeReportKey(
    report
) {

    return (
        String(
            report.cellId
        ) +
        "|" +
        String(
            report.date
        )
    );

}


/* =====================================================
   SYNC WEEKLY REPORTS TO SUPABASE
   ===================================================== */

async function cmsWeeklyBridgeSyncReports(
    value
) {

    if (
        cmsWeeklyBridgeSyncing
    ) {

        return;

    }


    if (
        cmsWeeklyBridgeHydrating
    ) {

        return;

    }


    if (
        !CMS_WEEKLY_BRIDGE_SUPABASE
    ) {

        return;

    }


    if (
        !Array.isArray(value)
    ) {

        return;

    }


    cmsWeeklyBridgeSyncing =
        true;


    try {

        console.log(
            "CMS Weekly Reports: synchronizing reports with Supabase..."
        );


        /* =================================================
           LOAD CURRENT DATABASE REPORTS
           ================================================= */

        const {
            data: dbReports,
            error: dbError
        } =
            await CMS_WEEKLY_BRIDGE_SUPABASE

                .from(
                    "weekly_reports"
                )

                .select(
                    `
                    id,
                    cell_id,
                    report_date,
                    status
                    `
                );


        if (dbError) {

            throw dbError;

        }


        const localById =
            {};


        const localByKey =
            {};


        value.forEach(
            function(report) {

                localById[
                    String(
                        report.id
                    )
                ] =
                    report;


                localByKey[
                    cmsWeeklyBridgeReportKey(
                        report
                    )
                ] =
                    report;

            }
        );


        const canonicalReports =
            [];


        /* =================================================
           UPSERT LOCAL REPORTS
           ================================================= */

        for (
            const report
            of value
        ) {

            const payload =
                await cmsWeeklyBridgeReportPayload(
                    report
                );


            let savedReport =
                null;


            const reportHasUUID =
                cmsWeeklyBridgeIsUUID(
                    report.id
                );


            if (
                reportHasUUID
            ) {

                const {
                    data,
                    error
                } =
                    await CMS_WEEKLY_BRIDGE_SUPABASE

                        .from(
                            "weekly_reports"
                        )

                        .update(
                            payload
                        )

                        .eq(
                            "id",
                            report.id
                        )

                        .select(
                            `
                            id,
                            cell_id,
                            report_date,
                            status,
                            created_at,
                            updated_at,
                            submitted_at,
                            created_by
                            `
                        )

                        .maybeSingle();


                if (error) {

                    throw error;

                }


                if (data) {

                    savedReport =
                        data;

                }

            }


            /* =================================================
               INSERT NEW REPORT
               ================================================= */

            if (
                !savedReport
            ) {

                const insertPayload =
                    {
                        ...payload
                    };


                const {
                    data,
                    error
                } =
                    await CMS_WEEKLY_BRIDGE_SUPABASE

                        .from(
                            "weekly_reports"
                        )

                        .insert(
                            insertPayload
                        )

                        .select(
                            `
                            id,
                            cell_id,
                            report_date,
                            status,
                            created_at,
                            updated_at,
                            submitted_at,
                            created_by
                            `
                        )

                        .single();


                if (error) {

                    throw error;

                }


                savedReport =
                    data;

            }


            canonicalReports.push({

                ...report,

                id:
                    savedReport.id,

                cellId:
                    savedReport.cell_id,

                date:
                    savedReport.report_date,

                status:
                    savedReport.status,

                createdAt:
                    savedReport.created_at ||
                    report.createdAt,

                updatedAt:
                    savedReport.updated_at ||
                    report.updatedAt,

                submittedAt:
                    savedReport.submitted_at ||
                    report.submittedAt ||
                    null,

                createdBy:
                    savedReport.created_by ||
                    report.createdBy ||
                    null

            });

        }


        /* =================================================
           DELETE REPORTS REMOVED FROM LOCAL UI
           ================================================= */

        const localKeys =
            new Set(
                value.map(
                    function(report) {

                        return (
                            String(
                                report.cellId
                            ) +
                            "|" +
                            String(
                                report.date
                            )
                        );

                    }
                )
            );


        for (
            const dbReport
            of (
                dbReports ||
                []
            )
        ) {

            const key =
                String(
                    dbReport.cell_id
                ) +
                "|" +
                String(
                    dbReport.report_date
                );


            if (
                !localKeys.has(
                    key
                )
            ) {

                const {
                    error
                } =
                    await CMS_WEEKLY_BRIDGE_SUPABASE

                        .from(
                            "weekly_reports"
                        )

                        .delete()

                        .eq(
                            "id",
                            dbReport.id
                        );


                if (error) {

                    throw error;

                }

            }

        }


        /* =================================================
           SAVE CANONICAL IDs BACK LOCALLY
           ================================================= */

        cmsWeeklyBridgeSetLocal(
            "cmsWeeklyReports",
            canonicalReports
        );


        /* =================================================
           UPDATE ATTENDANCE/CELL DATA TOO
           ================================================= */

        await cmsWeeklyBridgeRefreshCore();


        console.log(
            "CMS Weekly Reports: synchronization complete."
        );

    }

    catch (error) {

        console.error(
            "CMS Weekly Reports Supabase synchronization failed:",
            error
        );

    }

    finally {

        cmsWeeklyBridgeSyncing =
            false;

    }

}


/* =====================================================
   REFRESH CORE DATA
   ===================================================== */

async function cmsWeeklyBridgeRefreshCore() {

    try {

        const [
            dbCells,
            dbMembers,
            dbSessions,
            dbAttendance,
            dbReports
        ] =
            await Promise.all([
                cmsWeeklyBridgeLoadCells(),
                cmsWeeklyBridgeLoadMembers(),
                cmsWeeklyBridgeLoadAttendanceSessions(),
                cmsWeeklyBridgeLoadAttendance(),
                cmsWeeklyBridgeLoadReports()
            ]);


        const cmsCells =
            cmsWeeklyBridgeConvertCells(
                dbCells
            );


        const cmsAttendance =
            cmsWeeklyBridgeConvertAttendance(
                dbSessions,
                dbAttendance
            );


        cmsAttendance.forEach(
            function(record) {

                const cell =
                    dbCells.find(
                        function(item) {

                            return (
                                String(
                                    item.id
                                ) ===
                                String(
                                    record.cellId
                                )
                            );

                        }
                    );


                if (cell) {

                    record.cellName =
                        cell.name;

                }

            }
        );


        cmsWeeklyBridgeSetLocal(
            "cmsCells",
            cmsCells
        );


        cmsWeeklyBridgeSetLocal(
            "cmsAttendance",
            cmsAttendance
        );


        cmsWeeklyBridgeSetLocal(
            "cmsWeeklyReports",
            cmsWeeklyBridgeConvertReports(
                dbReports
            )
        );

    }

    catch (error) {

        console.error(
            "CMS Weekly Reports core refresh failed:",
            error
        );

    }

}


/* =====================================================
   WATCH cmsWeeklyReports WRITES
   ===================================================== */

function cmsWeeklyBridgeInstallStorageSync() {

    const originalSetItem =
        Storage.prototype.setItem;


    Storage.prototype.setItem =
        function(
            key,
            value
        ) {

            originalSetItem.call(
                this,
                key,
                value
            );


            if (
                this ===
                    localStorage &&

                key ===
                    "cmsWeeklyReports" &&

                !cmsWeeklyBridgeHydrating &&

                !cmsWeeklyBridgeSyncing
            ) {

                const parsed =
                    cmsWeeklyBridgeParse(
                        value,
                        []
                    );


                /*
                   Run asynchronously so the existing
                   Weekly Reports UI finishes its own
                   local save first.
                */

                setTimeout(
                    function() {

                        cmsWeeklyBridgeSyncReports(
                            parsed
                        );

                    },
                    0
                );

            }

        };


}


/* =====================================================
   REPORT PAGE SCRIPT LOADER
   ===================================================== */

function cmsWeeklyBridgeLoadReportScript() {

    const existing =
        document.querySelector(
            'script[data-cms-weekly-reports="true"]'
        );


    if (
        existing
    ) {

        return;

    }


    const script =
        document.createElement(
            "script"
        );


    script.src =
        "weekly-reports.js";


    script.dataset.cmsWeeklyReports =
        "true";


    script.onload =
        function() {

            console.log(
                "CMS Weekly Reports: existing report UI loaded after Supabase hydration."
            );

        };


    script.onerror =
        function() {

            console.error(
                "CMS Weekly Reports: failed to load weekly-reports.js"
            );

        };


    document.body.appendChild(
        script
    );

}


/* =====================================================
   START
   ===================================================== */

(async function startCMSWeeklyReportsBridge() {

    if (
        !CMS_WEEKLY_BRIDGE_SUPABASE
    ) {

        console.error(
            "CMS Weekly Reports Bridge: Supabase client unavailable."
        );

        return;

    }


    try {

        /*
           Load live database data BEFORE the
           existing weekly-reports.js runs.
        */

        await cmsWeeklyBridgeHydrate();


        /*
           Install localStorage synchronization.
        */

        cmsWeeklyBridgeInstallStorageSync();


        /*
           Hydration is now finished.
        */

        cmsWeeklyBridgeHydrating =
            false;


        /*
           Load the original UI logic.
        */

        cmsWeeklyBridgeLoadReportScript();


    }

    catch (error) {

        cmsWeeklyBridgeHydrating =
            false;


        console.error(
            "CMS Weekly Reports Bridge initialization failed:",
            error
        );


        /*
           Even if Supabase loading fails,
           keep the existing UI available.
        */

        cmsWeeklyBridgeLoadReportScript();

    }

})();