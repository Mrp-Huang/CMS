/* =====================================================
   CMS - MEMBERS MANAGEMENT SYSTEM
   ROLE-AWARE SUPABASE VERSION

   COORDINATOR
   - All cells
   - All members
   - Full member management

   CELL LEADER
   - Assigned cell only
   - Cell selector locked
   - New members automatically use assigned cell
   - Database RLS remains the final security layer
   ===================================================== */


/* =====================================================
   SUPABASE CLIENT
   ===================================================== */

const cmsMembersSupabase =
    window.supabaseClient;


if (!cmsMembersSupabase) {

    console.error(
        "CMS Members: Supabase client is not available."
    );

}


/* =====================================================
   FRONTEND STATE
   ===================================================== */

let cells = [];

let members = [];

let cmsMembersAccess = null;


/* =====================================================
   DOM ELEMENTS
   ===================================================== */

const addMemberButton =
    document.getElementById(
        "addMemberButton"
    );

const memberModal =
    document.getElementById(
        "memberModal"
    );

const closeMemberModal =
    document.getElementById(
        "closeMemberModal"
    );

const cancelMemberButton =
    document.getElementById(
        "cancelMemberButton"
    );

const memberForm =
    document.getElementById(
        "memberForm"
    );

const memberId =
    document.getElementById(
        "memberId"
    );

const memberName =
    document.getElementById(
        "memberName"
    );

const memberPhone =
    document.getElementById(
        "memberPhone"
    );

const memberGender =
    document.getElementById(
        "memberGender"
    );

const memberYear =
    document.getElementById(
        "memberYear"
    );

const memberCombination =
    document.getElementById(
        "memberCombination"
    );

const memberCell =
    document.getElementById(
        "memberCell"
    );

const memberDateJoined =
    document.getElementById(
        "memberDateJoined"
    );

const memberStatus =
    document.getElementById(
        "memberStatus"
    );

const memberNotes =
    document.getElementById(
        "memberNotes"
    );

const membersTableBody =
    document.getElementById(
        "membersTableBody"
    );

const memberSearch =
    document.getElementById(
        "memberSearch"
    );

const memberModalTitle =
    document.getElementById(
        "memberModalTitle"
    );


/* =====================================================
   ACCESS
   ===================================================== */

async function initializeMembersAccess() {

    try {

        /*
         * Use the common CMS access helper when available.
         */

        if (
            window.CMSAccess &&
            typeof window.CMSAccess.initialize ===
                "function"
        ) {

            cmsMembersAccess =
                await window.CMSAccess.initialize();

        }

        /*
         * Fallback in case cms-access.js has not finished
         * initializing yet.
         */

        if (
            !cmsMembersAccess ||
            !cmsMembersAccess.initialized
        ) {

            const {
                data: role,
                error: roleError
            } =
                await cmsMembersSupabase.rpc(
                    "cms_my_role"
                );


            if (roleError) {
                throw roleError;
            }


            const normalizedRole =
                String(
                    role || ""
                )
                    .trim()
                    .toLowerCase();


            cmsMembersAccess = {

                role:
                    normalizedRole,

                userId:
                    null,

                cellId:
                    null,

                cellName:
                    null,

                initialized:
                    true

            };


            if (
                normalizedRole ===
                "cell_leader"
            ) {

                const {
                    data: myCells,
                    error: cellError
                } =
                    await cmsMembersSupabase.rpc(
                        "cms_my_cells"
                    );


                if (cellError) {
                    throw cellError;
                }


                if (
                    !myCells ||
                    !myCells.length
                ) {

                    throw new Error(
                        "No active cell is assigned to this Cell Leader."
                    );

                }


                cmsMembersAccess.cellId =
                    myCells[0].cell_id;

                cmsMembersAccess.cellName =
                    myCells[0].cell_name || "";

            }

        }


        console.log(
            "CMS Members access:",
            cmsMembersAccess
        );


        return true;

    } catch (error) {

        console.error(
            "CMS Members access initialization failed:",
            error
        );

        alert(
            "Unable to determine your CMS access."
        );

        return false;

    }

}


/* =====================================================
   ROLE HELPERS
   ===================================================== */

function membersIsCoordinator() {

    return (
        cmsMembersAccess?.role ===
        "coordinator"
    );

}


