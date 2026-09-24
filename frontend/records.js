/* =====================================================
   CMS - RECORDS CENTER
   COMPLETE CONNECTED VERSION

   PRESERVES:
   - Attendance
   - Weekly Reports
   - Follow-ups
   - Evangelism
   - Visitors
   - Search
   - Date filtering
   - Tabs
   - View
   - Download
   - Delete
   - Export All
   - Print
   - Existing localStorage backup/cache
   - Supabase live member/cell reference lookup
   - Supabase live visitor + visitor history lookup

   IMPORTANT:
   Registered attendance members are resolved from
   Supabase public.members so the Records Center
   does not display "Unknown Member" when the member
   exists in the live CMS database.

   IMPORTANT:
   Visitors are read from:
       visitors
       visitor_visits

   Visitors are NOT deleted from Records Center because
   visitor_visits depends on the visitor record.
   ===================================================== */


/* =====================================================
   STORAGE KEYS
   ===================================================== */

const ATTENDANCE_KEYS = [

    "cmsAttendance",

    "cmsAttendances",

    "attendanceRecords"

];


const REPORT_KEYS = [

    "cmsWeeklyReports",

    "cmsReports",

    "weeklyReports"

];


const FOLLOW_UP_KEYS = [

    "cmsFollowUps",

    "cmsFollowups",

    "followUps",

    "followups"

];


const EVANGELISM_KEYS = [

    "cmsEvangelism"

];


const MEMBERS_KEY =
    "cmsMembers";


/* =====================================================
   LOCAL STORAGE READER
   ===================================================== */

function readStorageArray(
    keys
) {

    for (
        const key of keys
    ) {

        try {

            const value =
                JSON.parse(
                    localStorage.getItem(
                        key
                    )
                );


            if (
                Array.isArray(
                    value
                )
            ) {

                return value;

            }

        }

        catch (error) {

            console.warn(
                "CMS Records storage read:",
                key,
                error
            );

        }

    }


    return [];

}


/* =====================================================
   INITIAL DATA
   ===================================================== */

let attendanceRecords =
    readStorageArray(
        ATTENDANCE_KEYS
    );


let weeklyReports =
    readStorageArray(
        REPORT_KEYS
    );


let followUps =
    readStorageArray(
        FOLLOW_UP_KEYS
    );


let evangelismRecords =
    readStorageArray(
        EVANGELISM_KEYS
    );


/* =====================================================
   LIVE VISITOR DATA
   ===================================================== */

let visitorRecords =
    [];


let visitorVisitRecords =
    [];


/* =====================================================
   LOCAL FALLBACK CELLS
   ===================================================== */

function getLocalCells() {

    try {

        const value =
            JSON.parse(
                localStorage.getItem(
                    "cmsCells"
                )
            );


        return Array.isArray(
            value
        )
            ? value
            : [];

    }

    catch {

        return [];

    }

}


/* =====================================================
   LOCAL FALLBACK MEMBERS
   ===================================================== */

function getLocalMembers() {

    try {

        const value =
            JSON.parse(
                localStorage.getItem(
                    MEMBERS_KEY
                )
            );


        return Array.isArray(
            value
        )
            ? value
            : [];

    }

    catch {

        return [];

    }

}


/* =====================================================
   REFERENCE DATA
   ===================================================== */

let cells =
    getLocalCells();


let members =
    getLocalMembers();


/* =====================================================
   FILTER STATE
   ===================================================== */

let currentType =
    "all";


let selectedRecord =
    null;


/* =====================================================
   LIVE SUPABASE STATE
   ===================================================== */

let cmsRecordsSupabase =
    window.supabaseClient ||
    null;


let recordsLiveReferenceLoaded =
    false;


/* =====================================================
   DOM ELEMENTS
   ===================================================== */

const recordsTableBody =
    document.getElementById(
        "recordsTableBody"
    );


const recordSearch =
    document.getElementById(
        "recordSearch"
    );


const recordDate =
    document.getElementById(
        "recordDate"
    );


const clearFiltersButton =
    document.getElementById(
        "clearFiltersButton"
    );


const recordTabs =
    document.querySelectorAll(
        ".record-tab"
    );


const totalRecords =
    document.getElementById(
        "totalRecords"
    );


const totalAttendance =
    document.getElementById(
        "totalAttendance"
    );


const totalReports =
    document.getElementById(
        "totalReports"
    );


const totalFollowUps =
    document.getElementById(
        "totalFollowUps"
    );


const totalEvangelism =
    document.getElementById(
        "totalEvangelism"
    );


const totalVisitors =
    document.getElementById(
        "totalVisitors"
    );


const latestRecord =
    document.getElementById(
        "latestRecord"
    );


const recordCountText =
    document.getElementById(
        "recordCountText"
    );


const recordModal =
    document.getElementById(
        "recordModal"
    );


const recordDetails =
    document.getElementById(
        "recordDetails"
    );


const modalRecordTitle =
    document.getElementById(
        "modalRecordTitle"
    );


const closeRecordModal =
    document.getElementById(
        "closeRecordModal"
    );


const closeRecordButton =
    document.getElementById(
        "closeRecordButton"
    );


const downloadRecordButton =
    document.getElementById(
        "downloadRecordButton"
    );


const printRecordButton =
    document.getElementById(
        "printRecordButton"
    );


const exportAllButton =
    document.getElementById(
        "exportAllButton"
    );


const printButton =
    document.getElementById(
        "printButton"
    );


/* =====================================================
   REFRESH LOCAL DATA
   ===================================================== */

function refreshAllData() {

    if (
        !recordsLiveReferenceLoaded
    ) {

        cells =
            getLocalCells();


        members =
            getLocalMembers();

    }


    attendanceRecords =
        readStorageArray(
            ATTENDANCE_KEYS
        );


    weeklyReports =
        readStorageArray(
            REPORT_KEYS
        );


    followUps =
        readStorageArray(
            FOLLOW_UP_KEYS
        );


    evangelismRecords =
        readStorageArray(
            EVANGELISM_KEYS
        );

}


/* =====================================================
   CELL NAME
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
        cell?.cellName ||
        "Unknown cell"
    );

}


/* =====================================================
   LEADER BY ID
   ===================================================== */

function getLeaderById(
    assignedTo
) {

    if (
        !assignedTo
    ) {

        return null;

    }

    const rawValue =
        String(
            assignedTo
        )
        .trim();

    let normalizedId =
        rawValue;

    if (
        normalizedId.startsWith(
            "leader:"
        )
    ) {

        normalizedId =
            normalizedId.substring(
                7
            );

    }

    if (
        !normalizedId ||
        normalizedId.toLowerCase() ===
        "coordinator"
    ) {

        return null;

    }

    const leaderSources = [
        JSON.parse(
            localStorage.getItem(
                "cmsCellLeaders"
            ) || "[]"
        ),
        JSON.parse(
            localStorage.getItem(
                "cmsLeaders"
            ) || "[]"
        )
    ];

    for (
        const source of leaderSources
    ) {

        const leader =
            Array.isArray(source)
                ? source.find(
                    function(item) {

                        return (
                            String(
                                item?.id ||
                                ""
                            )
                            .trim() ===
                            String(
                                normalizedId
                            )
                            .trim()
                        );

                    }
                )
                : null;

        if (
            leader
        ) {

            return leader;

        }

    }

    return null;

}


function looksLikeUUID(
    value
) {

    if (
        typeof value !== "string"
    ) {

        return false;

    }

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value.trim()
    );

}


function findLeaderByStoredValue(
    value
) {

    if (
        !value
    ) {

        return null;

    }

    const rawValue =
        String(
            value
        )
        .trim();

    if (
        !rawValue
    ) {

        return null;

    }

    const sources = [
        JSON.parse(
            localStorage.getItem(
                "cmsCellLeaders"
            ) || "[]"
        ),
        JSON.parse(
            localStorage.getItem(
                "cmsLeaders"
            ) || "[]"
        )
    ];

    for (
        const source of sources
    ) {

        const items =
            Array.isArray(
                source
            )
                ? source
                : [];

        const match =
            items.find(
                function(item) {

                    return (
                        String(
                            item?.id ||
                            ""
                        )
                        .trim() ===
                        rawValue ||

                        String(
                            item?.auth_user_id ||
                            item?.authUserId ||
                            ""
                        )
                        .trim() ===
                        rawValue ||

                        String(
                            item?.profile_id ||
                            item?.profileId ||
                            ""
                        )
                        .trim() ===
                        rawValue ||

                        String(
                            item?.user_id ||
                            item?.userId ||
                            ""
                        )
                        .trim() ===
                        rawValue ||

                        String(
                            item?.full_name ||
                            item?.fullName ||
                            item?.leaderName ||
                            item?.name ||
                            ""
                        )
                        .trim() ===
                        rawValue
                    );

                }
            );

        if (
            match
        ) {

            return match;

        }

    }

    return null;

}


