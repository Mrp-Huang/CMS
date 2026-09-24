/* =====================================================
   CMS - VISITORS MANAGEMENT
   FINAL CONNECTED VERSION

   TABLE ORDER

   1. Full Name
   2. Phone
   3. Year
   4. Combination
   5. Association
   6. First Visit
   7. Last Visit
   8. Visits
   9. Cell
   10. Status
    11. Actions

   ROLE MODEL

   COORDINATOR
   - All visitors
   - View
   - Edit
   - Change / assign Cell
   - Visit History
   - Convert Visitor -> Member

    CELL LEADER
   - Visitors page available
   - Only visitors from assigned Cell
    - Can edit and delete visitors from assigned Cell
   - Cannot change Cell
   - Cannot convert

   DATA SOURCE

   public.visitors
   public.visitor_visits
   public.cells
   public.members

   VISITOR CREATION

   Attendance
      ->
   attendance_sessions
      ->
   database trigger
      ->
   visitors
      ->
   visitor_visits

   ===================================================== */


/* =====================================================
   SUPABASE
   ===================================================== */

const cmsVisitorsSupabase =
    window.supabaseClient ||
    null;


/* =====================================================
   STATE
   ===================================================== */

let visitors = [];

let visitorVisits = [];

let cells = [];

let selectedVisitor = null;


let cmsVisitorsAccess = {

    role:
        null,

    userId:
        null,

    cellId:
        null,

    cellName:
        null

};


let cmsVisitorsAccessReady =
    false;


/* =====================================================
   DOM
   ===================================================== */

const visitorsTableBody =
    document.getElementById(
        "visitorsTableBody"
    );


const visitorSearch =
    document.getElementById(
        "visitorSearch"
    );


const visitorCellFilter =
    document.getElementById(
        "visitorCellFilter"
    );


const visitorStatusFilter =
    document.getElementById(
        "visitorStatusFilter"
    );


const clearVisitorFiltersButton =
    document.getElementById(
        "clearVisitorFiltersButton"
    );


const refreshVisitorsButton =
    document.getElementById(
        "refreshVisitorsButton"
    );


const totalVisitors =
    document.getElementById(
        "totalVisitors"
    );


const newVisitors =
    document.getElementById(
        "newVisitors"
    );


const convertedVisitors =
    document.getElementById(
        "convertedVisitors"
    );


const totalVisitorVisits =
    document.getElementById(
        "totalVisitorVisits"
    );


const visitorCountText =
    document.getElementById(
        "visitorCountText"
    );


/* =====================================================
   EDIT MODAL
   ===================================================== */

const visitorModal =
    document.getElementById(
        "visitorModal"
    );


const visitorForm =
    document.getElementById(
        "visitorForm"
    );


const visitorId =
    document.getElementById(
        "visitorId"
    );


const visitorName =
    document.getElementById(
        "visitorName"
    );


const visitorPhone =
    document.getElementById(
        "visitorPhone"
    );


const visitorYear =
    document.getElementById(
        "visitorYear"
    );


const visitorCombination =
    document.getElementById(
        "visitorCombination"
    );


const visitorAssociation =
    document.getElementById(
        "visitorAssociation"
    );


const visitorCell =
    document.getElementById(
        "visitorCell"
    );


const visitorModalTitle =
    document.getElementById(
        "visitorModalTitle"
    );


const closeVisitorModal =
    document.getElementById(
        "closeVisitorModal"
    );


const cancelVisitorButton =
    document.getElementById(
        "cancelVisitorButton"
    );


/* =====================================================
   VIEW MODAL
   ===================================================== */

const visitorViewModal =
    document.getElementById(
        "visitorViewModal"
    );


const visitorViewContent =
    document.getElementById(
        "visitorViewContent"
    );


const visitorViewTitle =
    document.getElementById(
        "visitorViewTitle"
    );


const visitorViewSubtitle =
    document.getElementById(
        "visitorViewSubtitle"
    );


const closeVisitorViewModal =
    document.getElementById(
        "closeVisitorViewModal"
    );


const visitorViewEditButton =
    document.getElementById(
        "visitorViewEditButton"
    );


const visitorViewHistoryButton =
    document.getElementById(
        "visitorViewHistoryButton"
    );


const visitorViewConvertButton =
    document.getElementById(
        "visitorViewConvertButton"
    );


/* =====================================================
   HISTORY MODAL
   ===================================================== */

const visitorHistoryModal =
    document.getElementById(
        "visitorHistoryModal"
    );


const visitorHistorySubtitle =
    document.getElementById(
        "visitorHistorySubtitle"
    );


const visitorHistoryTableBody =
    document.getElementById(
        "visitorHistoryTableBody"
    );


const closeVisitorHistoryModal =
    document.getElementById(
        "closeVisitorHistoryModal"
    );


/* =====================================================
   ROLE HELPERS
   ===================================================== */

function cmsVisitorsIsCoordinator() {

    return (
        cmsVisitorsAccess.role ===
        "coordinator"
    );

}


function cmsVisitorsIsCellLeader() {

    return (
        cmsVisitorsAccess.role ===
        "cell_leader"
    );

}


function canEditVisitor() {

    return (
        cmsVisitorsIsCoordinator() ||
        cmsVisitorsIsCellLeader()
    );

}