function membersIsCellLeader() {

    return (
        cmsMembersAccess?.role ===
        "cell_leader"
    );

}


function membersGetCellId() {

    return (
        cmsMembersAccess?.cellId ||
        null
    );

}


/* =====================================================
   DATABASE ERROR HANDLER
   ===================================================== */

function showMemberDatabaseError(
    action,
    error
) {

    console.error(
        `CMS Members - ${action}:`,
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

async function loadMemberCells() {

    if (!cmsMembersSupabase) {
        return false;
    }


    const {
        data,
        error
    } =
        await cmsMembersSupabase
            .from("cells")
            .select(
                "id,name,active"
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        showMemberDatabaseError(
            "load Cells",
            error
        );

        return false;

    }


    cells =
        data || [];


    /*
     * Cell Leader sees only their assigned cell.
     *
     * This is also enforced by RLS.
     */

    if (
        membersIsCellLeader()
    ) {

        const myCellId =
            membersGetCellId();


        cells =
            cells.filter(
                cell =>
                    String(
                        cell.id
                    ) ===
                    String(
                        myCellId
                    )
            );

    }


    return true;

}


/* =====================================================
   LOAD MEMBERS
   ===================================================== */

async function loadMembersFromSupabase() {

    if (!cmsMembersSupabase) {
        return false;
    }


    const {
        data,
        error
    } =
        await cmsMembersSupabase
            .from("members")
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
                updated_at,
                cells (
                    id,
                    name,
                    active
                )
                `
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        showMemberDatabaseError(
            "load Members",
            error
        );

        return false;

    }


    /*
     * RLS already restricts Cell Leaders to their cell.
     * We additionally filter defensively in the frontend.
     */

    let liveMembers =
        data || [];


    if (
        membersIsCellLeader()
    ) {

        const myCellId =
            membersGetCellId();


        liveMembers =
            liveMembers.filter(
                item =>
                    String(
                        item.cell_id
                    ) ===
                    String(
                        myCellId
                    )
            );

    }


    /*
     * Convert database structure into the original
     * frontend structure.
     */

    members =
        liveMembers.map(
            function (item) {

                const status =
                    item.active !== false
                        ? "Active"
                        : "Inactive";


                return {

                    id:
                        item.id,

                    name:
                        [
                            item.first_name,
                            item.last_name
                        ]
                            .filter(Boolean)
                            .join(" "),

                    phone:
                        item.phone || "",

                    email:
                        item.email || "",

                    gender:
                        item.gender || "",

                    year:
                        item.year_of_study || "",

                    combination:
                        item.combination || "",

                    cellId:
                        item.cell_id,

                    dateJoined:
                        item.date_joined || "",

                    status:

                        status,

                    notes:
                        item.notes || "",

                    active:
                        item.active !== false,

                    createdAt:
                        item.created_at,

                    updatedAt:
                        item.updated_at,

                    cell:
                        item.cells || null

                };

            }
        );


    return true;

}


/* =====================================================
   REFRESH DATA
   ===================================================== */

async function refreshMembersData() {

    const cellsLoaded =
        await loadMemberCells();


    if (!cellsLoaded) {
        return false;
    }


    const membersLoaded =
        await loadMembersFromSupabase();


    if (!membersLoaded) {
        return false;
    }


    loadCellOptions();


    renderMembers(
        memberSearch
            ? memberSearch.value
            : ""
    );


    updateMembersPageForRole();


    return true;

}


/* =====================================================
   PAGE ROLE PRESENTATION
   ===================================================== */

function updateMembersPageForRole() {

    if (
        membersIsCellLeader()
    ) {

        const cellName =
            cmsMembersAccess.cellName ||
            getCellName(
                cmsMembersAccess.cellId
            );


        /*
         * Change heading subtitle where possible.
         */

        document
            .querySelectorAll(
                ".page-header h1"
            )
            .forEach(
                heading => {

                    heading.textContent =
                        "My Members";

                }
            );


        document
            .querySelectorAll(
                ".page-header p"
            )
            .forEach(
                subtitle => {

                    subtitle.textContent =
                        `${cellName} cell members`;

                }
            );


        /*
         * Coordinator-only navigation.
         */

        document
            .querySelectorAll(
                '.sidebar-nav a[href="cells.html"],' +
                '.sidebar-nav a[href="cell-leaders.html"]'
            )
            .forEach(
                link => {

                    link.style.display =
                        "none";

                }
            );


        /*
         * Make the cell field clearly read-only.
         */

        if (memberCell) {

            memberCell.disabled =
                true;

            memberCell.title =
                `Your assigned cell is ${cellName}`;

        }

    }

}


/* =====================================================
   OPEN MODAL
   ===================================================== */

function openMemberModal() {

    if (!memberModal) {
        return;
    }


    memberModal.classList.add(
        "show"
    );


    memberModal.setAttribute(
        "aria-hidden",
        "false"
    );


    setTimeout(
        function () {

            if (memberName) {
                memberName.focus();
            }

        },
        100
    );

}


/* =====================================================
   CLOSE MODAL
   ===================================================== */

function closeMemberModalWindow() {

    if (!memberModal) {
        return;
    }


    memberModal.classList.remove(
        "show"
    );


    memberModal.setAttribute(
        "aria-hidden",
        "true"
    );


    if (memberForm) {
        memberForm.reset();
    }


    if (memberId) {
        memberId.value = "";
    }


    if (memberModalTitle) {

        memberModalTitle.textContent =
            "Add Member";

    }


    loadCellOptions();

}


/* =====================================================
   LOAD CELLS INTO SELECT
   ===================================================== */

function loadCellOptions(
    selectedCellId = ""
) {

    if (!memberCell) {
        return;
    }


    memberCell.innerHTML = `
        <option value="">
            Select a cell
        </option>
    `;


    const activeCells =
        cells.filter(
            function (cell) {

                return (
                    cell.active !== false
                );

            }
        );


    activeCells.forEach(
        function (cell) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                cell.id;


            option.textContent =
                cell.name;


            memberCell.appendChild(
                option
            );

        }
    );


    if (
        activeCells.length === 0
    ) {

        memberCell.innerHTML = `
            <option value="">
                No active cells available
            </option>
        `;

    }


    /* -------------------------------------------------
       CELL LEADER LOCK
       ------------------------------------------------- */

    if (
        membersIsCellLeader()
    ) {

        const myCellId =
            membersGetCellId();


        memberCell.value =
            myCellId || "";


        memberCell.disabled =
            true;


        /*
         * Disabled form controls aren't submitted by
         * browsers, so saveMember() reads the value
         * separately from memberCell.disabled state.
         */

    } else {

        memberCell.disabled =
            false;


        if (
            selectedCellId
        ) {

            memberCell.value =
                selectedCellId;

        }

    }

}


/* =====================================================
   FIND CELL NAME
   ===================================================== */

function getCellName(
    cellId
) {

    const cell =
        cells.find(
            function (item) {

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


    if (cell) {
        return cell.name;
    }


    return "Unknown cell";

}


/* =====================================================
   ADD MEMBER BUTTON
   ===================================================== */

if (
    addMemberButton
) {

    addMemberButton.addEventListener(
        "click",
        function () {

            if (memberForm) {
                memberForm.reset();
            }


            if (memberId) {
                memberId.value = "";
            }


            if (memberModalTitle) {

                memberModalTitle.textContent =
                    "Add Member";

            }


            loadCellOptions();


            if (memberStatus) {

                memberStatus.value =
                    "Active";

            }


            /*
             * Cell Leader automatically gets their
             * assigned cell.
             */

            if (
                membersIsCellLeader()
            ) {

                memberCell.value =
                    membersGetCellId();

                memberCell.disabled =
                    true;

            }


            openMemberModal();

        }
    );

}


/* =====================================================
   CLOSE BUTTONS
   ===================================================== */

if (
    closeMemberModal
) {

    closeMemberModal.addEventListener(
        "click",
        closeMemberModalWindow
    );

}


if (
    cancelMemberButton
) {

    cancelMemberButton.addEventListener(
        "click",
        closeMemberModalWindow
    );

}


/* =====================================================
   CLOSE OUTSIDE
   ===================================================== */

if (
    memberModal
) {

    memberModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                memberModal
            ) {

                closeMemberModalWindow();

            }

        }
    );

}


/* =====================================================
   ESCAPE
   ===================================================== */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
                "Escape" &&
            memberModal &&
            memberModal.classList.contains(
                "show"
            )
        ) {

            closeMemberModalWindow();

        }

    }
);


/* =====================================================
   SAVE MEMBER
   ===================================================== */

if (
    memberForm
) {

    memberForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!cmsMembersSupabase) {

                alert(
                    "Supabase is not connected."
                );

                return;

            }


            const name =
                memberName
                    ? memberName.value.trim()
                    : "";


            const phone =
                memberPhone
                    ? memberPhone.value.trim()
                    : "";


            const gender =
                memberGender
                    ? memberGender.value
                    : "";


            const year =
                memberYear
                    ? memberYear.value
                    : "";


            const combination =
                memberCombination
                    ? memberCombination.value.trim()
                    : "";


            /*
             * IMPORTANT:
             * For a Cell Leader, ignore whatever the
             * browser tried to submit and use the assigned
             * cell from CMSAccess.
             */

            const cellId =
                membersIsCellLeader()
                    ? membersGetCellId()
                    : (
                        memberCell
                            ? memberCell.value
                            : ""
                    );


            const dateJoined =
                memberDateJoined
                    ? memberDateJoined.value
                    : "";


            const status =
                memberStatus
                    ? memberStatus.value
                    : "Active";


            const notes =
                memberNotes
                    ? memberNotes.value.trim()
                    : "";


            /* =================================================
               VALIDATION
               ================================================= */

            if (!name) {

                alert(
                    "Please enter the member's full name."
                );


                if (memberName) {
                    memberName.focus();
                }


                return;

            }


            if (!cellId) {

                alert(
                    "No valid cell is assigned."
                );

                return;

            }


            if (!year) {

                alert(
                    "Please select the member's year of study."
                );

                return;

            }


            const selectedCell =
                cells.find(
                    function (cell) {

                        return (
                            String(
                                cell.id
                            ) ===
                            String(
                                cellId
                            )
                        );

                    }
                );


            if (!selectedCell) {

                alert(
                    "The selected cell could not be found."
                );

                return;

            }


            /*
             * Extra Cell Leader safety check.
             */

            if (
                membersIsCellLeader() &&
                String(
                    cellId
                ) !==
                String(
                    membersGetCellId()
                )
            ) {

                alert(
                    "You can only manage members in your assigned cell."
                );

                return;

            }


            /* =================================================
               SPLIT FULL NAME
               ================================================= */

            const nameParts =
                name.split(
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


            const isActive =
                status
                    .toLowerCase() ===
                "active";


            /* =================================================
               EDIT
               ================================================= */

            if (
                memberId &&
                memberId.value
            ) {

                const existingMember =
                    members.find(
                        function (item) {

                            return (
                                String(
                                    item.id
                                ) ===
                                String(
                                    memberId.value
                                )
                            );

                        }
                    );


                if (!existingMember) {

                    alert(
                        "The selected member could not be found."
                    );

                    return;

                }


                /*
                 * Extra frontend protection.
                 */

                if (
                    membersIsCellLeader() &&
                    String(
                        existingMember.cellId
                    ) !==
                    String(
                        membersGetCellId()
                    )
                ) {

                    alert(
                        "You can only edit members in your assigned cell."
                    );

                    return;

                }


                const {
                    error
                } =
                    await cmsMembersSupabase
                        .from("members")
                        .update({

                            first_name:
                                firstName,

                            last_name:
                                lastName,

                            phone:
                                phone ||
                                null,

                            gender:
                                gender ||
                                null,

                            year_of_study:
                                year ||
                                null,

                            combination:
                                combination ||
                                null,

                            cell_id:
                                cellId,

                            date_joined:
                                dateJoined ||
                                null,

                            active:
                                isActive,

                            notes:
                                notes ||
                                null,

                            updated_at:
                                new Date()
                                    .toISOString()

                        })
                        .eq(
                            "id",
                            existingMember.id
                        );


                if (error) {

                    showMemberDatabaseError(
                        "update the member",
                        error
                    );

                    return;

                }


                console.log(
                    "Member updated successfully."
                );

            }


            /* =================================================
               ADD
               ================================================= */

            else {

                const {
                    error
                } =
                    await cmsMembersSupabase
                        .from("members")
                        .insert({

                            first_name:
                                firstName,

                            last_name:
                                lastName,

                            phone:
                                phone ||
                                null,

                            gender:
                                gender ||
                                null,

                            year_of_study:
                                year ||
                                null,

                            combination:
                                combination ||
                                null,

                            cell_id:
                                cellId,

                            date_joined:
                                dateJoined ||
                                null,

                            active:
                                isActive,

                            notes:
                                notes ||
                                null

                        });


                if (error) {

                    showMemberDatabaseError(
                        "add the member",
                        error
                    );

                    return;

                }


                console.log(
                    "Member added successfully."
                );

            }


            await refreshMembersData();

            closeMemberModalWindow();

        }
    );

}


/* =====================================================
   EDIT MEMBER
   ===================================================== */

function editMember(
    id
) {

    const member =
        members.find(
            function (item) {

                return (
                    String(
                        item.id
                    ) ===
                    String(id)
                );

            }
        );


    if (!member) {

        alert(
            "Member not found."
        );

        return;

    }


    if (
        membersIsCellLeader() &&
        String(
            member.cellId
        ) !==
        String(
            membersGetCellId()
        )
    ) {

        alert(
            "You can only edit members in your assigned cell."
        );

        return;

    }


    if (memberId) {
        memberId.value =
            member.id;
    }


    if (memberName) {
        memberName.value =
            member.name;
    }


    if (memberPhone) {
        memberPhone.value =
            member.phone || "";
    }


    if (memberGender) {
        memberGender.value =
            member.gender || "";
    }


    if (memberYear) {
        memberYear.value =
            member.year || "";
    }


    if (memberCombination) {
        memberCombination.value =
            member.combination || "";
    }


    loadCellOptions(
        member.cellId
    );


    if (memberDateJoined) {
        memberDateJoined.value =
            member.dateJoined || "";
    }


    if (memberStatus) {

        memberStatus.value =
            member.status ||
            "Active";

    }


    if (memberNotes) {

        memberNotes.value =
            member.notes || "";

    }


    if (
        membersIsCellLeader()
    ) {

        memberCell.value =
            membersGetCellId();

        memberCell.disabled =
            true;

    }


    if (memberModalTitle) {

        memberModalTitle.textContent =
            "Edit Member";

    }


    openMemberModal();

}


/* =====================================================
   DELETE MEMBER
   ===================================================== */

async function deleteMember(
    id
) {

    const member =
        members.find(
            function (item) {

                return (
                    String(
                        item.id
                    ) ===
                    String(id)
                );

            }
        );


    if (!member) {

        alert(
            "Member not found."
        );

        return;

    }


    if (
        membersIsCellLeader() &&
        String(
            member.cellId
        ) !==
        String(
            membersGetCellId()
        )
    ) {

        alert(
            "You can only delete members in your assigned cell."
        );

        return;

    }


    const confirmed =
        confirm(
            `Are you sure you want to remove ${member.name}?`
        );


    if (!confirmed) {
        return;
    }


    if (!cmsMembersSupabase) {

        alert(
            "Supabase is not connected."
        );

        return;

    }


    const {
        error
    } =
        await cmsMembersSupabase
            .from("members")
            .delete()
            .eq(
                "id",
                member.id
            );


    if (error) {

        showMemberDatabaseError(
            "delete the member",
            error
        );

        return;

    }


    await refreshMembersData();


    console.log(
        "Member deleted successfully."
    );

}


/* =====================================================
   RENDER MEMBERS
   ===================================================== */

function renderMembers(
    searchTerm = ""
) {

    if (!membersTableBody) {
        return;
    }


    membersTableBody.innerHTML =
        "";


    const search =
        String(
            searchTerm
        )
            .trim()
            .toLowerCase();


    const filteredMembers =
        members.filter(
            function (member) {

                const name =
                    String(
                        member.name || ""
                    )
                        .toLowerCase();


                const phone =
                    String(
                        member.phone || ""
                    )
                        .toLowerCase();


                const gender =
                    String(
                        member.gender || ""
                    )
                        .toLowerCase();


                const year =
                    String(
                        member.year || ""
                    )
                        .toLowerCase();


                const combination =
                    String(
                        member.combination || ""
                    )
                        .toLowerCase();


                const cellName =
                    getCellName(
                        member.cellId
                    )
                        .toLowerCase();


                return (

                    name.includes(search)

                    ||

                    phone.includes(search)

                    ||

                    gender.includes(search)

                    ||

                    year.includes(search)

                    ||

                    combination.includes(search)

                    ||

                    cellName.includes(search)

                );

            }
        );


    /* =================================================
       EMPTY
       ================================================= */

    if (
        filteredMembers.length ===
        0
    ) {

        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `

            <td
                colspan="8"
                class="empty-message"
            >

                ${
                    members.length === 0
                        ? (
                            membersIsCellLeader()
                                ? "No members have been registered in your cell yet."
                                : "No members have been registered yet."
                        )
                        : "No members match your search."
                }

            </td>

        `;


        membersTableBody.appendChild(
            row
        );


        return;

    }


    /* =================================================
       DISPLAY
       ================================================= */

    filteredMembers.forEach(
        function (member) {

            const row =
                document.createElement(
                    "tr"
                );


            let statusClass =
                "status-active";


            if (
                member.status ===
                "Inactive"
            ) {

                statusClass =
                    "status-inactive";

            }


            if (
                member.status ===
                "Moved to another cell"
            ) {

                statusClass =
                    "status-moved";

            }


            /*
             * Cell Leaders only ever receive their cell
             * rows because of RLS + frontend filtering.
             */

            const actionButtons =
                `

                    <button
                        type="button"
                        class="action-button edit"
                        onclick="editMember('${escapeHTML(
                            member.id
                        )}')"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="action-button delete"
                        onclick="deleteMember('${escapeHTML(
                            member.id
                        )}')"
                    >
                        Delete
                    </button>

                `;


            row.innerHTML = `

                <td>

                    <strong>
                        ${escapeHTML(
                            member.name
                        )}
                    </strong>

                </td>


                <td>

                    ${
                        member.phone
                            ? escapeHTML(
                                member.phone
                            )
                            : "—"
                    }

                </td>


                <td>

                    ${
                        member.gender
                            ? escapeHTML(
                                member.gender
                            )
                            : "—"
                    }

                </td>


                <td>

                    ${
                        member.year
                            ? escapeHTML(
                                member.year
                            )
                            : "—"
                    }

                </td>


                <td>

                    ${
                        member.combination
                            ? escapeHTML(
                                member.combination
                            )
                            : "—"
                    }

                </td>


                <td>

                    ${escapeHTML(
                        getCellName(
                            member.cellId
                        )
                    )}

                </td>


                <td>

                    <span
                        class="${statusClass}"
                    >

                        ${escapeHTML(
                            member.status
                        )}

                    </span>

                </td>


                <td>

                    ${actionButtons}

                </td>

            `;


            membersTableBody.appendChild(
                row
            );

        }
    );

}


/* =====================================================
   SEARCH
   ===================================================== */

if (
    memberSearch
) {

    memberSearch.addEventListener(
        "input",
        function () {

            renderMembers(
                memberSearch.value
            );

        }
    );

}


/* =====================================================
   SECURITY
   ===================================================== */

function escapeHTML(
    value
) {

    return String(
        value
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
   INLINE BUTTON SUPPORT
   ===================================================== */

window.editMember =
    editMember;

window.deleteMember =
    deleteMember;


/* =====================================================
   INITIALIZE
   ===================================================== */

(async function initializeMembers() {

    if (!cmsMembersSupabase) {

        console.error(
            "CMS Members initialization stopped: Supabase unavailable."
        );

        return;

    }


    const accessReady =
        await initializeMembersAccess();


    if (!accessReady) {
        return;
    }


    const success =
        await refreshMembersData();


    if (success) {

        console.log(
            "CMS Members connected to Supabase successfully."
        );


        console.log(
            `CMS Members role: ${cmsMembersAccess.role}`
        );


        if (
            membersIsCellLeader()
        ) {

            console.log(
                `CMS Members: Cell Leader restricted to ${cmsMembersAccess.cellName}.`
            );

        }


        console.log(
            `Members loaded from Supabase: ${members.length}`
        );

    }

})();