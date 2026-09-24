/* =====================================================
   CMS - FOLLOW-UPS MANAGEMENT SYSTEM
   ===================================================== */


/* =====================================================
   DATA
   ===================================================== */

let cells = [];
let members = [];
let cellLeaders = [];
let followUps = [];


/* =====================================================
   ELEMENTS
   ===================================================== */

const followUpModal =
    document.getElementById("followUpModal");

const followUpForm =
    document.getElementById("followUpForm");

const followUpId =
    document.getElementById("followUpId");

const followUpCell =
    document.getElementById("followUpCell");

const followUpMember =
    document.getElementById("followUpMember");

const followUpAssignedTo =
    document.getElementById("followUpAssignedTo");

const followUpReason =
    document.getElementById("followUpReason");

const followUpDetails =
    document.getElementById("followUpDetails");

const followUpPriority =
    document.getElementById("followUpPriority");

const followUpDate =
    document.getElementById("followUpDate");

const followUpStatus =
    document.getElementById("followUpStatus");

const followUpAction =
    document.getElementById("followUpAction");

const followUpNextAction =
    document.getElementById("followUpNextAction");

const followUpsTableBody =
    document.getElementById("followUpsTableBody");

const followUpSearch =
    document.getElementById("followUpSearch");

const memberInfo =
    document.getElementById("memberInfo");

const followUpMessage =
    document.getElementById("followUpMessage");

const totalFollowUps =
    document.getElementById("totalFollowUps");

const pendingFollowUps =
    document.getElementById("pendingFollowUps");

const progressFollowUps =
    document.getElementById("progressFollowUps");

const completedFollowUps =
    document.getElementById("completedFollowUps");

const newFollowUpButton =
    document.getElementById("newFollowUpButton");

const closeFollowUpModal =
    document.getElementById("closeFollowUpModal");

const cancelFollowUpButton =
    document.getElementById("cancelFollowUpButton");


/* =====================================================
   CURRENT VIEWED RECORD
   ===================================================== */

let currentViewedFollowUp = null;


/* =====================================================
   LOAD DATA
   ===================================================== */

function refreshData() {

    /* -----------------------------
       CELLS
       ----------------------------- */

    try {

        cells =
            JSON.parse(
                localStorage.getItem("cmsCells")
            ) || [];

    } catch (error) {

        console.error(
            "Could not load cells:",
            error
        );

        cells = [];
    }


    /* -----------------------------
       MEMBERS
       ----------------------------- */

    try {

        members =
            JSON.parse(
                localStorage.getItem("cmsMembers")
            ) || [];

    } catch (error) {

        console.error(
            "Could not load members:",
            error
        );

        members = [];
    }


    /* -----------------------------
       CELL LEADERS
       ----------------------------- */

    let currentLeaders = [];
    let oldLeaders = [];

    try {

        currentLeaders =
            JSON.parse(
                localStorage.getItem(
                    "cmsCellLeaders"
                )
            ) || [];

    } catch (error) {

        currentLeaders = [];
    }


    try {

        oldLeaders =
            JSON.parse(
                localStorage.getItem(
                    "cmsLeaders"
                )
            ) || [];

    } catch (error) {

        oldLeaders = [];
    }


    /*
       Use current dataset when it
       contains leaders.

       Otherwise recover the
       older dataset.
    */

    if (currentLeaders.length > 0) {

        cellLeaders =
            currentLeaders;

    } else {

        cellLeaders =
            oldLeaders;
    }


    /* -----------------------------
       FOLLOW-UPS
       ----------------------------- */

    try {

        followUps =
            JSON.parse(
                localStorage.getItem(
                    "cmsFollowUps"
                )
            ) || [];

    } catch (error) {

        console.error(
            "Could not load follow-ups:",
            error
        );

        followUps = [];
    }
}


/* =====================================================
   SAVE FOLLOW-UPS
   ===================================================== */

function saveFollowUps() {

    localStorage.setItem(
        "cmsFollowUps",
        JSON.stringify(followUps)
    );
}


/* =====================================================
   GENERATE ID
   ===================================================== */

function generateId() {

    return (
        "followup_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );
}


/* =====================================================
   DATE HELPERS
   ===================================================== */

function getToday() {

    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");

    return (
        year +
        "-" +
        month +
        "-" +
        day
    );
}


function formatDate(date) {

    if (!date) {
        return "—";
    }

    const parts =
        String(date).split("-");

    if (parts.length !== 3) {

        return String(date);
    }

    return (
        parts[2] +
        "/" +
        parts[1] +
        "/" +
        parts[0]
    );
}


function formatDateTime(value) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";
    }

    return date.toLocaleString();
}


/* =====================================================
   DISPLAY VALUE
   ===================================================== */

function displayValue(value) {

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {

        return "—";
    }

    return String(value).trim();
}


/* =====================================================
   ESCAPE HTML
   ===================================================== */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =====================================================
   ESCAPE ATTRIBUTE
   ===================================================== */

function escapeAttribute(value) {

    return String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}


/* =====================================================
   CELL HELPERS
   ===================================================== */

function getCellName(cellId) {

    const cell =
        cells.find(
            item =>
                String(item.id) ===
                String(cellId)
        );

    if (!cell) {
        return "Unknown Cell";
    }

    return (
        cell.name ||
        cell.cellName ||
        "Unknown Cell"
    );
}