function canAssignVisitorCell() {

    return (
        cmsVisitorsIsCoordinator()
    );

}


function canConvertVisitor() {

    return (
        cmsVisitorsIsCoordinator()
    );

}


/* =====================================================
   ACCESS INITIALIZATION
   ===================================================== */

async function initializeCMSVisitorsAccess() {

    /*
       Use the existing CMS Access layer first.
    */

    try {

        if (

            window.CMSAccess &&

            typeof window.CMSAccess.initialize ===
                "function"

        ) {

            const access =
                await window.CMSAccess.initialize();


            cmsVisitorsAccess = {

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

                    null,

                cellName:
                    access?.cellName ||

                    window.CMSAccess.cellName ||

                    null

            };

        }

    }

    catch (error) {

        console.warn(
            "CMS Visitors: CMSAccess initialization warning:",
            error
        );

    }


    /*
       Supabase fallback.
    */

    if (
        cmsVisitorsSupabase
    ) {

        try {

            if (
                !cmsVisitorsAccess.role
            ) {

                const {
                    data: roleData,
                    error: roleError
                } =
                    await cmsVisitorsSupabase
                        .rpc(
                            "cms_my_role"
                        );


                if (
                    !roleError
                ) {

                    cmsVisitorsAccess.role =
                        roleData ||
                        null;

                }

            }


            if (
                !cmsVisitorsAccess.cellId
            ) {

                const {
                    data: cellData,
                    error: cellError
                } =
                    await cmsVisitorsSupabase
                        .rpc(
                            "cms_my_cell_id"
                        );


                if (
                    !cellError
                ) {

                    cmsVisitorsAccess.cellId =
                        cellData ||
                        null;

                }

            }


            if (
                !cmsVisitorsAccess.userId
            ) {

                const {
                    data: sessionData
                } =
                    await cmsVisitorsSupabase
                        .auth
                        .getSession();


                cmsVisitorsAccess.userId =

                    sessionData
                        ?.session
                        ?.user
                        ?.id ||

                    null;

            }

        }

        catch (error) {

            console.warn(
                "CMS Visitors: Supabase access fallback warning:",
                error
            );

        }

    }


    cmsVisitorsAccessReady =
        true;


    console.log(
        "CMS Visitors access:",
        cmsVisitorsAccess
    );


    return cmsVisitorsAccess;

}


/* =====================================================
   BASIC HELPERS
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


function formatDate(
    value
) {

    if (
        !value
    ) {

        return "—";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            value
        );

    }


    return date.toLocaleDateString(
        "en-GB"
    );

}


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
   CELL HELPERS
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


    if (
        cell
    ) {

        return (
            cell.name ||
            cell.cellName ||
            "Unknown cell"
        );

    }


    return "Unknown cell";

}


/* =====================================================
   VISITOR HELPERS
   ===================================================== */

function getVisitorById(
    id
) {

    return (

        visitors.find(
            function(visitor) {

                return (
                    String(
                        visitor.id
                    ) ===
                    String(
                        id
                    )
                );

            }
        )

        ||

        null

    );

}


