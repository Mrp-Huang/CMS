/* =====================================================
   CMS - FOLLOW-UPS SUPABASE BRIDGE

   FINAL STABLE / ADDITIVE FIX

   Existing follow-ups.js and database structure are kept.
   localStorage remains the frontend cache.
   Supabase remains the source of truth.
   ===================================================== */

const CMS_FOLLOWUPS_SUPABASE = window.supabaseClient || null;

let cmsFollowUpsHydrating = true;
let cmsFollowUpsSyncing = false;
let cmsFollowUpsStorageInstalled = false;
let cmsFollowUpsOriginalScriptLoaded = false;
let cmsFollowUpsRealtimeChannel = null;
let cmsFollowUpsCoordinatorProfileId = null;

let cmsFollowUpsAccess = {
    role: null,
    userId: null,
    cellId: null
};


/* =====================================================
   BASIC HELPERS
   ===================================================== */

function cmsFollowUpsIsUUID(value) {

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        String(value || "")
    );

}


function cmsFollowUpsParse(value, fallback) {

    try {

        return JSON.parse(value);

    }

    catch (error) {

        return fallback;

    }

}


/*
   IMPORTANT:
   Central ID comparison helper.

   The previous bridge referenced this function
   but it was missing.
*/

function cmsFollowUpsSameId(a, b) {

    return String(a ?? "") === String(b ?? "");

}


/* =====================================================
   UUID GENERATOR
   ===================================================== */

function cmsFollowUpsCreateUUID() {

    try {

        if (
            window.crypto &&
            typeof window.crypto.randomUUID ===
                "function"
        ) {

            return window.crypto.randomUUID();

        }

    }

    catch (error) {

        /* fallback below */

    }


    return (
        "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
            .replace(
                /[xy]/g,
                function(character) {

                    const random =
                        Math.random() * 16 |
                        0;

                    const value =
                        character === "x"
                            ? random
                            : (
                                random & 0x3
                            ) | 0x8;

                    return value.toString(
                        16
                    );

                }
            )
    );

}


/* =====================================================
   SAFE LOCAL STORAGE WRITE
   ===================================================== */

function cmsFollowUpsSetLocal(
    key,
    value
) {

    cmsFollowUpsSyncing = true;

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    }

    catch (error) {

        console.warn(
            "CMS Follow-ups: local cache write warning:",
            error
        );

    }

    finally {

        cmsFollowUpsSyncing = false;

    }

}


/* =====================================================
   ACCESS / ROLE
   ===================================================== */

async function cmsFollowUpsInitializeAccess() {

    if (
        !CMS_FOLLOWUPS_SUPABASE
    ) {

        return;

    }


    /*
       First use the shared CMS Access system.
    */

    try {

        if (
            window.CMSAccess &&
            typeof window.CMSAccess.initialize ===
                "function"
        ) {

            const access =
                await window.CMSAccess.initialize();


            cmsFollowUpsAccess = {

                role:
                    access?.role ||
                    window.CMSAccess.role ||
                    null,

                userId:
                    access?.userId ||
                    window.CMSAccess.userId ||
                    null,

                cellId:
                    access?.cellId ||
                    window.CMSAccess.cellId ||
                    null

            };

        }

    }

    catch (error) {

        console.warn(
            "CMS Follow-ups: CMS Access initialization warning:",
            error
        );

    }


    /*
       Safe RPC/session fallback.
    */

    try {

        if (
            !cmsFollowUpsAccess.role
        ) {

            const {
                data,
                error
            } =
                await CMS_FOLLOWUPS_SUPABASE
                    .rpc(
                        "cms_my_role"
                    );


            if (
                !error &&
                data
            ) {

                cmsFollowUpsAccess.role =
                    data;

            }

        }


        if (
            !cmsFollowUpsAccess.cellId
        ) {

            const {
                data,
                error
            } =
                await CMS_FOLLOWUPS_SUPABASE
                    .rpc(
                        "cms_my_cell_id"
                    );


            if (
                !error &&
                data
            ) {

                cmsFollowUpsAccess.cellId =
                    data;

            }

        }


        if (
            !cmsFollowUpsAccess.userId
        ) {

            const {
                data
            } =
                await CMS_FOLLOWUPS_SUPABASE
                    .auth
                    .getSession();


            cmsFollowUpsAccess.userId =
                data?.session?.user?.id ||
                null;

        }

    }

    catch (error) {

        console.warn(
            "CMS Follow-ups: access fallback warning:",
            error
        );

    }


    console.log(
        "CMS Follow-ups access:",
        cmsFollowUpsAccess
    );

}


function cmsFollowUpsIsCoordinator() {

    return (
        cmsFollowUpsAccess.role ===
        "coordinator"
    );

}


function cmsFollowUpsIsCellLeader() {

    return (
        cmsFollowUpsAccess.role ===
        "cell_leader"
    );

}


/* =====================================================
   COORDINATOR PROFILE UUID
   ===================================================== */

async function cmsFollowUpsLoadCoordinatorProfileId() {

    if (
        cmsFollowUpsCoordinatorProfileId
    ) {

        return cmsFollowUpsCoordinatorProfileId;

    }


    const {
        data,
        error
    } =
        await CMS_FOLLOWUPS_SUPABASE
            .rpc(
                "cms_get_active_coordinator_profile_id"
            );


    if (
        error
    ) {

        throw error;

    }


    cmsFollowUpsCoordinatorProfileId =
        data ||
        null;


    window.cmsFollowUpsCoordinatorProfileId =
        cmsFollowUpsCoordinatorProfileId;


    return cmsFollowUpsCoordinatorProfileId;

}


/* =====================================================
   LOAD CELLS
   ===================================================== */

