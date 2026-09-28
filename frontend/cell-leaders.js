/* =====================================================
   CMS - CELL LEADERS MANAGEMENT
   SUPABASE CONNECTED VERSION

   LIVE DATABASE:
   - cell_leader_directory
   - cells

   BACKUP ONLY:
   - cmsLeaders
   - cmsCells

   RULE:
   - Maximum 2 active leaders per cell
   ===================================================== */


/* =====================================================
   SUPABASE CLIENT
   ===================================================== */

const cmsSupabase =
    window.supabaseClient;


/* =====================================================
   FRONTEND STATE
   ===================================================== */

let cells = [];

let leaders = [];


/* =====================================================
   DOM ELEMENTS
   ===================================================== */

const addLeaderButton =
    document.getElementById(
        "addLeaderButton"
    );

const leaderModal =
    document.getElementById(
        "leaderModal"
    );

const closeLeaderModalButton =
    document.getElementById(
        "closeLeaderModal"
    );

const cancelLeaderButton =
    document.getElementById(
        "cancelLeaderButton"
    );

const leaderForm =
    document.getElementById(
        "leaderForm"
    );

const leaderIdInput =
    document.getElementById(
        "leaderId"
    );

const leaderNameInput =
    document.getElementById(
        "leaderName"
    );

const leaderEmailInput =
    document.getElementById(
        "leaderEmail"
    );

const leaderPhoneInput =
    document.getElementById(
        "leaderPhone"
    );

const leaderCellSelect =
    document.getElementById(
        "leaderCell"
    );

const leadersTableBody =
    document.getElementById(
        "leadersTableBody"
    );

const leaderSearch =
    document.getElementById(
        "leaderSearch"
    );

const leaderModalTitle =
    document.getElementById(
        "leaderModalTitle"
    );


/* =====================================================
   DATABASE ERROR
   ===================================================== */