function getVisitorVisits(
    id
) {

    return visitorVisits

        .filter(
            function(visit) {

                return (
                    String(
                        visit.visitor_id
                    ) ===
                    String(
                        id
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

}


function visitorIsConverted(
    visitor
) {

    return (
        visitor?.converted_to_member ===
        true
    );

}


/* =====================================================
   DATABASE ERROR
   ===================================================== */

function showDatabaseError(
    action,
    error
) {

    console.error(
        `CMS Visitors - ${action}:`,
        error
    );


    const message =

        error?.message ||

        error?.details ||

        error?.hint ||

        "An unexpected database error occurred.";


    alert(
        `Unable to ${action}.\n\n${message}`
    );

}


/* =====================================================
   LOAD CELLS
   ===================================================== */

async function loadCells() {

    if (
        !cmsVisitorsSupabase
    ) {

        return false;

    }


    let query =

        cmsVisitorsSupabase

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


    /*
       Cell Leader sees only assigned Cell
       in their filter/select context.
    */

    if (

        cmsVisitorsIsCellLeader() &&

        cmsVisitorsAccess.cellId

    ) {

        query =
            query.eq(
                "id",
                cmsVisitorsAccess.cellId
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

        showDatabaseError(
            "load Cells",
            error
        );


        return false;

    }


    cells =
        data ||
        [];


    if (

        cmsVisitorsIsCellLeader() &&

        cmsVisitorsAccess.cellId

    ) {

        cmsVisitorsAccess.cellName =
            getCellName(
                cmsVisitorsAccess.cellId
            );

    }


    return true;

}


/* =====================================================
   LOAD VISITORS
   ===================================================== */

async function loadVisitors() {

    if (
        !cmsVisitorsSupabase
    ) {

        alert(
            "Supabase is not connected."
        );


        return false;

    }


    /*
       VISITOR MASTER QUERY
    */

    let visitorQuery =

        cmsVisitorsSupabase

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
            );


    /*
       CELL LEADER:
       ONLY ASSIGNED CELL.
    */

    if (

        cmsVisitorsIsCellLeader() &&

        cmsVisitorsAccess.cellId

    ) {

        visitorQuery =
            visitorQuery.eq(
                "cell_id",
                cmsVisitorsAccess.cellId
            );

    }


    /*
       VISIT HISTORY QUERY
    */

    let visitQuery =

        cmsVisitorsSupabase

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
            );


    /*
       Cell Leader history restricted to own Cell.
    */

    if (

        cmsVisitorsIsCellLeader() &&

        cmsVisitorsAccess.cellId

    ) {

        visitQuery =
            visitQuery.eq(
                "cell_id",
                cmsVisitorsAccess.cellId
            );

    }


    const [
        visitorResult,
        visitResult
    ] =
        await Promise.all([
            visitorQuery,
            visitQuery
        ]);


    if (
        visitorResult.error
    ) {

        showDatabaseError(
            "load Visitors",
            visitorResult.error
        );


        return false;

    }


    visitors =
        visitorResult.data ||
        [];


    if (
        visitResult.error
    ) {

        console.warn(
            "CMS Visitors: visitor history loading warning:",
            visitResult.error
        );


        visitorVisits =
            [];

    }

    else {

        visitorVisits =
            visitResult.data ||
            [];

    }


    return true;

}


/* =====================================================
   LOAD CELL OPTIONS
   ===================================================== */

function loadCellOptions() {

    /*
       CELL FILTER
    */

    if (
        visitorCellFilter
    ) {

        visitorCellFilter.innerHTML = `

            <option value="">
                All Cells
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


                visitorCellFilter.appendChild(
                    option
                );

            }
        );


        if (
            cmsVisitorsIsCellLeader()
        ) {

            visitorCellFilter.value =
                cmsVisitorsAccess.cellId ||
                "";


            visitorCellFilter.disabled =
                true;

        }

        else {

            visitorCellFilter.disabled =
                false;

        }

    }


    /*
       EDIT CELL SELECTOR
    */

    if (
        visitorCell
    ) {

        visitorCell.innerHTML = `

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


                visitorCell.appendChild(
                    option
                );

            }
        );


        visitorCell.disabled =
            !canAssignVisitorCell();

    }

}


/* =====================================================
   SUMMARY
   ===================================================== */

function updateSummary() {

    const converted =

        visitors.filter(
            visitorIsConverted
        )
        .length;


    /*
       Use actual visit history count.
       This remains correct even if visit_count
       has not yet been refreshed.
    */

    const totalVisits =

        visitorVisits.length;


    if (
        totalVisitors
    ) {

        totalVisitors.textContent =
            visitors.length;

    }


    if (
        newVisitors
    ) {

        newVisitors.textContent =

            Math.max(
                0,
                visitors.length -
                converted
            );

    }


    if (
        convertedVisitors
    ) {

        convertedVisitors.textContent =
            converted;

    }


    if (
        totalVisitorVisits
    ) {

        totalVisitorVisits.textContent =
            totalVisits;

    }

}


/* =====================================================
   FILTER
   ===================================================== */

function getFilteredVisitors() {

    const search =

        visitorSearch

            ? normalizeText(
                visitorSearch.value
            )

            : "";


    const selectedCell =

        visitorCellFilter

            ? visitorCellFilter.value

            : "";


    const selectedStatus =

        visitorStatusFilter

            ? visitorStatusFilter.value

            : "";


    const assignedCellId =

        cmsVisitorsIsCellLeader()

            ? String(
                cmsVisitorsAccess.cellId ||
                ""
            )

            : "";


    return visitors.filter(
        function(visitor) {

            const searchText = [

                visitor.full_name,

                visitor.phone,

                visitor.year_of_study,

                visitor.combination,

                visitor.association,

                getCellName(
                    visitor.cell_id
                )

            ]

            .map(
                normalizeText
            )

            .join(" ");


            if (

                search &&

                !searchText.includes(
                    search
                )

            ) {

                return false;

            }


            /*
               Selected filter.
            */

            if (

                selectedCell &&

                String(
                    visitor.cell_id
                ) !==
                String(
                    selectedCell
                )

            ) {

                return false;

            }


            /*
               Hard Cell Leader restriction.
            */

            if (

                assignedCellId &&

                String(
                    visitor.cell_id
                ) !==
                assignedCellId

            ) {

                return false;

            }


            /*
               Visitor status.
            */

            if (

                selectedStatus ===
                "visitor"

                &&

                visitorIsConverted(
                    visitor
                )

            ) {

                return false;

            }


            /*
               Converted status.
            */

            if (

                selectedStatus ===
                "converted"

                &&

                !visitorIsConverted(
                    visitor
                )

            ) {

                return false;

            }


            return true;

        }
    );

}


/* =====================================================
   RENDER TABLE
   IMPORTANT:
   HEADER ORDER MUST MATCH THIS EXACTLY
   ===================================================== */

function renderVisitors() {

    if (
        !visitorsTableBody
    ) {

        return;

    }


    const filtered =
        getFilteredVisitors();


    visitorsTableBody.innerHTML =
        "";


    const actionsHeader =
        document.getElementById(
            "visitorActionsHeader"
        );


    if (
        actionsHeader
    ) {

        actionsHeader.style.display = "";

    }


    /*
       Empty state.
    */

    if (
        filtered.length ===
        0
    ) {

        const colspan = 11;


        const message =

            visitors.length ===
            0

                ? (

                    cmsVisitorsIsCellLeader()

                        ? "No visitors have been recorded for your cell yet."
                        : "No visitors have been recorded yet."

                )

                : "No visitors match your filters.";


        visitorsTableBody.innerHTML = `

            <tr>

                <td
                    colspan="${colspan}"
                    class="empty-message"
                >

                    ${escapeHTML(
                        message
                    )}

                </td>

            </tr>

        `;


        return;

    }


    /*
       Build each row in exactly the same
       order as the HTML header.
    */

    filtered.forEach(
        function(visitor) {

            const row =
                document.createElement(
                    "tr"
                );


            const converted =
                visitorIsConverted(
                    visitor
                );


            const statusClass =
                converted
                    ? "converted"
                    : "new";


            const statusText =
                converted
                    ? "Converted"
                    : "Visitor";


            /*
               1 Full Name
               2 Phone
               3 Year
               4 Combination
               5 Association
               6 First Visit
               7 Last Visit
               8 Visits
               9 Cell
               10 Status
            */

            let html = `

                <td
                    class="visitor-name"
                >

                    ${escapeHTML(
                        displayValue(
                            visitor.full_name
                        )
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        displayValue(
                            visitor.phone
                        )
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        displayValue(
                            visitor.year_of_study
                        )
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        displayValue(
                            visitor.combination
                        )
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        displayValue(
                            visitor.association
                        )
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        formatDate(
                            visitor.first_visit_date
                        )
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        formatDate(
                            visitor.last_visit_date
                        )
                    )}

                </td>


                <td
                    class="visitor-visits"
                >

                    ${escapeHTML(
                        displayValue(
                            visitor.visit_count
                        )
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        displayValue(
                            getCellName(
                                visitor.cell_id
                            )
                        )
                    )}

                </td>


                <td>

                    <span
                        class="visitor-status ${statusClass}"
                    >

                        ${escapeHTML(
                            statusText
                        )}

                    </span>

                </td>

            `;


            /*
               11 Actions
            */

            if (
                cmsVisitorsIsCoordinator() ||
                cmsVisitorsIsCellLeader()
            ) {

                html += `

                    <td>

                        <div
                            class="visitor-actions"
                        >

                            <button
                                type="button"
                                class="visitor-action"
                                onclick="viewVisitor(
                                    '${escapeHTML(
                                        String(
                                            visitor.id
                                        )
                                    )}'
                                )"
                            >

                                View

                            </button>


                            <button
                                type="button"
                                class="visitor-action"
                                onclick="editVisitor(
                                    '${escapeHTML(
                                        String(
                                            visitor.id
                                        )
                                    )}'
                                )"
                            >

                                Edit

                            </button>


                            ${
                                cmsVisitorsIsCellLeader()

                                    ? `

                                        <button
                                            type="button"
                                            class="visitor-action delete"
                                            onclick="deleteVisitor(
                                                '${escapeHTML(
                                                    String(
                                                        visitor.id
                                                    )
                                                )}'
                                            )"
                                        >

                                            Delete

                                        </button>

                                    `

                                    : ""
                            }


                            <button
                                type="button"
                                class="visitor-action history"
                                onclick="showVisitorHistory(
                                    '${escapeHTML(
                                        String(
                                            visitor.id
                                        )
                                    )}'
                                )"
                            >

                                History

                            </button>


                            ${
                                converted

                                    ? ""

                                    : `

                                        <button
                                            type="button"
                                            class="visitor-action convert"
                                            onclick="convertVisitor(
                                                '${escapeHTML(
                                                    String(
                                                        visitor.id
                                                    )
                                                )}'
                                            )"
                                        >

                                            Convert

                                        </button>

                                    `
                            }

                        </div>

                    </td>

                `;

            }


            row.innerHTML =
                html;


            visitorsTableBody.appendChild(
                row
            );

        }
    );

}