async function cmsFollowUpsLoadCells() {

    let query =
        CMS_FOLLOWUPS_SUPABASE
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


    if (
        cmsFollowUpsIsCellLeader() &&
        cmsFollowUpsAccess.cellId
    ) {

        query =
            query.eq(
                "id",
                cmsFollowUpsAccess.cellId
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

        throw error;

    }


    return data || [];

}


/* =====================================================
   LOAD MEMBERS
   ===================================================== */

async function cmsFollowUpsLoadMembers() {

    let query =
        CMS_FOLLOWUPS_SUPABASE
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


    if (
        cmsFollowUpsIsCellLeader() &&
        cmsFollowUpsAccess.cellId
    ) {

        query =
            query.eq(
                "cell_id",
                cmsFollowUpsAccess.cellId
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

        throw error;

    }


    return data || [];

}


/* =====================================================
   LOAD CELL LEADER DIRECTORY
   ===================================================== */

async function cmsFollowUpsLoadLeaders() {

    let query =
        CMS_FOLLOWUPS_SUPABASE
            .from(
                "cell_leader_directory"
            )
            .select(`
                id,
                full_name,
                email,
                phone,
                cell_id,
                active,
                auth_user_id
            `)
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (
        cmsFollowUpsIsCellLeader() &&
        cmsFollowUpsAccess.userId
    ) {

        query =
            query.eq(
                "auth_user_id",
                cmsFollowUpsAccess.userId
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

        throw error;

    }


    return data || [];

}


/* =====================================================
   LOAD ALL LEADERS FOR COORDINATOR
   ===================================================== */

async function cmsFollowUpsLoadAllDirectoryLeaders() {

    const {
        data,
        error
    } =
        await CMS_FOLLOWUPS_SUPABASE
            .from(
                "cell_leader_directory"
            )
            .select(`
                id,
                full_name,
                email,
                phone,
                cell_id,
                active,
                auth_user_id
            `)
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (
        error
    ) {

        throw error;

    }


    return data || [];

}


/* =====================================================
   LOAD PROFILES
   ===================================================== */

async function cmsFollowUpsLoadProfiles() {

    let query =
        CMS_FOLLOWUPS_SUPABASE
            .from("profiles")
            .select(`
                id,
                full_name,
                email,
                role,
                active,
                auth_user_id
            `)
            .eq(
                "active",
                true
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (
        cmsFollowUpsIsCellLeader() &&
        cmsFollowUpsAccess.userId
    ) {

        query =
            query.eq(
                "auth_user_id",
                cmsFollowUpsAccess.userId
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

        throw error;

    }


    return data || [];

}


/* =====================================================
   LOAD ALL PROFILES
   ===================================================== */

async function cmsFollowUpsLoadAllProfiles() {

    const {
        data,
        error
    } =
        await CMS_FOLLOWUPS_SUPABASE
            .from("profiles")
            .select(`
                id,
                full_name,
                email,
                role,
                active,
                auth_user_id
            `)
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (
        error
    ) {

        console.warn(
            "CMS Follow-ups: all-profiles query warning:",
            error
        );


        return [];

    }


    return data || [];

}


/* =====================================================
   LOAD FOLLOW-UPS
   ===================================================== */

async function cmsFollowUpsLoadRecords() {

    const {
        data,
        error
    } =
        await CMS_FOLLOWUPS_SUPABASE
            .from("follow_ups")
            .select(`
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
                updated_at,

                cells (
                    id,
                    name
                ),

                members (
                    id,
                    first_name,
                    last_name,
                    phone,
                    year_of_study,
                    combination,
                    active
                ),

                profiles (
                    id,
                    full_name,
                    role,
                    active
                )
            `)
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (
        error
    ) {

        throw error;

    }


    return data || [];

}


/* =====================================================
   CONVERT CELLS
   ===================================================== */

function cmsFollowUpsConvertCells(
    rows
) {

    return (
        rows || []
    )
        .map(
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
   CONVERT MEMBERS
   ===================================================== */

function cmsFollowUpsConvertMembers(
    rows
) {

    return (
        rows || []
    )
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
                        .join(" ");


                return {

                    id:
                        member.id,

                    name:
                        fullName,

                    fullName:
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

                    active:
                        member.active !== false,

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


/* =====================================================
   CONVERT LEADERS
   ===================================================== */

function cmsFollowUpsConvertLeaders(
    rows
) {

    return (
        rows || []
    )
        .map(
            function(leader) {

                const name =
                    leader.full_name ||
                    "Unnamed Cell Leader";


                return {

                    id:
                        leader.id,

                    name:
                        name,

                    fullName:
                        name,

                    leaderName:
                        name,

                    email:
                        leader.email ||
                        "",

                    phone:
                        leader.phone ||
                        "",

                    cellId:
                        leader.cell_id,

                    active:
                        leader.active !== false,

                    authUserId:
                        leader.auth_user_id ||
                        null

                };

            }
        );

}


/* =====================================================
   LOOKUP HELPERS
   ===================================================== */

function cmsFollowUpsFindMember(
    memberId,
    members
) {

    return (
        members || []
    )
        .find(
            function(member) {

                return cmsFollowUpsSameId(
                    member.id,
                    memberId
                );

            }
        ) ||
        null;

}


function cmsFollowUpsFindCell(
    cellId,
    cells
) {

    return (
        cells || []
    )
        .find(
            function(cell) {

                return cmsFollowUpsSameId(
                    cell.id,
                    cellId
                );

            }
        ) ||
        null;

}


function cmsFollowUpsFindLeaderByDirectoryId(
    leaderId,
    leaders
) {

    return (
        leaders || []
    )
        .find(
            function(leader) {

                return cmsFollowUpsSameId(
                    leader.id,
                    leaderId
                );

            }
        ) ||
        null;

}


function cmsFollowUpsFindProfileById(
    profileId,
    profiles
) {

    return (
        profiles || []
    )
        .find(
            function(profile) {

                return cmsFollowUpsSameId(
                    profile.id,
                    profileId
                );

            }
        ) ||
        null;

}


function cmsFollowUpsFindProfileByAuthUserId(
    authUserId,
    profiles
) {

    return (
        profiles || []
    )
        .find(
            function(profile) {

                return cmsFollowUpsSameId(
                    profile.auth_user_id,
                    authUserId
                );

            }
        ) ||
        null;

}


/* =====================================================
   FRONTEND ASSIGNEE RESOLVER
   ===================================================== */

function cmsFollowUpsAssignedValue(
    assignedTo,
    profiles,
    leaders
) {

    return cmsFollowUpsResolveFrontendAssignee(
        assignedTo,
        leaders || [],
        profiles || []
    );

}


function cmsFollowUpsResolveFrontendAssignee(
    assignedTo,
    leaders,
    profiles
) {

    if (
        !assignedTo
    ) {

        return "";

    }


    const value =
        String(
            assignedTo
        ).trim();


    if (
        !value
    ) {

        return "";

    }


    /*
       Coordinator stored directly.
    */

    if (
        value.toLowerCase() ===
        "coordinator"
    ) {

        return "coordinator";

    }


    /*
       Coordinator profile UUID.
    */

    if (
        cmsFollowUpsCoordinatorProfileId &&
        value.toLowerCase() ===
        String(
            cmsFollowUpsCoordinatorProfileId
        ).toLowerCase()
    ) {

        return "coordinator";

    }


    /*
       Existing frontend leader format.
    */

    if (
        value.startsWith(
            "leader:"
        )
    ) {

        return value;

    }


    /*
       Direct directory leader ID.
    */

    const directLeader =
        cmsFollowUpsFindLeaderByDirectoryId(
            value,
            leaders
        );


    if (
        directLeader
    ) {

        return (
            "leader:" +
            String(
                directLeader.id
            )
        );

    }


    /*
       Profile UUID → profile → directory leader.
    */

    const profile =
        cmsFollowUpsFindProfileById(
            value,
            profiles
        );


    if (
        profile?.role ===
        "coordinator"
    ) {

        return "coordinator";

    }


    if (
        profile?.auth_user_id
    ) {

        const matchingLeader =
            (
                leaders || []
            )
                .find(
                    function(leader) {

                        return cmsFollowUpsSameId(
                            leader.auth_user_id,
                            profile.auth_user_id
                        );

                    }
                );


        if (
            matchingLeader
        ) {

            return (
                "leader:" +
                String(
                    matchingLeader.id
                )
            );

        }

    }


    /*
       Return raw value as final legacy fallback.
    */

    return value;

}


/* =====================================================
   COMPATIBILITY ALIASES

   Existing/older code sometimes used the lowercase
   versions. Keep them safely available.
   ===================================================== */

function cmsFollowUpsfindmember(
    memberId,
    members
) {

    return cmsFollowUpsFindMember(
        memberId,
        members
    );

}


function cmsFollowUpsfindcell(
    cellId,
    cells
) {

    return cmsFollowUpsFindCell(
        cellId,
        cells
    );

}


/* =====================================================
   CONVERT ONE FOLLOW-UP RECORD

   IMPORTANT:
   -----------------------------------------------------
   - Helpers are outside this function.
   - cellName is always defined.
   - memberName is always defined.
   - assignment is preserved.
   ===================================================== */

function cmsFollowUpsConvertRecord(
    row,
    members,
    cells,
    leaders,
    profiles
) {

    if (
        !row
    ) {

        return null;

    }


    const member =
        cmsFollowUpsFindMember(
            row.member_id,
            members
        );


    const cell =
        cmsFollowUpsFindCell(
            row.cell_id,
            cells
        );


    const memberName =
        member
            ? (
                member.name ||
                member.fullName ||
                [
                    member.first_name,
                    member.last_name
                ]
                    .filter(Boolean)
                    .join(" ") ||
                "Unknown Member"
            )
            : "Unknown Member";


    const cellName =
        cell?.name ||
        "Unknown Cell";


    /*
       Preserve the local frontend assignment.
    */

    let previousLocalRecord =
        null;


    try {

        const cachedFollowUps =
            cmsFollowUpsParse(
                localStorage.getItem(
                    "cmsFollowUps"
                ),
                []
            );


        if (
            Array.isArray(
                cachedFollowUps
            )
        ) {

            previousLocalRecord =
                cachedFollowUps
                    .find(
                        function(item) {

                            return cmsFollowUpsSameId(
                                item?.id,
                                row.id
                            );

                        }
                    ) ||
                null;

        }

    }

    catch (error) {

        console.warn(
            "CMS Follow-ups: assignment cache warning:",
            error
        );

    }


    let assignedTo =
        "";

    let assignedToName =
        "";


    /* =================================================
       STEP 1
       PRESERVE USER'S FRONTEND ASSIGNMENT
       ================================================= */

    if (
        previousLocalRecord?.assignedTo
    ) {

        const cachedValue =
            String(
                previousLocalRecord.assignedTo
            ).trim();


        if (
            cachedValue.toLowerCase() ===
            "coordinator"
        ) {

            assignedTo =
                "coordinator";

        }

        else if (
            cachedValue.startsWith(
                "leader:"
            )
        ) {

            assignedTo =
                cachedValue;

        }

    }


    /* =================================================
       STEP 2
       DATABASE → FRONTEND ASSIGNMENT
       ================================================= */

    if (
        !assignedTo &&
        row.assigned_to
    ) {

        const databaseAssignedTo =
            String(
                row.assigned_to
            ).trim();


        if (
            databaseAssignedTo.toLowerCase() ===
            "coordinator"
        ) {

            assignedTo =
                "coordinator";

        }

        else {

            const resolved =
                cmsFollowUpsResolveFrontendAssignee(
                    databaseAssignedTo,
                    leaders,
                    profiles
                );


            if (
                resolved ===
                "coordinator"
            ) {

                assignedTo =
                    "coordinator";

            }

            else if (
                resolved &&
                resolved.startsWith(
                    "leader:"
                )
            ) {

                assignedTo =
                    resolved;

            }

        }

    }


    /* =================================================
       STEP 3
       PROFILE-BASED FALLBACK
       ================================================= */

    if (
        !assignedTo &&
        row.assigned_to
    ) {

        const profile =
            cmsFollowUpsFindProfileById(
                row.assigned_to,
                profiles
            );


        if (
            profile?.role ===
            "coordinator"
        ) {

            assignedTo =
                "coordinator";

        }

        else if (
            profile?.auth_user_id
        ) {

            const matchingLeader =
                (
                    leaders || []
                )
                    .find(
                        function(leader) {

                            return cmsFollowUpsSameId(
                                leader.auth_user_id,
                                profile.auth_user_id
                            );

                        }
                    );


            if (
                matchingLeader
            ) {

                assignedTo =
                    "leader:" +
                    String(
                        matchingLeader.id
                    );

            }

        }

    }


    /* =================================================
       STEP 4
       LEGACY DIRECTORY ID FALLBACK
       ================================================= */

    if (
        !assignedTo &&
        row.assigned_to
    ) {

        const legacyLeader =
            cmsFollowUpsFindLeaderByDirectoryId(
                row.assigned_to,
                leaders
            );


        if (
            legacyLeader
        ) {

            assignedTo =
                "leader:" +
                String(
                    legacyLeader.id
                );

        }

    }


    /* =================================================
       STEP 5
       ASSIGNMENT DISPLAY NAME
       ================================================= */

    if (
        assignedTo.toLowerCase() ===
        "coordinator"
    ) {

        assignedToName =
            "Coordinator";

    }

    else if (
        assignedTo.startsWith(
            "leader:"
        )
    ) {

        const leaderId =
            assignedTo.substring(
                7
            );


        const leader =
            cmsFollowUpsFindLeaderByDirectoryId(
                leaderId,
                leaders
            );


        if (
            leader
        ) {

            assignedToName =
                leader.name ||
                leader.fullName ||
                leader.leaderName ||
                "Cell Leader";

        }

    }


    /* =================================================
       STEP 6
       PRESERVE CACHED DISPLAY NAME
       ================================================= */

    if (
        !assignedToName &&
        previousLocalRecord?.assignedToName
    ) {

        const cachedName =
            String(
                previousLocalRecord.assignedToName
            ).trim();


        if (
            cachedName &&
            cachedName !== "—" &&
            cachedName !== "-"
        ) {

            assignedToName =
                cachedName;

        }

    }


    /* =================================================
       STEP 7
       DATABASE PROFILE NAME FALLBACK
       ================================================= */

    if (
        !assignedToName &&
        row.assigned_to
    ) {

        const profile =
            cmsFollowUpsFindProfileById(
                row.assigned_to,
                profiles
            );


        if (
            profile?.role ===
            "coordinator"
        ) {

            assignedToName =
                "Coordinator";

        }

        else if (
            profile?.full_name
        ) {

            assignedToName =
                profile.full_name;

        }

    }


    /* =================================================
       STEP 8
       NEVER DISPLAY — FOR VALID ASSIGNMENT
       ================================================= */

    if (
        !assignedToName &&
        assignedTo
    ) {

        if (
            assignedTo.toLowerCase() ===
            "coordinator"
        ) {

            assignedToName =
                "Coordinator";

        }

        else if (
            assignedTo.startsWith(
                "leader:"
            )
        ) {

            assignedToName =
                "Cell Leader";

        }

    }


    /* =================================================
       ONLY TRULY UNASSIGNED RECORDS GET —
       ================================================= */

    if (
        !assignedTo
    ) {

        assignedTo =
            "";

        assignedToName =
            "—";

    }


    /* =================================================
       FINAL CMS FOLLOW-UP OBJECT
       ================================================= */

    return {

        id:
            row.id,

        cellId:
            row.cell_id,

        cellName:
            cellName,

        memberId:
            row.member_id,

        memberName:
            memberName,

        assignedTo:
            assignedTo,

        assignedToName:
            assignedToName,

        reason:
            row.subject ||
            "",

        details:
            row.description ||
            "",

        priority:
            row.priority ||
            "Medium",

        followUpDate:
            row.due_date ||
            "",

        status:
            row.status ||
            "Pending",

        actionTaken:
            row.action_taken ||
            "",

        nextAction:
            row.next_action ||
            "",

        createdAt:
            row.created_at ||
            new Date()
                .toISOString(),

        updatedAt:
            row.updated_at ||
            row.created_at ||
            new Date()
                .toISOString(),

        completedAt:
            row.completed_at ||
            null,

        reportId:
            row.report_id ||
            null

    };

}


/* =====================================================
   CONVERT FOLLOW-UP RECORDS
   ===================================================== */

function cmsFollowUpsConvertRecords(
    rows,
    members,
    cells,
    leaders,
    profiles
) {

    return (
        Array.isArray(
            rows
        )
            ? rows
            : []
    )
        .map(
            function(row) {

                return cmsFollowUpsConvertRecord(
                    row,
                    members,
                    cells,
                    leaders,
                    profiles
                );

            }
        )
        .filter(
            Boolean
        );

}


/* =====================================================
   HYDRATE EXISTING CMS STORAGE
   ===================================================== */

async function cmsFollowUpsHydrate() {

    if (
        !CMS_FOLLOWUPS_SUPABASE
    ) {

        throw new Error(
            "Supabase client is not available."
        );

    }


    await cmsFollowUpsInitializeAccess();


    /*
       Coordinator ID is only required when
       resolving coordinator assignment.
    */

    try {

        await cmsFollowUpsLoadCoordinatorProfileId();

    }

    catch (error) {

        if (
            !cmsFollowUpsIsCellLeader()
        ) {

            throw error;

        }


        console.warn(
            "CMS Follow-ups: coordinator profile lookup warning:",
            error
        );

    }


    console.log(
        "CMS Follow-ups: loading live Supabase data..."
    );


    const dbCells =
        await cmsFollowUpsLoadCells();


    const dbMembers =
        await cmsFollowUpsLoadMembers();


    const dbLeaders =
        cmsFollowUpsIsCoordinator()
            ? await cmsFollowUpsLoadAllDirectoryLeaders()
            : await cmsFollowUpsLoadLeaders();


    const dbProfiles =
        await cmsFollowUpsLoadAllProfiles();


    const dbFollowUps =
        await cmsFollowUpsLoadRecords();


    const cmsCells =
        cmsFollowUpsConvertCells(
            dbCells
        );


    const cmsMembers =
        cmsFollowUpsConvertMembers(
            dbMembers
        );


    const cmsLeaders =
        cmsFollowUpsConvertLeaders(
            dbLeaders
        );


    const cmsFollowUps =
        cmsFollowUpsConvertRecords(
            dbFollowUps,
            dbMembers,
            dbCells,
            dbLeaders,
            dbProfiles
        );


    cmsFollowUpsSetLocal(
        "cmsCells",
        cmsCells
    );


    cmsFollowUpsSetLocal(
        "cmsMembers",
        cmsMembers
    );


    cmsFollowUpsSetLocal(
        "cmsCellLeaders",
        cmsLeaders
    );


    cmsFollowUpsSetLocal(
        "cmsLeaders",
        cmsLeaders
    );


    cmsFollowUpsSetLocal(
        "cmsFollowUps",
        cmsFollowUps
    );


    console.log(
        "CMS Follow-ups: Supabase hydration complete."
    );


    console.log({

        cells:
            cmsCells.length,

        members:
            cmsMembers.length,

        leaders:
            cmsLeaders.length,

        followUps:
            cmsFollowUps.length

    });

}


/* =====================================================
   REPORT ID
   ===================================================== */

function cmsFollowUpsGetReportId(
    reportId
) {

    if (
        !reportId
    ) {

        return null;

    }


    if (
        cmsFollowUpsIsUUID(
            reportId
        )
    ) {

        return reportId;

    }


    const reportMap =
        cmsFollowUpsParse(
            localStorage.getItem(
                "cmsReportIdMap"
            ),
            {}
        );


    return (
        reportMap[
            String(
                reportId
            )
        ] ||
        null
    );

}


/* =====================================================
   RESOLVE ASSIGNEE → PROFILE UUID
   ===================================================== */

async function cmsFollowUpsResolveAssignee(
    assignedTo,
    leaders,
    profiles
) {

    if (
        !assignedTo
    ) {

        return null;

    }


    const value =
        String(
            assignedTo
        ).trim();


    if (
        !value
    ) {

        return null;

    }


    /*
       COORDINATOR
    */

    if (
        value.toLowerCase() ===
        "coordinator"
    ) {

        const coordinatorId =
            cmsFollowUpsCoordinatorProfileId ||
            await cmsFollowUpsLoadCoordinatorProfileId();


        if (
            !coordinatorId
        ) {

            throw new Error(
                "No active coordinator profile is available."
            );

        }


        return coordinatorId;

    }


    /*
       Already a canonical profile UUID.
    */

    if (
        cmsFollowUpsIsUUID(
            value
        )
    ) {

        const directProfile =
            cmsFollowUpsFindProfileById(
                value,
                profiles
            );


        if (
            directProfile?.id
        ) {

            return directProfile.id;

        }


        return value;

    }


    /*
       FRONTEND LEADER VALUE:

       leader:<cell_leader_directory.id>
    */

    let leaderDirectoryId =
        value;


    if (
        leaderDirectoryId
            .toLowerCase()
            .startsWith(
                "leader:"
            )
    ) {

        leaderDirectoryId =
            leaderDirectoryId.substring(
                7
            );

    }


    const directoryLeader =
        cmsFollowUpsFindLeaderByDirectoryId(
            leaderDirectoryId,
            leaders
        );


    if (
        !directoryLeader
    ) {

        throw new Error(
            "The selected Cell Leader could not be found in the Cell Leader directory."
        );

    }


    /*
       Use directory auth_user_id
       to locate canonical profile UUID.
    */

    if (
        directoryLeader.auth_user_id
    ) {

        const loadedProfile =
            cmsFollowUpsFindProfileByAuthUserId(
                directoryLeader.auth_user_id,
                profiles
            );


        if (
            loadedProfile?.id
        ) {

            return loadedProfile.id;

        }


        /*
           Direct profile lookup.
        */

        const {
            data: targetProfile,
            error: targetProfileError
        } =
            await CMS_FOLLOWUPS_SUPABASE
                .from("profiles")
                .select(
                    "id,auth_user_id,role,active"
                )
                .eq(
                    "auth_user_id",
                    directoryLeader.auth_user_id
                )
                .eq(
                    "role",
                    "cell_leader"
                )
                .maybeSingle();


        if (
            targetProfileError
        ) {

            throw targetProfileError;

        }


        if (
            targetProfile?.id
        ) {

            return targetProfile.id;

        }

    }


    /*
       Legacy profile UUID fallback.
    */

    const directProfile =
        cmsFollowUpsFindProfileById(
            value,
            profiles
        );


    if (
        directProfile?.id
    ) {

        return directProfile.id;

    }


    throw new Error(
        "Unable to resolve the selected Cell Leader to a CMS profile. Please check that the leader has an active CMS profile linked to the leader account."
    );

}


/*
   Keep resolver available if another existing
   CMS script uses the window reference.
*/

window.cmsFollowUpsResolveAssignee =
    cmsFollowUpsResolveAssignee;


/* =====================================================
   DATABASE PAYLOAD
   ===================================================== */

async function cmsFollowUpsBuildPayload(
    followUp,
    leaders,
    profiles,
    isInsert
) {

    const assignedTo =
        await cmsFollowUpsResolveAssignee(
            followUp.assignedTo,
            leaders,
            profiles
        );


    const payload = {

        cell_id:
            followUp.cellId,

        member_id:
            followUp.memberId ||
            null,

        report_id:
            cmsFollowUpsGetReportId(
                followUp.reportId
            ),

        subject:
            followUp.reason ||
            "",

        description:
            followUp.details ||
            null,

        priority:
            followUp.priority ||
            "Medium",

        status:
            followUp.status ||
            "Pending",

        due_date:
            followUp.followUpDate ||
            null,

        assigned_to:
            assignedTo,

        action_taken:
            followUp.actionTaken ||
            null,

        next_action:
            followUp.nextAction ||
            null,

        completed_at:
            followUp.status ===
            "Completed"

                ? (
                    followUp.completedAt ||
                    new Date()
                        .toISOString()
                )

                : null,

        updated_at:
            new Date()
                .toISOString()

    };


    /*
       Preserve created_at for an existing
       frontend record where available.
    */

    if (
        isInsert &&
        followUp.createdAt
    ) {

        payload.created_at =
            followUp.createdAt;

    }


    return payload;

}


/* =====================================================
   CHECK WHETHER DATABASE ROW EXISTS
   ===================================================== */

async function cmsFollowUpsRowExists(
    id
) {

    if (
        !cmsFollowUpsIsUUID(
            id
        )
    ) {

        return false;

    }


    const {
        data,
        error
    } =
        await CMS_FOLLOWUPS_SUPABASE
            .from(
                "follow_ups"
            )
            .select(
                "id"
            )
            .eq(
                "id",
                id
            )
            .maybeSingle();


    if (
        error
    ) {

        throw error;

    }


    return Boolean(
        data
    );

}


/* =====================================================
   SAVE ONE FOLLOW-UP
   ===================================================== */

async function cmsFollowUpsPersistOne(
    followUp
) {

    /*
       Fresh reference data before writing.
    */

    const dbCells =
        await cmsFollowUpsLoadCells();


    const dbMembers =
        await cmsFollowUpsLoadMembers();


    const dbLeaders =
        cmsFollowUpsIsCoordinator()
            ? await cmsFollowUpsLoadAllDirectoryLeaders()
            : await cmsFollowUpsLoadLeaders();


    const dbProfiles =
        await cmsFollowUpsLoadAllProfiles();


    /*
       Prevent cross-cell modification.
    */

    if (
        cmsFollowUpsIsCellLeader() &&
        cmsFollowUpsAccess.cellId &&
        String(
            followUp.cellId
        ) !==
        String(
            cmsFollowUpsAccess.cellId
        )
    ) {

        throw new Error(
            "You can only manage follow-ups for your assigned cell."
        );

    }


    /*
       Existing UUID?
    */

    let recordId =
        cmsFollowUpsIsUUID(
            followUp.id
        )
            ? String(
                followUp.id
            )
            : null;


    let isExisting =
        false;


    if (
        recordId
    ) {

        isExisting =
            await cmsFollowUpsRowExists(
                recordId
            );

    }


    /*
       New rows receive a proper Supabase UUID.
    */

    if (
        !isExisting
    ) {

        recordId =
            cmsFollowUpsIsUUID(
                recordId
            )
                ? recordId
                : cmsFollowUpsCreateUUID();

    }


    const payload =
        await cmsFollowUpsBuildPayload(
            followUp,
            dbLeaders,
            dbProfiles,
            !isExisting
        );


    if (
        !isExisting
    ) {

        payload.id =
            recordId;

    }


    /*
       Database write.
    */

    try {

        if (
            isExisting
        ) {

            const {
                error
            } =
                await CMS_FOLLOWUPS_SUPABASE
                    .from(
                        "follow_ups"
                    )
                    .update(
                        payload
                    )
                    .eq(
                        "id",
                        recordId
                    );


            if (
                error
            ) {

                throw error;

            }


            console.log(
                "CMS Follow-ups: Supabase UPDATE confirmed.",
                recordId
            );

        }

        else {

            const {
                error
            } =
                await CMS_FOLLOWUPS_SUPABASE
                    .from(
                        "follow_ups"
                    )
                    .insert(
                        payload
                    );


            if (
                error
            ) {

                throw error;

            }


            console.log(
                "CMS Follow-ups: Supabase INSERT confirmed.",
                recordId
            );

        }

    }

    catch (error) {

        console.error(
            "CMS Follow-ups: database write failed.",
            {
                error:
                    error,

                message:
                    error?.message,

                code:
                    error?.code,

                details:
                    error?.details,

                hint:
                    error?.hint,

                followUp:
                    followUp,

                payload:
                    payload

            }
        );


        throw error;

    }


    /*
       Canonical frontend copy.
    */

    const canonical =
        Object.assign(
            {},
            followUp,
            {
                id:
                    recordId
            }
        );


    /*
       Keep local cache synchronized.
    */

    const existing =
        cmsFollowUpsParse(
            localStorage.getItem(
                "cmsFollowUps"
            ),
            []
        );


    const list =
        Array.isArray(
            existing
        )
            ? existing.slice()
            : [];


    const index =
        list.findIndex(
            function(item) {

                return (
                    cmsFollowUpsSameId(
                        item?.id,
                        followUp.id
                    ) ||
                    cmsFollowUpsSameId(
                        item?.id,
                        recordId
                    )
                );

            }
        );


    if (
        index >= 0
    ) {

        list[index] =
            canonical;

    }

    else {

        list.push(
            canonical
        );

    }


    cmsFollowUpsSetLocal(
        "cmsFollowUps",
        list
    );


    return canonical;

}


/* =====================================================
   DIRECT SAVE API
   ===================================================== */

window.cmsFollowUpsSaveFollowUp =
    async function(
        followUp
    ) {

        if (
            !CMS_FOLLOWUPS_SUPABASE
        ) {

            throw new Error(
                "Supabase client is unavailable."
            );

        }


        const canonical =
            await cmsFollowUpsPersistOne(
                followUp
            );


        /*
           Reload authoritative rows.
        */

        await cmsFollowUpsRefreshCanonicalData();


        return canonical;

    };


/* =====================================================
   DIRECT DELETE API
   ===================================================== */

window.cmsFollowUpsDeleteFollowUp =
    async function(
        id
    ) {

        if (
            !CMS_FOLLOWUPS_SUPABASE
        ) {

            throw new Error(
                "Supabase client is unavailable."
            );

        }


        if (
            !cmsFollowUpsIsUUID(
                id
            )
        ) {

            throw new Error(
                "This follow-up does not have a valid Supabase record ID."
            );

        }


        const {
            error
        } =
            await CMS_FOLLOWUPS_SUPABASE
                .from(
                    "follow_ups"
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


        /*
           Remove from local cache first.
        */

        const existing =
            cmsFollowUpsParse(
                localStorage.getItem(
                    "cmsFollowUps"
                ),
                []
            );


        const remaining =
            (
                Array.isArray(
                    existing
                )
                    ? existing
                    : []
            )
                .filter(
                    function(item) {

                        return !cmsFollowUpsSameId(
                            item?.id,
                            id
                        );

                    }
                );


        cmsFollowUpsSetLocal(
            "cmsFollowUps",
            remaining
        );


        /*
           Preserve Records Center behavior.
        */

        try {

            if (
                typeof deleteRecordEntry ===
                "function"
            ) {

                deleteRecordEntry(
                    id
                );

            }

        }

        catch (error) {

            console.warn(
                "CMS Follow-ups: Records Center cleanup warning:",
                error
            );

        }


        /*
           Reload authoritative rows.
        */

        await cmsFollowUpsRefreshCanonicalData();


        return true;

    };


/* =====================================================
   REFRESH AUTHORITATIVE DATA
   ===================================================== */

async function cmsFollowUpsRefreshCanonicalData() {

    if (
        !CMS_FOLLOWUPS_SUPABASE
    ) {

        return [];

    }


    const dbCells =
        await cmsFollowUpsLoadCells();


    const dbMembers =
        await cmsFollowUpsLoadMembers();


    const dbLeaders =
        cmsFollowUpsIsCoordinator()
            ? await cmsFollowUpsLoadAllDirectoryLeaders()
            : await cmsFollowUpsLoadLeaders();


    const dbProfiles =
        await cmsFollowUpsLoadAllProfiles();


    const dbFollowUps =
        await cmsFollowUpsLoadRecords();


    const cmsCells =
        cmsFollowUpsConvertCells(
            dbCells
        );


    const cmsMembers =
        cmsFollowUpsConvertMembers(
            dbMembers
        );


    const cmsLeaders =
        cmsFollowUpsConvertLeaders(
            dbLeaders
        );


    const cmsFollowUps =
        cmsFollowUpsConvertRecords(
            dbFollowUps,
            dbMembers,
            dbCells,
            dbLeaders,
            dbProfiles
        );


    cmsFollowUpsSetLocal(
        "cmsCells",
        cmsCells
    );


    cmsFollowUpsSetLocal(
        "cmsMembers",
        cmsMembers
    );


    cmsFollowUpsSetLocal(
        "cmsCellLeaders",
        cmsLeaders
    );


    cmsFollowUpsSetLocal(
        "cmsLeaders",
        cmsLeaders
    );


    cmsFollowUpsSetLocal(
        "cmsFollowUps",
        cmsFollowUps
    );


    /*
       Keep existing follow-ups.js arrays synchronized.
    */

    try {

        if (
            typeof cells !==
            "undefined"
        ) {

            cells =
                cmsCells;

        }


        if (
            typeof members !==
            "undefined"
        ) {

            members =
                cmsMembers;

        }


        if (
            typeof cellLeaders !==
            "undefined"
        ) {

            cellLeaders =
                cmsLeaders;

        }


        if (
            typeof followUps !==
            "undefined"
        ) {

            followUps =
                cmsFollowUps;

        }

    }

    catch (error) {

        console.warn(
            "CMS Follow-ups: live-array refresh warning:",
            error
        );

    }


    /*
       Preserve existing rendering.
    */

    try {

        if (
            typeof renderFollowUps ===
            "function"
        ) {

            renderFollowUps(
                document.getElementById(
                    "followUpSearch"
                )?.value ||
                ""
            );

        }


        if (
            typeof updateStatistics ===
            "function"
        ) {

            updateStatistics();

        }

    }

    catch (error) {

        console.warn(
            "CMS Follow-ups: render refresh warning:",
            error
        );

    }


    return cmsFollowUps;

}


/* =====================================================
   LOCAL STORAGE SYNC

   Kept for compatibility.

   IMPORTANT:
   The active automatic watcher remains disabled.
   Direct Save/Delete APIs handle Supabase writes.
   ===================================================== */

async function cmsFollowUpsSync(
    localValue
) {

    if (
        cmsFollowUpsHydrating ||
        cmsFollowUpsSyncing ||
        !Array.isArray(
            localValue
        ) ||
        !CMS_FOLLOWUPS_SUPABASE
    ) {

        return;

    }


    cmsFollowUpsSyncing =
        true;


    try {

        const localRows =
            localValue.slice();


        for (
            const followUp
            of localRows
        ) {

            if (
                !followUp ||
                !followUp.cellId
            ) {

                continue;

            }


            const canonical =
                await cmsFollowUpsPersistOne(
                    followUp
                );


            const index =
                localRows.findIndex(
                    function(item) {

                        return cmsFollowUpsSameId(
                            item?.id,
                            followUp.id
                        );

                    }
                );


            if (
                index >= 0
            ) {

                localRows[index] =
                    canonical;

            }

        }


        cmsFollowUpsSetLocal(
            "cmsFollowUps",
            localRows
        );


        await cmsFollowUpsRefreshCanonicalData();


        console.log(
            "CMS Follow-ups: synchronization complete."
        );

    }

    catch (error) {

        console.error(
            "CMS Follow-ups synchronization failed:",
            error
        );

    }

    finally {

        cmsFollowUpsSyncing =
            false;

    }

}


/* =====================================================
   STORAGE WATCHER
   ===================================================== */

function cmsFollowUpsInstallStorageSync() {

    if (
        cmsFollowUpsStorageInstalled
    ) {

        return;

    }


    cmsFollowUpsStorageInstalled =
        true;


    console.log(
        "CMS Follow-ups: localStorage watcher disabled; direct Supabase save path is active."
    );

}


/* =====================================================
   REALTIME
   ===================================================== */

function cmsFollowUpsSubscribeRealtime() {

    if (
        !CMS_FOLLOWUPS_SUPABASE
    ) {

        return;

    }


    if (
        cmsFollowUpsRealtimeChannel
    ) {

        return;

    }


    cmsFollowUpsRealtimeChannel =
        CMS_FOLLOWUPS_SUPABASE
            .channel(
                "cms-follow-ups-live"
            )
            .on(
                "postgres_changes",
                {
                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "follow_ups"
                },
                async function() {

                    try {

                        cmsFollowUpsSyncing =
                            true;


                        await cmsFollowUpsRefreshCanonicalData();


                        console.log(
                            "CMS Follow-ups realtime: refreshed."
                        );

                    }

                    catch (error) {

                        console.error(
                            "CMS Follow-ups realtime refresh failed:",
                            error
                        );

                    }

                    finally {

                        cmsFollowUpsSyncing =
                            false;

                    }

                }
            )
            .subscribe(
                function(status) {

                    console.log(
                        "CMS Follow-ups realtime:",
                        status
                    );

                }
            );

}


/* =====================================================
   LOAD ORIGINAL FOLLOW-UPS UI
   ===================================================== */

function cmsFollowUpsLoadOriginalScript() {

    const existing =
        document.querySelector(
            'script[src*="follow-ups.js"]'
        );


    if (
        existing
    ) {

        cmsFollowUpsOriginalScriptLoaded =
            true;

        return Promise.resolve();

    }


    if (
        cmsFollowUpsOriginalScriptLoaded
    ) {

        return Promise.resolve();

    }


    cmsFollowUpsOriginalScriptLoaded =
        true;


    return new Promise(
        function(
            resolve,
            reject
        ) {

            const script =
                document.createElement(
                    "script"
                );


            script.src =
                "follow-ups.js";


            script.dataset.cmsFollowups =
                "true";


            script.onload =
                function() {

                    console.log(
                        "CMS Follow-ups: existing UI loaded."
                    );


                    resolve();

                };


            script.onerror =
                function(error) {

                    cmsFollowUpsOriginalScriptLoaded =
                        false;


                    console.error(
                        "CMS Follow-ups: failed to load follow-ups.js",
                        error
                    );


                    reject(
                        error
                    );

                };


            document.body.appendChild(
                script
            );

        }
    );

}


/* =====================================================
   START BRIDGE
   ===================================================== */

(async function startCMSFollowUpsBridge() {

    if (
        !CMS_FOLLOWUPS_SUPABASE
    ) {

        console.error(
            "CMS Follow-ups Bridge: Supabase client unavailable."
        );

        return;

    }


    try {

        /*
           1. Access
        */

        await cmsFollowUpsInitializeAccess();


        /*
           2. Supabase → local cache
        */

        await cmsFollowUpsHydrate();


        /*
           3. Hydration finished
        */

        cmsFollowUpsHydrating =
            false;


        /*
           4. Keep the direct-save architecture.
        */

        cmsFollowUpsInstallStorageSync();


        /*
           5. Existing Follow-ups UI
        */

        await cmsFollowUpsLoadOriginalScript();


        /*
           6. One final authoritative refresh
        */

        await cmsFollowUpsRefreshCanonicalData();


        /*
           7. Realtime
        */

        cmsFollowUpsSubscribeRealtime();


        console.log(
            "CMS Follow-ups Supabase Bridge initialized successfully."
        );

    }

    catch (error) {

        cmsFollowUpsHydrating =
            false;


        console.error(
            "CMS Follow-ups Bridge initialization failed:",
            {
                error:
                    error,

                message:
                    error?.message,

                code:
                    error?.code,

                details:
                    error?.details,

                hint:
                    error?.hint

            }
        );


        /*
           Preserve existing page behavior even
           if Supabase temporarily fails.
        */

        try {

            cmsFollowUpsInstallStorageSync();


            await cmsFollowUpsLoadOriginalScript();

        }

        catch (fallbackError) {

            console.error(
                "CMS Follow-ups: original UI fallback failed:",
                fallbackError
            );

        }

    }

})();