function loadCells() {

    if (!followUpCell) {
        return;
    }

    followUpCell.innerHTML = `
        <option value="">
            Select a cell
        </option>
    `;

    cells.forEach(function(cell) {

        const option =
            document.createElement("option");

        option.value =
            cell.id;

        option.textContent =
            cell.name ||
            cell.cellName ||
            "Unnamed Cell";

        followUpCell.appendChild(option);
    });


    if (cells.length === 0) {

        followUpCell.innerHTML = `
            <option value="">
                No cells available
            </option>
        `;
    }
}


/* =====================================================
   MEMBER HELPERS
   ===================================================== */

function getMember(memberId) {

    return members.find(
        member =>
            String(member.id) ===
            String(memberId)
    );
}


function getMembersForCell(cellId) {

    if (!cellId) {
        return [];
    }

    return members.filter(
        function(member) {

            const memberCellId =
                member.cellId ??
                member.cell ??
                member.cellID ??
                member.cell_id;

            return (
                String(memberCellId) ===
                String(cellId)
            );
        }
    );
}


function loadMembersForCell(
    selectedMemberId = ""
) {

    if (!followUpMember) {
        return;
    }

    followUpMember.innerHTML = `
        <option value="">
            Select a member
        </option>
    `;

    if (memberInfo) {
        memberInfo.textContent = "";
    }

    const cellId =
        followUpCell.value;

    if (!cellId) {

        followUpMember.disabled =
            true;

        return;
    }

    const cellMembers =
        getMembersForCell(cellId);


    if (cellMembers.length === 0) {

        followUpMember.innerHTML = `
            <option value="">
                No members found for this cell
            </option>
        `;

        followUpMember.disabled =
            true;

        return;
    }


    cellMembers.forEach(
        function(member) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                member.id;

            option.textContent =
                member.name ||
                member.fullName ||
                member.memberName ||
                "Unnamed Member";

            followUpMember.appendChild(
                option
            );
        }
    );


    followUpMember.disabled =
        false;


    if (selectedMemberId) {

        followUpMember.value =
            selectedMemberId;
    }
}


/* =====================================================
   LEADER HELPERS
   ===================================================== */

function getLeadersForCell(cellId) {

    if (!cellId) {
        return [];
    }

    return cellLeaders.filter(
        function(leader) {

            const leaderCellId =
                leader.cellId ??
                leader.cell ??
                leader.cellID ??
                leader.cell_id;

            return (
                String(leaderCellId) ===
                String(cellId)
            );
        }
    );
}


function getAssigneeName(assignedTo) {

    if (!assignedTo) {
        return "—";
    }


    if (
        String(assignedTo).toLowerCase() ===
        "coordinator"
    ) {

        return "Coordinator";
    }


    let leaderId =
        String(assignedTo);


    if (
        leaderId.startsWith("leader:")
    ) {

        leaderId =
            leaderId.substring(7);
    }


    const leader =
        cellLeaders.find(
            item =>
                String(item.id) ===
                String(leaderId)
        );


    if (!leader) {
        return "—";
    }


    return (
        leader.name ||
        leader.fullName ||
        leader.leaderName ||
        "Unknown Leader"
    );
}


function loadFollowUpAssignees(
    selectedValue = ""
) {

    if (!followUpAssignedTo) {
        return;
    }

    followUpAssignedTo.innerHTML = `
        <option value="">
            Select who will handle this follow-up
        </option>

        <option value="coordinator">
            Coordinator
        </option>
    `;


    const cellId =
        followUpCell.value;


    if (!cellId) {

        followUpAssignedTo.disabled =
            false;

        if (selectedValue) {

            followUpAssignedTo.value =
                selectedValue;
        }

        return;
    }


    const leaders =
        getLeadersForCell(cellId);


    leaders.forEach(
        function(leader) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                "leader:" +
                leader.id;

            option.textContent =
                leader.name ||
                leader.fullName ||
                leader.leaderName ||
                "Unnamed Cell Leader";

            followUpAssignedTo.appendChild(
                option
            );
        }
    );


    followUpAssignedTo.disabled =
        false;


    if (selectedValue) {

        const exactOption =
            Array.from(
                followUpAssignedTo.options
            ).find(
                option =>
                    option.value ===
                    String(selectedValue)
            );


        if (exactOption) {

            followUpAssignedTo.value =
                exactOption.value;

            return;
        }


        /*
           Support old records that
           saved only the leader ID.
        */

        const legacyOption =
            Array.from(
                followUpAssignedTo.options
            ).find(
                option =>
                    option.value ===
                    "leader:" +
                    String(selectedValue)
            );


        if (legacyOption) {

            followUpAssignedTo.value =
                legacyOption.value;
        }
    }
}


/* =====================================================
   MEMBER INFORMATION
   ===================================================== */

function showMemberInformation() {

    if (!memberInfo) {
        return;
    }

    const member =
        getMember(
            followUpMember.value
        );


    if (!member) {

        memberInfo.textContent =
            "";

        return;
    }


    const year =
        member.year ||
        member.yearOfStudy ||
        "—";


    const combination =
        member.combination ||
        "—";


    memberInfo.textContent =
        "Year: " +
        year +
        " • Combination: " +
        combination;
}