/* =====================================================
   MODAL OPEN
   ===================================================== */

function openModal(
    modal
) {

    if (
        !modal
    ) {

        return;

    }


    modal.classList.add(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";

}


/* =====================================================
   MODAL CLOSE
   ===================================================== */

function closeModalWindow(
    modal
) {

    if (
        !modal
    ) {

        return;

    }


    modal.classList.remove(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    if (
        !document.querySelector(
            ".modal-overlay.show"
        )
    ) {

        document.body.style.overflow =
            "";

    }

}


/* =====================================================
   VIEW VISITOR
   ===================================================== */

function viewVisitor(
    id
) {

    const visitor =
        getVisitorById(
            id
        );


    if (
        !visitor
    ) {

        alert(
            "Visitor not found."
        );


        return;

    }


    /*
       Cell Leader extra protection.
    */

    if (

        cmsVisitorsIsCellLeader() &&

        cmsVisitorsAccess.cellId &&

        String(
            visitor.cell_id
        ) !==
        String(
            cmsVisitorsAccess.cellId
        )

    ) {

        alert(
            "This visitor does not belong to your assigned cell."
        );


        return;

    }


    selectedVisitor =
        visitor;


    const visits =
        getVisitorVisits(
            visitor.id
        );


    const converted =
        visitorIsConverted(
            visitor
        );


    if (
        visitorViewTitle
    ) {

        visitorViewTitle.textContent =

            visitor.full_name ||
            "Visitor Details";

    }


    if (
        visitorViewSubtitle
    ) {

        visitorViewSubtitle.textContent =

            `${getCellName(
                visitor.cell_id
            )} • ${
                converted
                    ? "Converted to Member"
                    : "Visitor"
            }`;

    }


    const recentVisits =

        visits
            .slice(
                0,
                5
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


    if (
        visitorViewContent
    ) {

        visitorViewContent.innerHTML = `

            <div
                class="visitor-detail-grid"
            >

                <div
                    class="visitor-detail-item"
                >

                    <span>
                        Phone
                    </span>

                    <strong>

                        ${escapeHTML(
                            displayValue(
                                visitor.phone
                            )
                        )}

                    </strong>

                </div>


                <div
                    class="visitor-detail-item"
                >

                    <span>
                        Year
                    </span>

                    <strong>

                        ${escapeHTML(
                            displayValue(
                                visitor.year_of_study
                            )
                        )}

                    </strong>

                </div>


                <div
                    class="visitor-detail-item"
                >

                    <span>
                        Combination
                    </span>

                    <strong>

                        ${escapeHTML(
                            displayValue(
                                visitor.combination
                            )
                        )}

                    </strong>

                </div>


                <div
                    class="visitor-detail-item"
                >

                    <span>
                        Association
                    </span>

                    <strong>

                        ${escapeHTML(
                            displayValue(
                                visitor.association
                            )
                        )}

                    </strong>

                </div>


                <div
                    class="visitor-detail-item"
                >

                    <span>
                        Cell
                    </span>

                    <strong>

                        ${escapeHTML(
                            displayValue(
                                getCellName(
                                    visitor.cell_id
                                )
                            )
                        )}

                    </strong>

                </div>


                <div
                    class="visitor-detail-item"
                >

                    <span>
                        Visits
                    </span>

                    <strong>

                        ${escapeHTML(
                            displayValue(
                                visitor.visit_count
                            )
                        )}

                    </strong>

                </div>


                <div
                    class="visitor-detail-item"
                >

                    <span>
                        First Visit
                    </span>

                    <strong>

                        ${escapeHTML(
                            formatDate(
                                visitor.first_visit_date
                            )
                        )}

                    </strong>

                </div>


                <div
                    class="visitor-detail-item"
                >

                    <span>
                        Last Visit
                    </span>

                    <strong>

                        ${escapeHTML(
                            formatDate(
                                visitor.last_visit_date
                            )
                        )}

                    </strong>

                </div>

            </div>


            <div
                class="visitor-history-preview"
            >

                <h3>
                    Recent Visits
                </h3>


                <div
                    class="table-responsive"
                >

                    <table
                        class="visitor-history-table"
                    >

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
                                recentVisits ||

                                `

                                    <tr>

                                        <td
                                            colspan="3"
                                            class="empty-message"
                                        >

                                            No visit history found.

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


    /*
       Coordinator controls.
    */

    if (
        visitorViewEditButton
    ) {

        visitorViewEditButton.style.display =

            canEditVisitor()
                ? ""
                : "none";

    }


    if (
        visitorViewConvertButton
    ) {

        visitorViewConvertButton.style.display =

            (
                canConvertVisitor() &&
                !converted
            )

                ? ""
                : "none";

    }


    openModal(
        visitorViewModal
    );

}


/* =====================================================
   EDIT VISITOR
   ===================================================== */

function editVisitor(
    id
) {

    if (
        !canEditVisitor()
    ) {

        alert(
            "You do not have permission to edit visitors."
        );


        return;

    }


    const visitor =
        getVisitorById(
            id
        );


    if (
        !visitor
    ) {

        alert(
            "Visitor not found."
        );


        return;

    }


    selectedVisitor =
        visitor;


    if (
        visitorModalTitle
    ) {

        visitorModalTitle.textContent =
            "Edit Visitor";

    }


    if (
        visitorId
    ) {

        visitorId.value =
            visitor.id ||
            "";

    }


    if (
        visitorName
    ) {

        visitorName.value =
            visitor.full_name ||
            "";

    }


    if (
        visitorPhone
    ) {

        visitorPhone.value =
            visitor.phone ||
            "";

    }


    if (
        visitorYear
    ) {

        visitorYear.value =
            visitor.year_of_study ||
            "";

    }


    if (
        visitorCombination
    ) {

        visitorCombination.value =
            visitor.combination ||
            "";

    }


    if (
        visitorAssociation
    ) {

        visitorAssociation.value =
            visitor.association ||
            "";

    }


    if (
        visitorCell
    ) {

        visitorCell.value =
            visitor.cell_id ||
            "";

        visitorCell.disabled =
            !canAssignVisitorCell();

    }


    closeModalWindow(
        visitorViewModal
    );


    openModal(
        visitorModal
    );


    setTimeout(
        function() {

            if (
                visitorName
            ) {

                visitorName.focus();

            }

        },
        50
    );

}


/* =====================================================
   SAVE VISITOR
   ===================================================== */

async function saveVisitor(
    event
) {

    event.preventDefault();


    if (
        !canEditVisitor()
    ) {

        alert(
            "You do not have permission to edit visitors."
        );


        return;

    }


    if (
        !cmsVisitorsSupabase
    ) {

        alert(
            "Supabase is not connected."
        );


        return;

    }


    const id =

        visitorId
            ? visitorId.value
            : "";


    const fullName =

        visitorName
            ? visitorName.value.trim()
            : "";


    const phone =

        visitorPhone
            ? visitorPhone.value.trim()
            : "";


    const year =

        visitorYear
            ? visitorYear.value.trim()
            : "";


    const combination =

        visitorCombination
            ? visitorCombination.value.trim()
            : "";


    const association =

        visitorAssociation
            ? visitorAssociation.value.trim()
            : "";


    const cellId =

        visitorCell
            ? visitorCell.value
            : "";


    if (
        !id ||
        !fullName
    ) {

        alert(
            "Please enter the visitor's full name."
        );


        return;

    }


    if (
        !cellId
    ) {

        alert(
            "Please assign the visitor to a cell."
        );


        return;

    }


    const {
        error
    } =

        await cmsVisitorsSupabase

            .from(
                "visitors"
            )

            .update({

                full_name:
                    fullName,

                phone:
                    phone ||
                    null,

                year_of_study:
                    year ||
                    null,

                combination:
                    combination ||
                    null,

                association:
                    association ||
                    null,

                cell_id:
                    cellId,

                updated_at:
                    new Date()
                        .toISOString()

            })

            .eq(
                "id",
                id
            );


    if (
        error
    ) {

        showDatabaseError(
            "update the visitor",
            error
        );


        return;

    }


    closeModalWindow(
        visitorModal
    );


    await refreshVisitorsData();


    window.dispatchEvent(
        new Event(
            "cmsRecordsUpdated"
        )
    );

}


/* =====================================================
   DELETE VISITOR
   ===================================================== */

async function deleteVisitor(
    id
) {

    if (
        !cmsVisitorsIsCoordinator() &&
        !cmsVisitorsIsCellLeader()
    ) {

        alert(
            "You do not have permission to delete visitors."
        );


        return;

    }


    const visitor =
        getVisitorById(
            id
        );


    if (
        !visitor
    ) {

        alert(
            "Visitor not found."
        );


        return;

    }


    if (
        cmsVisitorsIsCellLeader() &&
        cmsVisitorsAccess.cellId &&
        String(
            visitor.cell_id
        ) !==
        String(
            cmsVisitorsAccess.cellId
        )
    ) {

        alert(
            "This visitor does not belong to your assigned cell."
        );


        return;

    }


    const confirmed =
        confirm(
            `Are you sure you want to delete ${displayValue(
                visitor.full_name
            )}? This cannot be undone.`
        );


    if (
        !confirmed
    ) {

        return;

    }


    if (
        !cmsVisitorsSupabase
    ) {

        alert(
            "Supabase is not connected."
        );


        return;

    }


    const {
        error:
            visitsError
    } =
        await cmsVisitorsSupabase
            .from(
                "visitor_visits"
            )
            .delete()
            .eq(
                "visitor_id",
                id
            );


    if (
        visitsError
    ) {

        showDatabaseError(
            "delete the visitor's visit history",
            visitsError
        );


        return;

    }


    const {
        error
    } =
        await cmsVisitorsSupabase
            .from(
                "visitors"
            )
            .delete()
            .eq(
                "id",
                id
            );


    if (
        error
    ) {

        showDatabaseError(
            "delete the visitor",
            error
        );


        return;

    }


    await refreshVisitorsData();


    console.log(
        "Visitor deleted successfully.",
        {
            visitorId:
                id
        }
    );

}


/* =====================================================
   VISITOR HISTORY
   ===================================================== */

function showVisitorHistory(
    id
) {

    const visitor =
        getVisitorById(
            id
        );


    if (
        !visitor
    ) {

        alert(
            "Visitor not found."
        );


        return;

    }


    /*
       Extra Cell Leader protection.
    */

    if (

        cmsVisitorsIsCellLeader() &&

        cmsVisitorsAccess.cellId &&

        String(
            visitor.cell_id
        ) !==
        String(
            cmsVisitorsAccess.cellId
        )

    ) {

        alert(
            "This visitor does not belong to your assigned cell."
        );


        return;

    }


    selectedVisitor =
        visitor;


    const visits =
        getVisitorVisits(
            visitor.id
        );


    if (
        visitorHistorySubtitle
    ) {

        visitorHistorySubtitle.textContent =

            `${visitor.full_name} • ${
                visits.length
            } visit${
                visits.length ===
                1
                    ? ""
                    : "s"
            }`;

    }


    if (
        visitorHistoryTableBody
    ) {

        visitorHistoryTableBody.innerHTML =
            "";

    }


    if (
        visits.length ===
        0
    ) {

        if (
            visitorHistoryTableBody
        ) {

            visitorHistoryTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="4"
                        class="empty-message"
                    >

                        No visit history found.

                    </td>

                </tr>

            `;

        }

    }

    else {

        visits.forEach(
            function(visit) {

                if (
                    !visitorHistoryTableBody
                ) {

                    return;

                }


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

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


                    <td>

                        ${escapeHTML(
                            displayValue(
                                visit.attendance_session_id
                            )
                        )}

                    </td>

                `;


                visitorHistoryTableBody.appendChild(
                    row
                );

            }
        );

    }


    closeModalWindow(
        visitorViewModal
    );


    openModal(
        visitorHistoryModal
    );

}


/* =====================================================
   CONVERT VISITOR -> MEMBER
   ===================================================== */

async function convertVisitor(
    id
) {

    if (
        !canConvertVisitor()
    ) {

        alert(
            "Only the Coordinator can convert a visitor into a member."
        );


        return;

    }


    const visitor =
        getVisitorById(
            id
        );


    if (
        !visitor
    ) {

        alert(
            "Visitor not found."
        );


        return;

    }


    if (
        visitorIsConverted(
            visitor
        )
    ) {

        alert(
            "This visitor has already been converted to a member."
        );


        return;

    }


    /*
       A member must belong to a Cell.
    */

    if (
        !visitor.cell_id
    ) {

        alert(
            "Please assign this visitor to a cell before converting them to a member."
        );


        return;

    }


    if (
        !confirm(
            `Convert ${visitor.full_name} to a member?`
        )
    ) {

        return;

    }


    if (
        !cmsVisitorsSupabase
    ) {

        alert(
            "Supabase is not connected."
        );


        return;

    }


    /*
       Split visitor's name for existing
       Members database structure.
    */

    const nameParts =

        String(
            visitor.full_name ||
            ""
        )
        .trim()
        .split(
            /\s+/
        );


    const firstName =
        nameParts.shift() ||
        "";


    const lastName =
        nameParts.join(
            " "
        ) ||
        "";


    /*
       Check existing Members within
       the visitor's current Cell.
    */

    const {
        data: existingMembers,
        error: memberLookupError
    } =

        await cmsVisitorsSupabase

            .from(
                "members"
            )

            .select(
                "id,first_name,last_name,phone,cell_id"
            )

            .eq(
                "cell_id",
                visitor.cell_id
            );


    if (
        memberLookupError
    ) {

        showDatabaseError(
            "check existing members",
            memberLookupError
        );


        return;

    }


    const visitorNameKey =
        normalizeText(
            visitor.full_name
        );


    const visitorPhoneKey =
        normalizeText(
            visitor.phone
        );


    const existingMember =

        (
            existingMembers ||
            []
        )
        .find(
            function(member) {

                const memberNameKey =

                    normalizeText(
                        `${
                            member.first_name ||
                            ""
                        } ${
                            member.last_name ||
                            ""
                        }`
                    );


                const memberPhoneKey =
                    normalizeText(
                        member.phone
                    );


                return (

                    (
                        visitorPhoneKey &&

                        memberPhoneKey &&

                        visitorPhoneKey ===
                        memberPhoneKey
                    )

                    ||

                    (
                        visitorNameKey &&

                        memberNameKey ===
                        visitorNameKey
                    )

                );

            }
        );


    let memberId =
        existingMember?.id ||
        null;


    /*
       Create a new Member only when
       one does not already exist.
    */

    if (
        !memberId
    ) {

        const payload = {

            first_name:
                firstName,

            last_name:
                lastName,

            phone:
                visitor.phone ||
                null,

            year_of_study:
                visitor.year_of_study ||
                null,

            combination:
                visitor.combination ||
                null,

            cell_id:
                visitor.cell_id,

            date_joined:

                visitor.first_visit_date ||

                new Date()
                    .toISOString()
                    .slice(
                        0,
                        10
                    ),

            active:
                true,

            notes:
                "Converted from Visitor"

        };


        const {
            data: insertedMember,
            error: insertError
        } =

            await cmsVisitorsSupabase

                .from(
                    "members"
                )

                .insert(
                    payload
                )

                .select(
                    "id"
                )

                .single();


        if (
            insertError
        ) {

            showDatabaseError(
                "convert the visitor to a member",
                insertError
            );


            return;

        }


        memberId =
            insertedMember?.id ||
            null;

    }


    /*
       Mark visitor as converted.

       The visitor record itself stays.
       Therefore visit history remains intact.
    */

    const {
        error: visitorUpdateError
    } =

        await cmsVisitorsSupabase

            .from(
                "visitors"
            )

            .update({

                converted_to_member:
                    true,

                updated_at:
                    new Date()
                        .toISOString()

            })

            .eq(
                "id",
                visitor.id
            );


    if (
        visitorUpdateError
    ) {

        showDatabaseError(
            "mark the visitor as converted",
            visitorUpdateError
        );


        return;

    }


    alert(

        existingMember

            ? "Visitor linked to the existing member successfully."

            : "Visitor converted to member successfully."

    );


    closeModalWindow(
        visitorViewModal
    );


    await refreshVisitorsData();


    /*
       Refresh Records Center.
    */

    window.dispatchEvent(
        new Event(
            "cmsRecordsUpdated"
        )
    );


    console.log(
        "CMS Visitors: conversion complete.",
        {

            visitorId:
                visitor.id,

            memberId:
                memberId

        }
    );

}


/* =====================================================
   REFRESH
   ===================================================== */

async function refreshVisitorsData() {

    if (
        !cmsVisitorsAccessReady
    ) {

        await initializeCMSVisitorsAccess();

    }


    const cellsLoaded =
        await loadCells();


    if (
        !cellsLoaded
    ) {

        return false;

    }


    const visitorsLoaded =
        await loadVisitors();


    if (
        !visitorsLoaded
    ) {

        return false;

    }


    loadCellOptions();


    updateSummary();


    renderVisitors();


    return true;

}


/* =====================================================
   CLEAR FILTERS
   ===================================================== */

function clearVisitorFilters() {

    if (
        visitorSearch
    ) {

        visitorSearch.value =
            "";

    }


    if (
        visitorStatusFilter
    ) {

        visitorStatusFilter.value =
            "";

    }


    if (
        visitorCellFilter
    ) {

        visitorCellFilter.value =

            cmsVisitorsIsCellLeader()

                ? (
                    cmsVisitorsAccess.cellId ||
                    ""
                )

                : "";

    }


    renderVisitors();

}


/* =====================================================
   EVENTS - FILTERS
   ===================================================== */

if (
    visitorSearch
) {

    visitorSearch.addEventListener(
        "input",
        function() {

            renderVisitors();

        }
    );

}


if (
    visitorCellFilter
) {

    visitorCellFilter.addEventListener(
        "change",
        function() {

            renderVisitors();

        }
    );

}


if (
    visitorStatusFilter
) {

    visitorStatusFilter.addEventListener(
        "change",
        function() {

            renderVisitors();

        }
    );

}


if (
    clearVisitorFiltersButton
) {

    clearVisitorFiltersButton.addEventListener(
        "click",
        function() {

            clearVisitorFilters();

        }
    );

}


if (
    refreshVisitorsButton
) {

    refreshVisitorsButton.addEventListener(
        "click",
        function() {

            refreshVisitorsData();

        }
    );

}


/* =====================================================
   EVENTS - FORM
   ===================================================== */

if (
    visitorForm
) {

    visitorForm.addEventListener(
        "submit",
        function(event) {

            saveVisitor(
                event
            );

        }
    );

}


/* =====================================================
   EVENTS - CLOSE MODALS
   ===================================================== */

if (
    closeVisitorModal
) {

    closeVisitorModal.addEventListener(
        "click",
        function() {

            closeModalWindow(
                visitorModal
            );

        }
    );

}


if (
    cancelVisitorButton
) {

    cancelVisitorButton.addEventListener(
        "click",
        function() {

            closeModalWindow(
                visitorModal
            );

        }
    );

}


if (
    closeVisitorViewModal
) {

    closeVisitorViewModal.addEventListener(
        "click",
        function() {

            closeModalWindow(
                visitorViewModal
            );

        }
    );

}


if (
    closeVisitorHistoryModal
) {

    closeVisitorHistoryModal.addEventListener(
        "click",
        function() {

            closeModalWindow(
                visitorHistoryModal
            );

        }
    );

}


/* =====================================================
   EVENTS - VIEW MODAL
   ===================================================== */

if (
    visitorViewEditButton
) {

    visitorViewEditButton.addEventListener(
        "click",
        function() {

            if (
                selectedVisitor &&
                canEditVisitor()
            ) {

                editVisitor(
                    selectedVisitor.id
                );

            }

        }
    );

}


if (
    visitorViewHistoryButton
) {

    visitorViewHistoryButton.addEventListener(
        "click",
        function() {

            if (
                selectedVisitor
            ) {

                showVisitorHistory(
                    selectedVisitor.id
                );

            }

        }
    );

}


if (
    visitorViewConvertButton
) {

    visitorViewConvertButton.addEventListener(
        "click",
        function() {

            if (
                selectedVisitor &&
                canConvertVisitor()
            ) {

                convertVisitor(
                    selectedVisitor.id
                );

            }

        }
    );

}


/* =====================================================
   EVENTS - CLICK OUTSIDE MODAL
   ===================================================== */

[
    visitorModal,

    visitorViewModal,

    visitorHistoryModal

]
.forEach(
    function(modal) {

        if (
            !modal
        ) {

            return;

        }


        modal.addEventListener(
            "click",
            function(event) {

                if (
                    event.target ===
                    modal
                ) {

                    closeModalWindow(
                        modal
                    );

                }

            }
        );

    }
);


/* =====================================================
   ESCAPE KEY
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


        closeModalWindow(
            visitorModal
        );


        closeModalWindow(
            visitorViewModal
        );


        closeModalWindow(
            visitorHistoryModal
        );

    }
);


/* =====================================================
   RECORDS CENTER CONNECTION
   ===================================================== */

window.addEventListener(
    "cmsRecordsUpdated",
    function() {

        refreshVisitorsData();

    }
);


/* =====================================================
   PUBLIC FUNCTIONS
   ===================================================== */

window.viewVisitor =
    viewVisitor;


window.editVisitor =
    editVisitor;


window.deleteVisitor =
    deleteVisitor;


window.showVisitorHistory =
    showVisitorHistory;


window.convertVisitor =
    convertVisitor;


window.refreshVisitorsData =
    refreshVisitorsData;


/* =====================================================
   INITIALIZE
   ===================================================== */

async function initializeVisitorsPage() {

    console.log(
        "CMS Visitors: initializing..."
    );


    await initializeCMSVisitorsAccess();


    if (
        !cmsVisitorsSupabase
    ) {

        console.error(
            "CMS Visitors: Supabase client is not available."
        );


        return;

    }


    const success =
        await refreshVisitorsData();


    if (
        success
    ) {

        console.log(
            "CMS Visitors module loaded successfully.",
            {

                role:
                    cmsVisitorsAccess.role,

                userId:
                    cmsVisitorsAccess.userId,

                cellId:
                    cmsVisitorsAccess.cellId,

                cellName:
                    cmsVisitorsAccess.cellName,

                visitors:
                    visitors.length,

                visits:
                    visitorVisits.length,

                cells:
                    cells.length

            }
        );

    }

}


initializeVisitorsPage();