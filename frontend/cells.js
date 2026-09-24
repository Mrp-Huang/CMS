/* =====================================================
   CMS - CELLS MANAGEMENT SYSTEM
   SUPABASE CONNECTED VERSION

   LIVE DATA:
   - public.cells
   - public.cell_leader_directory
   - public.members

   BACKUP ONLY:
   - localStorage cmsCells
   - localStorage cmsMembers
   - localStorage cmsLeaders

   FEATURES:
   - Add Cell
   - Edit Cell
   - Delete Cell
   - Search Cells
   - Show Cell Leaders
   - Show LIVE Member Count
   ===================================================== */


/* =====================================================
   SUPABASE
   ===================================================== */

const cmsCellsSupabase =
    window.supabaseClient;


/* =====================================================
   STATE
   ===================================================== */

let cells = [];

let leaders = [];

let members = [];


/* =====================================================
   DOM ELEMENTS
   ===================================================== */

const addCellButton =
    document.getElementById(
        "addCellButton"
    );


const cellModal =
    document.getElementById(
        "cellModal"
    );


const closeModalButton =
    document.getElementById(
        "closeModal"
    );


const cancelButton =
    document.getElementById(
        "cancelButton"
    );


const cellForm =
    document.getElementById(
        "cellForm"
    );


const cellIdInput =
    document.getElementById(
        "cellId"
    );


const cellNameInput =
    document.getElementById(
        "cellName"
    );


const cellsTableBody =
    document.getElementById(
        "cellsTableBody"
    );


const cellSearch =
    document.getElementById(
        "cellSearch"
    );


const modalTitle =
    document.getElementById(
        "modalTitle"
    );


/* =====================================================
   ERROR HANDLER
   ===================================================== */

function showCellsDatabaseError(
    action,
    error
) {

    console.error(
        `CMS Cells - ${action}:`,
        error
    );


    const message =
        error?.message ||
        error?.details ||
        error?.hint ||
        "Unknown database error.";


    alert(
        `Unable to ${action}.\n\n${message}`
    );

}


/* =====================================================
   LOAD CELLS
   ===================================================== */

async function loadCellsFromSupabase() {

    if (!cmsCellsSupabase) {

        console.error(
            "Supabase client is unavailable."
        );

        return false;

    }


    const {
        data,
        error
    } =
        await cmsCellsSupabase

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

        showCellsDatabaseError(
            "load Cells",
            error
        );

        return false;

    }


    cells =
        data || [];


    return true;

}


/* =====================================================
   LOAD LEADERS
   ===================================================== */

async function loadCellLeadersFromSupabase() {

    const {
        data,
        error
    } =
        await cmsCellsSupabase

            .from(
                "cell_leader_directory"
            )

            .select(
                "id,full_name,email,phone,cell_id,active"
            );


    if (error) {

        showCellsDatabaseError(
            "load Cell Leaders",
            error
        );

        return false;

    }


    leaders =
        (data || [])
            .map(
                function(item) {

                    return {

                        id:
                            item.id,

                        name:
                            item.full_name ||
                            "Unnamed Leader",

                        email:
                            item.email ||
                            "",

                        phone:
                            item.phone ||
                            "",

                        cellId:
                            item.cell_id,

                        active:
                            item.active !== false

                    };

                }
            );


    return true;

}


/* =====================================================
   LOAD MEMBERS
   ===================================================== */

async function loadMembersFromSupabase() {

    const {
        data,
        error
    } =
        await cmsCellsSupabase

            .from("members")

            .select(
                "id,cell_id,active"
            );


    if (error) {

        showCellsDatabaseError(
            "load Members",
            error
        );

        return false;

    }


    members =
        data || [];


    return true;

}


/* =====================================================
   REFRESH EVERYTHING
   ===================================================== */

async function refreshCellsData() {

    if (!cmsCellsSupabase) {

        return false;

    }


    const cellsLoaded =
        await loadCellsFromSupabase();


    if (!cellsLoaded) {

        return false;

    }


    const leadersLoaded =
        await loadCellLeadersFromSupabase();


    if (!leadersLoaded) {

        return false;

    }


    const membersLoaded =
        await loadMembersFromSupabase();


    if (!membersLoaded) {

        return false;

    }


    renderCells(
        cellSearch
            ? cellSearch.value
            : ""
    );


    return true;

}


/* =====================================================
   OPEN MODAL
   ===================================================== */

function openCellModal() {

    if (!cellModal) {

        return;

    }


    cellModal.classList.add(
        "show"
    );


    cellModal.setAttribute(
        "aria-hidden",
        "false"
    );


    setTimeout(
        function() {

            if (cellNameInput) {

                cellNameInput.focus();

            }

        },
        100
    );

}


/* =====================================================
   CLOSE MODAL
   ===================================================== */

