/* =========================================================
   CMS - RECORDS CENTER SUPABASE BRIDGE
   =========================================================

   Purpose:
   - Connect Records Center to Supabase
   - Supabase is the source of truth
   - LocalStorage remains a frontend cache
   - Records Center does NOT create a new database table
   - Resolves:
        Cell ID    -> Cell Name
        Member ID  -> Member Name
        Leader ID  -> Leader Name

   Connected tables:
   - cells
   - cell_leader_directory
   - members
   - attendance
   - weekly_reports
   - follow_ups
   - evangelism

   ========================================================= */

(function () {
    "use strict";

    console.log("CMS Records Supabase Bridge loading...");

    /* =====================================================
       SUPABASE CHECK
       ===================================================== */

    if (!window.supabaseClient) {
        console.error(
            "CMS Records: Supabase client not available."
        );
        return;
    }

    const supabase = window.supabaseClient;


    /* =====================================================
       HELPERS
       ===================================================== */

    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function textValue(value, fallback = "") {
        if (
            value === null ||
            value === undefined ||
            String(value).trim() === ""
        ) {
            return fallback;
        }

        return String(value).trim();
    }

    function numberValue(value) {
        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : 0;
    }

    function isUUID(value) {
        if (!value) return false;

        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            .test(String(value));
    }

    function firstValue(row, keys, fallback = "") {
        if (!row) return fallback;

        for (const key of keys) {
            if (
                row[key] !== undefined &&
                row[key] !== null &&
                String(row[key]).trim() !== ""
            ) {
                return row[key];
            }
        }

        return fallback;
    }

    function isPlaceholderName(value) {
        if (value === undefined || value === null) {
            return true;
        }

        const text = String(value).trim();

        return text === "" || /^unknown(?:\s+(?:member|leader|cell))?$/i.test(text);
    }

    function firstMeaningfulValue(row, keys, fallback = "") {
        if (!row) return fallback;

        for (const key of keys) {
            const value = row[key];

            if (!isPlaceholderName(value)) {
                return value;
            }
        }

        return fallback;
    }


    /* =====================================================
       RELATIONSHIP LOOKUPS
       ===================================================== */

    let cellMap = new Map();
    let memberMap = new Map();
    let leaderMap = new Map();


    function buildLookupMaps(cells, members, leaders) {

        cellMap = new Map();
        memberMap = new Map();
        leaderMap = new Map();


        /* -----------------------------
           CELLS
           ----------------------------- */

        safeArray(cells).forEach(function (cell) {

            if (!cell || cell.id === undefined) {
                return;
            }

            const name = firstValue(
                cell,
                [
                    "name",
                    "cell_name",
                    "cellName"
                ],
                "Unknown Cell"
            );

            cellMap.set(
                String(cell.id),
                name
            );
        });


        /* -----------------------------
           MEMBERS
           ----------------------------- */

        safeArray(members).forEach(function (member) {

            if (!member || member.id === undefined) {
                return;
            }

            const name = firstValue(
                member,
                [
                    "name",
                    "full_name",
                    "fullName",
                    "member_name",
                    "memberName"
                ],
                "Unknown Member"
            );

            memberMap.set(
                String(member.id),
                {
                    name: name,
                    phone: firstValue(
                        member,
                        [
                            "phone",
                            "phone_number",
                            "phoneNumber",
                            "telephone",
                            "mobile"
                        ],
                        ""
                    ),
                    year: firstValue(
                        member,
                        [
                            "year",
                            "year_of_study",
                            "yearOfStudy"
                        ],
                        ""
                    ),
                    combination: firstValue(
                        member,
                        [
                            "combination"
                        ],
                        ""
                    ),
                    cellId: firstValue(
                        member,
                        [
                            "cell_id",
                            "cellId"
                        ],
                        ""
                    )
                }
            );
        });


        /* -----------------------------
           LEADERS
           ----------------------------- */

        safeArray(leaders).forEach(function (leader) {

            if (!leader || leader.id === undefined) {
                return;
            }

            const name = firstValue(
                leader,
                [
                    "full_name",
                    "fullName",
                    "name",
                    "leader_name",
                    "leaderName"
                ],
                "Unknown Leader"
            );

            leaderMap.set(
                String(leader.id),
                {
                    name: name,
                    phone: firstValue(
                        leader,
                        [
                            "phone",
                            "phone_number",
                            "phoneNumber"
                        ],
                        ""
                    ),
                    email: firstValue(
                        leader,
                        [
                            "email"
                        ],
                        ""
                    ),
                    cellId: firstValue(
                        leader,
                        [
                            "cell_id",
                            "cellId"
                        ],
                        ""
                    )
                }
            );
        });


        console.log(
            "CMS Records: relationship maps built.",
            {
                cells: cellMap.size,
                members: memberMap.size,
                leaders: leaderMap.size
            }
        );
    }


    function resolveCellName(cellId, fallback = "") {

        if (
            cellId !== undefined &&
            cellId !== null &&
            String(cellId).trim() !== ""
        ) {
            const name = cellMap.get(String(cellId));

            if (name) {
                return name;
            }
        }

        return fallback || "Unknown Cell";
    }


    function resolveMember(memberId) {

        if (
            memberId === undefined ||
            memberId === null ||
            String(memberId).trim() === ""
        ) {
            return null;
        }

        return (
            memberMap.get(String(memberId))
            || null
        );
    }


    function resolveMemberName(memberId, fallback = "") {

        const member = resolveMember(memberId);

        if (member && member.name) {
            return member.name;
        }

        return fallback || "Unknown Member";
    }


    function resolveLeader(leaderId) {

        if (
            leaderId === undefined ||
            leaderId === null ||
            String(leaderId).trim() === ""
        ) {
            return null;
        }

        return (
            leaderMap.get(String(leaderId))
            || null
        );
    }


    function resolveLeaderName(leaderId, fallback = "") {

        if (
            leaderId === undefined ||
            leaderId === null ||
            String(leaderId).trim() === ""
        ) {
            return fallback || "Unknown Leader";
        }

        const rawId = String(leaderId).trim();
        const normalizedId = rawId.startsWith("leader:")
            ? rawId.substring(7)
            : rawId;

        if (
            normalizedId.toLowerCase() === "coordinator"
        ) {
            return "Coordinator";
        }

        const leader = resolveLeader(normalizedId);

        if (leader && leader.name) {
            return leader.name;
        }

        return fallback || "Unknown Leader";
    }


    /* =====================================================
       SUPABASE TABLE LOADER
       ===================================================== */

    async function loadTable(tableNames) {

        for (const tableName of tableNames) {

            try {

                const response = await supabase
                    .from(tableName)
                    .select("*");

                if (!response.error) {

                    console.log(
                        "CMS Records: loaded table:",
                        tableName,
                        response.data
                    );

                    return {
                        table: tableName,
                        data: safeArray(response.data)
                    };
                }

                console.warn(
                    "CMS Records: table unavailable:",
                    tableName,
                    response.error.message
                );

            } catch (error) {

                console.warn(
                    "CMS Records: table loading error:",
                    tableName,
                    error
                );
            }
        }

        return {
            table: null,
            data: []
        };
    }


    /* =====================================================
       CELLS
       ===================================================== */

    async function loadCells() {

        const result = await supabase
            .from("cells")
            .select("*");

        if (result.error) {

            console.error(
                "CMS Records: failed to load cells:",
                result.error
            );

            return [];
        }

        return safeArray(result.data);
    }


    /* =====================================================
       MEMBERS
       ===================================================== */

    async function loadMembers() {

        const result = await supabase
            .from("members")
            .select("*");

        if (result.error) {

            console.error(
                "CMS Records: failed to load members:",
                result.error
            );

            return [];
        }

        return safeArray(result.data);
    }


    /* =====================================================
       CELL LEADERS
       ===================================================== */

    async function loadLeaders() {

        const result = await supabase
            .from("cell_leader_directory")
            .select("*");

        if (result.error) {

            console.error(
                "CMS Records: failed to load leaders:",
                result.error
            );

            return [];
        }

        return safeArray(result.data);
    }


    /* =====================================================
       ATTENDANCE NORMALIZATION
       ===================================================== */

    function convertAttendance(row) {

        const cellId = firstValue(
            row,
            [
                "cell_id",
                "cellId"
            ],
            ""
        );

        const date = firstValue(
            row,
            [
                "date",
                "meeting_date",
                "meetingDate",
                "attendance_date",
                "attendanceDate",
                "created_at"
            ],
            ""
        );


        let entries = [];

        const possibleEntries = firstValue(
            row,
            [
                "members",
                "entries",
                "attendance",
                "records"
            ],
            []
        );

        if (Array.isArray(possibleEntries)) {
            entries = possibleEntries;
        }


        /*
         * If the database stores attendance rows using
         * member_id directly, preserve the row as one entry.
         */

        if (
            entries.length === 0 &&
            (
                row.member_id ||
                row.memberId
            )
        ) {

            const memberId = firstValue(
                row,
                [
                    "member_id",
                    "memberId"
                ],
                ""
            );

            const member = resolveMember(memberId);

            entries.push({
                id: memberId,
                memberId: memberId,
                name: resolveMemberName(
                    memberId,
                    firstMeaningfulValue(
                        row,
                        [
                            "member_name",
                            "memberName",
                            "name"
                        ],
                        "Unknown"
                    )
                ),
                phone: member?.phone || firstValue(
                    row,
                    [
                        "phone",
                        "phone_number"
                    ],
                    "—"
                ),
                year: member?.year || firstValue(
                    row,
                    [
                        "year",
                        "year_of_study"
                    ],
                    "—"
                ),
                combination:
                    member?.combination
                    ||
                    firstValue(
                        row,
                        [
                            "combination"
                        ],
                        "—"
                    ),
                status: firstValue(
                    row,
                    [
                        "status",
                        "attendance_status",
                        "attendanceStatus"
                    ],
                    ""
                ),
                type: "Member"
            });
        }


        /*
         * Enrich every attendance member with the real
         * member information from Supabase.
         */

        entries = entries.map(function (entry) {

            const memberId = firstValue(
                entry,
                [
                    "memberId",
                    "member_id",
                    "id"
                ],
                ""
            );

            const member = resolveMember(memberId);

            return {
                ...entry,

                memberId: memberId,

                name:
                    member?.name
                    ||
                    firstMeaningfulValue(
                        entry,
                        [
                            "name",
                            "fullName",
                            "memberName",
                            "member_name"
                        ],
                        "Unknown"
                    ),

                phone:
                    member?.phone
                    ||
                    firstValue(
                        entry,
                        [
                            "phone",
                            "phoneNumber",
                            "phone_number",
                            "telephone",
                            "mobile"
                        ],
                        "—"
                    ),

                year:
                    member?.year
                    ||
                    firstValue(
                        entry,
                        [
                            "year",
                            "yearOfStudy",
                            "year_of_study"
                        ],
                        "—"
                    ),

                combination:
                    member?.combination
                    ||
                    firstValue(
                        entry,
                        [
                            "combination"
                        ],
                        "—"
                    ),

                status: firstValue(
                    entry,
                    [
                        "status",
                        "attendance_status",
                        "attendanceStatus"
                    ],
                    ""
                ),

                type:
                    entry.type
                    ||
                    "Member"
            };
        });


        return {
            ...row,

            id:
                row.id
                ||
                (
                    "attendance-"
                    +
                    cellId
                    +
                    "-"
                    +
                    date
                ),

            cellId: cellId,

            cellName:
                firstValue(
                    row,
                    [
                        "cell_name",
                        "cellName"
                    ],
                    ""
                )
                ||
                resolveCellName(cellId),

            date: date,

            members: entries,

            entries: entries,

            attendance: entries
        };
    }


    /* =====================================================
       WEEKLY REPORT NORMALIZATION
       ===================================================== */

    function convertWeeklyReport(row) {

        const cellId = firstValue(
            row,
            [
                "cell_id",
                "cellId"
            ],
            ""
        );

        const date = firstValue(
            row,
            [
                "date",
                "report_date",
                "reportDate",
                "week",
                "created_at"
            ],
            ""
        );

        return {
            ...row,

            id: row.id || (
                "report-"
                +
                cellId
                +
                "-"
                +
                date
            ),

            cellId: cellId,

            cellName:
                firstValue(
                    row,
                    [
                        "cell_name",
                        "cellName"
                    ],
                    ""
                )
                ||
                resolveCellName(cellId),

            date: date,

            meetingLocation:
                firstValue(
                    row,
                    [
                        "meeting_location",
                        "meetingLocation",
                        "location"
                    ],
                    ""
                ),

            membersLife:
                firstValue(
                    row,
                    [
                        "members_life",
                        "membersLife",
                        "life"
                    ],
                    ""
                ),

            activityDone:
                firstValue(
                    row,
                    [
                        "activity_done",
                        "activityDone",
                        "activity"
                    ],
                    ""
                ),

            challengesNeeds:
                firstValue(
                    row,
                    [
                        "challenges_needs",
                        "challengesNeeds",
                        "challenges"
                    ],
                    ""
                ),

            followUpNeeded:
                firstValue(
                    row,
                    [
                        "follow_up_needed",
                        "followUpNeeded",
                        "follow_up"
                    ],
                    ""
                ),

            nextWeekPlan:
                firstValue(
                    row,
                    [
                        "next_week_plan",
                        "nextWeekPlan"
                    ],
                    ""
                ),

            additionalComments:
                firstValue(
                    row,
                    [
                        "additional_comments",
                        "additionalComments",
                        "comments"
                    ],
                    ""
                )
        };
    }


    /* =====================================================
       FOLLOW-UP NORMALIZATION
       ===================================================== */

    function convertFollowUp(row) {

        const cellId = firstValue(
            row,
            [
                "cell_id",
                "cellId"
            ],
            ""
        );

        const memberId = firstValue(
            row,
            [
                "member_id",
                "memberId"
            ],
            ""
        );

        const assignedTo = firstValue(
            row,
            [
                "assigned_to",
                "assignedTo"
            ],
            ""
        );

        const member = resolveMember(memberId);
        const leader = resolveLeader(assignedTo);


        return {
            ...row,

            id:
                row.id
                ||
                (
                    "followup-"
                    +
                    memberId
                    +
                    "-"
                    +
                    (
                        row.follow_up_date
                        ||
                        row.date
                        ||
                        ""
                    )
                ),

            cellId: cellId,

            cellName:
                firstValue(
                    row,
                    [
                        "cell_name",
                        "cellName"
                    ],
                    ""
                )
                ||
                resolveCellName(cellId),

            memberId: memberId,

            memberName:
                firstMeaningfulValue(
                    row,
                    [
                        "member_name",
                        "memberName",
                        "name",
                        "full_name",
                        "fullName"
                    ],
                    ""
                )
                ||
                member?.name
                ||
                "Unknown Member",

            memberPhone:
                firstValue(
                    row,
                    [
                        "member_phone",
                        "memberPhone"
                    ],
                    ""
                )
                ||
                member?.phone
                ||
                "—",

            assignedTo: assignedTo,

            assignedToName:
                firstMeaningfulValue(
                    row,
                    [
                        "assigned_to_name",
                        "assignedToName",
                        "assigned_to",
                        "assignedTo"
                    ],
                    ""
                )
                ||
                resolveLeaderName(
                    assignedTo,
                    leader?.name || ""
                )
                ||
                "Unknown Leader",

            followUpDate:
                firstValue(
                    row,
                    [
                        "follow_up_date",
                        "followUpDate",
                        "date",
                        "created_at"
                    ],
                    ""
                ),

            reason:
                firstValue(
                    row,
                    [
                        "reason",
                        "follow_up_reason"
                    ],
                    ""
                ),

            details:
                firstValue(
                    row,
                    [
                        "details",
                        "description"
                    ],
                    ""
                ),

            priority:
                firstValue(
                    row,
                    [
                        "priority"
                    ],
                    "Normal"
                ),

            status:
                firstValue(
                    row,
                    [
                        "status"
                    ],
                    "Pending"
                ),

            actionTaken:
                firstValue(
                    row,
                    [
                        "action_taken",
                        "actionTaken"
                    ],
                    ""
                ),

            nextAction:
                firstValue(
                    row,
                    [
                        "next_action",
                        "nextAction"
                    ],
                    ""
                )
        };
    }


    /* =====================================================
       EVANGELISM NORMALIZATION
       ===================================================== */

    function convertEvangelism(row) {

        const cellId = firstValue(
            row,
            [
                "cell_id",
                "cellId"
            ],
            ""
        );

        const leaderId = firstValue(
            row,
            [
                "leader_id",
                "leaderId",
                "recorded_by",
                "recordedBy"
            ],
            ""
        );

        const leader = resolveLeader(leaderId);


        return {
            ...row,

            id: row.id,

            cellId: cellId,

            cellName:
                firstValue(
                    row,
                    [
                        "cell_name",
                        "cellName"
                    ],
                    ""
                )
                ||
                resolveCellName(cellId),

            leaderId: leaderId,

            leaderName:
                firstValue(
                    row,
                    [
                        "leader_name",
                        "leaderName",
                        "recorded_by_name",
                        "recordedByName"
                    ],
                    ""
                )
                ||
                leader?.name
                ||
                "Unknown Leader",

            date:
                firstValue(
                    row,
                    [
                        "evangelism_date",
                        "evangelismDate",
                        "date",
                        "created_at"
                    ],
                    ""
                ),

            evangelismType:
                firstValue(
                    row,
                    [
                        "evangelism_type",
                        "evangelismType"
                    ],
                    ""
                ),

            location:
                firstValue(
                    row,
                    [
                        "location",
                        "area"
                    ],
                    ""
                ),

            peopleReached:
                numberValue(
                    firstValue(
                        row,
                        [
                            "people_reached",
                            "peopleReached"
                        ],
                        0
                    )
                ),

            newPeople:
                numberValue(
                    firstValue(
                        row,
                        [
                            "new_people",
                            "newPeople"
                        ],
                        0
                    )
                ),

            saved:
                numberValue(
                    firstValue(
                        row,
                        [
                            "saved"
                        ],
                        0
                    )
                ),

            inProgress:
                numberValue(
                    firstValue(
                        row,
                        [
                            "in_progress",
                            "inProgress"
                        ],
                        0
                    )
                ),

            interested:
                numberValue(
                    firstValue(
                        row,
                        [
                            "interested"
                        ],
                        0
                    )
                ),

            followUpNeeded:
                numberValue(
                    firstValue(
                        row,
                        [
                            "follow_up_needed",
                            "followUpNeeded"
                        ],
                        0
                    )
                ),

            notYet:
                numberValue(
                    firstValue(
                        row,
                        [
                            "not_yet",
                            "notYet"
                        ],
                        0
                    )
                ),

            people:
                safeArray(row.people),

            details:
                firstValue(
                    row,
                    [
                        "details",
                        "notes"
                    ],
                    ""
                ),

            nextAction:
                firstValue(
                    row,
                    [
                        "next_action",
                        "nextAction"
                    ],
                    ""
                )
        };
    }


    /* =====================================================
       CACHE HELPERS
       ===================================================== */

    function cacheArray(key, data) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(
                    safeArray(data)
                )
            );

        } catch (error) {

            console.error(
                "CMS Records: cache error:",
                key,
                error
            );
        }
    }


    /* =====================================================
       LOAD ALL SUPABASE RECORDS
       ===================================================== */

    async function loadRecordsFromSupabase() {

        console.log(
            "CMS Records: loading live Supabase data..."
        );


        try {

            /*
             * Load relationship data first.
             */

            const [
                cells,
                members,
                leaders
            ] = await Promise.all([
                loadCells(),
                loadMembers(),
                loadLeaders()
            ]);


            buildLookupMaps(
                cells,
                members,
                leaders
            );


            /*
             * Load record tables.
             */

            const [
                attendanceResult,
                reportsResult,
                followUpsResult,
                evangelismResult
            ] = await Promise.all([

                loadTable([
                    "attendance",
                    "attendances"
                ]),

                loadTable([
                    "weekly_reports",
                    "weeklyReports"
                ]),

                loadTable([
                    "follow_ups",
                    "followups",
                    "followUps"
                ]),

                loadTable([
                    "evangelism"
                ])
            ]);


            /* =================================================
               CONVERT DATA
               ================================================= */

            const convertedAttendance =
                attendanceResult.data.map(
                    convertAttendance
                );

            const convertedReports =
                reportsResult.data.map(
                    convertWeeklyReport
                );

            const convertedFollowUps =
                followUpsResult.data.map(
                    convertFollowUp
                );

            const convertedEvangelism =
                evangelismResult.data.map(
                    convertEvangelism
                );


            /* =================================================
               UPDATE LOCAL ARRAYS
               ================================================= */

            try {
                cells = cells;
            } catch (error) {
                /* ignored */
            }


            /*
             * Update the global/module arrays when available.
             */

            if (
                typeof attendanceRecords !==
                "undefined"
            ) {
                attendanceRecords =
                    convertedAttendance;
            }

            if (
                typeof weeklyReports !==
                "undefined"
            ) {
                weeklyReports =
                    convertedReports;
            }

            if (
                typeof followUps !==
                "undefined"
            ) {
                followUps =
                    convertedFollowUps;
            }

            if (
                typeof evangelismRecords !==
                "undefined"
            ) {
                evangelismRecords =
                    convertedEvangelism;
            }


            /*
             * Keep window-level arrays synchronized
             * for other CMS modules.
             */

            window.cmsCells =
                cells;

            window.cmsMembers =
                members;

            window.cmsLeaders =
                leaders;

            window.attendanceRecords =
                convertedAttendance;

            window.weeklyReports =
                convertedReports;

            window.followUps =
                convertedFollowUps;

            window.evangelismRecords =
                convertedEvangelism;


            /* =================================================
               UPDATE EXISTING LOCALSTORAGE CACHE
               ================================================= */

            cacheArray(
                "cmsCells",
                cells
            );

            cacheArray(
                "cmsMembers",
                members
            );

            cacheArray(
                "cmsCellLeaders",
                leaders
            );

            cacheArray(
                "cmsLeaders",
                leaders
            );

            cacheArray(
                "cmsAttendance",
                convertedAttendance
            );

            cacheArray(
                "cmsWeeklyReports",
                convertedReports
            );

            cacheArray(
                "cmsFollowUps",
                convertedFollowUps
            );

            cacheArray(
                "cmsEvangelism",
                convertedEvangelism
            );


            /* =================================================
               REFRESH EXISTING RECORDS CENTER
               ================================================= */

            if (
                typeof refreshAllData ===
                "function"
            ) {
                refreshAllData();
            }

            if (
                typeof updateSummary ===
                "function"
            ) {
                updateSummary();
            }

            if (
                typeof renderRecords ===
                "function"
            ) {
                renderRecords();
            }


            /*
             * Tell the rest of CMS that the central
             * record data has changed.
             */

            window.dispatchEvent(
                new CustomEvent(
                    "cmsRecordsUpdated"
                )
            );


            console.log(
                "CMS Records: Supabase hydration complete.",
                {
                    cells: cells.length,
                    members: members.length,
                    leaders: leaders.length,
                    attendance:
                        convertedAttendance.length,
                    reports:
                        convertedReports.length,
                    followUps:
                        convertedFollowUps.length,
                    evangelism:
                        convertedEvangelism.length
                }
            );


            return {
                cells,
                members,
                leaders,
                attendance:
                    convertedAttendance,
                reports:
                    convertedReports,
                followUps:
                    convertedFollowUps,
                evangelism:
                    convertedEvangelism
            };

        } catch (error) {

            console.error(
                "CMS Records: Supabase hydration failed:",
                error
            );

            return null;
        }
    }


    /* =====================================================
       DELETE FROM SUPABASE
       ===================================================== */

    async function deleteFromSupabase(
        type,
        recordId
    ) {

        const tableMap = {
            attendance:
                [
                    "attendance",
                    "attendances"
                ],

            report:
                [
                    "weekly_reports"
                ],

            followup:
                [
                    "follow_ups",
                    "followups",
                    "followUps"
                ],

            evangelism:
                [
                    "evangelism"
                ]
        };


        const tables =
            tableMap[type];

        if (!tables || !recordId) {
            return false;
        }


        /*
         * Records created in Supabase normally have UUIDs.
         * Old localStorage-only records may not.
         */

        if (!isUUID(recordId)) {

            console.warn(
                "CMS Records: record is not a Supabase UUID:",
                recordId
            );

            return false;
        }


        for (const tableName of tables) {

            try {

                const result =
                    await supabase
                        .from(tableName)
                        .delete()
                        .eq("id", recordId);

                if (!result.error) {

                    console.log(
                        "CMS Records: deleted from Supabase:",
                        tableName,
                        recordId
                    );

                    return true;
                }

            } catch (error) {

                console.warn(
                    "CMS Records: delete failed:",
                    tableName,
                    error
                );
            }
        }

        return false;
    }


    /* =====================================================
       WRAP EXISTING DELETE FUNCTION
       ===================================================== */

    function connectDeleteHandler() {

        if (
            typeof deleteRecord !==
            "function"
        ) {

            console.warn(
                "CMS Records: deleteRecord() not available yet."
            );

            return;
        }


        if (
            window.__cmsRecordsDeleteWrapped
        ) {
            return;
        }


        const originalDeleteRecord =
            window.deleteRecord;


        if (
            typeof originalDeleteRecord !==
            "function"
        ) {

            console.warn(
                "CMS Records: unable to wrap deleteRecord()."
            );

            return;
        }


        window.deleteRecord =
            async function (
                type,
                id
            ) {

                console.log(
                    "CMS Records: delete requested:",
                    type,
                    id
                );


                /*
                 * Delete from Supabase first.
                 */

                const deleted =
                    await deleteFromSupabase(
                        type,
                        id
                    );


                /*
                 * Then allow the original Records Center
                 * function to update its local cache/UI.
                 */

                if (deleted) {

                    await originalDeleteRecord(
                        type,
                        id
                    );

                } else {

                    /*
                     * For old records that do not have
                     * Supabase UUIDs, preserve existing
                     * localStorage behavior.
                     */

                    await originalDeleteRecord(
                        type,
                        id
                    );
                }


                /*
                 * Reload authoritative data.
                 */

                await loadRecordsFromSupabase();
            };


        window.__cmsRecordsDeleteWrapped =
            true;

        console.log(
            "CMS Records: delete synchronization connected."
        );
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.CMSRecordsSupabase = {

        load:
            loadRecordsFromSupabase,

        refresh:
            loadRecordsFromSupabase,

        delete:
            deleteFromSupabase

    };


    /* =====================================================
       INITIALIZATION
       ===================================================== */

    function initializeRecordsBridge() {

        console.log(
            "CMS Records Supabase Bridge initialized."
        );


        connectDeleteHandler();


        loadRecordsFromSupabase();
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeRecordsBridge
        );

    } else {

        initializeRecordsBridge();
    }

})();