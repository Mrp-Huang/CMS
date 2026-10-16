/* =========================================================
   GBU RUKARA CMS AI ASSISTANT
   COMPLETE IMPROVED VERSION

   AI PROVIDER:
   Cloudflare Workers AI

   CAPABILITIES:
   - Read live CMS data
   - Analyze cells, leaders and members
   - Analyze attendance and visitors
   - Analyze weekly reports and follow-ups
   - Analyze evangelism records
   - Rank cell attendance using calculated figures
   - Identify attendance data-quality problems
   - Answer general Coordinator questions
   - Provide management recommendations

   SECURITY:
   - Active Coordinators only
   - Read-only access
   - No CMS record modifications
   - No credentials exposed to the browser
   ========================================================= */

import { createClient } from "npm:@supabase/supabase-js@2";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const SUPABASE_URL =
    Deno.env.get("SUPABASE_URL");

const SUPABASE_SECRET_KEYS_RAW =
    Deno.env.get("SUPABASE_SECRET_KEYS");

const CLOUDFLARE_ACCOUNT_ID =
    Deno.env.get("CLOUDFLARE_ACCOUNT_ID");

const CLOUDFLARE_API_TOKEN =
    Deno.env.get("CLOUDFLARE_API_TOKEN");

const CLOUDFLARE_MODEL =
    "@cf/meta/llama-3.1-8b-instruct-fp8";

const MAX_ROWS_PER_TABLE = 5000;
const PAGE_SIZE = 500;
const MAX_HISTORY_MESSAGES = 8;
const MAX_HISTORY_MESSAGE_LENGTH = 2000;
const MAX_REQUEST_BODY_LENGTH = 20000;


if (!SUPABASE_URL) {
    throw new Error("SUPABASE_URL is missing.");
}

if (!SUPABASE_SECRET_KEYS_RAW) {
    throw new Error("SUPABASE_SECRET_KEYS is missing.");
}

let secretKeys: Record<string, string>;

try {
    secretKeys = JSON.parse(SUPABASE_SECRET_KEYS_RAW);
} catch {
    throw new Error(
        "SUPABASE_SECRET_KEYS is not valid JSON."
    );
}

if (!secretKeys.default) {
    throw new Error(
        "The Supabase server key is missing."
    );
}


/* =========================================================
   SERVER-SIDE SUPABASE CLIENT
   ========================================================= */

const supabaseAdmin = createClient(
    SUPABASE_URL,
    secretKeys.default,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);


/* =========================================================
   CORS
   ========================================================= */

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",

    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",

    "Access-Control-Allow-Methods":
        "POST, OPTIONS"
};


/* =========================================================
   RESPONSE HELPERS
   ========================================================= */

function jsonResponse(
    body: Record<string, unknown>,
    status = 200
): Response {

    return new Response(
        JSON.stringify(body),
        {
            status,

            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "Cache-Control": "no-store"
            }
        }
    );

}


function text(value: unknown): string {

    return String(value ?? "").trim();

}


function dateKey(value: unknown): string {

    return text(value).slice(0, 10);

}


function safeNumber(value: unknown): number {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;

}


function normalizeSearch(value: unknown): string {

    return text(value)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

}


function clip(
    value: unknown,
    maxLength = 600
): string {

    const result = text(value);

    return result.length <= maxLength
        ? result
        : result.slice(0, maxLength) + "…";

}


type ConversationMessage = {
    role: "user" | "assistant";
    content: string;
};


function normalizeHistory(value: unknown): ConversationMessage[] {

    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter(
            (item): item is Record<string, unknown> =>
                typeof item === "object" &&
                item !== null &&
                (item.role === "user" || item.role === "assistant") &&
                typeof item.content === "string"
        )
        .map(item => ({
            role: item.role as ConversationMessage["role"],
            content: text(item.content).slice(
                0,
                MAX_HISTORY_MESSAGE_LENGTH
            )
        }))
        .filter(item => item.content.length > 0)
        .slice(-MAX_HISTORY_MESSAGES);

}


function emptyLoadedTable(): LoadedTable {
    return {
        rows: [],
        totalCount: 0,
        truncated: false,
        error: null
    };
}


function errorText(error: unknown): string {

    if (error instanceof Error) {
        return error.message;
    }

    return String(error ?? "Unknown error");

}


/* =========================================================
   PAGINATED DATABASE LOADER

   Keeps the application responsive and identifies when
   a table exceeds the configured retrieval limit.
   ========================================================= */

type LoadedTable = {
    rows: any[];
    totalCount: number | null;
    truncated: boolean;
    error: string | null;
};


async function loadAllRows(
    table: string,
    columns: string,
    orderColumn: string,
    ascending = false
): Promise<LoadedTable> {

    const rows: any[] = [];

    let totalCount: number | null = null;

    for (
        let offset = 0;
        offset < MAX_ROWS_PER_TABLE;
        offset += PAGE_SIZE
    ) {

        const end = Math.min(
            offset + PAGE_SIZE - 1,
            MAX_ROWS_PER_TABLE - 1
        );

        const {
            data,
            error,
            count
        } = await supabaseAdmin
            .from(table)
            .select(
                columns,
                {
                    count: "exact"
                }
            )
            .order(
                orderColumn,
                {
                    ascending
                }
            )
            .range(
                offset,
                end
            );

        if (error) {
            throw new Error(
                `${table}: ${error.message}`
            );
        }

        if (offset === 0) {
            totalCount = count ?? null;
        }

        const page = data || [];

        rows.push(...page);

        if (page.length < PAGE_SIZE) {
            break;
        }

    }

    const truncated =
        totalCount !== null
            ? totalCount > rows.length
            : rows.length >= MAX_ROWS_PER_TABLE;

    return {
        rows,
        totalCount,
        truncated,
        error: null
    };

}


/* =========================================================
   SAFE TABLE LOADER

   A failure in one table does not automatically prevent
   general AI questions from being answered. CMS-specific
   questions are checked against their required tables.
   ========================================================= */

async function safeLoadAllRows(
    table: string,
    columns: string,
    orderColumn: string,
    ascending = false
): Promise<LoadedTable> {

    try {

        return await loadAllRows(
            table,
            columns,
            orderColumn,
            ascending
        );

    } catch (error) {

        const message = errorText(error);

        console.error(
            `CMS AI could not load ${table}:`,
            message
        );

        return {
            rows: [],
            totalCount: null,
            truncated: false,
            error: message
        };

    }

}


/* =========================================================
   ATTENDANCE STATUS NORMALIZATION
   ========================================================= */

type AttendanceStatus =
    | "present"
    | "late"
    | "absent"
    | "excused"
    | "unknown";


function normalizeAttendanceStatus(
    value: unknown
): AttendanceStatus {

    const status = text(value)
        .toLowerCase()
        .replace(/[^a-z]/g, "");

    if (
        [
            "present",
            "p",
            "here",
            "attended",
            "ontime"
        ].includes(status)
    ) {
        return "present";
    }

    if (
        [
            "late",
            "l",
            "latearrival"
        ].includes(status)
    ) {
        return "late";
    }

    if (
        [
            "absent",
            "a",
            "notpresent",
            "didnotattend"
        ].includes(status)
    ) {
        return "absent";
    }

    if (
        [
            "excused",
            "e",
            "excusedabsence"
        ].includes(status)
    ) {
        return "excused";
    }

    return "unknown";

}


/* =========================================================
   VISITOR COUNT NORMALIZATION
   ========================================================= */

function getVisitorCount(
    value: unknown
): number {

    if (Array.isArray(value)) {
        return value.length;
    }

    if (
        typeof value === "number" &&
        Number.isFinite(value)
    ) {
        return Math.max(0, value);
    }

    if (typeof value === "string") {

        const trimmed = value.trim();

        if (!trimmed) {
            return 0;
        }

        const numeric = Number(trimmed);

        if (Number.isFinite(numeric)) {
            return Math.max(0, numeric);
        }

        try {

            const parsed = JSON.parse(trimmed);

            if (Array.isArray(parsed)) {
                return parsed.length;
            }

        } catch {
            // Unrecognized value: do not guess.
        }

    }

    return 0;

}