function closeCellModal() {

    if (!cellModal) {

        return;

    }


    cellModal.classList.remove(
        "show"
    );


    cellModal.setAttribute(
        "aria-hidden",
        "true"
    );


    if (cellForm) {

        cellForm.reset();

    }


    if (cellIdInput) {

        cellIdInput.value =
            "";

    }


    if (modalTitle) {

        modalTitle.textContent =
            "Add Cell";

    }

}


/* =====================================================
   ADD CELL BUTTON
   ===================================================== */

if (
    addCellButton
) {

    addCellButton.addEventListener(
        "click",
        function() {

            if (cellForm) {

                cellForm.reset();

            }


            if (cellIdInput) {

                cellIdInput.value =
                    "";

            }


            if (modalTitle) {

                modalTitle.textContent =
                    "Add Cell";

            }


            openCellModal();

        }
    );

}


/* =====================================================
   CLOSE BUTTONS
   ===================================================== */

if (
    closeModalButton
) {

    closeModalButton.addEventListener(
        "click",
        closeCellModal
    );

}


if (
    cancelButton
) {

    cancelButton.addEventListener(
        "click",
        closeCellModal
    );

}


/* =====================================================
   OUTSIDE CLICK
   ===================================================== */

if (
    cellModal
) {

    cellModal.addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                cellModal
            ) {

                closeCellModal();

            }

        }
    );

}


/* =====================================================
   ESCAPE
   ===================================================== */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key ===
                "Escape" &&
            cellModal &&
            cellModal.classList.contains(
                "show"
            )
        ) {

            closeCellModal();

        }

    }
);


/* =====================================================
   SAVE CELL
   ===================================================== */

if (
    cellForm
) {

    cellForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            if (!cmsCellsSupabase) {

                alert(
                    "Supabase is not connected."
                );

                return;

            }


            const name =
                cellNameInput
                    ? cellNameInput.value.trim()
                    : "";


            if (!name) {

                alert(
                    "Please enter the cell name."
                );

                if (
                    cellNameInput
                ) {

                    cellNameInput.focus();

                }

                return;

            }


            /* =================================================
               DUPLICATE CHECK
               ================================================= */

            const duplicate =
                cells.find(
                    function(cell) {

                        return (

                            String(
                                cell.name
                            )
                            .trim()
                            .toLowerCase() ===

                            name
                                .toLowerCase()

                            &&

                            String(
                                cell.id
                            ) !==

                            String(
                                cellIdInput
                                    ? cellIdInput.value
                                    : ""
                            )

                        );

                    }
                );


            if (duplicate) {

                alert(
                    "A cell with this name already exists."
                );

                return;

            }


            /* =================================================
               EDIT
               ================================================= */

            if (
                cellIdInput &&
                cellIdInput.value
            ) {

                const {
                    error
                } =
                    await cmsCellsSupabase

                        .from("cells")

                        .update({

                            name:
                                name,

                            updated_at:
                                new Date()
                                    .toISOString()

                        })

                        .eq(
                            "id",
                            cellIdInput.value
                        );


                if (error) {

                    showCellsDatabaseError(
                        "update the Cell",
                        error
                    );

                    return;

                }


                console.log(
                    "Cell updated successfully."
                );

            }


            /* =================================================
               ADD
               ================================================= */

            else {

                const {
                    error
                } =
                    await cmsCellsSupabase

                        .from("cells")

                        .insert({

                            name:
                                name,

                            active:
                                true

                        });


                if (error) {

                    showCellsDatabaseError(
                        "add the Cell",
                        error
                    );

                    return;

                }


                console.log(
                    "Cell added successfully."
                );

            }


            await refreshCellsData();

            closeCellModal();

        }
    );

}


/* =====================================================
   GET CELL LEADERS
   ===================================================== */

function getCellLeaders(
    cellId
) {

    return leaders.filter(
        function(leader) {

            return (
                String(
                    leader.cellId
                ) ===
                String(
                    cellId
                )
                &&
                leader.active !== false
            );

        }
    );

}


/* =====================================================
   GET MEMBER COUNT
   ===================================================== */

function getMemberCount(
    cellId
) {

    return members.filter(
        function(member) {

            return (
                String(
                    member.cell_id
                ) ===
                String(
                    cellId
                )
                &&
                member.active !== false
            );

        }
    ).length;

}


/* =====================================================
   EDIT CELL
   ===================================================== */

function editCell(
    id
) {

    const cell =
        cells.find(
            function(item) {

                return (
                    String(
                        item.id
                    ) ===
                    String(id)
                );

            }
        );


    if (!cell) {

        alert(
            "Cell not found."
        );

        return;

    }


    if (cellIdInput) {

        cellIdInput.value =
            cell.id;

    }


    if (cellNameInput) {

        cellNameInput.value =
            cell.name;

    }


    if (modalTitle) {

        modalTitle.textContent =
            "Edit Cell";

    }


    openCellModal();

}