/* =====================================================
   FORM RESET
   ===================================================== */

function resetForm() {

    if (followUpForm) {

        followUpForm.reset();
    }


    if (followUpId) {

        followUpId.value =
            "";
    }


    if (followUpMember) {

        followUpMember.innerHTML = `
            <option value="">
                Select a cell first
            </option>
        `;

        followUpMember.disabled =
            true;
    }


    if (followUpAssignedTo) {

        followUpAssignedTo.innerHTML = `
            <option value="">
                Select a cell first
            </option>
        `;

        followUpAssignedTo.disabled =
            true;
    }


    if (memberInfo) {

        memberInfo.textContent =
            "";
    }


    if (followUpMessage) {

        followUpMessage.textContent =
            "";
    }


    const title =
        document.getElementById(
            "followUpModalTitle"
        );

    if (title) {

        title.textContent =
            "Add Follow-up";
    }
}


/* =====================================================
   OPEN MODAL
   ===================================================== */

function openModal() {

    refreshData();

    resetForm();

    loadCells();


    if (followUpDate) {

        followUpDate.value =
            getToday();
    }


    if (followUpPriority) {

        followUpPriority.value =
            "Medium";
    }


    if (followUpStatus) {

        followUpStatus.value =
            "Pending";
    }


    if (followUpModal) {

        followUpModal.style.display =
            "flex";
    }
}


/* =====================================================
   CLOSE MODAL
   ===================================================== */

function closeModal() {

    if (followUpModal) {

        followUpModal.style.display =
            "none";
    }
}


/* =====================================================
   COLLECT DATA
   ===================================================== */

function collectFollowUpData() {

    const now =
        new Date().toISOString();


    const existing =
        followUps.find(
            item =>
                String(item.id) ===
                String(followUpId.value)
        );


    const member =
        getMember(
            followUpMember.value
        );


    const assignedTo =
        followUpAssignedTo.value;


    return {

        id:
            followUpId.value ||
            generateId(),

        cellId:
            followUpCell.value,

        cellName:
            getCellName(
                followUpCell.value
            ),

        memberId:
            followUpMember.value,

        memberName:
            member
                ? (
                    member.name ||
                    member.fullName ||
                    member.memberName ||
                    "Unknown Member"
                )
                : "Unknown Member",

        assignedTo:
            assignedTo,

        assignedToName:
            getAssigneeName(
                assignedTo
            ),

        reason:
            followUpReason.value.trim(),

        details:
            followUpDetails.value.trim(),

        priority:
            followUpPriority.value,

        followUpDate:
            followUpDate.value,

        status:
            followUpStatus.value,

        actionTaken:
            followUpAction.value.trim(),

        nextAction:
            followUpNextAction.value.trim(),

        createdAt:
            existing?.createdAt ||
            now,

        updatedAt:
            now,

        completedAt:
            followUpStatus.value ===
            "Completed"
                ? (
                    existing?.completedAt ||
                    now
                )
                : null
    };
}


/* =====================================================
   VALIDATION
   ===================================================== */

function validateFollowUp() {

    if (!followUpCell.value) {

        alert(
            "Please select a cell."
        );

        followUpCell.focus();

        return false;
    }


    if (!followUpMember.value) {

        alert(
            "Please select a member."
        );

        followUpMember.focus();

        return false;
    }


    if (!followUpAssignedTo.value) {

        alert(
            "Please select Coordinator or Cell Leader."
        );

        followUpAssignedTo.focus();

        return false;
    }


    if (!followUpReason.value.trim()) {

        alert(
            "Please enter the reason for the follow-up."
        );

        followUpReason.focus();

        return false;
    }


    if (!followUpDate.value) {

        alert(
            "Please select the follow-up date."
        );

        followUpDate.focus();

        return false;
    }


    return true;
}


/* =====================================================
   RECORDS CENTER
   ===================================================== */

function createRecordEntry(followUp) {

    let records = [];


    try {

        records =
            JSON.parse(
                localStorage.getItem(
                    "cmsRecords"
                )
            ) || [];

    } catch {

        records = [];
    }


    const existingIndex =
        records.findIndex(
            record =>
                record.sourceType ===
                    "Follow-up"
                &&
                String(
                    record.sourceId
                ) ===
                String(
                    followUp.id
                )
        );


    const record = {

        id:
            existingIndex >= 0
                ? records[
                    existingIndex
                ].id

                : (
                    "record_" +
                    Date.now() +
                    "_" +
                    Math.random()
                        .toString(36)
                        .substring(2, 8)
                ),

        sourceType:
            "Follow-up",

        sourceId:
            followUp.id,

        title:
            "Follow-up - " +
            followUp.memberName,

        cellId:
            followUp.cellId,

        cellName:
            followUp.cellName,

        memberId:
            followUp.memberId,

        memberName:
            followUp.memberName,

        assignedTo:
            followUp.assignedTo,

        assignedToName:
            followUp.assignedToName,

        date:
            followUp.followUpDate,

        status:
            followUp.status,

        priority:
            followUp.priority,

        description:
            followUp.reason,

        details:
            followUp.details,

        actionTaken:
            followUp.actionTaken,

        nextAction:
            followUp.nextAction,

        createdAt:
            followUp.createdAt,

        updatedAt:
            followUp.updatedAt
    };


    if (existingIndex >= 0) {

        records[existingIndex] =
            record;

    } else {

        records.push(record);
    }


    localStorage.setItem(
        "cmsRecords",
        JSON.stringify(records)
    );
}