function showDatabaseError(
    action,
    error
) {

    console.error(
        `CMS Cell Leaders - ${action}:`,
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

async function loadCellsFromSupabase() {

    if (!cmsSupabase) {

        console.error(
            "Supabase client not available."
        );

        return false;

    }


    const {
        data,
        error
    } =
        await cmsSupabase

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

        showDatabaseError(
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

async function loadLeadersFromSupabase() {

    if (!cmsSupabase) {

        console.error(
            "Supabase client not available."
        );

        return false;

    }


    const {
        data,
        error
    } =
        await cmsSupabase

            .from(
                "cell_leader_directory"
            )

            .select(`
                id,
                old_local_id,
                full_name,
                email,
                phone,
                cell_id,
                active,
                auth_user_id,
                migrated_to_profile,
                created_at,
                updated_at,
                cells (
                    id,
                    name,
                    active
                )
            `)

            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        showDatabaseError(
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

                        /*
                           Keep database ID.
                        */

                        id:
                            item.id,

                        /*
                           Preserve original
                           local ID for backup
                           compatibility.
                        */

                        oldLocalId:
                            item.old_local_id,

                        /*
                           FRONTEND FIELD NAMES
                        */

                        name:
                            item.full_name ||
                            "",

                        email:
                            item.email ||
                            "",

                        phone:
                            item.phone ||
                            "",

                        cellId:
                            item.cell_id,

                        active:
                            item.active !== false,

                        authUserId:
                            item.auth_user_id,

                        migratedToProfile:
                            item.migrated_to_profile,

                        createdAt:
                            item.created_at,

                        updatedAt:
                            item.updated_at,

                        cell:
                            item.cells ||
                            null

                    };

                }
            );


    return true;

}


/* =====================================================
   REFRESH DATABASE DATA
   ===================================================== */

async function refreshData() {

    const cellsLoaded =
        await loadCellsFromSupabase();


    if (!cellsLoaded) {

        return false;

    }


    const leadersLoaded =
        await loadLeadersFromSupabase();


    if (!leadersLoaded) {

        return false;

    }


    loadCellOptions();


    renderLeaders(
        leaderSearch
            ? leaderSearch.value
            : ""
    );


    return true;

}


/* =====================================================
   OPEN MODAL
   ===================================================== */

function openLeaderModal() {

    if (!leaderModal) {

        return;

    }


    leaderModal.classList.add(
        "show"
    );


    leaderModal.setAttribute(
        "aria-hidden",
        "false"
    );


    setTimeout(
        function() {

            if (
                leaderNameInput
            ) {

                leaderNameInput.focus();

            }

        },
        100
    );

}


/* =====================================================
   CLOSE MODAL
   ===================================================== */

function closeLeaderModal() {

    if (!leaderModal) {

        return;

    }


    leaderModal.classList.remove(
        "show"
    );


    leaderModal.setAttribute(
        "aria-hidden",
        "true"
    );


    if (leaderForm) {

        leaderForm.reset();

    }


    if (
        leaderIdInput
    ) {

        leaderIdInput.value =
            "";

    }


    if (
        leaderModalTitle
    ) {

        leaderModalTitle.textContent =
            "Add Cell Leader";

    }


    loadCellOptions();

}


/* =====================================================
   LOAD ACTIVE CELLS INTO SELECT
   ===================================================== */

function loadCellOptions(
    selectedCellId = ""
) {

    if (!leaderCellSelect) {

        return;

    }


    leaderCellSelect.innerHTML = `

        <option value="">
            Select a cell
        </option>

    `;


    const activeCells =
        cells.filter(
            function(cell) {

                return (
                    cell.active !==
                    false
                );

            }
        );


    activeCells.forEach(
        function(cell) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                cell.id;


            option.textContent =
                cell.name;


            leaderCellSelect.appendChild(
                option
            );

        }
    );


    if (
        activeCells.length ===
        0
    ) {

        leaderCellSelect.innerHTML = `

            <option value="">
                No active cells available
            </option>

        `;

    }


    if (
        selectedCellId
    ) {

        leaderCellSelect.value =
            selectedCellId;

    }

}


/* =====================================================
   COUNT ACTIVE LEADERS IN CELL
   ===================================================== */

function countCellLeaders(
    cellId,
    excludeLeaderId = ""
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
                String(
                    leader.id
                ) !==
                String(
                    excludeLeaderId
                )
                &&
                leader.active !== false
            );

        }
    ).length;

}


/* =====================================================
   ADD BUTTON
   ===================================================== */

if (
    addLeaderButton
) {

    addLeaderButton.addEventListener(
        "click",
        function() {

            if (
                leaderForm
            ) {

                leaderForm.reset();

            }


            if (
                leaderIdInput
            ) {

                leaderIdInput.value =
                    "";

            }


            if (
                leaderModalTitle
            ) {

                leaderModalTitle.textContent =
                    "Add Cell Leader";

            }


            loadCellOptions();


            openLeaderModal();

        }
    );

}


/* =====================================================
   CLOSE BUTTONS
   ===================================================== */

if (
    closeLeaderModalButton
) {

    closeLeaderModalButton.addEventListener(
        "click",
        closeLeaderModal
    );

}


if (
    cancelLeaderButton
) {

    cancelLeaderButton.addEventListener(
        "click",
        closeLeaderModal
    );

}


/* =====================================================
   CLOSE OUTSIDE MODAL
   ===================================================== */

if (
    leaderModal
) {

    leaderModal.addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                leaderModal
            ) {

                closeLeaderModal();

            }

        }
    );

}


/* =====================================================
   ESCAPE KEY
   ===================================================== */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key ===
                "Escape" &&
            leaderModal &&
            leaderModal.classList.contains(
                "show"
            )
        ) {

            closeLeaderModal();

        }

    }
);


/* =====================================================
   SAVE LEADER
   ===================================================== */