function resolveAssignedToName(
    assignedTo,
    fallbackName = ""
) {

    const cleanFallback =
        typeof fallbackName === "string"
            ? fallbackName.trim()
            : "";

    const valueToResolve =
        assignedTo !== undefined &&
        assignedTo !== null &&
        String(
            assignedTo
        ).trim() !== ""
            ? String(
                assignedTo
            ).trim()
            : "";

    if (
        valueToResolve &&
        (
            valueToResolve.toLowerCase() ===
            "coordinator" ||
            valueToResolve.toLowerCase().includes(
                "coordinator"
            ) ||
            (
                window.cmsFollowUpsCoordinatorProfileId &&
                String(
                    window.cmsFollowUpsCoordinatorProfileId
                )
                .toLowerCase() ===
                valueToResolve.toLowerCase()
            )
        )
    ) {

        return "Coordinator";

    }

    if (
        valueToResolve &&
        /^unknown(?:\s+(?:member|leader|cell))?$/i.test(
            valueToResolve
        )
    ) {

        return "Cell Leader";

    }

    const leaderId =
        valueToResolve.startsWith(
            "leader:"
        )
            ? valueToResolve.substring(7)
            : valueToResolve;

    const leader =
        getLeaderById(
            leaderId
        ) ||
        findLeaderByStoredValue(
            leaderId
        );

    if (
        leader
    ) {

        return (
            leader.name ||
            leader.fullName ||
            leader.leaderName ||
            leader.full_name ||
            "Cell Leader"
        );

    }

    if (
        cleanFallback &&
        !looksLikeUUID(
            cleanFallback
        ) &&
        !/^unknown(?:\s+(?:member|leader|cell))?$/i.test(
            cleanFallback
        )
    ) {

        if (
            /coordinator/i.test(
                cleanFallback
            )
        ) {

            return "Coordinator";

        }

        return cleanFallback;

    }

    if (
        !valueToResolve &&
        looksLikeUUID(
            cleanFallback
        )
    ) {

        valueToResolve =
            cleanFallback;

    }

    const uuidCandidate =
        looksLikeUUID(
            valueToResolve
        )
            ? valueToResolve
            : (
                looksLikeUUID(
                    cleanFallback
                )
                    ? cleanFallback
                    : ""
            );

    if (
        uuidCandidate
    ) {

        const storedLeader =
            findLeaderByStoredValue(
                uuidCandidate
            );

        if (
            storedLeader
        ) {

            return (
                storedLeader.name ||
                storedLeader.fullName ||
                storedLeader.leaderName ||
                storedLeader.full_name ||
                "Cell Leader"
            );

        }

        return "Cell Leader";

    }

    if (
        !valueToResolve
    ) {

        return (
            cleanFallback ||
            "—"
        );

    }

    return (
        cleanFallback ||
        "—"
    );

}


/* =====================================================
   MEMBER BY ID
   ===================================================== */

function getMemberById(
    memberId
) {

    if (
        !memberId
    ) {

        return null;

    }


    const normalizedId =
        String(
            memberId
        )
        .trim();


    return (
        members.find(
            function(member) {

                return (
                    String(
                        member?.id ||
                        ""
                    )
                    .trim() ===
                    normalizedId
                );

            }
        ) ||
        null
    );

}


/* =====================================================
   MEMBER FULL NAME
   ===================================================== */

function memberFullName(
    member
) {

    if (
        !member
    ) {

        return "";

    }

    const candidate =
        member.name ||

        member.fullName ||

        member.memberName ||

        [
            member.first_name,
            member.last_name
        ]
        .filter(
            Boolean
        )
        .join(" ")

    if (
        typeof candidate === "string" &&
        /^unknown(?:\s+(?:member|leader|cell))?$/i.test(candidate.trim())
    ) {

        return "";

    }

    return String(candidate || "").trim();

}


/* =====================================================
   BUILD MEMBER ENTRY
   ===================================================== */

function buildMemberEntry(
    entry
) {

    const memberId =

        entry?.memberId ||

        entry?.member_id ||

        entry?.memberID ||

        null;


    const member =
        getMemberById(
            memberId
        );


    const directNameCandidate =
        entry?.name ||
        entry?.fullName ||
        entry?.full_name ||
        entry?.memberName ||
        entry?.member_name;

    const resolvedName =

        memberFullName(
            member
        )

        ||

        (
            typeof directNameCandidate === "string" &&
            !/^unknown(?:\s+(?:member|leader|cell))?$/i.test(directNameCandidate.trim())
                ? directNameCandidate
                : ""
        )

        ||

        (
            memberId
                ? `Member ${memberId}`
                : "Registered Member"
        );


    const resolvedPhone =

        member?.phone

        ||

        member?.phoneNumber

        ||

        member?.telephone

        ||

        member?.mobile

        ||

        entry?.phone

        ||

        entry?.phoneNumber

        ||

        "—";


    const resolvedYear =

        member?.year

        ||

        member?.yearOfStudy

        ||

        member?.year_of_study

        ||

        entry?.year

        ||

        entry?.yearOfStudy

        ||

        entry?.year_of_study

        ||

        "—";


    const resolvedCombination =

        member?.combination

        ||

        entry?.combination

        ||

        "—";


    return {

        memberId:
            memberId ||
            "",

        name:
            resolvedName,

        phone:
            resolvedPhone,

        year:
            resolvedYear,

        combination:
            resolvedCombination,

        status:
            entry?.status ||

            entry?.attendance_status ||

            "—",

        type:
            "Member"

    };

}


/* =====================================================
   BUILD VISITOR ENTRY
   ===================================================== */

function buildVisitorEntry(
    visitor
) {

    return {

        id:
            visitor?.id ||
            "",

        name:
            visitor?.name ||

            visitor?.fullName ||

            visitor?.full_name ||

            visitor?.memberName ||

            "Visitor",

        phone:
            visitor?.phone ||

            visitor?.phoneNumber ||

            visitor?.telephone ||

            visitor?.mobile ||

            "—",

        year:
            visitor?.year ||

            visitor?.yearOfStudy ||

            visitor?.year_of_study ||

            "—",

        combination:
            visitor?.combination ||

            "—",

        association:
            visitor?.association ||

            visitor?.belongsTo ||

            visitor?.belongs_to ||

            "—",

        status:
            visitor?.status ||

            visitor?.attendance_status ||

            "—",

        type:
            "Visitor / Newcomer"

    };

}


/* =====================================================
   NORMALIZE STATUS
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
   NORMALIZE ATTENDANCE
   ===================================================== */

function normalizeAttendance(
    record
) {

    const date =

        record?.date ||

        record?.meetingDate ||

        record?.attendanceDate ||

        record?.createdAt ||

        record?.meeting_date ||

        "";


    const cellId =

        record?.cellId ||

        record?.cell ||

        record?.cell_id ||

        "";


    const cellName =

        record?.cellName ||

        getCellName(
            cellId
        );


    const rawMembers =

        record?.members ||

        record?.entries ||

        record?.attendance ||

        record?.records ||

        [];


    const memberEntries =

        Array.isArray(
            rawMembers
        )

            ? rawMembers

                .filter(
                    function(entry) {

                        return !(
                            entry?.type ===
                                "visitor"

                            ||

                            entry?.type ===
                                "newcomer"

                            ||

                            entry?.isVisitor ===
                                true

                            ||

                            entry?.isNewcomer ===
                                true
                        );

                    }
                )

                .map(
                    buildMemberEntry
                )

            : [];


    const visitors =

        Array.isArray(
            record?.visitors
        )

            ? record.visitors
                .map(
                    buildVisitorEntry
                )

            : [];


    const entries = [

        ...memberEntries,

        ...visitors

    ];


    let present =
        0;


    let absent =
        0;


    let excused =
        0;


    let late =
        0;


    memberEntries.forEach(
        function(entry) {

            const s =
                normalizeStatus(
                    entry.status
                );


            if (
                s ===
                "present"
            ) {

                present++;

            }

            else if (
                s ===
                "absent"
            ) {

                absent++;

            }

            else if (
                s ===
                "excused"
            ) {

                excused++;

            }

            else if (
                s ===
                "late"
            ) {

                late++;

            }

        }
    );


    visitors.forEach(
        function(entry) {

            const s =
                normalizeStatus(
                    entry.status
                );


            if (
                s ===
                "present"
            ) {

                present++;

            }

            else if (
                s ===
                "absent"
            ) {

                absent++;

            }

            else if (
                s ===
                "late"
            ) {

                late++;

            }

        }
    );


    const totalMembers =
        memberEntries.length;


    const visitorTotal =
        visitors.length;


    const total =
        totalMembers +
        visitorTotal;


    const attendanceRate =
        total
            ? Math.round(
                (
                    (
                        present +
                        late
                    )
                    /
                    total
                ) *
                100
            )
            : 0;


    return {

        type:
            "attendance",

        original:
            record,

        id:
            record?.id ||
            `attendance-${Date.now()}`,

        date,

        cellId,

        cellName,

        entries,

        memberEntries,

        visitors:
            visitorTotal,

        present,

        absent,

        excused,

        late,

        totalMembers,

        attendanceRate

    };

}


/* =====================================================
   NORMALIZE REPORT
   ===================================================== */