function deleteRecordEntry(
    followUpId
) {

    let records = [];


    try {

        records =
            JSON.parse(
                localStorage.getItem(
                    "cmsRecords"
                )
            ) || [];

    } catch {

        records = [];
    }


    records =
        records.filter(
            record =>
                !(
                    record.sourceType ===
                        "Follow-up"
                    &&
                    String(
                        record.sourceId
                    ) ===
                    String(
                        followUpId
                    )
                )
        );


    localStorage.setItem(
        "cmsRecords",
        JSON.stringify(records)
    );
}


/* =====================================================
   SAVE FOLLOW-UP
   FINAL - NO DUPLICATE AFTER SAVE
   ===================================================== */

async function saveFollowUp() {

    if (
        !validateFollowUp()
    ) {

        return;

    }


    const followUp =
        collectFollowUpData();


    try {

        /*
           =================================================
           SUPABASE IS THE PRIMARY SAVE PATH
           =================================================
        */

        if (
            typeof window.cmsFollowUpsSaveFollowUp ===
            "function"
        ) {

            /*
               Save the actual record to Supabase.

               The bridge returns the canonical record,
               including the real Supabase UUID.
            */

            const savedFollowUp =
                await window.cmsFollowUpsSaveFollowUp(
                    followUp
                );


            const canonicalFollowUp =
                savedFollowUp ||
                followUp;


            /*
               IMPORTANT:

               Do NOT push/re-add the row manually here.

               The bridge already updates the local cache,
               and realtime may also have refreshed the
               global followUps array.

               Re-reading the cache prevents the temporary
               duplicate that appeared after Save.
            */

            refreshData();


            /*
               Make sure the Records Center has the
               canonical Supabase ID.
            */

            createRecordEntry(
                canonicalFollowUp
            );


            /*
               Existing UI behavior.
            */

            renderFollowUps();

            updateStatistics();

            closeModal();


            alert(
                "Follow-up saved successfully!"
            );


            return;

        }


        /*
           =================================================
           LOCAL FALLBACK
           =================================================

           Only used when the bridge is unavailable.
        */

        const index =
            followUps.findIndex(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        followUp.id
                    )
            );


        if (
            index >= 0
        ) {

            followUps[
                index
            ] =
                followUp;

        }

        else {

            followUps.push(
                followUp
            );

        }


        saveFollowUps();


        createRecordEntry(
            followUp
        );


        renderFollowUps();

        updateStatistics();

        closeModal();


        alert(
            "Follow-up saved locally. Supabase bridge was unavailable."
        );

    }

    catch (
        error
    ) {

        console.error(
            "CMS Follow-ups save failed:",
            error
        );


        console.error(
            "CMS Follow-ups save error details:",
            {
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


        alert(
            "Follow-up could not be saved.\n\n" +
            (
                error?.message ||
                "Supabase could not save this Follow-up."
            )
        );

    }

}
/* =====================================================
   STATUS CLASS
   ===================================================== */

function getStatusClass(status) {

    if (status === "Completed") {

        return "status-completed";
    }


    if (status === "In Progress") {

        return "status-progress";
    }


    return "status-pending";
}


/* =====================================================
   PRIORITY CLASS
   ===================================================== */

function getPriorityClass(priority) {

    if (priority === "Urgent") {

        return "priority-urgent";
    }


    if (priority === "High") {

        return "priority-high";
    }


    if (priority === "Medium") {

        return "priority-medium";
    }


    return "priority-low";
}


/* =====================================================
   FIND FOLLOW-UP BY ID
   ===================================================== */

function followUpById(id) {

    return (
        followUps.find(
            followUp =>
                String(
                    followUp.id
                ) ===
                String(id)
        ) ||
        null
    );
}


/* =====================================================
   SHORTEN TEXT
   ===================================================== */

function shortenText(
    text,
    length
) {

    const value =
        displayValue(text);


    if (
        value.length <=
        length
    ) {

        return value;
    }


    return (
        value.substring(
            0,
            length
        ) +
        "..."
    );
}


/* =====================================================
   RENDER FOLLOW-UPS
   ===================================================== */

function renderFollowUps(
    searchTerm = ""
) {

    if (!followUpsTableBody) {
        return;
    }


    followUpsTableBody.innerHTML =
        "";


    const search =
        String(searchTerm)
            .toLowerCase()
            .trim();


    const filtered =
        followUps.filter(
            function(followUp) {

                const assignedName =
                    followUp.assignedToName ||
                    getAssigneeName(
                        followUp.assignedTo
                    );


                const searchableText = [

                    followUp.memberName,
                    followUp.cellName,
                    followUp.reason,
                    assignedName,
                    followUp.priority,
                    followUp.followUpDate,
                    followUp.status,
                    followUp.details,
                    followUp.actionTaken,
                    followUp.nextAction

                ]
                    .join(" ")
                    .toLowerCase();


                return searchableText.includes(
                    search
                );
            }
        );


    if (filtered.length === 0) {

        followUpsTableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="empty-message"
                >
                    ${
                        search
                            ? "No follow-ups match your search."
                            : "No follow-ups have been recorded yet."
                    }
                </td>
            </tr>
        `;

        return;
    }


    filtered
        .slice()
        .reverse()
        .forEach(
            function(followUp) {

                const assignedName =
                    followUp.assignedToName ||
                    getAssigneeName(
                        followUp.assignedTo
                    );


                const row =
                    document.createElement(
                        "tr"
                    );


                const safeId =
                    escapeAttribute(
                        followUp.id
                    );


                row.innerHTML = `
                    <td>
                        <strong>
                            ${escapeHTML(
                                displayValue(
                                    followUp.memberName
                                )
                            )}
                        </strong>
                    </td>


                    <td>
                        ${escapeHTML(
                            displayValue(
                                followUp.cellName
                            )
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            shortenText(
                                followUp.reason,
                                45
                            )
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            displayValue(
                                assignedName
                            )
                        )}
                    </td>


                    <td>
                        <span
                            class="priority-badge ${getPriorityClass(
                                followUp.priority
                            )}"
                        >
                            ${escapeHTML(
                                displayValue(
                                    followUp.priority
                                )
                            )}
                        </span>
                    </td>


                    <td>
                        ${formatDate(
                            followUp.followUpDate
                        )}
                    </td>


                    <td>
                        <span
                            class="followup-status ${getStatusClass(
                                followUp.status
                            )}"
                        >
                            ${escapeHTML(
                                displayValue(
                                    followUp.status
                                )
                            )}
                        </span>
                    </td>


                    <td>

                        <button
                            type="button"
                            class="followup-action-button"
                            onclick="viewFollowUp('${safeId}')"
                        >
                            View
                        </button>


                        <button
                            type="button"
                            class="followup-action-button"
                            onclick="editFollowUp('${safeId}')"
                        >
                            Edit
                        </button>


                        <button
                            type="button"
                            class="followup-action-button"
                            onclick="downloadFollowUp(followUpById('${safeId}'))"
                        >
                            Download
                        </button>


                        <button
                            type="button"
                            class="followup-action-button"
                            onclick="printFollowUp(followUpById('${safeId}'))"
                        >
                            Print
                        </button>


                        <button
                            type="button"
                            class="followup-action-button danger"
                            onclick="deleteFollowUp('${safeId}')"
                        >
                            Delete
                        </button>

                    </td>
                `;


                followUpsTableBody.appendChild(
                    row
                );
            }
        );
}


/* =====================================================
   VIEW FOLLOW-UP
   ===================================================== */

function viewFollowUp(id) {

    const followUp =
        followUpById(id);


    if (!followUp) {

        alert(
            "Follow-up record could not be found."
        );

        return;
    }


    currentViewedFollowUp =
        followUp;


    /*
       Remove previous
       dynamic view modal.
    */

    const oldModal =
        document.getElementById(
            "followUpViewModalDynamic"
        );


    if (oldModal) {

        oldModal.remove();
    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "followUpViewModalDynamic";


    modal.className =
        "followup-view-overlay";


    modal.innerHTML = `

        <div class="followup-view-modal">


            <div class="followup-view-header">

                <div>

                    <h2>
                        Follow-up Record
                    </h2>

                    <p>
                        ${escapeHTML(
                            displayValue(
                                followUp.memberName
                            )
                        )}
                        •
                        ${formatDate(
                            followUp.followUpDate
                        )}
                    </p>

                </div>


                <button
                    type="button"
                    class="followup-view-close"
                    aria-label="Close"
                >
                    ×
                </button>

            </div>


            <div class="followup-view-body">


                <!-- BASIC INFORMATION -->

                <div class="followup-view-grid">


                    <div class="followup-view-info">

                        <span>
                            MEMBER
                        </span>

                        <strong>
                            ${escapeHTML(
                                displayValue(
                                    followUp.memberName
                                )
                            )}
                        </strong>

                    </div>


                    <div class="followup-view-info">

                        <span>
                            CELL
                        </span>

                        <strong>
                            ${escapeHTML(
                                displayValue(
                                    followUp.cellName
                                )
                            )}
                        </strong>

                    </div>


                    <div class="followup-view-info">

                        <span>
                            ASSIGNED TO
                        </span>

                        <strong>
                            ${escapeHTML(
                                displayValue(
                                    followUp.assignedToName ||
                                    getAssigneeName(
                                        followUp.assignedTo
                                    )
                                )
                            )}
                        </strong>

                    </div>


                    <div class="followup-view-info">

                        <span>
                            FOLLOW-UP DATE
                        </span>

                        <strong>
                            ${formatDate(
                                followUp.followUpDate
                            )}
                        </strong>

                    </div>

                </div>


                <!-- STATUS -->

                <div class="followup-view-section">

                    <h3>
                        Follow-up Status
                    </h3>


                    <div class="followup-view-grid">


                        <div class="followup-view-info">

                            <span>
                                PRIORITY
                            </span>

                            <strong>

                                <span
                                    class="priority-badge ${getPriorityClass(
                                        followUp.priority
                                    )}"
                                >
                                    ${escapeHTML(
                                        displayValue(
                                            followUp.priority
                                        )
                                    )}
                                </span>

                            </strong>

                        </div>


                        <div class="followup-view-info">

                            <span>
                                STATUS
                            </span>

                            <strong>

                                <span
                                    class="followup-status ${getStatusClass(
                                        followUp.status
                                    )}"
                                >
                                    ${escapeHTML(
                                        displayValue(
                                            followUp.status
                                        )
                                    )}
                                </span>

                            </strong>

                        </div>

                    </div>

                </div>


                <!-- REASON -->

                <div class="followup-view-section">

                    <h3>
                        Reason for Follow-up
                    </h3>

                    <div class="followup-view-text">

                        ${escapeHTML(
                            displayValue(
                                followUp.reason
                            )
                        )}

                    </div>

                </div>


                <!-- DETAILS -->

                <div class="followup-view-section">

                    <h3>
                        Details
                    </h3>

                    <div class="followup-view-text">

                        ${escapeHTML(
                            displayValue(
                                followUp.details
                            )
                        )}

                    </div>

                </div>


                <!-- ACTION TAKEN -->

                <div class="followup-view-section">

                    <h3>
                        Action Taken
                    </h3>

                    <div class="followup-view-text">

                        ${escapeHTML(
                            displayValue(
                                followUp.actionTaken
                            )
                        )}

                    </div>

                </div>


                <!-- NEXT ACTION -->

                <div class="followup-view-section">

                    <h3>
                        Next Action
                    </h3>

                    <div class="followup-view-text">

                        ${escapeHTML(
                            displayValue(
                                followUp.nextAction
                            )
                        )}

                    </div>

                </div>


                <!-- RECORD INFORMATION -->

                <div class="followup-view-section">

                    <h3>
                        Record Information
                    </h3>


                    <div class="followup-view-grid">


                        <div class="followup-view-info">

                            <span>
                                CREATED
                            </span>

                            <strong>
                                ${formatDateTime(
                                    followUp.createdAt
                                )}
                            </strong>

                        </div>


                        <div class="followup-view-info">

                            <span>
                                LAST UPDATED
                            </span>

                            <strong>
                                ${formatDateTime(
                                    followUp.updatedAt
                                )}
                            </strong>

                        </div>

                    </div>

                </div>

            </div>


            <!-- VIEW FOOTER -->

            <div class="followup-view-footer">

                <button
                    type="button"
                    class="secondary-button"
                    id="downloadCurrentFollowUp"
                >
                    Download
                </button>


                <button
                    type="button"
                    class="secondary-button"
                    id="printCurrentFollowUp"
                >
                    Print
                </button>


                <button
                    type="button"
                    class="primary-button"
                    id="closeCurrentFollowUp"
                >
                    Close
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(
        modal
    );


    /* CLOSE X */

    modal
        .querySelector(
            ".followup-view-close"
        )
        .addEventListener(
            "click",
            function() {

                modal.remove();
            }
        );


    /* CLOSE BUTTON */

    modal
        .querySelector(
            "#closeCurrentFollowUp"
        )
        .addEventListener(
            "click",
            function() {

                modal.remove();
            }
        );


    /* DOWNLOAD */

    modal
        .querySelector(
            "#downloadCurrentFollowUp"
        )
        .addEventListener(
            "click",
            function() {

                downloadFollowUp(
                    followUp
                );
            }
        );


    /* PRINT */

    modal
        .querySelector(
            "#printCurrentFollowUp"
        )
        .addEventListener(
            "click",
            function() {

                printFollowUp(
                    followUp
                );
            }
        );


    /* CLICK OUTSIDE */

    modal.addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                modal
            ) {

                modal.remove();
            }
        }
    );
}