if (
    leaderForm
) {

    leaderForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            if (!cmsSupabase) {

                alert(
                    "Supabase is not connected."
                );

                return;

            }


            const name =
                leaderNameInput
                    ? leaderNameInput.value
                        .trim()
                    : "";


            const email =
                leaderEmailInput
                    ? leaderEmailInput.value
                        .trim()
                    : "";


            const phone =
                leaderPhoneInput
                    ? leaderPhoneInput.value
                        .trim()
                    : "";


            const selectedCellId =
                leaderCellSelect
                    ? leaderCellSelect.value
                    : "";


            /* =================================================
               REQUIRED FIELDS
               ================================================= */

            if (!name) {

                alert(
                    "Please enter the leader's name."
                );

                if (
                    leaderNameInput
                ) {

                    leaderNameInput.focus();

                }

                return;

            }


            if (!selectedCellId) {

                alert(
                    "Please select a cell."
                );

                return;

            }


            const selectedCell =
                cells.find(
                    function(cell) {

                        return (
                            String(
                                cell.id
                            ) ===
                            String(
                                selectedCellId
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


            /* =================================================
               EDIT EXISTING LEADER
               ================================================= */

            if (
                leaderIdInput &&
                leaderIdInput.value
            ) {

                const existingLeader =
                    leaders.find(
                        function(item) {

                            return (
                                String(
                                    item.id
                                ) ===
                                String(
                                    leaderIdInput
                                        .value
                                )
                            );

                        }
                    );


                if (!existingLeader) {

                    alert(
                        "The selected leader could not be found."
                    );

                    return;

                }


                /* ---------------------------------------------
                   CHECK 2-LEADER LIMIT WHEN MOVING
                   --------------------------------------------- */

                const movingToDifferentCell =
                    String(
                        existingLeader.cellId
                    ) !==
                    String(
                        selectedCellId
                    );


                if (
                    movingToDifferentCell
                ) {

                    const newCellCount =
                        countCellLeaders(
                            selectedCellId,
                            existingLeader.id
                        );


                    if (
                        newCellCount >=
                        2
                    ) {

                        alert(
                            `${selectedCell.name} already has two active leaders. A cell can have a maximum of two leaders.`
                        );

                        return;

                    }

                }


                /* ---------------------------------------------
                   UPDATE
                   --------------------------------------------- */

                const {
                    error
                } =
                    await cmsSupabase

                        .from(
                            "cell_leader_directory"
                        )

                        .update({

                            full_name:
                                name,

                            email:
                                email ||
                                null,

                            phone:
                                phone ||
                                null,

                            cell_id:
                                selectedCellId,

                            updated_at:
                                new Date()
                                    .toISOString()

                        })

                        .eq(
                            "id",
                            existingLeader.id
                        );


                if (error) {

                    showDatabaseError(
                        "update the Cell Leader",
                        error
                    );

                    return;

                }


                console.log(
                    "Cell Leader updated successfully."
                );

            }


            /* =================================================
               ADD NEW LEADER
               ================================================= */

            else {

                const currentCount =
                    countCellLeaders(
                        selectedCellId
                    );


                if (
                    currentCount >=
                    2
                ) {

                    alert(
                        `${selectedCell.name} already has two active leaders. A cell can have a maximum of two leaders.`
                    );

                    return;

                }


                const {
                    error
                } =
                    await cmsSupabase

                        .from(
                            "cell_leader_directory"
                        )

                        .insert({

                            full_name:
                                name,

                            email:
                                email ||
                                null,

                            phone:
                                phone ||
                                null,

                            cell_id:
                                selectedCellId,

                            active:
                                true,

                            auth_user_id:
                                null,

                            migrated_to_profile:
                                false

                        });


                if (error) {

                    showDatabaseError(
                        "add the Cell Leader",
                        error
                    );

                    return;

                }


                console.log(
                    "Cell Leader added successfully."
                );

            }


            await refreshData();

            closeLeaderModal();

        }
    );

}


/* =====================================================
   EDIT LEADER
   ===================================================== */

function editLeader(
    id
) {

    const leader =
        leaders.find(
            function(item) {

                return (
                    String(
                        item.id
                    ) ===
                    String(id)
                );

            }
        );


    if (!leader) {

        alert(
            "Cell Leader not found."
        );

        return;

    }


    if (
        leaderIdInput
    ) {

        leaderIdInput.value =
            leader.id;

    }


    if (
        leaderNameInput
    ) {

        leaderNameInput.value =
            leader.name;

    }


    if (
        leaderEmailInput
    ) {

        leaderEmailInput.value =
            leader.email ||
            "";

    }


    if (
        leaderPhoneInput
    ) {

        leaderPhoneInput.value =
            leader.phone ||
            "";

    }


    loadCellOptions(
        leader.cellId
    );


    if (
        leaderModalTitle
    ) {

        leaderModalTitle.textContent =
            "Edit Cell Leader";

    }


    openLeaderModal();

}


/* =====================================================
   DELETE LEADER
   ===================================================== */

async function deleteLeader(
    id
) {

    const leader =
        leaders.find(
            function(item) {

                return (
                    String(
                        item.id
                    ) ===
                    String(id)
                );

            }
        );


    if (!leader) {

        alert(
            "Cell Leader not found."
        );

        return;

    }


    const confirmed =
        confirm(
            `Are you sure you want to remove ${leader.name} as a Cell Leader?`
        );


    if (!confirmed) {

        return;

    }


    if (!cmsSupabase) {

        alert(
            "Supabase is not connected."
        );

        return;

    }


    /*
       Delete only the management record.
       We do NOT delete any future Auth account.
    */

    const {
        error
    } =
        await cmsSupabase

            .from(
                "cell_leader_directory"
            )

            .delete()

            .eq(
                "id",
                id
            );


    if (error) {

        showDatabaseError(
            "delete the Cell Leader",
            error
        );

        return;

    }


    await refreshData();


    console.log(
        "Cell Leader deleted successfully."
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


    return cell
        ? cell.name
        : "Unknown cell";

}
/* =====================================================
   CMS - CELL LEADER ACCOUNT MANAGEMENT
   ===================================================== */

const CELL_LEADER_ACCOUNT_FUNCTION =
    "cms-cell-leader-account-manager";


/* =====================================================
   ACCOUNT MANAGEMENT
   ===================================================== */

async function manageCellLeaderAccount(
    action,
    leaderId
) {

    if (!cmsSupabase) {

        alert(
            "Supabase is not connected."
        );

        return;

    }


    const leader =
        leaders.find(
            function(item) {

                return (
                    String(item.id) ===
                    String(leaderId)
                );

            }
        );


    if (!leader) {

        alert(
            "Cell Leader not found."
        );

        return;

    }


    const confirmed =
        confirm(
            action === "reset_password"
                ? `Reset the password for ${leader.name} to the CMS general password?`
                : `Create a CMS account for ${leader.name}?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await cmsSupabase.functions.invoke(
                CELL_LEADER_ACCOUNT_FUNCTION,
                {
                    body: {

                        action:
                            action,

                        leader_id:
                            leaderId

                    }

                }
            );


        if (error) {

            console.error(
                "Cell Leader account function error:",
                error
            );

            throw new Error(
                error.message ||
                "Unable to manage the Cell Leader account."
            );

        }


        if (
            !data ||
            !data.success
        ) {

            throw new Error(
                data?.error ||
                "Unable to manage the Cell Leader account."
            );

        }


        const account =
            data.account ||
            data;


        const username =
            account.username ||
            leader.username ||
            "—";


        const password =
            account.password ||
            data.password ||
            "—";


        const message =
            action ===
            "reset_password"

                ? (
                    `PASSWORD RESET SUCCESSFUL\n\n` +
                    `Leader: ${leader.name}\n` +
                    `Username: ${username}\n` +
                    `New Password: ${password}\n\n` +
                    `The Cell Leader can continue using this password ` +
                    `or change it later.`
                )

                : (
                    `ACCOUNT CREATED SUCCESSFULLY\n\n` +
                    `Leader: ${leader.name}\n` +
                    `Username: ${username}\n` +
                    `Initial Password: ${password}\n\n` +
                    `Give these credentials to the Cell Leader.`
                );


        alert(
            message
        );


        await refreshData();

    }

    catch (
        error
    ) {

        console.error(
            "CMS Cell Leader account error:",
            error
        );


        alert(
            error.message ||
            "Unable to manage the Cell Leader account."
        );

    }

}


window.manageCellLeaderAccount =
    manageCellLeaderAccount;


/* =====================================================
   CREATE ACCOUNTS FOR ALL LEADERS
   ===================================================== */

async function createAllCellLeaderAccounts() {

    if (!cmsSupabase) {

        alert(
            "Supabase is not connected."
        );

        return;

    }


    const confirmed =
        confirm(
            "Create accounts for all active Cell Leaders who do not already have accounts?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await cmsSupabase.functions.invoke(
                CELL_LEADER_ACCOUNT_FUNCTION,
                {
                    body: {

                        action:
                            "create_all"

                    }

                }
            );


        if (error) {

            console.error(
                "Create all accounts error:",
                error
            );

            throw new Error(
                error.message ||
                "Unable to create Cell Leader accounts."
            );

        }


        if (
            !data ||
            !data.success
        ) {

            throw new Error(
                data?.error ||
                "Unable to create Cell Leader accounts."
            );

        }


        const accounts =
            data.accounts ||
            [];


        const created =
            accounts.filter(
                item =>
                    item.status ===
                    "created"
            );


        const existing =
            accounts.filter(
                item =>
                    item.status ===
                    "existing"
            );


        const failed =
            accounts.filter(
                item =>
                    item.status ===
                    "error"
            );


        let message =
            "CELL LEADER ACCOUNTS\n\n";


        message +=
            `GENERAL PASSWORD:\n${data.password}\n\n`;


        if (
            created.length > 0
        ) {

            message +=
                "NEW ACCOUNTS\n\n";


            created.forEach(
                account => {

                    message +=
                        `${account.leader}\n` +
                        `Username: ${account.username}\n` +
                        `Password: ${account.password}\n\n`;

                }
            );

        }


        if (
            existing.length > 0
        ) {

            message +=
                `Already active: ${existing.length}\n`;

        }


        if (
            failed.length > 0
        ) {

            message +=
                `Failed: ${failed.length}\n\n`;


            failed.forEach(
                account => {

                    message +=
                        `${account.leader}: ${account.error}\n`;

                }
            );

        }


        alert(
            message
        );


        /*
           Copy the complete credentials
           for Coordinator use.
        */

        try {

            await navigator.clipboard.writeText(
                message
            );

        }

        catch {

            /* Clipboard is optional. */

        }


        await refreshData();

    }

    catch (
        error
    ) {

        console.error(
            "Create all Cell Leader accounts error:",
            error
        );


        alert(
            error.message ||
            "Unable to create Cell Leader accounts."
        );

    }

}


window.createAllCellLeaderAccounts =
    createAllCellLeaderAccounts;


/* =====================================================
   CREATE ACCOUNT TOOLBAR BUTTON
   ===================================================== */

function addAccountManagementButton() {

    if (
        !addLeaderButton ||
        document.getElementById(
            "createAllLeaderAccountsButton"
        )
    ) {

        return;

    }


    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.id =
        "createAllLeaderAccountsButton";


    button.className =
        "secondary-button";


    button.textContent =
        "Create All Accounts";


    button.style.marginLeft =
        "8px";


    button.addEventListener(
        "click",
        createAllCellLeaderAccounts
    );


    addLeaderButton.parentNode.insertBefore(
        button,
        addLeaderButton.nextSibling
    );

}

/* =====================================================
   DISPLAY LEADERS
   ===================================================== */

function renderLeaders(
    searchTerm = ""
) {

    if (!leadersTableBody) {

        return;

    }


    leadersTableBody.innerHTML =
        "";


    const search =
        String(
            searchTerm
        )
        .trim()
        .toLowerCase();


    const filteredLeaders =
        leaders.filter(
            function(leader) {

                const name =
                    String(
                        leader.name ||
                        ""
                    )
                    .toLowerCase();


                const email =
                    String(
                        leader.email ||
                        ""
                    )
                    .toLowerCase();


                const phone =
                    String(
                        leader.phone ||
                        ""
                    )
                    .toLowerCase();


                const cellName =
                    getCellName(
                        leader.cellId
                    )
                    .toLowerCase();


                return (
                    name.includes(
                        search
                    )
                    ||
                    email.includes(
                        search
                    )
                    ||
                    phone.includes(
                        search
                    )
                    ||
                    cellName.includes(
                        search
                    )
                );

            }
        );


    /* =================================================
       EMPTY
       ================================================= */

    if (
        filteredLeaders.length ===
        0
    ) {

        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `

            <td
                colspan="5"
                class="empty-message"
            >

                ${
                    leaders.length ===
                    0
                        ? "No cell leaders have been registered yet."
                        : "No leaders match your search."
                }

            </td>

        `;


        leadersTableBody.appendChild(
            row
        );


        return;

    }


    /* =================================================
       DISPLAY
       ================================================= */

    filteredLeaders.forEach(
        function(leader) {

            const row =
                document.createElement(
                    "tr"
                );


            const cellName =
                getCellName(
                    leader.cellId
                );


            row.innerHTML = `

                <td>

                    <strong>
                        ${escapeHTML(
                            leader.name
                        )}
                    </strong>

                </td>


                <td>

                    ${
                        leader.email
                            ? escapeHTML(
                                leader.email
                            )
                            : "—"
                    }

                </td>


                <td>

                    ${
                        leader.phone
                            ? escapeHTML(
                                leader.phone
                            )
                            : "—"
                    }

                </td>


                <td>

                    ${escapeHTML(
                        cellName
                    )}

                </td>


<td>

    <button
        type="button"
        class="action-button edit"
        onclick="editLeader('${escapeHTML(
            leader.id
        )}')"
    >
        Edit
    </button>


    ${
        leader.authUserId

            ? `
                <span
                    style="
                        display:inline-block;
                        margin:4px;
                        padding:5px 8px;
                        border-radius:6px;
                        background:#e8f5e9;
                        color:#2e7d32;
                        font-size:12px;
                        font-weight:600;
                    "
                >
                    Account Active
                </span>

                <button
                    type="button"
                    class="action-button edit"
                    onclick="manageCellLeaderAccount(
                        'reset_password',
                        '${escapeHTML(
                            leader.id
                        )}'
                    )"
                >
                    Reset Password
                </button>
            `

            : `
                <button
                    type="button"
                    class="action-button edit"
                    onclick="manageCellLeaderAccount(
                        'create_one',
                        '${escapeHTML(
                            leader.id
                        )}'
                    )"
                >
                    Create Account
                </button>
            `
    }


    <button
        type="button"
        class="action-button delete"
        onclick="deleteLeader('${escapeHTML(
            leader.id
        )}')"
    >
        Delete
    </button>

</td>
            `;


            leadersTableBody.appendChild(
                row
            );

        }
    );

}


/* =====================================================
   SEARCH
   ===================================================== */

if (
    leaderSearch
) {

    leaderSearch.addEventListener(
        "input",
        function() {

            renderLeaders(
                leaderSearch.value
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
   INITIALIZE
   ===================================================== */
addAccountManagementButton();

(async function initializeCellLeaders() {

    const success =
        await refreshData();


    if (success) {

        console.log(
            "CMS Cell Leaders connected to Supabase successfully."
        );

    }

})();