function normalizeReport(
    report
) {

    const date =

        report?.date ||

        report?.reportDate ||

        report?.report_date ||

        report?.createdAt ||

        report?.created_at ||

        "";


    const cellId =

        report?.cellId ||

        report?.cell ||

        report?.cell_id ||

        "";


    return {

        type:
            "report",

        original:
            report,

        id:
            report?.id ||
            `report-${Date.now()}`,

        date,

        cellId,

        cellName:
            report?.cellName ||
            getCellName(
                cellId
            ),

        meetingLocation:
            report?.meetingLocation ||

            report?.meeting_location ||

            report?.location ||

            "—",

        status:
            report?.status ||

            "Draft",

        attendance:
            report?.attendance ||

            report?.attendanceSummary ||

            "—",

        membersLife:
            report?.membersLife ||

            report?.members_life ||

            report?.life ||

            "—",

        activityDone:
            report?.activityDone ||

            report?.activity_done ||

            report?.activity ||

            "—",

        challenges:
            report?.challenges ||

            report?.challengesNeeds ||

            report?.challenges_needs ||

            "—",

        followUp:
            report?.followUpNeeded ||

            report?.followUp ||

            report?.follow_up_needed ||

            "—",

        nextWeekPlan:
            report?.nextWeekPlan ||

            report?.next_week_plan ||

            "—",

        comments:
            report?.additionalComments ||

            report?.additional_comments ||

            report?.comments ||

            "—",

        createdAt:
            report?.createdAt ||

            report?.created_at ||

            "",

        updatedAt:
            report?.updatedAt ||

            report?.updated_at ||

            "",

        submittedAt:
            report?.submittedAt ||

            report?.submitted_at ||

            ""

    };

}


/* =====================================================
   NORMALIZE FOLLOW-UP
   ===================================================== */

function normalizeFollowUp(
    followUp
) {

    const date =

        followUp?.followUpDate ||

        followUp?.date ||

        followUp?.due_date ||

        followUp?.createdAt ||

        followUp?.created_at ||

        "";


    const cellId =

        followUp?.cellId ||

        followUp?.cell ||

        followUp?.cell_id ||

        "";


    const memberId =

        followUp?.memberId ||

        followUp?.member_id ||

        "";


    const member =
        getMemberById(
            memberId
        );


    const directMemberName =
        followUp?.memberName ||
        followUp?.member_name ||
        followUp?.name ||
        followUp?.fullName ||
        followUp?.full_name;

    const memberName =

        (
            typeof directMemberName === "string" &&
            !/^unknown(?:\s+(?:member|leader|cell))?$/i.test(directMemberName.trim())
                ? directMemberName
                : ""
        ) ||

        memberFullName(
            member
        ) ||

        (
            memberId
                ? `Member ${memberId}`
                : "Registered Member"
        );


    return {

        type:
            "followup",

        original:
            followUp,

        id:
            followUp?.id ||
            `followup-${Date.now()}`,

        date,

        cellId,

        cellName:
            followUp?.cellName ||
            getCellName(
                cellId
            ),

        memberId,

        memberName,

        memberPhone:
            member?.phone ||

            followUp?.memberPhone ||

            followUp?.member_phone ||

            "—",

        assignedTo:
            followUp?.assignedTo ||

            followUp?.assigned_to ||

            "",

        assignedToName:
            resolveAssignedToName(
                followUp?.assignedTo ||
                followUp?.assigned_to,
                followUp?.assignedToName ||
                followUp?.assigned_to_name
            ) ||

            "—",

        reason:
            followUp?.reason ||

            followUp?.subject ||

            "—",

        details:
            followUp?.details ||

            followUp?.description ||

            "—",

        priority:
            followUp?.priority ||

            "—",

        status:
            followUp?.status ||

            "—",

        actionTaken:
            followUp?.actionTaken ||

            followUp?.action_taken ||

            "—",

        nextAction:
            followUp?.nextAction ||

            followUp?.next_action ||

            "—"

    };

}


/* =====================================================
   NORMALIZE EVANGELISM
   ===================================================== */

function normalizeEvangelism(
    record
) {

    const date =

        record?.date ||

        record?.evangelismDate ||

        record?.evangelism_date ||

        record?.createdAt ||

        record?.created_at ||

        "";


    const cellId =

        record?.cellId ||

        record?.cell ||

        record?.cell_id ||

        "";


    const people =
        Array.isArray(
            record?.people
        )
            ? record.people
            : [];


    return {

        type:
            "evangelism",

        original:
            record,

        id:
            record?.id ||
            `evangelism-${Date.now()}`,

        date,

        cellId,

        cellName:
            record?.cellName ||
            getCellName(
                cellId
            ),

        leaderId:
            record?.leaderId ||

            record?.leader_id ||

            record?.recordedBy ||

            "",

        leaderName:
            record?.leaderName ||

            record?.recordedByName ||

            "—",

        evangelismType:
            record?.evangelismType ||

            record?.evangelism_type ||

            "—",

        location:
            record?.location ||

            "—",

        peopleReached:
            Number(
                record?.peopleReached ??
                record?.people_reached
            ) ||
            0,

        newPeople:
            Number(
                record?.newPeople ??
                record?.new_people
            ) ||
            0,

        saved:
            Number(
                record?.saved
            ) ||
            0,

        inProgress:
            Number(
                record?.inProgress ??
                record?.in_progress
            ) ||
            0,

        interested:
            Number(
                record?.interested
            ) ||
            0,

        followUpNeeded:
            Number(
                record?.followUpNeeded ??
                record?.follow_up_needed
            ) ||
            0,

        notYet:
            Number(
                record?.notYet ??
                record?.not_yet
            ) ||
            0,

        people,

        details:
            record?.details ||

            record?.description ||

            record?.notes ||

            "—",

        nextAction:
            record?.nextAction ||

            record?.next_action ||

            "—"

    };

}


/* =====================================================
   NORMALIZE VISITOR
   ===================================================== */

function normalizeVisitor(
    visitor
) {

    const cellId =

        visitor?.cell_id ||

        visitor?.cellId ||

        "";


    const cellName =

        visitor?.cellName ||

        getCellName(
            cellId
        );


    return {

        type:
            "visitor",

        original:
            visitor,

        id:
            visitor?.id ||
            "",

        date:

            visitor?.last_visit_date ||

            visitor?.lastVisitDate ||

            visitor?.first_visit_date ||

            visitor?.firstVisitDate ||

            visitor?.created_at ||

            "",

        cellId,

        cellName,

        name:

            visitor?.full_name ||

            visitor?.fullName ||

            visitor?.name ||

            "Unknown visitor",

        phone:

            visitor?.phone ||

            "—",

        year:

            visitor?.year_of_study ||

            visitor?.yearOfStudy ||

            visitor?.year ||

            "—",

        combination:

            visitor?.combination ||

            "—",

        association:

            visitor?.association ||

            "—",

        firstVisit:

            visitor?.first_visit_date ||

            visitor?.firstVisitDate ||

            "",

        lastVisit:

            visitor?.last_visit_date ||

            visitor?.lastVisitDate ||

            "",

        visitCount:

            Number(
                visitor?.visit_count ??
                visitor?.visitCount ??
                0
            ),

        convertedToMember:

            visitor?.converted_to_member ===
                true

            ||

            visitor?.convertedToMember ===
                true

    };

}


/* =====================================================
   ALL RECORDS
   ===================================================== */

function getAllRecords() {

    return [

        ...attendanceRecords.map(
            normalizeAttendance
        ),

        ...weeklyReports.map(
            normalizeReport
        ),

        ...followUps.map(
            normalizeFollowUp
        ),

        ...evangelismRecords.map(
            normalizeEvangelism
        ),

        ...visitorRecords.map(
            normalizeVisitor
        )

    ];

}


/* =====================================================
   FILTER
   ===================================================== */

function getFilteredRecords() {

    let records =
        getAllRecords();


    if (
        currentType !==
        "all"
    ) {

        records =
            records.filter(
                function(record) {

                    return (
                        record.type ===
                        currentType
                    );

                }
            );

    }


    const search =
        recordSearch
            ? recordSearch.value
                .trim()
                .toLowerCase()

            : "";


    if (
        search
    ) {

        records =
            records.filter(
                function(record) {

                    return (

                        String(
                            record.cellName ||
                            ""
                        )
                        .toLowerCase()
                        .includes(
                            search
                        )

                        ||

                        String(
                            record.date ||
                            ""
                        )
                        .toLowerCase()
                        .includes(
                            search
                        )

                        ||

                        String(
                            getTypeLabel(
                                record.type
                            )
                        )
                        .toLowerCase()
                        .includes(
                            search
                        )

                        ||

                        JSON.stringify(
                            record.original ||
                            record
                        )
                        .toLowerCase()
                        .includes(
                            search
                        )

                    );

                }
            );

    }


    const selectedDate =
        recordDate
            ? recordDate.value
            : "";


    if (
        selectedDate
    ) {

        records =
            records.filter(
                function(record) {

                    return String(
                        record.date ||
                        ""
                    )
                    .startsWith(
                        selectedDate
                    );

                }
            );

    }


    records.sort(
        function(a, b) {

            return (

                new Date(
                    b.date ||
                    0
                )

                -

                new Date(
                    a.date ||
                    0
                )

            );

        }
    );


    return records;

}


/* =====================================================
   TYPE LABEL
   ===================================================== */

function getTypeLabel(
    type
) {

    if (
        type ===
        "attendance"
    ) {

        return "Attendance";

    }


    if (
        type ===
        "report"
    ) {

        return "Weekly Report";

    }


    if (
        type ===
        "followup"
    ) {

        return "Follow-up";

    }


    if (
        type ===
        "evangelism"
    ) {

        return "Evangelism";

    }


    if (
        type ===
        "visitor"
    ) {

        return "Visitors";

    }


    return "Record";

}


/* =====================================================
   TYPE CLASS
   ===================================================== */

function getTypeClass(
    type
) {

    return `type-${type}`;

}