/* =====================================================
   DELETE CELL
   ===================================================== */

async function deleteCell(
    id
) {

    const cell =
        cells.find(
            function(item) {

                return (
                    String(
                        item.id
                    ) ===
                    String(id)
                );

            }
        );


    if (!cell) {

        alert(
            "Cell not found."
        );

        return;

    }


    const cellLeaders =
        getCellLeaders(
            id
        );


    const cellMembers =
        getMemberCount(
            id
        );


    if (
        cellLeaders.length > 0
    ) {

        alert(
            `You cannot delete "${cell.name}" because it has ${cellLeaders.length} active leader(s) assigned. Please remove or reassign the leader(s) first.`
        );

        return;

    }


    if (
        cellMembers > 0
    ) {

        alert(
            `You cannot delete "${cell.name}" because it has ${cellMembers} member(s) assigned. Please move or remove the member(s) first.`
        );

        return;

    }


    const confirmed =
        confirm(
            `Are you sure you want to delete "${cell.name}"?`
        );


    if (!confirmed) {

        return;

    }


    const {
        error
    } =
        await cmsCellsSupabase

            .from("cells")

            .delete()

            .eq(
                "id",
                id
            );


    if (error) {

        showCellsDatabaseError(
            "delete the Cell",
            error
        );

        return;

    }


    await refreshCellsData();

}


/* =====================================================
   RENDER CELLS
   ===================================================== */

function renderCells(
    searchTerm = ""
) {

    if (!cellsTableBody) {

        return;

    }


    cellsTableBody.innerHTML =
        "";


    const search =
        String(
            searchTerm
        )
        .trim()
        .toLowerCase();


    const filteredCells =
        cells.filter(
            function(cell) {

                return String(
                    cell.name ||
                    ""
                )
                .toLowerCase()
                .includes(search);

            }
        );


    if (
        filteredCells.length ===
        0
    ) {

        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `

            <td
                colspan="4"
                class="empty-message"
            >

                ${
                    cells.length === 0
                        ? "No cells have been registered yet."
                        : "No cells match your search."
                }

            </td>

        `;


        cellsTableBody.appendChild(
            row
        );

        return;

    }


    filteredCells.forEach(
        function(cell) {

            const row =
                document.createElement(
                    "tr"
                );


            const cellLeaders =
                getCellLeaders(
                    cell.id
                );


            let leaderDisplay =
                `<span class="not-assigned">
                    Not assigned
                </span>`;


            if (
                cellLeaders.length ===
                1
            ) {

                leaderDisplay = `

                    <span class="leader-name">

                        ${escapeHTML(
                            cellLeaders[0].name
                        )}

                    </span>

                `;

            }


            else if (
                cellLeaders.length >=
                2
            ) {

                leaderDisplay =

                    cellLeaders
                        .slice(
                            0,
                            2
                        )
                        .map(
                            function(leader) {

                                return `

                                    <span class="leader-name">

                                        ${escapeHTML(
                                            leader.name
                                        )}

                                    </span>

                                `;

                            }
                        )
                        .join(
                            "<br>"
                        );

            }


            const memberCount =
                getMemberCount(
                    cell.id
                );


            row.innerHTML = `

                <td>

                    <div class="cell-name">

                        <strong>

                            ${escapeHTML(
                                cell.name
                            )}

                        </strong>

                    </div>

                </td>


                <td>

                    ${leaderDisplay}

                </td>


                <td>

                    <span class="member-count">

                        ${memberCount}

                    </span>

                </td>


                <td>

                    <button
                        type="button"
                        class="action-button edit"
                        onclick="editCell('${escapeHTML(
                            cell.id
                        )}')"
                    >

                        Edit

                    </button>


                    <button
                        type="button"
                        class="action-button delete"
                        onclick="deleteCell('${escapeHTML(
                            cell.id
                        )}')"
                    >

                        Delete

                    </button>

                </td>

            `;


            cellsTableBody.appendChild(
                row
            );

        }
    );

}


/* =====================================================
   SEARCH
   ===================================================== */

if (
    cellSearch
) {

    cellSearch.addEventListener(
        "input",
        function() {

            renderCells(
                cellSearch.value
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
   INLINE BUTTONS
   ===================================================== */

window.editCell =
    editCell;


window.deleteCell =
    deleteCell;


/* =====================================================
   INITIALIZE
   ===================================================== */

(async function initializeCells() {

    if (!cmsCellsSupabase) {

        console.error(
            "CMS Cells: Supabase client not available."
        );

        return;

    }


    const success =
        await refreshCellsData();


    if (success) {

        console.log(
            "CMS Cells connected to Supabase successfully."
        );

        console.log(
            `Cells: ${cells.length}`
        );

        console.log(
            `Members loaded for counting: ${members.length}`
        );

    }

})();