/* =====================================================
   EDIT FOLLOW-UP
   ===================================================== */

function editFollowUp(id) {

    const followUp =
        followUpById(id);


    if (!followUp) {
        return;
    }


    refreshData();

    resetForm();

    loadCells();


    followUpId.value =
        followUp.id;


    followUpCell.value =
        followUp.cellId;


    loadMembersForCell(
        followUp.memberId
    );


    loadFollowUpAssignees(
        followUp.assignedTo
    );


    followUpMember.value =
        followUp.memberId;


    followUpAssignedTo.value =
        followUp.assignedTo;


    showMemberInformation();


    followUpReason.value =
        followUp.reason || "";


    followUpDetails.value =
        followUp.details || "";


    followUpPriority.value =
        followUp.priority ||
        "Medium";


    followUpDate.value =
        followUp.followUpDate ||
        "";


    followUpStatus.value =
        followUp.status ||
        "Pending";


    followUpAction.value =
        followUp.actionTaken ||
        "";


    followUpNextAction.value =
        followUp.nextAction ||
        "";


    const title =
        document.getElementById(
            "followUpModalTitle"
        );


    if (title) {

        title.textContent =
            "Edit Follow-up";
    }


    followUpModal.style.display =
        "flex";
}


/* =====================================================
   DELETE FOLLOW-UP
   SUPABASE-PERSISTENT VERSION
   ===================================================== */