/* =====================================================
   FORMAT DATE
   ===================================================== */

function formatDate(
    date
) {

    if (
        !date
    ) {

        return "—";

    }


    const d =
        new Date(
            date
        );


    if (
        Number.isNaN(
            d.getTime()
        )
    ) {

        return String(
            date
        );

    }


    return d.toLocaleDateString(
        "en-GB"
    );

}


/* =====================================================
   DISPLAY VALUE
   ===================================================== */

function displayValue(
    value
) {

    if (
        value ===
            null ||

        value ===
            undefined ||

        String(
            value
        )
        .trim() ===
            ""
    ) {

        return "—";

    }


    return String(
        value
    )
    .trim();

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
   RENDER RECORDS
   ===================================================== */

function renderRecords() {

    if (
        !recordsTableBody
    ) {

        return;

    }


    const records =
        getFilteredRecords();


    recordsTableBody.innerHTML =
        "";


    if (
        recordCountText
    ) {

        recordCountText.textContent =

            `${records.length} record${
                records.length ===
                1
                    ? ""
                    : "s"
            }`;

    }


    if (
        !records.length
    ) {

        recordsTableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-records"
                >

                    No saved records found.

                </td>

            </tr>

        `;


        return;

    }


    records.forEach(
        function(record) {

            const row =
                document.createElement(
                    "tr"
                );


            let summary =
                "Saved";


            let status =
                "Saved";


            /* =================================
               ATTENDANCE
               ================================= */

            if (
                record.type ===
                "attendance"
            ) {

                summary =

                    `${record.present} present / ` +

                    `${record.totalMembers} total — ` +

                    `${record.attendanceRate}%`;


                status =
                    "Saved";

            }


            /* =================================
               WEEKLY REPORT
               ================================= */

            else if (
                record.type ===
                "report"
            ) {

                summary =
                    record.activityDone ||
                    "Weekly cell report";


                status =
                    record.status;

            }


            /* =================================
               FOLLOW-UP
               ================================= */

            else if (
                record.type ===
                "followup"
            ) {

                summary =

                    `${displayValue(
                        record.memberName
                    )} — ` +

                    `${displayValue(
                        record.priority
                    )}`;


                status =
                    record.status;

            }


            /* =================================
               EVANGELISM
               ================================= */

            else if (
                record.type ===
                "evangelism"
            ) {

                summary =

                    `${record.peopleReached} reached — ` +

                    `${record.saved} saved`;


                status =
                    "Saved";

            }


            /* =================================
               VISITOR
               ================================= */

            else if (
                record.type ===
                "visitor"
            ) {

                summary =

                    `${displayValue(
                        record.phone
                    )} • ` +

                    `${record.visitCount} visit${
                        Number(
                            record.visitCount
                        ) === 1
                            ? ""
                            : "s"
                    }`;


                status =
                    record.convertedToMember
                        ? "Converted to Member"
                        : "Visitor";

            }


            row.innerHTML = `

                <td>

                    <span
                        class="record-type ${getTypeClass(
                            record.type
                        )}"
                    >

                        ${escapeHTML(
                            getTypeLabel(
                                record.type
                            )
                        )}

                    </span>

                </td>


                <td>

                    ${escapeHTML(
                        formatDate(
                            record.date
                        )
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        displayValue(
                            record.cellName
                        )
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        displayValue(
                            summary
                        )
                    )}

                </td>


                <td>

                    <span
                        class="record-status"
                    >

                        ${escapeHTML(
                            displayValue(
                                status
                            )
                        )}

                    </span>

                </td>


                <td>

                    <button
                        type="button"
                        class="record-action view-action"
                        onclick="viewRecord(
                            '${record.type}',
                            '${escapeHTML(
                                String(
                                    record.id
                                )
                            )}'
                        )"
                    >
                        View
                    </button>


                    <button
                        type="button"
                        class="record-action download-action"
                        onclick="downloadRecord(
                            '${record.type}',
                            '${escapeHTML(
                                String(
                                    record.id
                                )
                            )}'
                        )"
                    >
                        Download
                    </button>


                    ${
                        record.type ===
                        "visitor"

                            ? ""

                            : `

                                <button
                                    type="button"
                                    class="record-action delete-action"
                                    onclick="deleteRecord(
                                        '${record.type}',
                                        '${escapeHTML(
                                            String(
                                                record.id
                                            )
                                        )}'
                                    )"
                                >
                                    Delete
                                </button>

                            `
                    }

                </td>

            `;


            recordsTableBody.appendChild(
                row
            );

        }
    );

}


/* =====================================================
   SUMMARY
   ===================================================== */

function updateSummary(
    filteredRecords =
        getFilteredRecords()
) {

    const allRecords =
        getAllRecords();


    const visitors =
        allRecords.filter(
            record =>
                record.type ===
                "visitor"
        );


    if (
        totalRecords
    ) {

        totalRecords.textContent =
            allRecords.length;

    }


    if (
        totalAttendance
    ) {

        totalAttendance.textContent =
            attendanceRecords.length;

    }


    if (
        totalReports
    ) {

        totalReports.textContent =
            weeklyReports.length;

    }


    if (
        totalFollowUps
    ) {

        totalFollowUps.textContent =
            followUps.length;

    }


    if (
        totalEvangelism
    ) {

        totalEvangelism.textContent =
            evangelismRecords.length;

    }


    if (
        totalVisitors
    ) {

        totalVisitors.textContent =
            visitors.length;

    }


    if (
        recordCountText
    ) {

        recordCountText.textContent =

            `${filteredRecords.length} record${
                filteredRecords.length ===
                1
                    ? ""
                    : "s"
            }`;

    }


    if (
        latestRecord
    ) {

        const sorted =
            allRecords
                .slice()
                .sort(
                    function(a, b) {

                        return (

                            new Date(
                                b.date ||
                                0
                            )

                            -

                            new Date(
                                a.date ||
                                0
                            )

                        );

                    }
                );


        const latest =
            sorted[0];


        latestRecord.textContent =

            latest

                ? formatDate(
                    latest.date
                )

                : "—";

    }

}


/* =====================================================
   FIND RECORD
   ===================================================== */

function findRecord(
    type,
    id
) {

    return getAllRecords()
        .find(
            function(record) {

                return (

                    record.type ===
                    type

                    &&

                    String(
                        record.id
                    ) ===
                    String(
                        id
                    )

                );

            }
        );

}


/* =====================================================
   VIEW RECORD
   ===================================================== */

function viewRecord(
    type,
    id
) {

    const record =
        findRecord(
            type,
            id
        );


    if (
        !record
    ) {

        alert(
            "Record could not be found."
        );


        return;

    }


    selectedRecord =
        record;


    if (
        type ===
        "attendance"
    ) {

        showAttendanceDetails(
            record
        );

    }


    else if (
        type ===
        "report"
    ) {

        showReportDetails(
            record
        );

    }


    else if (
        type ===
        "followup"
    ) {

        showFollowUpDetails(
            record
        );

    }


    else if (
        type ===
        "evangelism"
    ) {

        showEvangelismDetails(
            record
        );

    }


    else if (
        type ===
        "visitor"
    ) {

        showVisitorDetails(
            record
        );

    }


    if (
        recordModal
    ) {

        recordModal.classList.add(
            "show"
        );

    }

}


/* =====================================================
   ATTENDANCE DETAILS
   ===================================================== */

function showAttendanceDetails(
    record
) {

    if (
        modalRecordTitle
    ) {

        modalRecordTitle.textContent =
            "Attendance Record";

    }


    const entries = [];


    (
        record?.original?.members ||

        record?.original?.entries ||

        record?.original?.attendance ||

        record?.memberEntries ||

        []
    )
    .forEach(
        function(entry) {

            entries.push(
                buildMemberEntry(
                    entry
                )
            );

        }
    );


    (
        record?.original?.visitors ||
        []
    )
    .forEach(
        function(visitor) {

            entries.push(
                buildVisitorEntry(
                    visitor
                )
            );

        }
    );


    if (
        entries.length ===
        0
    ) {

        (
            record?.entries ||
            []
        )
        .forEach(
            function(entry) {

                entries.push(
                    entry.type ===
                        "Member"

                        ? buildMemberEntry(
                            entry
                        )

                        : buildVisitorEntry(
                            entry
                        )
                );

            }
        );

    }


    const memberRows =
        entries
            .map(
                function(entry) {

                    return `

                        <tr>

                            <td>

                                ${escapeHTML(
                                    displayValue(
                                        entry.name
                                    )
                                )}

                            </td>

                            <td>

                                ${escapeHTML(
                                    displayValue(
                                        entry.phone
                                    )
                                )}

                            </td>

                            <td>

                                ${escapeHTML(
                                    displayValue(
                                        entry.year
                                    )
                                )}

                            </td>

                            <td>

                                ${escapeHTML(
                                    displayValue(
                                        entry.combination
                                    )
                                )}

                            </td>

                            <td>

                                ${escapeHTML(
                                    displayValue(
                                        entry.association ||
                                        "—"
                                    )
                                )}

                            </td>

                            <td>

                                ${escapeHTML(
                                    displayValue(
                                        entry.status
                                    )
                                )}

                            </td>

                            <td>

                                ${escapeHTML(
                                    displayValue(
                                        entry.type
                                    )
                                )}

                            </td>

                        </tr>

                    `;

                }
            )
            .join(
                ""
            );


    if (
        recordDetails
    ) {

        recordDetails.innerHTML = `

            <div
                class="detail-section"
            >

                <h3>
                    Meeting Information
                </h3>


                <div
                    class="detail-grid"
                >

                    <div
                        class="detail-item"
                    >

                        <strong>
                            Cell
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.cellName
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Date
                        </strong>

                        ${escapeHTML(
                            formatDate(
                                record.date
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Total People
                        </strong>

                        ${
                            record.totalMembers +
                            record.visitors
                        }

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Attendance Rate
                        </strong>

                        ${record.attendanceRate}%

                    </div>

                </div>

            </div>


            <div
                class="detail-section"
            >

                <h3>
                    Attendance Summary
                </h3>


                <div
                    class="detail-grid"
                >

                    <div
                        class="detail-item"
                    >

                        <strong>
                            Present
                        </strong>

                        ${record.present}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Absent
                        </strong>

                        ${record.absent}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Excused
                        </strong>

                        ${record.excused}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Late
                        </strong>

                        ${record.late}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Visitors / Newcomers
                        </strong>

                        ${record.visitors}

                    </div>

                </div>

            </div>


            <div
                class="detail-section"
            >

                <h3>
                    Attendance Details
                </h3>


                <div
                    style="overflow-x:auto"
                >

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Person
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
                                    Type
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            ${
                                memberRows ||

                                `
                                    <tr>

                                        <td
                                            colspan="7"
                                        >
                                            No attendance details available.
                                        </td>

                                    </tr>
                                `
                            }

                        </tbody>

                    </table>

                </div>

            </div>

        `;

    }

}


/* =====================================================
   WEEKLY REPORT DETAILS
   ===================================================== */

function showReportDetails(
    record
) {

    if (
        modalRecordTitle
    ) {

        modalRecordTitle.textContent =
            "Weekly Report";

    }


    if (
        recordDetails
    ) {

        recordDetails.innerHTML = `

            <div
                class="detail-section"
            >

                <h3>
                    Report Information
                </h3>


                <div
                    class="detail-grid"
                >

                    <div
                        class="detail-item"
                    >

                        <strong>
                            Cell
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.cellName
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Date
                        </strong>

                        ${escapeHTML(
                            formatDate(
                                record.date
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Meeting Location
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.meetingLocation
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Status
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.status
                            )
                        )}

                    </div>

                </div>

            </div>


            <div
                class="detail-section"
            >

                <h3>
                    Attendance
                </h3>

                <p>

                    ${escapeHTML(
                        displayValue(
                            record.attendance
                        )
                    )}

                </p>

            </div>


            <div
                class="detail-section"
            >

                <h3>
                    Members' Life
                </h3>

                <p>

                    ${escapeHTML(
                        displayValue(
                            record.membersLife
                        )
                    )}

                </p>

            </div>


            <div
                class="detail-section"
            >

                <h3>
                    Activity Done
                </h3>

                <p>

                    ${escapeHTML(
                        displayValue(
                            record.activityDone
                        )
                    )}

                </p>

            </div>


            <div
                class="detail-section"
            >

                <h3>
                    Challenges / Needs
                </h3>

                <p>

                    ${escapeHTML(
                        displayValue(
                            record.challenges
                        )
                    )}

                </p>

            </div>


            <div
                class="detail-section"
            >

                <h3>
                    Follow-up Needed
                </h3>

                <p>

                    ${escapeHTML(
                        displayValue(
                            record.followUp
                        )
                    )}

                </p>

            </div>


            <div
                class="detail-section"
            >

                <h3>
                    Next Week's Plan
                </h3>

                <p>

                    ${escapeHTML(
                        displayValue(
                            record.nextWeekPlan
                        )
                    )}

                </p>

            </div>


            <div
                class="detail-section"
            >

                <h3>
                    Additional Comments
                </h3>

                <p>

                    ${escapeHTML(
                        displayValue(
                            record.comments
                        )
                    )}

                </p>

            </div>

        `;

    }

}


/* =====================================================
   FOLLOW-UP DETAILS
   ===================================================== */

function showFollowUpDetails(
    record
) {

    if (
        modalRecordTitle
    ) {

        modalRecordTitle.textContent =
            "Follow-up Record";

    }


    if (
        recordDetails
    ) {

        recordDetails.innerHTML = `

            <div
                class="detail-section"
            >

                <h3>
                    Follow-up Information
                </h3>


                <div
                    class="detail-grid"
                >

                    <div
                        class="detail-item"
                    >

                        <strong>
                            Cell
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.cellName
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Date
                        </strong>

                        ${escapeHTML(
                            formatDate(
                                record.date
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Member
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.memberName
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Phone
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.memberPhone
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Reason / Subject
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.reason
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Priority
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.priority
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Status
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.status
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Assigned To
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                resolveAssignedToName(
                                    record.assignedTo,
                                    record.assignedToName
                                )
                            )
                        )}

                    </div>

                </div>

            </div>


            <div
                class="detail-section"
            >

                <h3>
                    Details
                </h3>

                <p>

                    ${escapeHTML(
                        displayValue(
                            record.details
                        )
                    )}

                </p>

            </div>


            <div
                class="detail-section"
            >

                <h3>
                    Action Taken
                </h3>

                <p>

                    ${escapeHTML(
                        displayValue(
                            record.actionTaken
                        )
                    )}

                </p>

            </div>


            <div
                class="detail-section"
            >

                <h3>
                    Next Action
                </h3>

                <p>

                    ${escapeHTML(
                        displayValue(
                            record.nextAction
                        )
                    )}

                </p>

            </div>

        `;

    }

}


/* =====================================================
   EVANGELISM DETAILS
   ===================================================== */

function showEvangelismDetails(
    record
) {

    if (
        modalRecordTitle
    ) {

        modalRecordTitle.textContent =
            "Evangelism Record";

    }


    if (
        recordDetails
    ) {

        recordDetails.innerHTML = `

            <div
                class="detail-section"
            >

                <h3>
                    Evangelism Information
                </h3>


                <div
                    class="detail-grid"
                >

                    <div
                        class="detail-item"
                    >

                        <strong>
                            Cell
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.cellName
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Date
                        </strong>

                        ${escapeHTML(
                            formatDate(
                                record.date
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Leader
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.leaderName
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Type
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.evangelismType
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Location
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.location
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            People Reached
                        </strong>

                        ${record.peopleReached}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            New People
                        </strong>

                        ${record.newPeople}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Saved
                        </strong>

                        ${record.saved}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            In Progress
                        </strong>

                        ${record.inProgress}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Interested
                        </strong>

                        ${record.interested}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Follow-up Needed
                        </strong>

                        ${record.followUpNeeded}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Not Yet
                        </strong>

                        ${record.notYet}

                    </div>

                </div>

            </div>


            <div
                class="detail-section"
            >

                <h3>
                    Details
                </h3>

                <p>

                    ${escapeHTML(
                        displayValue(
                            record.details
                        )
                    )}

                </p>

            </div>


            <div
                class="detail-section"
            >

                <h3>
                    Next Action
                </h3>

                <p>

                    ${escapeHTML(
                        displayValue(
                            record.nextAction
                        )
                    )}

                </p>

            </div>

        `;

    }

}


/* =====================================================
   VISITOR DETAILS
   ===================================================== */

function showVisitorDetails(
    record
) {

    if (
        modalRecordTitle
    ) {

        modalRecordTitle.textContent =
            "Visitor Record";

    }


    const visits =

        visitorVisitRecords

            .filter(
                function(visit) {

                    return (
                        String(
                            visit?.visitor_id
                        ) ===
                        String(
                            record.id
                        )
                    );

                }
            )

            .sort(
                function(a, b) {

                    return (

                        new Date(
                            b.visit_date ||
                            0
                        )

                        -

                        new Date(
                            a.visit_date ||
                            0
                        )

                    );

                }
            );


    const visitRows =

        visits.length

            ?

                visits
                    .map(
                        function(visit) {

                            return `

                                <tr>

                                    <td>

                                        ${escapeHTML(
                                            formatDate(
                                                visit.visit_date
                                            )
                                        )}

                                    </td>


                                    <td>

                                        ${escapeHTML(
                                            displayValue(
                                                getCellName(
                                                    visit.cell_id
                                                )
                                            )
                                        )}

                                    </td>


                                    <td>

                                        ${escapeHTML(
                                            displayValue(
                                                visit.status
                                            )
                                        )}

                                    </td>

                                </tr>

                            `;

                        }
                    )
                    .join("")

            :

                `

                    <tr>

                        <td
                            colspan="3"
                        >

                            No visit history found.

                        </td>

                    </tr>

                `;


    if (
        recordDetails
    ) {

        recordDetails.innerHTML = `

            <div
                class="detail-section"
            >

                <h3>
                    Visitor Information
                </h3>


                <div
                    class="detail-grid"
                >

                    <div
                        class="detail-item"
                    >

                        <strong>
                            Name
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.name
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Phone
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.phone
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Year
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.year
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Combination
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.combination
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Association
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.association
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Cell
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.cellName
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            First Visit
                        </strong>

                        ${escapeHTML(
                            formatDate(
                                record.firstVisit
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Last Visit
                        </strong>

                        ${escapeHTML(
                            formatDate(
                                record.lastVisit
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Total Visits
                        </strong>

                        ${escapeHTML(
                            displayValue(
                                record.visitCount
                            )
                        )}

                    </div>


                    <div
                        class="detail-item"
                    >

                        <strong>
                            Status
                        </strong>

                        ${escapeHTML(
                            record.convertedToMember
                                ? "Converted to Member"
                                : "Visitor"
                        )}

                    </div>

                </div>

            </div>


            <div
                class="detail-section"
            >

                <h3>
                    Visit History
                </h3>


                <div
                    style="overflow-x:auto"
                >

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Date
                                </th>

                                <th>
                                    Cell
                                </th>

                                <th>
                                    Status
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            ${visitRows}

                        </tbody>

                    </table>

                </div>

            </div>

        `;

    }

}


/* =====================================================
   CLOSE MODAL
   ===================================================== */

function closeRecordsModal() {

    if (
        recordModal
    ) {

        recordModal.classList.remove(
            "show"
        );

    }


    selectedRecord =
        null;

}


if (
    closeRecordModal
) {

    closeRecordModal.addEventListener(
        "click",
        closeRecordsModal
    );

}


if (
    closeRecordButton
) {

    closeRecordButton.addEventListener(
        "click",
        closeRecordsModal
    );

}


if (
    recordModal
) {

    recordModal.addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                recordModal
            ) {

                closeRecordsModal();

            }

        }
    );

}


/* =====================================================
   CSV ESCAPE
   ===================================================== */

function csvEscape(
    value
) {

    const text =
        String(
            value ??
            ""
        );


    return `"${text.replace(
        /"/g,
        '""'
    )}"`;

}


/* =====================================================
   DOWNLOAD RECORD
   ===================================================== */

function downloadRecord(
    type,
    id
) {

    const record =
        findRecord(
            type,
            id
        );


    if (
        !record
    ) {

        alert(
            "Record could not be found."
        );


        return;

    }


    const rows = [];


    rows.push([
        "Record Type",
        getTypeLabel(
            record.type
        )
    ]);


    rows.push([
        "Cell",
        record.cellName
    ]);


    rows.push([
        "Date",
        formatDate(
            record.date
        )
    ]);


    if (
        type ===
        "attendance"
    ) {

        rows.push([
            "Total People",
            record.totalMembers +
            record.visitors
        ]);


        rows.push([
            "Present",
            record.present
        ]);


        rows.push([
            "Absent",
            record.absent
        ]);


        rows.push([
            "Excused",
            record.excused
        ]);


        rows.push([
            "Late",
            record.late
        ]);


        rows.push([
            "Visitors / Newcomers",
            record.visitors
        ]);


        rows.push([
            "Attendance Rate",
            `${record.attendanceRate}%`
        ]);


        rows.push([]);


        rows.push([
            "Person",
            "Phone",
            "Year",
            "Combination",
            "Association",
            "Status",
            "Type"
        ]);


        (
            record.entries ||
            []
        )
        .forEach(
            function(entry) {

                rows.push([

                    displayValue(
                        entry.name
                    ),

                    displayValue(
                        entry.phone
                    ),

                    displayValue(
                        entry.year
                    ),

                    displayValue(
                        entry.combination
                    ),

                    displayValue(
                        entry.association
                    ),

                    displayValue(
                        entry.status
                    ),

                    displayValue(
                        entry.type
                    )

                ]);

            }
        );

    }


    else if (
        type ===
        "report"
    ) {

        rows.push([
            "Status",
            record.status
        ]);


        rows.push([
            "Meeting Location",
            record.meetingLocation
        ]);


        rows.push([
            "Attendance",
            record.attendance
        ]);


        rows.push([
            "Members' Life",
            record.membersLife
        ]);


        rows.push([
            "Activity Done",
            record.activityDone
        ]);


        rows.push([
            "Challenges / Needs",
            record.challenges
        ]);


        rows.push([
            "Follow-up Needed",
            record.followUp
        ]);


        rows.push([
            "Next Week's Plan",
            record.nextWeekPlan
        ]);


        rows.push([
            "Additional Comments",
            record.comments
        ]);

    }


    else if (
        type ===
        "followup"
    ) {

        rows.push([
            "Member",
            record.memberName
        ]);


        rows.push([
            "Phone",
            record.memberPhone
        ]);


        rows.push([
            "Reason",
            record.reason
        ]);


        rows.push([
            "Priority",
            record.priority
        ]);


        rows.push([
            "Status",
            record.status
        ]);


        rows.push([
            "Assigned To",
            resolveAssignedToName(
                record.assignedTo,
                record.assignedToName
            )
        ]);


        rows.push([
            "Details",
            record.details
        ]);


        rows.push([
            "Action Taken",
            record.actionTaken
        ]);


        rows.push([
            "Next Action",
            record.nextAction
        ]);

    }


    else if (
        type ===
        "evangelism"
    ) {

        rows.push([
            "Leader",
            record.leaderName
        ]);


        rows.push([
            "Type",
            record.evangelismType
        ]);


        rows.push([
            "Location",
            record.location
        ]);


        rows.push([
            "People Reached",
            record.peopleReached
        ]);


        rows.push([
            "New People",
            record.newPeople
        ]);


        rows.push([
            "Saved",
            record.saved
        ]);


        rows.push([
            "In Progress",
            record.inProgress
        ]);


        rows.push([
            "Interested",
            record.interested
        ]);


        rows.push([
            "Follow-up Needed",
            record.followUpNeeded
        ]);


        rows.push([
            "Not Yet",
            record.notYet
        ]);


        rows.push([
            "Details",
            record.details
        ]);


        rows.push([
            "Next Action",
            record.nextAction
        ]);

    }


    else if (
        type ===
        "visitor"
    ) {

        rows.push([
            "Name",
            record.name
        ]);


        rows.push([
            "Phone",
            record.phone
        ]);


        rows.push([
            "Year",
            record.year
        ]);


        rows.push([
            "Combination",
            record.combination
        ]);


        rows.push([
            "Association",
            record.association
        ]);


        rows.push([
            "First Visit",
            formatDate(
                record.firstVisit
            )
        ]);


        rows.push([
            "Last Visit",
            formatDate(
                record.lastVisit
            )
        ]);


        rows.push([
            "Total Visits",
            record.visitCount
        ]);


        rows.push([
            "Status",
            record.convertedToMember
                ? "Converted to Member"
                : "Visitor"
        ]);


        rows.push([]);


        rows.push([
            "Visit Date",
            "Cell",
            "Status"
        ]);


        const visits =

            visitorVisitRecords

                .filter(
                    function(visit) {

                        return (
                            String(
                                visit?.visitor_id
                            ) ===
                            String(
                                record.id
                            )
                        );

                    }
                )

                .sort(
                    function(a, b) {

                        return (

                            new Date(
                                b.visit_date ||
                                0
                            )

                            -

                            new Date(
                                a.visit_date ||
                                0
                            )

                        );

                    }
                );


        visits.forEach(
            function(visit) {

                rows.push([

                    formatDate(
                        visit.visit_date
                    ),

                    getCellName(
                        visit.cell_id
                    ),

                    displayValue(
                        visit.status
                    )

                ]);

            }
        );

    }


    const csv =

        rows

            .map(
                function(row) {

                    return row
                        .map(
                            csvEscape
                        )
                        .join(",");

                }
            )

            .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
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


    const safeDate =

        String(
            record.date ||
            "record"
        )
        .replace(
            /[^a-zA-Z0-9-_]/g,
            "-"
        );


    link.href =
        url;


    link.download =

        `CMS_${getTypeLabel(
            type
        )
        .replace(
            /[^a-z0-9]+/gi,
            "_"
        )}_${safeDate}.csv`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );

}


/* =====================================================
   PRINT RECORD
   ===================================================== */

function printRecord(
    type,
    id
) {

    const record =
        findRecord(
            type,
            id
        );


    if (
        !record
    ) {

        alert(
            "Record could not be found."
        );


        return;

    }


    const win =
        window.open(
            "",
            "_blank",
            "width=1000,height=800"
        );


    if (
        !win
    ) {

        alert(
            "Please allow pop-ups to print this record."
        );


        return;

    }


    function printField(
        label,
        value
    ) {

        return `

            <p>

                <strong>
                    ${escapeHTML(
                        label
                    )}:
                </strong>

                ${escapeHTML(
                    displayValue(
                        value
                    )
                )}

            </p>

        `;

    }


    let content =
        "";


    if (
        type ===
        "attendance"
    ) {

        const rows =

            (
                record.entries ||
                []
            )
            .map(
                function(entry) {

                    return `

                        <tr>

                            <td>
                                ${escapeHTML(
                                    entry.name
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    entry.phone
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    entry.year
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    entry.combination
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    entry.association ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    entry.status
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    entry.type
                                )}
                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


        content = `

            <h1>
                Attendance Record
            </h1>

            <p>
                <b>Cell:</b>
                ${escapeHTML(
                    record.cellName
                )}
            </p>

            <p>
                <b>Date:</b>
                ${escapeHTML(
                    formatDate(
                        record.date
                    )
                )}
            </p>

            <p>
                <b>Attendance Rate:</b>
                ${record.attendanceRate}%
            </p>

            <table>

                <thead>

                    <tr>

                        <th>
                            Person
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
                            Type
                        </th>

                    </tr>

                </thead>

                <tbody>

                    ${rows}

                </tbody>

            </table>

        `;

    }


    else if (
        type ===
        "visitor"
    ) {

        const visitRows =

            visitorVisitRecords

                .filter(
                    function(visit) {

                        return (
                            String(
                                visit?.visitor_id
                            ) ===
                            String(
                                record.id
                            )
                        );

                    }
                )

                .sort(
                    function(a, b) {

                        return (

                            new Date(
                                b.visit_date ||
                                0
                            )

                            -

                            new Date(
                                a.visit_date ||
                                0
                            )

                        );

                    }
                )

                .map(
                    function(visit) {

                        return `

                            <tr>

                                <td>

                                    ${escapeHTML(
                                        formatDate(
                                            visit.visit_date
                                        )
                                    )}

                                </td>


                                <td>

                                    ${escapeHTML(
                                        getCellName(
                                            visit.cell_id
                                        )
                                    )}

                                </td>


                                <td>

                                    ${escapeHTML(
                                        displayValue(
                                            visit.status
                                        )
                                    )}

                                </td>

                            </tr>

                        `;

                    }
                )

                .join("");


        content = `

            <h1>
                Visitor Record
            </h1>


            ${printField(
                "Name",
                record.name
            )}


            ${printField(
                "Phone",
                record.phone
            )}


            ${printField(
                "Year",
                record.year
            )}


            ${printField(
                "Combination",
                record.combination
            )}


            ${printField(
                "Association",
                record.association
            )}


            ${printField(
                "Cell",
                record.cellName
            )}


            ${printField(
                "First Visit",
                formatDate(
                    record.firstVisit
                )
            )}


            ${printField(
                "Last Visit",
                formatDate(
                    record.lastVisit
                )
            )}


            ${printField(
                "Total Visits",
                record.visitCount
            )}


            ${printField(
                "Status",
                record.convertedToMember
                    ? "Converted to Member"
                    : "Visitor"
            )}


            <h2>
                Visit History
            </h2>


            <table>

                <thead>

                    <tr>

                        <th>
                            Date
                        </th>

                        <th>
                            Cell
                        </th>

                        <th>
                            Status
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        visitRows ||

                        `
                            <tr>

                                <td
                                    colspan="3"
                                >
                                    No visit history found.
                                </td>

                            </tr>
                        `
                    }

                </tbody>

            </table>

        `;

    }


    else {

        content = `

            <h1>
                ${escapeHTML(
                    getTypeLabel(
                        type
                    )
                )}
            </h1>


            <p>

                <strong>
                    Cell:
                </strong>

                ${escapeHTML(
                    record.cellName
                )}

            </p>


            <p>

                <strong>
                    Date:
                </strong>

                ${escapeHTML(
                    formatDate(
                        record.date
                    )
                )}

            </p>


            <pre>
${escapeHTML(
    JSON.stringify(
        record.original,
        null,
        2
    )
)}
            </pre>

        `;

    }


    win.document.write(`

        <!DOCTYPE html>

        <html>

            <head>

                <title>

                    CMS -
                    ${escapeHTML(
                        getTypeLabel(
                            type
                        )
                    )}

                </title>


                <style>

                    body {

                        font-family:
                            Arial,
                            sans-serif;

                        padding:
                            30px;

                        color:
                            #222;

                    }


                    table {

                        width:
                            100%;

                        border-collapse:
                            collapse;

                    }


                    th,
                    td {

                        border:
                            1px solid #ccc;

                        padding:
                            8px;

                        text-align:
                            left;

                        vertical-align:
                            top;

                    }


                    th {

                        background:
                            #f1f3f6;

                    }


                    pre {

                        white-space:
                            pre-wrap;

                    }

                </style>

            </head>


            <body>

                ${content}


                <script>

                    window.onload =
                        function() {

                            window.print();

                        };

                <\/script>

            </body>

        </html>

    `);


    win.document.close();

}


/* =====================================================
   MODAL DOWNLOAD
   ===================================================== */

if (
    downloadRecordButton
) {

    downloadRecordButton.addEventListener(
        "click",
        function() {

            if (
                selectedRecord
            ) {

                downloadRecord(
                    selectedRecord.type,
                    selectedRecord.id
                );

            }

        }
    );

}


/* =====================================================
   MODAL PRINT
   ===================================================== */

if (
    printRecordButton
) {

    printRecordButton.addEventListener(
        "click",
        function() {

            if (
                selectedRecord
            ) {

                printRecord(
                    selectedRecord.type,
                    selectedRecord.id
                );

            }

        }
    );

}


/* =====================================================
   PRINT PAGE
   ===================================================== */

if (
    printButton
) {

    printButton.addEventListener(
        "click",
        function() {

            window.print();

        }
    );

}


/* =====================================================
   LOCAL SAVE HELPERS
   ===================================================== */

function saveAttendanceRecords() {

    localStorage.setItem(
        "cmsAttendance",
        JSON.stringify(
            attendanceRecords
        )
    );

}


function saveReportRecords() {

    localStorage.setItem(
        "cmsWeeklyReports",
        JSON.stringify(
            weeklyReports
        )
    );

}


function saveFollowUpRecords() {

    localStorage.setItem(
        "cmsFollowUps",
        JSON.stringify(
            followUps
        )
    );

}


function saveEvangelismRecords() {

    localStorage.setItem(
        "cmsEvangelism",
        JSON.stringify(
            evangelismRecords
        )
    );

}


/* =====================================================
   DELETE LINKED RECORD
   ===================================================== */

function deleteLinkedCmsRecord(
    sourceType,
    sourceId
) {

    let records =
        [];


    try {

        records =
            JSON.parse(
                localStorage.getItem(
                    "cmsRecords"
                )
            ) ||
            [];

    }

    catch {

        records =
            [];

    }


    records =
        records.filter(
            function(record) {

                return !(
                    record.sourceType ===
                        sourceType

                    &&

                    String(
                        record.sourceId
                    ) ===
                    String(
                        sourceId
                    )
                );

            }
        );


    localStorage.setItem(
        "cmsRecords",
        JSON.stringify(
            records
        )
    );

}


/* =====================================================
   DELETE RECORD
   ===================================================== */

function deleteRecord(
    type,
    id
) {

    const record =
        findRecord(
            type,
            id
        );


    if (
        !record
    ) {

        alert(
            "Record could not be found."
        );


        return;

    }


    /*
       IMPORTANT:
       Visitors have linked visit history.
       They must not be deleted from Records Center.
    */

    if (
        type ===
        "visitor"
    ) {

        alert(
            "Visitors cannot be deleted from Records Center because their visit history is linked to this record."
        );


        return;

    }


    if (
        !confirm(
            "Are you sure you want to delete this record?"
        )
    ) {

        return;

    }


    if (
        type ===
        "attendance"
    ) {

        attendanceRecords =
            attendanceRecords.filter(
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


        saveAttendanceRecords();

    }


    else if (
        type ===
        "report"
    ) {

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


        saveReportRecords();

    }


    else if (
        type ===
        "followup"
    ) {

        followUps =
            followUps.filter(
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


        saveFollowUpRecords();


        deleteLinkedCmsRecord(
            "Follow-up",
            id
        );

    }


    else if (
        type ===
        "evangelism"
    ) {

        evangelismRecords =
            evangelismRecords.filter(
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


        saveEvangelismRecords();


        deleteLinkedCmsRecord(
            "Evangelism",
            id
        );

    }


    refreshAllData();


    updateSummary();


    renderRecords();


    closeRecordsModal();

}


/* =====================================================
   EXPORT ALL
   ===================================================== */

if (
    exportAllButton
) {

    exportAllButton.addEventListener(
        "click",
        function() {

            const backup = {

                exportedAt:
                    new Date()
                        .toISOString(),


                cells:
                    getLocalCells(),


                leaders:
                    readStorageArray(
                        [
                            "cmsCellLeaders",
                            "cmsLeaders"
                        ]
                    ),


                members:
                    getLocalMembers(),


                attendance:
                    attendanceRecords,


                weeklyReports:
                    weeklyReports,


                followUps:
                    followUps,


                evangelism:
                    evangelismRecords,


                visitors:
                    visitorRecords,


                visitorVisits:
                    visitorVisitRecords,


                recordsCenter:
                    readStorageArray(
                        [
                            "cmsRecords"
                        ]
                    )

            };


            const blob =
                new Blob(
                    [
                        JSON.stringify(
                            backup,
                            null,
                            2
                        )
                    ],
                    {
                        type:
                            "application/json"
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


            link.href =
                url;


            link.download =
                "CMS-Full-Backup.json";


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            URL.revokeObjectURL(
                url
            );

        }
    );

}


/* =====================================================
   SEARCH
   ===================================================== */

if (
    recordSearch
) {

    recordSearch.addEventListener(
        "input",
        function() {

            renderRecords();


            updateSummary(
                getFilteredRecords()
            );

        }
    );

}


/* =====================================================
   DATE FILTER
   ===================================================== */

if (
    recordDate
) {

    recordDate.addEventListener(
        "change",
        function() {

            renderRecords();


            updateSummary(
                getFilteredRecords()
            );

        }
    );

}


/* =====================================================
   CLEAR FILTERS
   ===================================================== */

if (
    clearFiltersButton
) {

    clearFiltersButton.addEventListener(
        "click",
        function() {

            if (
                recordSearch
            ) {

                recordSearch.value =
                    "";

            }


            if (
                recordDate
            ) {

                recordDate.value =
                    "";

            }


            currentType =
                "all";


            recordTabs.forEach(
                function(tab) {

                    tab.classList.remove(
                        "active"
                    );

                }
            );


            const allTab =
                document.querySelector(
                    '[data-type="all"]'
                );


            if (
                allTab
            ) {

                allTab.classList.add(
                    "active"
                );

            }


            renderRecords();


            updateSummary(
                getFilteredRecords()
            );

        }
    );

}


/* =====================================================
   TABS
   ===================================================== */

recordTabs.forEach(
    function(tab) {

        tab.addEventListener(
            "click",
            function() {

                recordTabs.forEach(
                    function(item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                tab.classList.add(
                    "active"
                );


                currentType =
                    tab.dataset.type ||
                    "all";


                renderRecords();


                updateSummary(
                    getFilteredRecords()
                );

            }
        );

    }
);


/* =====================================================
   STORAGE EVENTS
   ===================================================== */

window.addEventListener(
    "storage",
    function(event) {

        const watched = [

            ...ATTENDANCE_KEYS,

            ...REPORT_KEYS,

            ...FOLLOW_UP_KEYS,

            ...EVANGELISM_KEYS,

            "cmsCells",

            "cmsCellLeaders",

            "cmsLeaders",

            "cmsMembers",

            "cmsRecords"

        ];


        if (
            watched.includes(
                event.key
            )
        ) {

            refreshAllData();


            renderRecords();


            updateSummary();


            if (
                recordsLiveReferenceLoaded
            ) {

                loadRecordsLiveReferenceData()
                    .then(
                        function() {

                            return loadRecordsLiveVisitors();

                        }
                    )
                    .then(
                        function() {

                            renderRecords();

                            updateSummary();

                        }
                    )
                    .catch(
                        function() {}
                    );

            }

        }

    }
);


/* =====================================================
   CUSTOM RECORD UPDATE EVENT
   ===================================================== */

window.addEventListener(
    "cmsRecordsUpdated",
    function() {

        refreshAllData();


        renderRecords();


        updateSummary();


        if (
            recordsLiveReferenceLoaded
        ) {

            loadRecordsLiveReferenceData()
                .then(
                    function() {

                        return loadRecordsLiveVisitors();

                    }
                )
                .then(
                    function() {

                        renderRecords();

                        updateSummary();

                    }
                )
                .catch(
                    function() {}
                );

        }

    }
);


/* =====================================================
   DYNAMIC SCRIPT LOADER
   ===================================================== */

function loadRecordsScript(
    src
) {

    return new Promise(
        function(resolve, reject) {

            const existing =
                document.querySelector(
                    `script[src="${src}"]`
                );


            if (
                existing
            ) {

                if (
                    existing.dataset
                        .cmsLoaded ===
                    "true"
                ) {

                    resolve();


                    return;

                }


                existing.addEventListener(
                    "load",
                    function() {

                        resolve();

                    },
                    {
                        once:
                            true
                    }
                );


                existing.addEventListener(
                    "error",
                    function() {

                        reject(
                            new Error(
                                `Unable to load ${src}`
                            )
                        );

                    },
                    {
                        once:
                            true
                    }
                );


                return;

            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                src;


            script.async =
                false;


            script.addEventListener(
                "load",
                function() {

                    script.dataset.cmsLoaded =
                        "true";


                    resolve();

                },
                {
                    once:
                        true
                }
            );


            script.addEventListener(
                "error",
                function() {

                    reject(
                        new Error(
                            `Unable to load ${src}`
                        )
                    );

                },
                {
                    once:
                        true
                }
            );


            document.head.appendChild(
                script
            );

        }
    );

}


/* =====================================================
   ENSURE SUPABASE
   ===================================================== */

async function ensureRecordsSupabaseClient() {

    if (
        window.supabaseClient
    ) {

        cmsRecordsSupabase =
            window.supabaseClient;


        return cmsRecordsSupabase;

    }


    try {

        if (
            !window.supabase
        ) {

            await loadRecordsScript(
                "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
            );

        }


        if (
            !window.supabaseClient
        ) {

            await loadRecordsScript(
                "supabase.js"
            );

        }


        for (
            let attempt =
                0;

            attempt <
            40;

            attempt++
        ) {

            if (
                window.supabaseClient
            ) {

                cmsRecordsSupabase =
                    window.supabaseClient;


                return cmsRecordsSupabase;

            }


            await new Promise(
                function(resolve) {

                    setTimeout(
                        resolve,
                        50
                    );

                }
            );

        }

    }

    catch (error) {

        console.warn(
            "CMS Records: automatic Supabase loading failed.",
            error
        );

    }


    return null;

}


/* =====================================================
   LOAD LIVE MEMBERS / CELLS
   ===================================================== */

async function loadRecordsLiveReferenceData() {

    const supabase =
        await ensureRecordsSupabaseClient();


    if (
        !supabase
    ) {

        console.warn(
            "CMS Records: using local member/cell data only."
        );


        return false;

    }


    try {

        const [
            cellsResult,
            membersResult
        ] =

            await Promise.all(

                [

                    supabase
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
                                ascending:
                                    true
                            }
                        ),


                    supabase
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
                                notes,
                                created_at,
                                updated_at
                            `
                        )
                        .order(
                            "created_at",
                            {
                                ascending:
                                    true
                            }
                        )

                ]

            );


        if (
            cellsResult.error
        ) {

            console.warn(
                "CMS Records: live cells lookup failed:",
                cellsResult.error
            );

        }

        else if (
            Array.isArray(
                cellsResult.data
            )
        ) {

            cells =
                cellsResult.data;

        }


        if (
            membersResult.error
        ) {

            console.warn(
                "CMS Records: live members lookup failed:",
                membersResult.error
            );

        }

        else if (
            Array.isArray(
                membersResult.data
            )
        ) {

            members =
                membersResult.data
                    .map(
                        function(member) {

                            const fullName =

                                [
                                    member.first_name,
                                    member.last_name
                                ]
                                .filter(
                                    Boolean
                                )
                                .join(" ")
                                .trim();


                            return {

                                id:
                                    member.id,

                                name:
                                    fullName,

                                fullName:
                                    fullName,

                                memberName:
                                    fullName,

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

                                yearOfStudy:
                                    member.year_of_study ||
                                    "",

                                year_of_study:
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

                                active:
                                    member.active !==
                                    false,

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

        }


        recordsLiveReferenceLoaded =
            true;


        console.log(
            "CMS Records: live reference data loaded.",
            {

                cells:
                    cells.length,

                members:
                    members.length

            }
        );


        return true;

    }

    catch (error) {

        console.error(
            "CMS Records: live reference loading error:",
            error
        );


        return false;

    }

}


/* =====================================================
   LOAD LIVE VISITORS + VISIT HISTORY
   ===================================================== */

async function loadRecordsLiveVisitors() {

    const supabase =
        await ensureRecordsSupabaseClient();


    if (
        !supabase
    ) {

        return false;

    }


    try {

        const [
            visitorsResult,
            visitsResult
        ] =

            await Promise.all(

                [

                    supabase
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
                                created_at,
                                updated_at
                            `
                        )
                        .order(
                            "last_visit_date",
                            {
                                ascending:
                                    false
                            }
                        ),


                    supabase
                        .from(
                            "visitor_visits"
                        )
                        .select(
                            `
                                id,
                                visitor_id,
                                cell_id,
                                visit_date,
                                status,
                                attendance_session_id
                            `
                        )
                        .order(
                            "visit_date",
                            {
                                ascending:
                                    false
                            }
                        )

                ]

            );


        if (
            visitorsResult.error
        ) {

            console.warn(
                "CMS Records: live visitors lookup failed:",
                visitorsResult.error
            );


            return false;

        }


        visitorRecords =
            Array.isArray(
                visitorsResult.data
            )
                ? visitorsResult.data
                : [];


        if (
            visitsResult.error
        ) {

            console.warn(
                "CMS Records: live visitor visit history lookup failed:",
                visitsResult.error
            );


            visitorVisitRecords =
                [];

        }

        else {

            visitorVisitRecords =
                Array.isArray(
                    visitsResult.data
                )
                    ? visitsResult.data
                    : [];

        }


        console.log(
            "CMS Records: live visitors loaded.",
            {

                visitors:
                    visitorRecords.length,

                visits:
                    visitorVisitRecords.length

            }
        );


        return true;

    }

    catch (error) {

        console.error(
            "CMS Records: live visitors loading error:",
            error
        );


        return false;

    }

}


/* =====================================================
   PUBLIC FUNCTIONS
   ===================================================== */

window.viewRecord =
    viewRecord;


window.downloadRecord =
    downloadRecord;


window.deleteRecord =
    deleteRecord;


window.printRecord =
    printRecord;


/* =====================================================
   INITIALIZE RECORDS CENTER
   ===================================================== */

async function initializeRecordsCenter() {

    refreshAllData();


    /*
       Render local records immediately.
    */

    updateSummary();


    renderRecords();


    /*
       Load live cells + members.
    */

    await loadRecordsLiveReferenceData();


    /*
       Load live visitor master + history.
    */

    await loadRecordsLiveVisitors();


    /*
       Render again with all live Supabase data.
    */

    updateSummary();


    renderRecords();


    console.log(
        "CMS Records Center loaded successfully."
    );

}


initializeRecordsCenter();