/* =========================================================
   MAIN EDGE FUNCTION
   ========================================================= */

Deno.serve(
    async (
        request: Request
    ): Promise<Response> => {

        try {

            /* -----------------------------------------
               CORS
               ----------------------------------------- */

            if (request.method === "OPTIONS") {

                return new Response(
                    null,
                    {
                        status: 204,
                        headers: corsHeaders
                    }
                );

            }


            /* -----------------------------------------
               METHOD
               ----------------------------------------- */

            if (request.method !== "POST") {

                return jsonResponse(
                    {
                        success: false,
                        error: "POST requests only."
                    },
                    405
                );

            }


            /* -----------------------------------------
               CLOUDFLARE CONFIGURATION
               ----------------------------------------- */

            if (
                !CLOUDFLARE_ACCOUNT_ID ||
                !CLOUDFLARE_API_TOKEN
            ) {

                return jsonResponse(
                    {
                        success: false,

                        error:
                            "Cloudflare AI is not configured. Check CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in Supabase."
                    },
                    503
                );

            }


            /* -----------------------------------------
               AUTHENTICATION
               ----------------------------------------- */

            const authorization =
                request.headers.get("Authorization");

            if (!authorization) {

                return jsonResponse(
                    {
                        success: false,
                        error:
                            "Authentication required. Please sign in again.",
                        answer:
                            "Your login session is missing. Sign in again and retry."
                    },
                    401
                );

            }

            const bearerMatch =
                authorization.match(/^Bearer\s+(.+)$/i);

            const accessToken =
                bearerMatch?.[1]?.trim() || "";

            if (!accessToken) {

                return jsonResponse(
                    {
                        success: false,
                        error: "Authentication token is missing.",
                        answer:
                            "Your login session is missing. Sign in again and retry."
                    },
                    401
                );

            }

            const {
                data: userData,
                error: userError
            } = await supabaseAdmin.auth.getUser(
                accessToken
            );

            if (
                userError ||
                !userData?.user
            ) {

                console.error(
                    "CMS AI authentication failed:",
                    userError?.message
                );

                return jsonResponse(
                    {
                        success: false,
                        error:
                            "Your login session is invalid or expired.",
                        answer:
                            "Your login session is invalid or expired. Please sign in again."
                    },
                    401
                );

            }

            const user = userData.user;


            /* -----------------------------------------
               COORDINATOR PERMISSION CHECK
               ----------------------------------------- */

            const {
                data: profile,
                error: profileError
            } = await supabaseAdmin
                .from("profiles")
                .select(
                    "id, full_name, email, role, active"
                )
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();

            if (profileError) {

                console.error(
                    "CMS AI profile lookup failed:",
                    profileError.message
                );

                return jsonResponse(
                    {
                        success: false,
                        error:
                            "Unable to verify your CMS profile.",
                        answer:
                            "I could not verify your Coordinator profile. Please check the Supabase function logs."
                    },
                    500
                );

            }

            if (!profile) {

                return jsonResponse(
                    {
                        success: false,
                        error: "CMS profile not found.",
                        answer:
                            "Your CMS profile was not found."
                    },
                    403
                );

            }

            if (
                text(profile.role).toLowerCase() !==
                "coordinator"
            ) {

                return jsonResponse(
                    {
                        success: false,
                        error:
                            "CMS AI is available to Coordinators only.",
                        answer:
                            "CMS AI is available to Coordinators only."
                    },
                    403
                );

            }

            if (profile.active !== true) {

                return jsonResponse(
                    {
                        success: false,
                        error: "Coordinator account is inactive.",
                        answer:
                            "Your Coordinator account is inactive."
                    },
                    403
                );

            }


            /* -----------------------------------------
               QUESTION VALIDATION
               ----------------------------------------- */

            let body: any;

            try {
                const rawBody = await request.text();

                if (rawBody.length > MAX_REQUEST_BODY_LENGTH) {
                    return jsonResponse(
                        {
                            success: false,
                            error: "The request is too large."
                        },
                        413
                    );
                }

                body = JSON.parse(rawBody);
            } catch {
                return jsonResponse(
                    {
                        success: false,
                        error: "Invalid JSON request.",
                        answer:
                            "The request was invalid. Please enter your question again."
                    },
                    400
                );
            }

            if (
                typeof body?.question !== "string" ||
                (body?.history !== undefined &&
                    !Array.isArray(body.history))
            ) {
                return jsonResponse(
                    {
                        success: false,
                        error: "The request must include a question and an optional message history."
                    },
                    400
                );
            }

            const question = text(body?.question);

            if (!question) {

                return jsonResponse(
                    {
                        success: false,
                        error: "Please enter a question.",
                        answer:
                            "Please enter a question."
                    },
                    400
                );

            }

            if (question.length > 1500) {

                return jsonResponse(
                    {
                        success: false,
                        error:
                            "Please keep your question under 1,500 characters.",
                        answer:
                            "Please shorten your question to 1,500 characters or fewer."
                    },
                    413
                );

            }

            const history =
                normalizeHistory(body.history);

            const intentText = [
                ...history
                    .filter(message => message.role === "user")
                    .slice(-2)
                    .map(message => message.content),
                question
            ].join("\n");


            /* =================================================
               QUESTION ROUTING

               These checks allow the function to identify
               which CMS records are needed and whether a
               calculated answer can be provided directly.
               ================================================= */

            const asksAttendance =
                /\b(attendance|attended|attending|present|absent|late|excused)\b/i
                    .test(intentText) ||
                /\b(attendance rate|attendance record|meeting attendance)\b/i
                    .test(intentText);

            const asksMembers =
                /\b(member|members|student|students|membership|roster|combination|gender|year of study)\b/i
                    .test(intentText);

            const asksLeaders =
                /\b(cell leader|cell leaders|leader|leaders|leadership)\b/i
                    .test(intentText);

            const asksCells =
                /\b(cell|cells)\b/i
                    .test(intentText);

            const asksReports =
                /\b(report|reports|reporting|challenges|next week plan)\b/i
                    .test(intentText);

            const asksFollowUps =
                /\b(follow.?ups?|overdue|pending follow|assigned to|next action)\b/i
                    .test(intentText);

            const asksEvangelism =
                /\b(evangelism|outreach|people reached|saved|in progress|interested)\b/i
                    .test(intentText);

            const asksVisitors =
                /\b(visitor|visitors|newcomer|newcomers)\b/i
                    .test(intentText);

            const asksDataQuality =
                /\b(data quality|duplicate|duplicates|unknown status|unmatched|unassigned|inconsistent data)\b/i
                    .test(intentText);

            const asksOverview =
                /\b(overview|overall|whole cms|whole system|system health|management summary|summari[sz]e everything|all records|what needs attention)\b/i
                    .test(intentText);

            const asksNames =
                /\b(who|name|names|list|which members|member details|absent members|present members|late members|excused members)\b/i
                    .test(intentText);

            const wantsRanking =
                /\b(which|highest|high|most|more|top|rank|ranking|compare|largest|biggest|greatest|lowest|least|fewest|cell with|cells with)\b/i
                    .test(intentText);

            const asksAttendanceRanking =
                asksAttendance &&
                wantsRanking;

            const wantsEachCellLatest =
                /\b(each cell|per cell|latest for every cell|latest for each cell|latest meeting of each cell|every cell's latest)\b/i
                    .test(intentText);

            const asksAllTime =
                /\b(all time|all-time|ever|entire history|all recorded sessions|across all sessions)\b/i
                    .test(intentText);

            const includeVisitors =
                /\b(visitor|visitors|newcomer|newcomers|total people|including visitors)\b/i
                    .test(intentText);

            const asksAttendanceRate =
                /\b(rate|percentage|percent|proportion)\b/i
                    .test(intentText);

            const requestedDates = [
                ...intentText.matchAll(
                    /\b20\d{2}-\d{2}-\d{2}\b/g
                )
            ].map(
                match => match[0]
            );


            /* =================================================
               LOAD LIVE CMS DATA

               Historical members are retained in the lookup
               to identify people in old attendance records.
               ================================================= */

            const asksBroadManagement =
                asksOverview ||
                /\b(management plan|priority actions|recommendations|what should i do|improve our cells)\b/i
                    .test(intentText);

            const needsCells =
                asksBroadManagement ||
                asksOverview ||
                asksCells ||
                asksMembers ||
                asksLeaders ||
                asksAttendance ||
                asksReports ||
                asksFollowUps ||
                asksEvangelism ||
                asksVisitors ||
                asksDataQuality;

            const needsMembers =
                asksBroadManagement ||
                asksOverview ||
                asksMembers ||
                asksAttendance ||
                asksFollowUps ||
                asksDataQuality;

            const needsLeaders =
                asksBroadManagement ||
                asksOverview ||
                asksLeaders;

            const needsAttendance =
                asksBroadManagement ||
                asksOverview ||
                asksAttendance ||
                asksDataQuality;

            const needsReports =
                asksBroadManagement ||
                asksOverview ||
                asksReports;

            const needsFollowUps =
                asksBroadManagement ||
                asksOverview ||
                asksFollowUps;

            const needsEvangelism =
                asksBroadManagement ||
                asksOverview ||
                asksEvangelism;

            const needsVisitors =
                asksBroadManagement ||
                asksOverview ||
                asksVisitors;

            const [
                cellsLoaded,
                leadersLoaded,
                membersLoaded,
                sessionsLoaded,
                attendanceLoaded,
                reportsLoaded,
                followUpsLoaded,
                evangelismLoaded,
                visitorsLoaded
            ] = await Promise.all([

                needsCells ? safeLoadAllRows(
                    "cells",
                    "id, name, active",
                    "name",
                    true
                ) : Promise.resolve(emptyLoadedTable()),

                needsLeaders ? safeLoadAllRows(
                    "cell_leader_directory",
                    "id, full_name, cell_id, active",
                    "full_name",
                    true
                ) : Promise.resolve(emptyLoadedTable()),

                needsMembers ? safeLoadAllRows(
                    "members",
                    `
                        id,
                        cell_id,
                        first_name,
                        last_name,
                        gender,
                        year_of_study,
                        combination,
                        active,
                        created_at,
                        updated_at
                    `,
                    "created_at",
                    false
                ) : Promise.resolve(emptyLoadedTable()),

                needsAttendance ? safeLoadAllRows(
                    "attendance_sessions",
                    `
                        id,
                        cell_id,
                        meeting_date,
                        visitors,
                        notes,
                        created_at,
                        updated_at
                    `,
                    "meeting_date",
                    false
                ) : Promise.resolve(emptyLoadedTable()),

                needsAttendance ? safeLoadAllRows(
                    "attendance",
                    `
                        id,
                        session_id,
                        cell_id,
                        member_id,
                        meeting_date,
                        status,
                        created_at,
                        updated_at
                    `,
                    "meeting_date",
                    false
                ) : Promise.resolve(emptyLoadedTable()),

                needsReports ? safeLoadAllRows(
                    "weekly_reports",
                    `
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
                        status
                    `,
                    "report_date",
                    false
                ) : Promise.resolve(emptyLoadedTable()),

                needsFollowUps ? safeLoadAllRows(
                    "follow_ups",
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
                    `,
                    "created_at",
                    false
                ) : Promise.resolve(emptyLoadedTable()),

                needsEvangelism ? safeLoadAllRows(
                    "evangelism",
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
                    `,
                    "evangelism_date",
                    false
                ) : Promise.resolve(emptyLoadedTable()),

                needsVisitors ? safeLoadAllRows(
                    "visitors",
                    `
                        id,
                        full_name,
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
                    `,
                    "last_visit_date",
                    false
                ) : Promise.resolve(emptyLoadedTable())

            ]);


            /* =================================================
               CHECK DATA REQUIRED FOR THIS QUESTION
               ================================================= */

            const requiredErrors: string[] = [];

            function requireTable(
                tableName: string,
                table: LoadedTable
            ) {
                if (table.error) {
                    requiredErrors.push(
                        `${tableName}: ${table.error}`
                    );
                }
            }

            if (needsCells) {
                requireTable("cells", cellsLoaded);
            }

            if (needsMembers) {
                requireTable("members", membersLoaded);
            }

            if (needsLeaders) {
                requireTable(
                    "cell_leader_directory",
                    leadersLoaded
                );
            }

            if (needsAttendance) {
                requireTable(
                    "attendance_sessions",
                    sessionsLoaded
                );

                requireTable(
                    "attendance",
                    attendanceLoaded
                );

                requireTable(
                    "members",
                    membersLoaded
                );
            }

            if (needsReports) {
                requireTable(
                    "weekly_reports",
                    reportsLoaded
                );
            }

            if (needsFollowUps) {
                requireTable(
                    "follow_ups",
                    followUpsLoaded
                );

                requireTable(
                    "members",
                    membersLoaded
                );
            }

            if (needsEvangelism) {
                requireTable(
                    "evangelism",
                    evangelismLoaded
                );
            }

            if (needsVisitors) {
                requireTable(
                    "visitors",
                    visitorsLoaded
                );
            }

            const distinctErrors = [
                ...new Set(requiredErrors)
            ];

            if (distinctErrors.length > 0) {

                console.error(
                    "CMS AI required data could not be loaded:",
                    distinctErrors
                );

                return jsonResponse(
                    {
                        success: false,

                        error:
                            "Some CMS data required for this question could not be loaded.",

                        answer:
                            "I could not give a reliable answer because some required CMS data could not be loaded.\n\n" +
                            distinctErrors.join("\n")
                    },
                    503
                );

            }


            /* =================================================
               REFERENCE MAPS
               ================================================= */

            const cells = cellsLoaded.rows;
            const leaders = leadersLoaded.rows;
            const members = membersLoaded.rows;
            const sessions = sessionsLoaded.rows;
            const attendance = attendanceLoaded.rows;
            const reports = reportsLoaded.rows;
            const followUps = followUpsLoaded.rows;
            const evangelism = evangelismLoaded.rows;
            const visitors = visitorsLoaded.rows;

            const cellMap = new Map<string, string>();

            for (const cell of cells) {
                cellMap.set(
                    String(cell.id),
                    text(cell.name) || "Unnamed cell"
                );
            }

            const memberMap = new Map<string, string>();

            for (const member of members) {

                const name = [
                    member.first_name,
                    member.last_name
                ]
                    .map(text)
                    .filter(Boolean)
                    .join(" ")
                    .trim();

                memberMap.set(
                    String(member.id),
                    name || "Name not available"
                );

            }

            function cellName(id: unknown): string {
                return (
                    cellMap.get(String(id)) ||
                    "Cell not found"
                );
            }

            function memberName(id: unknown): string {
                return (
                    memberMap.get(String(id)) ||
                    "Member name not found"
                );
            }

            const activeCells = cells.filter(
                cell => cell.active === true
            );

            const activeMembers = members.filter(
                member => member.active === true
            );

            const activeLeaders = leaders.filter(
                leader => leader.active === true
            );


            /* =================================================
               TABLE COVERAGE
               ================================================= */

            const dataCoverage = {

                cells: {
                    loaded: cells.length,
                    total: cellsLoaded.totalCount,
                    truncated: cellsLoaded.truncated,
                    error: cellsLoaded.error
                },

                cell_leaders: {
                    loaded: leaders.length,
                    total: leadersLoaded.totalCount,
                    truncated: leadersLoaded.truncated,
                    error: leadersLoaded.error
                },

                members: {
                    loaded: members.length,
                    total: membersLoaded.totalCount,
                    truncated: membersLoaded.truncated,
                    error: membersLoaded.error
                },

                attendance_sessions: {
                    loaded: sessions.length,
                    total: sessionsLoaded.totalCount,
                    truncated: sessionsLoaded.truncated,
                    error: sessionsLoaded.error
                },

                attendance: {
                    loaded: attendance.length,
                    total: attendanceLoaded.totalCount,
                    truncated: attendanceLoaded.truncated,
                    error: attendanceLoaded.error
                },

                weekly_reports: {
                    loaded: reports.length,
                    total: reportsLoaded.totalCount,
                    truncated: reportsLoaded.truncated,
                    error: reportsLoaded.error
                },

                follow_ups: {
                    loaded: followUps.length,
                    total: followUpsLoaded.totalCount,
                    truncated: followUpsLoaded.truncated,
                    error: followUpsLoaded.error
                },

                evangelism: {
                    loaded: evangelism.length,
                    total: evangelismLoaded.totalCount,
                    truncated: evangelismLoaded.truncated,
                    error: evangelismLoaded.error
                },

                visitors: {
                    loaded: visitors.length,
                    total: visitorsLoaded.totalCount,
                    truncated: visitorsLoaded.truncated,
                    error: visitorsLoaded.error
                }

            };


            const sourceDefinitions = [
                {
                    label: "Cells",
                    table: "cells",
                    loaded: cellsLoaded,
                    rows: cells,
                    dateColumn: null,
                    included: needsCells
                },
                {
                    label: "Cell leaders",
                    table: "cell_leader_directory",
                    loaded: leadersLoaded,
                    rows: leaders,
                    dateColumn: null,
                    included: needsLeaders
                },
                {
                    label: "Members",
                    table: "members",
                    loaded: membersLoaded,
                    rows: members,
                    dateColumn: "created_at",
                    included: needsMembers
                },
                {
                    label: "Attendance sessions",
                    table: "attendance_sessions",
                    loaded: sessionsLoaded,
                    rows: sessions,
                    dateColumn: "meeting_date",
                    included: needsAttendance
                },
                {
                    label: "Attendance records",
                    table: "attendance",
                    loaded: attendanceLoaded,
                    rows: attendance,
                    dateColumn: "meeting_date",
                    included: needsAttendance
                },
                {
                    label: "Weekly reports",
                    table: "weekly_reports",
                    loaded: reportsLoaded,
                    rows: reports,
                    dateColumn: "report_date",
                    included: needsReports
                },
                {
                    label: "Follow-ups",
                    table: "follow_ups",
                    loaded: followUpsLoaded,
                    rows: followUps,
                    dateColumn: "due_date",
                    included: needsFollowUps
                },
                {
                    label: "Evangelism records",
                    table: "evangelism",
                    loaded: evangelismLoaded,
                    rows: evangelism,
                    dateColumn: "evangelism_date",
                    included: needsEvangelism
                },
                {
                    label: "Visitors",
                    table: "visitors",
                    loaded: visitorsLoaded,
                    rows: visitors,
                    dateColumn: "last_visit_date",
                    included: needsVisitors
                }
            ];

            const sources = sourceDefinitions
                .filter(source => source.included)
                .map(source => {
                    const dates = source.dateColumn
                        ? source.rows
                            .map(row => dateKey(row[source.dateColumn]))
                            .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
                            .sort()
                        : [];

                    return {
                        label: source.label,
                        table: source.table,
                        recordsLoaded: source.loaded.rows.length,
                        recordsTotal: source.loaded.totalCount,
                        truncated: source.loaded.truncated,
                        ...(dates.length
                            ? {
                                dateRange: {
                                    from: dates[0],
                                    to: dates[dates.length - 1]
                                }
                            }
                            : {})
                    };
                });


            /* =================================================
               ATTENDANCE: MATCH ROWS TO SESSIONS
               ================================================= */

            const sessionsById =
                new Map<string, any>();

            for (const session of sessions) {
                sessionsById.set(
                    String(session.id),
                    session
                );
            }

            const rowsBySession =
                new Map<string, any[]>();

            let unassignedRows = 0;
            let ambiguousMatches = 0;

            for (const row of attendance) {

                let matched: any = null;

                if (
                    row.session_id &&
                    sessionsById.has(
                        String(row.session_id)
                    )
                ) {
                    matched = sessionsById.get(
                        String(row.session_id)
                    );
                }

                if (!matched) {

                    const candidates = sessions.filter(
                        session =>
                            String(session.cell_id) ===
                                String(row.cell_id) &&
                            dateKey(session.meeting_date) ===
                                dateKey(row.meeting_date)
                    );

                    if (candidates.length === 1) {

                        matched = candidates[0];

                    } else {

                        unassignedRows++;

                        if (candidates.length > 1) {
                            ambiguousMatches++;
                        }

                        continue;

                    }

                }

                const key = String(matched.id);

                if (!rowsBySession.has(key)) {
                    rowsBySession.set(key, []);
                }

                rowsBySession.get(key)!.push(row);

            }


            /* =================================================
               BUILD ACCURATE ATTENDANCE SESSION SUMMARIES
               ================================================= */

            const sessionSummaries: any[] = [];

            let totalDuplicateRows = 0;
            let totalUnknownStatuses = 0;

            for (const session of sessions) {

                const rawRows =
                    rowsBySession.get(
                        String(session.id)
                    ) || [];

                /*
                 * Each member should be counted once in one
                 * session. Duplicate rows are flagged.
                 */

                const uniqueRows =
                    new Map<string, any>();

                let duplicateRows = 0;

                for (const row of rawRows) {

                    const key = row.member_id
                        ? `member:${row.member_id}`
                        : `row:${row.id}`;

                    const existing = uniqueRows.get(key);

                    if (!existing) {
                        uniqueRows.set(key, row);
                        continue;
                    }

                    duplicateRows++;

                    const currentTime = new Date(
                        row.updated_at ||
                        row.created_at ||
                        0
                    ).getTime();

                    const oldTime = new Date(
                        existing.updated_at ||
                        existing.created_at ||
                        0
                    ).getTime();

                    if (
                        Number.isFinite(currentTime) &&
                        currentTime >= (
                            Number.isFinite(oldTime)
                                ? oldTime
                                : 0
                        )
                    ) {
                        uniqueRows.set(key, row);
                    }

                }

                totalDuplicateRows += duplicateRows;

                const counts = {
                    present: 0,
                    late: 0,
                    absent: 0,
                    excused: 0,
                    unknown: 0
                };

                const memberDetails: any[] = [];

                for (const row of uniqueRows.values()) {

                    const status =
                        normalizeAttendanceStatus(
                            row.status
                        );

                    counts[status]++;

                    if (status === "unknown") {
                        totalUnknownStatuses++;
                    }

                    memberDetails.push({

                        member_id:
                            String(row.member_id || ""),

                        name:
                            memberName(row.member_id),

                        status:
                            text(row.status) || "(blank)",

                        status_category:
                            status

                    });

                }

                const rosterCount =
                    activeMembers.filter(
                        member =>
                            String(member.cell_id) ===
                            String(session.cell_id)
                    ).length;

                sessionSummaries.push({

                    id:
                        String(session.id),

                    cell_id:
                        String(session.cell_id),

                    cell:
                        cellName(session.cell_id),

                    date:
                        dateKey(session.meeting_date),

                    current_active_member_count:
                        rosterCount,

                    raw_attendance_rows:
                        rawRows.length,

                    unique_members_recorded:
                        uniqueRows.size,

                    duplicate_attendance_rows:
                        duplicateRows,

                    counts,

                    visitors:
                        getVisitorCount(session.visitors),

                    member_details:
                        memberDetails

                });

            }

            sessionSummaries.sort(
                (a, b) =>
                    String(b.date).localeCompare(
                        String(a.date)
                    )
            );


            /* =================================================
               LATEST ATTENDANCE SESSION PER CELL
               ================================================= */

            const latestByCell: any[] = [];

            for (const cell of cells) {

                const latest =
                    sessionSummaries.find(
                        session =>
                            session.cell_id ===
                            String(cell.id)
                    );

                if (!latest) {

                    latestByCell.push({
                        cell: cell.name,
                        session_found: false,

                        current_active_member_count:
                            activeMembers.filter(
                                member =>
                                    String(member.cell_id) ===
                                    String(cell.id)
                            ).length
                    });

                    continue;

                }

                latestByCell.push({
                    ...latest,
                    session_found: true
                });

            }


            /* =================================================
               ATTENDANCE TOTALS
               ================================================= */

            const overallAttendance = {
                present: 0,
                late: 0,
                absent: 0,
                excused: 0,
                unknown: 0,
                unique_member_rows: 0
            };

            for (const session of sessionSummaries) {

                overallAttendance.present +=
                    session.counts.present;

                overallAttendance.late +=
                    session.counts.late;

                overallAttendance.absent +=
                    session.counts.absent;

                overallAttendance.excused +=
                    session.counts.excused;

                overallAttendance.unknown +=
                    session.counts.unknown;

                overallAttendance.unique_member_rows +=
                    session.unique_members_recorded;

            }


            /* =================================================
               MEMBERSHIP SUMMARIES
               ================================================= */

            const membersByCell = cells.map(
                cell => {

                    const cellMembers =
                        members.filter(
                            member =>
                                String(member.cell_id) ===
                                String(cell.id)
                        );

                    return {

                        cell: cell.name,

                        active_members:
                            cellMembers.filter(
                                member =>
                                    member.active === true
                            ).length,

                        inactive_members:
                            cellMembers.filter(
                                member =>
                                    member.active === false
                            ).length,

                        unspecified_status:
                            cellMembers.filter(
                                member =>
                                    member.active !== true &&
                                    member.active !== false
                            ).length

                    };

                }
            );

            const membersByYear: Record<string, number> = {};
            const membersByCombination: Record<string, number> = {};

            for (const member of members) {

                const year =
                    text(member.year_of_study) ||
                    "Not specified";

                const combination =
                    text(member.combination) ||
                    "Not specified";

                membersByYear[year] =
                    (membersByYear[year] || 0) + 1;

                membersByCombination[combination] =
                    (membersByCombination[combination] || 0) + 1;

            }


            /* =================================================
               SELECT RELEVANT RECORDS
               ================================================= */

            const normalizedQuestion =
                normalizeSearch(intentText);

            const mentionedCells =
                cells.filter(
                    cell => {

                        const name =
                            normalizeSearch(cell.name);

                        return (
                            name.length > 2 &&
                            normalizedQuestion.includes(name)
                        );

                    }
                );

            const mentionedCellIds =
                new Set(
                    mentionedCells.map(
                        cell => String(cell.id)
                    )
                );

            function selectRelevantRows(
                rows: any[],
                dateField: string,
                defaultLimit = 15
            ): any[] {

                const chosen =
                    new Map<string, any>();

                function add(row: any) {

                    chosen.set(
                        String(row.id),
                        row
                    );

                }

                [...rows]
                    .sort(
                        (a, b) =>
                            dateKey(b[dateField]).localeCompare(
                                dateKey(a[dateField])
                            )
                    )
                    .slice(0, defaultLimit)
                    .forEach(add);

                for (const cellId of mentionedCellIds) {

                    [...rows]
                        .filter(
                            row =>
                                String(row.cell_id) === cellId
                        )
                        .sort(
                            (a, b) =>
                                dateKey(b[dateField]).localeCompare(
                                    dateKey(a[dateField])
                                )
                        )
                        .slice(0, 15)
                        .forEach(add);

                }

                for (const date of requestedDates) {

                    rows
                        .filter(
                            row =>
                                dateKey(row[dateField]) === date
                        )
                        .forEach(add);

                }

                return [...chosen.values()];

            }


            /* =================================================
               DATA SUMMARY AND COVERAGE
               ================================================= */

            const context: Record<string, any> = {

                generated_at:
                    new Date().toISOString(),

                coverage: {

                    tables:
                        dataCoverage,

                    attendance_quality: {

                        unassigned_attendance_rows:
                            unassignedRows,

                        ambiguous_session_matches:
                            ambiguousMatches,

                        duplicate_attendance_rows:
                            totalDuplicateRows,

                        unknown_attendance_status_rows:
                            totalUnknownStatuses

                    }

                },

                summary: {

                    active_cells:
                        activeCells.length,

                    cells_loaded:
                        cells.length,

                    active_members:
                        activeMembers.length,

                    members_loaded:
                        members.length,

                    active_cell_leaders:
                        activeLeaders.length,

                    attendance_sessions_loaded:
                        sessions.length,

                    attendance_member_rows_loaded:
                        attendance.length,

                    weekly_reports_loaded:
                        reports.length,

                    follow_ups_loaded:
                        followUps.length,

                    evangelism_records_loaded:
                        evangelism.length,

                    visitors_loaded:
                        visitors.length

                },

                cells:
                    cells.map(
                        cell => ({
                            name: cell.name,
                            active: cell.active === true
                        })
                    ),

                cell_leaders:
                    activeLeaders.map(
                        leader => ({
                            name: leader.full_name,
                            cell: cellName(leader.cell_id)
                        })
                    ),

                members_summary: {

                    active_total:
                        activeMembers.length,

                    inactive_total:
                        members.filter(
                            member =>
                                member.active === false
                        ).length,

                    by_cell:
                        membersByCell,

                    by_year:
                        membersByYear,

                    by_combination:
                        membersByCombination,

                    member_details:
                        members.slice(0, 150).map(
                            member => ({

                                name:
                                    memberName(member.id),

                                cell:
                                    cellName(member.cell_id),

                                active:
                                    member.active === true,

                                gender:
                                    member.gender,

                                year_of_study:
                                    member.year_of_study,

                                combination:
                                    member.combination

                            })
                        )

                },

                attendance_analysis: {

                    totals_across_loaded_sessions:
                        overallAttendance,

                    latest_session_for_each_cell:
                        latestByCell,

                    relevant_session_details:
                        sessionSummaries.slice(0, 20),

                    visitors_are_separate:
                        true,

                    current_roster_is_not_historical_roster:
                        true

                },

                weekly_report_summary: {

                    total_loaded:
                        reports.length,

                    total_database_count:
                        reportsLoaded.totalCount,

                    by_status:
                        reports.reduce(
                            (
                                result: Record<string, number>,
                                report
                            ) => {

                                const status =
                                    text(report.status) ||
                                    "Not specified";

                                result[status] =
                                    (result[status] || 0) + 1;

                                return result;

                            },
                            {}
                        ),

                    relevant_records:
                        selectRelevantRows(
                            reports,
                            "report_date",
                            12
                        ).map(
                            report => ({

                                cell:
                                    cellName(report.cell_id),

                                date:
                                    dateKey(report.report_date),

                                status:
                                    report.status,

                                meeting_location:
                                    clip(report.meeting_location, 200),

                                members_life:
                                    clip(report.members_life),

                                activity_done:
                                    clip(report.activity_done),

                                challenges_needs:
                                    clip(report.challenges_needs),

                                follow_up_needed:
                                    clip(report.follow_up_needed),

                                next_week_plan:
                                    clip(report.next_week_plan),

                                additional_comments:
                                    clip(report.additional_comments)

                            })
                        )

                },

                follow_up_summary: {

                    total_loaded:
                        followUps.length,

                    total_database_count:
                        followUpsLoaded.totalCount,

                    by_status:
                        followUps.reduce(
                            (
                                result: Record<string, number>,
                                item
                            ) => {

                                const status =
                                    text(item.status) ||
                                    "Not specified";

                                result[status] =
                                    (result[status] || 0) + 1;

                                return result;

                            },
                            {}
                        ),

                    relevant_records:
                        selectRelevantRows(
                            followUps,
                            "due_date",
                            15
                        ).map(
                            item => ({

                                cell:
                                    cellName(item.cell_id),

                                member:
                                    memberName(item.member_id),

                                reason:
                                    clip(item.subject, 200),

                                details:
                                    clip(item.description, 400),

                                priority:
                                    item.priority,

                                due_date:
                                    dateKey(item.due_date),

                                status:
                                    item.status,

                                action_taken:
                                    clip(item.action_taken, 300),

                                next_action:
                                    clip(item.next_action, 300)

                            })
                        )

                },

                evangelism_summary: {

                    total_records_loaded:
                        evangelism.length,

                    total_database_count:
                        evangelismLoaded.totalCount,

                    totals:
                        evangelism.reduce(
                            (
                                result: Record<string, number>,
                                item
                            ) => {

                                result.people_reached +=
                                    safeNumber(item.people_reached);

                                result.saved +=
                                    safeNumber(item.saved);

                                result.new_people +=
                                    safeNumber(item.new_people);

                                result.in_progress +=
                                    safeNumber(item.in_progress);

                                result.interested +=
                                    safeNumber(item.interested);

                                result.not_yet +=
                                    safeNumber(item.not_yet);

                                return result;

                            },
                            {
                                people_reached: 0,
                                saved: 0,
                                new_people: 0,
                                in_progress: 0,
                                interested: 0,
                                not_yet: 0
                            }
                        ),

                    relevant_records:
                        selectRelevantRows(
                            evangelism,
                            "evangelism_date",
                            15
                        ).map(
                            item => ({

                                cell:
                                    cellName(item.cell_id),

                                date:
                                    dateKey(item.evangelism_date),

                                type:
                                    item.evangelism_type,

                                location:
                                    clip(item.location, 200),

                                people_reached:
                                    safeNumber(item.people_reached),

                                saved:
                                    safeNumber(item.saved),

                                new_people:
                                    safeNumber(item.new_people),

                                in_progress:
                                    safeNumber(item.in_progress),

                                interested:
                                    safeNumber(item.interested),

                                not_yet:
                                    safeNumber(item.not_yet),

                                follow_up_needed:
                                    item.follow_up_needed,

                                notes:
                                    clip(item.notes || item.details, 350),

                                next_action:
                                    clip(item.next_action, 250)

                            })
                        )

                },

                visitor_summary: {

                    total_records_loaded:
                        visitors.length,

                    total_database_count:
                        visitorsLoaded.totalCount,

                    converted_to_member:
                        visitors.filter(
                            visitor =>
                                visitor.converted_to_member === true
                        ).length,

                    relevant_records:
                        selectRelevantRows(
                            visitors,
                            "last_visit_date",
                            15
                        ).map(
                            visitor => ({

                                name:
                                    clip(visitor.full_name, 100),

                                cell:
                                    cellName(visitor.cell_id),

                                year_of_study:
                                    visitor.year_of_study,

                                combination:
                                    visitor.combination,

                                association:
                                    visitor.association,

                                first_visit_date:
                                    dateKey(visitor.first_visit_date),

                                last_visit_date:
                                    dateKey(visitor.last_visit_date),

                                visit_count:
                                    safeNumber(visitor.visit_count),

                                converted_to_member:
                                    visitor.converted_to_member === true

                            })
                        )

                }

            };


            /* =================================================
               DETERMINISTIC ATTENDANCE RANKING

               Calculations are performed in code before AI
               is involved, reducing the chance of counting
               mistakes in attendance-ranking questions.
               ================================================= */

            if (
                asksAttendanceRanking &&
                sessionSummaries.length > 0
            ) {

                let comparisonSessions: any[] = [];

                let comparisonDescription = "";

                if (requestedDates.length > 0) {

                    comparisonSessions =
                        sessionSummaries.filter(
                            session =>
                                requestedDates.includes(session.date)
                        );

                    comparisonDescription =
                        `Recorded sessions on ${requestedDates.join(", ")}`;

                } else if (asksAllTime) {

                    comparisonSessions =
                        sessionSummaries;

                    comparisonDescription =
                        "All loaded recorded attendance sessions";

                } else if (wantsEachCellLatest) {

                    comparisonSessions =
                        latestByCell.filter(
                            session =>
                                session.session_found === true
                        );

                    comparisonDescription =
                        "The latest recorded session for each cell. Dates can differ between cells.";

                } else {

                    const latestDate =
                        sessionSummaries
                            .map(
                                session => session.date
                            )
                            .filter(Boolean)
                            .sort(
                                (a, b) => b.localeCompare(a)
                            )[0];

                    comparisonSessions = latestDate
                        ? sessionSummaries.filter(
                            session =>
                                session.date === latestDate
                        )
                        : [];

                    comparisonDescription =
                        latestDate
                            ? `Recorded sessions on ${latestDate}`
                            : "Available recorded sessions";

                }


                const rankingRows =
                    comparisonSessions.map(
                        session => {

                            const counts =
                                session.counts;

                            const present =
                                safeNumber(counts.present);

                            const late =
                                safeNumber(counts.late);

                            const absent =
                                safeNumber(counts.absent);

                            const excused =
                                safeNumber(counts.excused);

                            const unknown =
                                safeNumber(counts.unknown);

                            const visitorsCount =
                                safeNumber(session.visitors);

                            const membersAttended =
                                present + late;

                            const totalPeople =
                                membersAttended + visitorsCount;

                            const roster =
                                safeNumber(
                                    session.current_active_member_count
                                );

                            const attendanceRate =
                                roster > 0
                                    ? Math.round(
                                        (membersAttended / roster) *
                                        1000
                                    ) / 10
                                    : null;

                            const rankingValue =
                                asksAttendanceRate
                                    ? (attendanceRate ?? -1)
                                    : includeVisitors
                                        ? totalPeople
                                        : membersAttended;

                            return {

                                cell:
                                    session.cell,

                                date:
                                    session.date,

                                present,

                                late,

                                membersAttended,

                                visitors:
                                    visitorsCount,

                                totalPeople,

                                attendanceRate,

                                absent,

                                excused,

                                unknown,

                                duplicateRows:
                                    safeNumber(
                                        session.duplicate_attendance_rows
                                    ),

                                rankingValue

                            };

                        }
                    ).sort(
                        (a, b) =>
                            b.rankingValue - a.rankingValue ||
                            b.membersAttended - a.membersAttended ||
                            a.cell.localeCompare(b.cell)
                    );


                if (rankingRows.length === 0) {

                    return jsonResponse(
                        {
                            success: true,

                            answer:
                                "No recorded attendance sessions were found for that date or comparison.",
                            sources
                        }
                    );

                }


                const metric =
                    asksAttendanceRate
                        ? "Attendance rate = (Present + Late) / current active registered-member roster"
                        : includeVisitors
                            ? "Total recorded people = registered members marked Present or Late + recorded visitors"
                            : "Registered members attending = Present + Late";


                const tableRows = [
                    "| Rank | Cell | Date | Present | Late | Members attending | Visitors | Total people | Rate* | Absent | Excused | Unknown | Duplicate rows |",
                    "|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",

                    ...rankingRows.map(
                        (item, index) =>

                            `| ${index + 1} | ${item.cell} | ${item.date} | ${item.present} | ${item.late} | ${item.membersAttended} | ${item.visitors} | ${item.totalPeople} | ${item.attendanceRate === null ? "N/A" : `${item.attendanceRate}%`} | ${item.absent} | ${item.excused} | ${item.unknown} | ${item.duplicateRows} |`
                    )

                ].join("\n");


                const limitations: string[] = [];

                if (sessionsLoaded.truncated) {
                    limitations.push(
                        "The attendance-session table reached its retrieval limit; older meetings may be missing."
                    );
                }

                if (attendanceLoaded.truncated) {
                    limitations.push(
                        "The attendance table reached its retrieval limit; some member attendance rows may be missing."
                    );
                }

                if (unassignedRows > 0) {
                    limitations.push(
                        `${unassignedRows} attendance rows could not be matched confidently to a session.`
                    );
                }

                if (totalDuplicateRows > 0) {
                    limitations.push(
                        `${totalDuplicateRows} duplicate attendance rows were detected; each member was counted only once per session.`
                    );
                }


                const answer = [

                    "## Attendance ranking",

                    "",

                    `**Comparison:** ${comparisonDescription}`,

                    `**Ranking method:** ${metric}.`,

                    "",

                    tableRows,

                    "",

                    "*Rate uses the current active-member roster; historical roster snapshots may not be available.*",

                    "",

                    "Present + Late counts registered members recorded as attending. Visitors are reported separately and included in total people only when relevant. Missing attendance rows are not automatically classified as absences.",

                    ...(
                        limitations.length
                            ? [
                                "",
                                "**Data-quality and coverage notes**",
                                ...limitations.map(
                                    item => `- ${item}`
                                )
                            ]
                            : []
                    )

                ].join("\n");


                return jsonResponse(
                    {
                        success: true,
                        answer,
                        sources
                    }
                );

            }


            /* =================================================
               FOCUS THE AI CONTEXT ON THE QUESTION

               This limits unnecessary data and reduces the
               chance of provider request-size failures.
               ================================================= */

            const broadManagementQuestion =
                asksBroadManagement;

            const asksGeneralOnly =
                !asksCells &&
                !asksMembers &&
                !asksLeaders &&
                !asksAttendance &&
                !asksReports &&
                !asksFollowUps &&
                !asksEvangelism &&
                !asksVisitors &&
                !asksOverview &&
                !asksDataQuality &&
                !asksBroadManagement;


            const compactContext: Record<string, any> = {

                generated_at:
                    context.generated_at,

                ...(!asksGeneralOnly
                    ? {
                        sources,
                        ...(asksBroadManagement
                            ? {
                                coverage: context.coverage,
                                summary: context.summary
                            }
                            : {})
                    }
                    : {}),

                note:
                    "Use computed summaries where available. Missing details are not proof that an event did not occur."

            };


            if (
                asksCells ||
                asksLeaders ||
                asksMembers ||
                asksAttendance ||
                broadManagementQuestion
            ) {

                compactContext.cells =
                    context.cells;

            }


            if (
                asksLeaders ||
                broadManagementQuestion
            ) {

                compactContext.cell_leaders =
                    context.cell_leaders;

            }


            if (
                asksMembers ||
                broadManagementQuestion
            ) {

                const memberSummary =
                    context.members_summary;

                compactContext.members_summary = {

                    active_total:
                        memberSummary.active_total,

                    inactive_total:
                        memberSummary.inactive_total,

                    by_cell:
                        memberSummary.by_cell,

                    by_year:
                        memberSummary.by_year,

                    by_combination:
                        memberSummary.by_combination,

                    ...(asksNames
                        ? {
                            member_details:
                                memberSummary.member_details
                                    .slice(0, 100)
                        }
                        : {})

                };

            }


            if (
                asksAttendance ||
                broadManagementQuestion ||
                asksDataQuality
            ) {

                const analysis =
                    context.attendance_analysis;

                const includeNames =
                    asksNames;

                function trimSession(
                    session: any
                ) {

                    const {
                        member_details,
                        ...summary
                    } = session;

                    return includeNames
                        ? {
                            ...summary,

                            member_details:
                                (member_details || [])
                                    .slice(0, 25)
                        }
                        : summary;

                }

                compactContext.attendance_analysis = {

                    totals_across_loaded_sessions:
                        analysis.totals_across_loaded_sessions,

                    latest_session_for_each_cell:
                        analysis.latest_session_for_each_cell
                            .map(
                                trimSession
                            ),

                    relevant_session_details:
                        analysis.relevant_session_details
                            .slice(0, includeNames ? 8 : 15)
                            .map(
                                trimSession
                            )

                };

            }


            if (
                asksReports ||
                broadManagementQuestion
            ) {

                const reportSummary =
                    context.weekly_report_summary;

                compactContext.weekly_report_summary = {

                    total_loaded:
                        reportSummary.total_loaded,

                    total_database_count:
                        reportSummary.total_database_count,

                    by_status:
                        reportSummary.by_status,

                    relevant_records:
                        reportSummary.relevant_records
                            .slice(0, 12)

                };

            }


            if (
                asksFollowUps ||
                broadManagementQuestion
            ) {

                const followUpSummary =
                    context.follow_up_summary;

                compactContext.follow_up_summary = {

                    total_loaded:
                        followUpSummary.total_loaded,

                    total_database_count:
                        followUpSummary.total_database_count,

                    by_status:
                        followUpSummary.by_status,

                    relevant_records:
                        followUpSummary.relevant_records
                            .slice(0, 15)

                };

            }


            if (
                asksEvangelism ||
                broadManagementQuestion
            ) {

                const evangelismSummary =
                    context.evangelism_summary;

                compactContext.evangelism_summary = {

                    total_records_loaded:
                        evangelismSummary.total_records_loaded,

                    total_database_count:
                        evangelismSummary.total_database_count,

                    totals:
                        evangelismSummary.totals,

                    relevant_records:
                        evangelismSummary.relevant_records
                            .slice(0, 12)

                };

            }


            if (
                asksVisitors ||
                broadManagementQuestion
            ) {

                const visitorSummary =
                    context.visitor_summary;

                compactContext.visitor_summary = {

                    total_records_loaded:
                        visitorSummary.total_records_loaded,

                    total_database_count:
                        visitorSummary.total_database_count,

                    converted_to_member:
                        visitorSummary.converted_to_member,

                    relevant_records:
                        visitorSummary.relevant_records
                            .slice(0, 12)

                };

            }


            /* =================================================
               PROMPT SIZE GUARD
               ================================================= */

            let serializedContext =
                JSON.stringify(compactContext);

            if (serializedContext.length > 35000) {

                if (compactContext.members_summary) {

                    delete compactContext.members_summary.member_details;

                }

                if (compactContext.attendance_analysis) {

                    compactContext.attendance_analysis
                        .relevant_session_details =
                            compactContext.attendance_analysis
                                .relevant_session_details
                                .slice(0, 6);

                }

                if (compactContext.weekly_report_summary) {

                    compactContext.weekly_report_summary
                        .relevant_records =
                            compactContext.weekly_report_summary
                                .relevant_records
                                .slice(0, 6);

                }

                if (compactContext.follow_up_summary) {

                    compactContext.follow_up_summary
                        .relevant_records =
                            compactContext.follow_up_summary
                                .relevant_records
                                .slice(0, 8);

                }

                if (compactContext.evangelism_summary) {

                    compactContext.evangelism_summary
                        .relevant_records =
                            compactContext.evangelism_summary
                                .relevant_records
                                .slice(0, 8);

                }

                serializedContext =
                    JSON.stringify(compactContext);

            }


            /* =================================================
               SYSTEM INSTRUCTIONS
               ================================================= */

            const systemInstruction = `
You are CMS AI, the management and general-purpose assistant
for the Coordinator of GBU Rukara Cell Management System.

You have two answer modes:

CMS DATA MODE:
For real GBU Rukara cells, members, leaders, attendance,
reports, follow-ups, visitors, evangelism and current
statistics, use only the supplied CMS data.

GENERAL ASSISTANCE MODE:
For general knowledge, writing, planning, education,
communication, leadership, ministry ideas and normal
questions, use your general knowledge. Do not pretend
general advice came from the CMS records.

ACCURACY RULES:
- Answer the exact question that was asked.
- Treat conversation history as context only; answer the newest question.
- Start with the direct answer.
- Do not invent CMS names, dates, numbers, statuses or events.
- Distinguish verified facts from recommendations.
- When using CMS data, name the supporting source table and date range when available.
- Use only the supplied sources and explain when their coverage is incomplete.
- Use computed summaries when available.
- Check coverage before claiming a total is complete.
- If data is truncated, explain the limitation.
- Explain missing information rather than guessing.
- Give general guidance when the question is not CMS-specific.
- Avoid filler and repetition.

ATTENDANCE RULES:
- One attendance_sessions row represents one meeting.
- One attendance row represents one registered-member status.
- Never count member attendance rows as separate meetings.
- Present + Late = registered members recorded as attending.
- Visitors are separate from registered members.
- Add visitors to members attending only when asked for
  total recorded people including visitors.
- A missing attendance row does not prove absence.
- Do not infer absence when a recorded status is missing.
- Use unknown for blank or unrecognized statuses.
- Avoid double-counting duplicate member/session rows.
- The current active roster may differ from the historical roster.
- A cell's latest session may be on a different date from
  another cell's latest session.
- Attendance rate excludes visitors from the denominator.

OTHER CMS RULES:
- Base reports, follow-ups, evangelism and visitor answers
  on records that were actually supplied.
- Explain the evidence behind recommendations.
- Protect personal information.
- Never reveal phone numbers, passwords, keys or tokens.
- You are READ-ONLY.
- Never claim that you changed or saved any CMS record.

ANSWER QUALITY:
1. Start with a short, direct answer; do not use a generic opening.
2. Use short paragraphs and meaningful Markdown headings for longer answers.
3. Use bullets for related facts and numbered lists for ordered actions.
4. Use a Markdown table only when comparing several records; keep it compact
   and include only columns that answer the question.
5. Bold key labels sparingly. Never output raw table-like text without a
   valid Markdown header and separator row.
6. Include supporting names, dates, counts or statuses where useful.
7. State data limitations when relevant.
8. Label practical next actions as recommendations.

If a general question needs no CMS records, answer it normally.
`;


            /* =================================================
               USER MESSAGE
               ================================================= */

            const userMessage = `
QUESTION-FOCUSED LIVE CMS CONTEXT:

${serializedContext}

COORDINATOR QUESTION:

${question}

Answer directly and accurately.

Use calculated results when available. Never invent CMS facts.
If the CMS data does not establish an answer, explain why.
General advice is allowed when the question is general.
Label recommendations separately from verified CMS facts.
`;


            /* =================================================
               CLOUDFLARE WORKERS AI REQUEST
               ================================================= */

            const cloudflareUrl =
                `https://api.cloudflare.com/client/v4/accounts/` +
                `${CLOUDFLARE_ACCOUNT_ID}/ai/run/` +
                `${CLOUDFLARE_MODEL}`;


            let aiResponse: Response;

            try {

                aiResponse = await fetch(
                    cloudflareUrl,
                    {

                        method: "POST",

                        headers: {
                            "Authorization":
                                `Bearer ${CLOUDFLARE_API_TOKEN}`,

                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            messages: [

                                {
                                    role: "system",
                                    content: systemInstruction
                                },

                                ...history,

                                {
                                    role: "user",
                                    content: userMessage
                                }

                            ],

                            max_tokens: 1400,

                            temperature: 0.1,

                            top_p: 0.85

                        }),

                        signal:
                            AbortSignal.any([
                                request.signal,
                                AbortSignal.timeout(55000)
                            ])

                    }
                );

            } catch (error) {

                if (request.signal.aborted) {
                    return jsonResponse(
                        {
                            success: false,
                            error: "The request was cancelled."
                        },
                        499
                    );
                }

                console.error(
                    "CMS AI Cloudflare connection error:",
                    errorText(error)
                );

                return jsonResponse(
                    {
                        success: false,

                        error:
                            "Cloudflare AI could not be reached.",

                        answer:
                            "I could not reach the AI service. Please try again. If the problem continues, check the Supabase Edge Function logs."
                    },
                    502
                );

            }


            /* =================================================
               PARSE CLOUDFLARE RESPONSE
               ================================================= */

            const responseText =
                await aiResponse.text();

            let providerData: any;

            try {

                providerData =
                    JSON.parse(responseText);

            } catch {

                console.error(
                    "CMS AI received invalid JSON from Cloudflare.",
                    {
                        status: aiResponse.status
                    }
                );

                return jsonResponse(
                    {
                        success: false,

                        error:
                            "The AI provider returned an invalid response.",

                        answer:
                            "The AI provider returned an unexpected response. Please retry. If this continues, check the Supabase function logs."
                    },
                    502
                );

            }


            /* =================================================
               HANDLE CLOUDFLARE ERRORS
               ================================================= */

            if (
                !aiResponse.ok ||
                providerData?.success === false
            ) {

                console.error(
                    "CMS AI Cloudflare error:",
                    {
                        status: aiResponse.status,
                        errors: providerData?.errors
                    }
                );

                let message =
                    "Cloudflare AI could not complete the request.";
                let statusCode =
                    502;

                if (
                    aiResponse.status === 401 ||
                    aiResponse.status === 403
                ) {

                    message =
                        "Cloudflare rejected the request. Check the account ID, API token and token permissions.";

                } else if (
                    aiResponse.status === 429
                ) {

                    message =
                        "Cloudflare's AI usage allowance or rate limit has been reached. Please wait and try again.";
                    statusCode =
                        429;

                } else if (
                    aiResponse.status === 413
                ) {

                    message =
                        "The AI request was too large. Try a more specific question.";
                    statusCode =
                        413;

                } else if (
                    aiResponse.status >= 500
                ) {

                    message =
                        "The AI provider is temporarily unavailable. Please try again later.";
                    statusCode =
                        503;

                }

                const providerDetails =
                    Array.isArray(providerData?.errors)
                        ? providerData.errors
                            .map(
                                (item: any) =>
                                    item?.message ||
                                    item?.code ||
                                    ""
                            )
                            .filter(Boolean)
                            .join("; ")
                        : "";

                return jsonResponse(
                    {
                        success: false,

                        error: message,

                        answer:
                            providerDetails
                                ? `${message}\n\nProvider details: ${providerDetails}`
                                : message
                    },
                    statusCode
                );

            }


            /* =================================================
               EXTRACT GENERATED ANSWER
               ================================================= */

            const answer =
                text(
                    providerData?.result?.response
                );

            if (!answer) {

                console.error(
                    "CMS AI received an empty response from Cloudflare."
                );

                return jsonResponse(
                    {
                        success: false,

                        error:
                            "The AI returned an empty answer.",

                        answer:
                            "The AI returned an empty answer. Please try a shorter or more specific question."
                    },
                    502
                );

            }


            /* =================================================
               SUCCESS

               Response shape stays compatible with cms-ai.js.
               ================================================= */

            return jsonResponse(
                {
                    success: true,
                    answer,
                    sources
                },
                200
            );

        } catch (error) {

            const message =
                errorText(error);

            console.error(
                "CMS AI unexpected error:",
                message
            );

            return jsonResponse(
                {
                    success: false,

                    error:
                        "CMS AI encountered an error while processing the request.",

                    answer:
                        "I could not complete that request. Check the Supabase Edge Function logs for the precise error, then try again."
                },
                500
            );

        }

    }
);