async function deleteFollowUp(
    id
) {

    const followUp =
        followUpById(
            id
        );


    if (
        !followUp
    ) {

        return;

    }


    const confirmed =
        confirm(
            "Are you sure you want to delete the " +
            "follow-up for " +
            displayValue(
                followUp.memberName
            ) +
            "?"
        );


    if (
        !confirmed
    ) {

        return;

    }


    try {

        /*
           =================================================
           PRIMARY DATABASE DELETE
           =================================================
        */

        if (
            typeof window.cmsFollowUpsDeleteFollowUp ===
            "function"
        ) {

            await window.cmsFollowUpsDeleteFollowUp(
                id
            );

        }


        /*
           Only modify the local array AFTER Supabase
           successfully accepts the deletion.
        */

        followUps =
            followUps.filter(
                item =>
                    String(
                        item.id
                    ) !==
                    String(
                        id
                    )
            );


        /*
           Preserve local cache.
        */

        saveFollowUps();


        /*
           Preserve Records Center behavior.
        */

        deleteRecordEntry(
            id
        );


        /*
           Existing UI behavior.
        */

        renderFollowUps();

        updateStatistics();


        alert(
            "Follow-up deleted successfully!"
        );

    }

    catch (
        error
    ) {

        console.error(
            "CMS Follow-ups delete failed:",
            error
        );


        console.error(
            "CMS Follow-ups delete error details:",
            {
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
           Do NOT remove the row from the local UI when
           Supabase deletion failed.
        */

        alert(
            "Follow-up could not be deleted.\n\n" +
            (
                error?.message ||
                "Supabase could not delete this Follow-up."
            )
        );

    }

}

/* =====================================================
   STATISTICS
   ===================================================== */

function updateStatistics() {

    if (totalFollowUps) {

        totalFollowUps.textContent =
            followUps.length;
    }


    if (pendingFollowUps) {

        pendingFollowUps.textContent =
            followUps.filter(
                item =>
                    item.status ===
                    "Pending"
            ).length;
    }


    if (progressFollowUps) {

        progressFollowUps.textContent =
            followUps.filter(
                item =>
                    item.status ===
                    "In Progress"
            ).length;
    }


    if (completedFollowUps) {

        completedFollowUps.textContent =
            followUps.filter(
                item =>
                    item.status ===
                    "Completed"
            ).length;
    }
}


/* =====================================================
   DOWNLOAD SINGLE FOLLOW-UP
   ===================================================== */

function downloadFollowUp(followUp) {

    if (!followUp) {

        alert(
            "Follow-up record could not be found."
        );

        return;
    }


    const content =

        "CELL MANAGEMENT SYSTEM\n" +
        "FOLLOW-UP RECORD\n" +
        "========================================\n\n" +

        "Member:\n" +
        displayValue(
            followUp.memberName
        ) +
        "\n\n" +

        "Cell:\n" +
        displayValue(
            followUp.cellName
        ) +
        "\n\n" +

        "Assigned To:\n" +
        displayValue(
            followUp.assignedToName ||
            getAssigneeName(
                followUp.assignedTo
            )
        ) +
        "\n\n" +

        "Priority:\n" +
        displayValue(
            followUp.priority
        ) +
        "\n\n" +

        "Follow-up Date:\n" +
        formatDate(
            followUp.followUpDate
        ) +
        "\n\n" +

        "Status:\n" +
        displayValue(
            followUp.status
        ) +
        "\n\n" +

        "Reason:\n" +
        displayValue(
            followUp.reason
        ) +
        "\n\n" +

        "Details:\n" +
        displayValue(
            followUp.details
        ) +
        "\n\n" +

        "Action Taken:\n" +
        displayValue(
            followUp.actionTaken
        ) +
        "\n\n" +

        "Next Action:\n" +
        displayValue(
            followUp.nextAction
        ) +
        "\n\n" +

        "Created:\n" +
        formatDateTime(
            followUp.createdAt
        ) +
        "\n\n" +

        "Last Updated:\n" +
        formatDateTime(
            followUp.updatedAt
        ) +
        "\n\n" +

        "========================================\n";


    const blob =
        new Blob(
            [content],
            {
                type:
                    "text/plain;charset=utf-8"
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
        "CMS-Follow-up-" +
        getToday() +
        ".txt";


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
   PRINT SINGLE FOLLOW-UP
   ===================================================== */

function printFollowUp(followUp) {

    if (!followUp) {

        alert(
            "Follow-up record could not be found."
        );

        return;
    }


    const printWindow =
        window.open(
            "",
            "_blank",
            "width=900,height=800"
        );


    if (!printWindow) {

        alert(
            "Please allow pop-ups to print the record."
        );

        return;
    }


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                CMS - Follow-up Record
            </title>


            <style>

                body {

                    font-family:
                        Arial,
                        sans-serif;

                    margin:
                        35px;

                    color:
                        #222;
                }


                h1 {

                    color:
                        #294895;
                }


                h2 {

                    color:
                        #294895;

                    border-bottom:
                        1px solid #ddd;

                    padding-bottom:
                        6px;
                }


                .field {

                    margin-bottom:
                        16px;
                }


                .label {

                    display:
                        block;

                    color:
                        #777;

                    font-size:
                        11px;

                    font-weight:
                        bold;

                    text-transform:
                        uppercase;

                    margin-bottom:
                        5px;
                }


                .value {

                    font-size:
                        14px;

                    line-height:
                        1.6;

                    white-space:
                        pre-wrap;
                }

            </style>

        </head>


        <body>

            <h1>
                CELL MANAGEMENT SYSTEM
            </h1>


            <p>
                Follow-up Record
            </p>


            <div class="field">

                <span class="label">
                    Member
                </span>

                <div class="value">

                    ${escapeHTML(
                        displayValue(
                            followUp.memberName
                        )
                    )}

                </div>

            </div>


            <div class="field">

                <span class="label">
                    Cell
                </span>

                <div class="value">

                    ${escapeHTML(
                        displayValue(
                            followUp.cellName
                        )
                    )}

                </div>

            </div>


            <div class="field">

                <span class="label">
                    Assigned To
                </span>

                <div class="value">

                    ${escapeHTML(
                        displayValue(
                            followUp.assignedToName ||
                            getAssigneeName(
                                followUp.assignedTo
                            )
                        )
                    )}

                </div>

            </div>


            <div class="field">

                <span class="label">
                    Priority
                </span>

                <div class="value">

                    ${escapeHTML(
                        displayValue(
                            followUp.priority
                        )
                    )}

                </div>

            </div>


            <div class="field">

                <span class="label">
                    Follow-up Date
                </span>

                <div class="value">

                    ${formatDate(
                        followUp.followUpDate
                    )}

                </div>

            </div>


            <div class="field">

                <span class="label">
                    Status
                </span>

                <div class="value">

                    ${escapeHTML(
                        displayValue(
                            followUp.status
                        )
                    )}

                </div>

            </div>


            <h2>
                Reason for Follow-up
            </h2>

            <div class="value">

                ${escapeHTML(
                    displayValue(
                        followUp.reason
                    )
                )}

            </div>


            <h2>
                Details
            </h2>

            <div class="value">

                ${escapeHTML(
                    displayValue(
                        followUp.details
                    )
                )}

            </div>


            <h2>
                Action Taken
            </h2>

            <div class="value">

                ${escapeHTML(
                    displayValue(
                        followUp.actionTaken
                    )
                )}

            </div>


            <h2>
                Next Action
            </h2>

            <div class="value">

                ${escapeHTML(
                    displayValue(
                        followUp.nextAction
                    )
                )}

            </div>


            <script>

                window.onload =
                    function() {

                        window.print();

                    };

            <\/script>

        </body>

        </html>

    `);


    printWindow.document.close();
}


/* =====================================================
   SEARCH
   ===================================================== */

if (followUpSearch) {

    followUpSearch.addEventListener(
        "input",
        function() {

            renderFollowUps(
                followUpSearch.value
            );

        }
    );
}


/* =====================================================
   CELL CHANGE
   ===================================================== */

if (followUpCell) {

    followUpCell.addEventListener(
        "change",
        function() {

            loadMembersForCell();

            loadFollowUpAssignees();

        }
    );
}


/* =====================================================
   MEMBER CHANGE
   ===================================================== */

if (followUpMember) {

    followUpMember.addEventListener(
        "change",
        function() {

            showMemberInformation();

        }
    );
}


/* =====================================================
   NEW FOLLOW-UP
   ===================================================== */

if (newFollowUpButton) {

    newFollowUpButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            openModal();

        }
    );
}


/* =====================================================
   CLOSE MODAL
   ===================================================== */

if (closeFollowUpModal) {

    closeFollowUpModal.addEventListener(
        "click",
        closeModal
    );
}


if (cancelFollowUpButton) {

    cancelFollowUpButton.addEventListener(
        "click",
        closeModal
    );
}


/* =====================================================
   FORM SUBMIT
   ===================================================== */

if (followUpForm) {

    followUpForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            saveFollowUp();

        }
    );
}


/* =====================================================
   CLICK OUTSIDE ADD/EDIT MODAL
   ===================================================== */

if (followUpModal) {

    followUpModal.addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                followUpModal
            ) {

                closeModal();
            }
        }
    );
}


/* =====================================================
   ESC KEY
   ===================================================== */

document.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Escape") {

            closeModal();


            const dynamicModal =
                document.getElementById(
                    "followUpViewModalDynamic"
                );


            if (dynamicModal) {

                dynamicModal.remove();
            }
        }
    }
);


/* =====================================================
   STORAGE CHANGES
   ===================================================== */

window.addEventListener(
    "storage",
    function(event) {

        if (
            [
                "cmsCells",
                "cmsMembers",
                "cmsCellLeaders",
                "cmsLeaders",
                "cmsFollowUps",
                "cmsRecords"
            ].includes(event.key)
        ) {

            refreshData();

            loadCells();

            renderFollowUps();

            updateStatistics();
        }
    }
);


/* =====================================================
   INITIALIZE
   ===================================================== */

refreshData();

loadCells();

renderFollowUps();

updateStatistics();


console.log(
    "CMS Follow-ups module loaded successfully."
);

console.log(
    "Cells:",
    cells
);

console.log(
    "Members:",
    members
);

console.log(
    "Cell Leaders:",
    cellLeaders
);

console.log(
    "Follow-ups:",
    followUps
);
