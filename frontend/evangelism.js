/* =====================================================
   CMS - EVANGELISM MANAGEMENT SYSTEM
   INDIVIDUAL PEOPLE CONNECTED VERSION
   ===================================================== */


/* =====================================================
   DATA
   ===================================================== */

let cells = [];

let members = [];

let cellLeaders = [];

let evangelismRecords = [];

let reachedPeople = [];


/* =====================================================
   ELEMENTS
   ===================================================== */

const evangelismModal =
    document.getElementById("evangelismModal");

const evangelismForm =
    document.getElementById("evangelismForm");

const evangelismId =
    document.getElementById("evangelismId");

const evangelismCell =
    document.getElementById("evangelismCell");

const evangelismLeader =
    document.getElementById("evangelismLeader");

const evangelismDate =
    document.getElementById("evangelismDate");

const evangelismType =
    document.getElementById("evangelismType");

const evangelismLocation =
    document.getElementById("evangelismLocation");

const peopleReached =
    document.getElementById("peopleReached");

const newPeople =
    document.getElementById("newPeople");

const savedCount =
    document.getElementById("savedCount");

const progressCount =
    document.getElementById("progressCount");

const interestedCount =
    document.getElementById("interestedCount");

const followUpCount =
    document.getElementById("followUpCount");

const notYetCount =
    document.getElementById("notYetCount");

const outcomeSummary =
    document.getElementById("outcomeSummary");

const peopleReachedContainer =
    document.getElementById("peopleReachedContainer");

const peopleEmptyState =
    document.getElementById("peopleEmptyState");

const peopleRecordsSummary =
    document.getElementById("peopleRecordsSummary");

const addPersonButton =
    document.getElementById("addPersonButton");

const evangelismDetails =
    document.getElementById("evangelismDetails");

const evangelismNextAction =
    document.getElementById("evangelismNextAction");

const evangelismMessage =
    document.getElementById("evangelismMessage");

const evangelismTableBody =
    document.getElementById("evangelismTableBody");

const evangelismSearch =
    document.getElementById("evangelismSearch");

const newEvangelismButton =
    document.getElementById("newEvangelismButton");

const closeEvangelismModal =
    document.getElementById("closeEvangelismModal");

const cancelEvangelismButton =
    document.getElementById("cancelEvangelismButton");

const evangelismModalTitle =
    document.getElementById("evangelismModalTitle");


/* =====================================================
   STATISTICS ELEMENTS
   ===================================================== */

const totalActivities =
    document.getElementById("totalActivities");

const totalReached =
    document.getElementById("totalReached");

const totalSaved =
    document.getElementById("totalSaved");

const totalProgress =
    document.getElementById("totalProgress");

const totalInterested =
    document.getElementById("totalInterested");

const totalFollowUpNeeded =
    document.getElementById("totalFollowUpNeeded");


/* =====================================================
   SAFE LOCAL STORAGE
   ===================================================== */

function readStorage(key, fallback = []) {

    try {

        const value =
            JSON.parse(
                localStorage.getItem(key)
            );

        return value ?? fallback;

    }

    catch (error) {

        console.error(
            "Could not read localStorage:",
            key,
            error
        );

        return fallback;

    }

}


/* =====================================================
   LOAD DATA
   ===================================================== */

function refreshData() {

    cells =
        readStorage(
            "cmsCells",
            []
        );


    members =
        readStorage(
            "cmsMembers",
            []
        );


    const primaryLeaders =
        readStorage(
            "cmsCellLeaders",
            []
        );


    const legacyLeaders =
        readStorage(
            "cmsLeaders",
            []
        );


    cellLeaders =
        primaryLeaders.length > 0
            ? primaryLeaders
            : legacyLeaders;


    evangelismRecords =
        readStorage(
            "cmsEvangelism",
            []
        );

}


/* =====================================================
   SAVE DATA
   ===================================================== */

function saveEvangelism() {

    localStorage.setItem(
        "cmsEvangelism",
        JSON.stringify(
            evangelismRecords
        )
    );

}


/* =====================================================
   ID
   ===================================================== */

function generateId() {

    return (
        "evangelism_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );

}


function generatePersonId() {

    return (
        "person_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );

}


/* =====================================================
   TODAY
   ===================================================== */

function getToday() {

    const date =
        new Date();

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return (
        year +
        "-" +
        month +
        "-" +
        day
    );

}


/* =====================================================
   DATE FORMAT
   ===================================================== */

function formatDate(date) {

    if (!date) {

        return "—";

    }

    const parts =
        String(date).split("-");

    if (
        parts.length !== 3
    ) {

        return date;

    }

    return (
        parts[2] +
        "/" +
        parts[1] +
        "/" +
        parts[0]
    );

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
   CELL
   ===================================================== */

function getCellName(cellId) {

    const cell =
        cells.find(
            item =>
                String(item.id) ===
                String(cellId)
        );


    return cell
        ? (
            cell.name ||
            cell.cellName ||
            "Unknown Cell"
        )
        : "Unknown Cell";

}


/* =====================================================
   LEADER
   ===================================================== */

function getLeaderName(leaderId) {

    const leader =
        cellLeaders.find(
            item =>
                String(item.id) ===
                String(leaderId)
        );


    return leader
        ? (
            leader.name ||
            leader.fullName ||
            leader.leaderName ||
            "Unknown Leader"
        )
        : "Unknown Leader";

}


/* =====================================================
   LEADERS FOR CELL
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


/* =====================================================
   LOAD CELLS
   ===================================================== */

function loadCells() {

    evangelismCell.innerHTML = `
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
                cell.name ||
                cell.cellName ||
                "Unnamed Cell";


            evangelismCell.appendChild(
                option
            );

        }
    );


    if (
        cells.length === 0
    ) {

        evangelismCell.innerHTML = `
            <option value="">
                No cells available
            </option>
        `;

    }

}


/* =====================================================
   LOAD LEADERS
   ===================================================== */

function loadLeadersForCell(
    selectedLeaderId = ""
) {

    evangelismLeader.innerHTML = `
        <option value="">
            Select a cell leader
        </option>
    `;


    const cellId =
        evangelismCell.value;


    if (!cellId) {

        evangelismLeader.disabled =
            true;

        return;

    }


    const leaders =
        getLeadersForCell(
            cellId
        );


    if (
        leaders.length === 0
    ) {

        evangelismLeader.innerHTML = `
            <option value="">
                No leaders found for this cell
            </option>
        `;

        evangelismLeader.disabled =
            true;

        return;

    }


    leaders.forEach(
        function(leader) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                leader.id;


            option.textContent =
                leader.name ||
                leader.fullName ||
                leader.leaderName ||
                "Unnamed Leader";


            evangelismLeader.appendChild(
                option
            );

        }
    );


    evangelismLeader.disabled =
        false;


    if (selectedLeaderId) {

        evangelismLeader.value =
            selectedLeaderId;

    }

}


/* =====================================================
   CREATE PERSON
   ===================================================== */

function createPerson() {

    return {

        id:
            generatePersonId(),

        name:
            "",

        phone:
            "",

        year:
            "",

        combination:
            "",

        isNew:
            false,

        outcome:
            "Interested"

    };

}


/* =====================================================
   NORMALIZE OLD PERSON RECORDS
   ===================================================== */

function normalizePerson(person) {

    return {

        id:
            person?.id ||
            generatePersonId(),

        name:
            person?.name ||
            person?.fullName ||
            "",

        phone:
            person?.phone ||
            person?.phoneNumber ||
            "",

        year:
            person?.year ||
            person?.memberYear ||
            "",

        combination:
            person?.combination ||
            person?.memberCombination ||
            "",

        isNew:
            person?.isNew === true ||
            person?.isNew === "true",

        outcome:
            person?.outcome ||
            "Interested"

    };

}


/* =====================================================
   ADD PERSON
   ===================================================== */

function addPerson() {

    reachedPeople.push(
        createPerson()
    );


    renderPeople();

    updateTotalsFromPeople();

}


/* =====================================================
   REMOVE PERSON
   ===================================================== */

function removePerson(personId) {

    reachedPeople =
        reachedPeople.filter(
            person =>
                String(person.id) !==
                String(personId)
        );


    renderPeople();

    updateTotalsFromPeople();

}


/* =====================================================
   UPDATE PERSON
   ===================================================== */

function updatePerson(
    id,
    field,
    value
) {

    const person =
        reachedPeople.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!person) {

        return;

    }


    if (
        field === "isNew"
    ) {

        person.isNew =
            value === true ||
            value === "true";

    }

    else {

        person[field] =
            value;

    }


    updateTotalsFromPeople();

}


/* =====================================================
   RENDER PEOPLE
   ===================================================== */

function renderPeople() {

    peopleReachedContainer.innerHTML =
        "";


    if (
        reachedPeople.length === 0
    ) {

        peopleReachedContainer.appendChild(
            peopleEmptyState
        );


        peopleRecordsSummary.textContent =
            "Individual records: 0";

        return;

    }


    reachedPeople.forEach(
        function(person, index) {

            person =
                normalizePerson(
                    person
                );


            reachedPeople[index] =
                person;


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "person-row";


            row.innerHTML = `

                <div class="person-field">

                    <label>
                        Name
                    </label>

                    <input
                        type="text"
                        value="${escapeHTML(
                            person.name
                        )}"
                        placeholder="Full name"
                        data-person-id="${escapeHTML(
                            person.id
                        )}"
                        data-field="name"
                    >

                </div>


                <div class="person-field">

                    <label>
                        Phone
                    </label>

                    <input
                        type="tel"
                        value="${escapeHTML(
                            person.phone
                        )}"
                        placeholder="Phone number"
                        autocomplete="tel"
                        data-person-id="${escapeHTML(
                            person.id
                        )}"
                        data-field="phone"
                    >

                </div>


                <div class="person-field">

                    <label>
                        Year
                    </label>

                    <input
                        type="text"
                        value="${escapeHTML(
                            person.year
                        )}"
                        placeholder="Year"
                        data-person-id="${escapeHTML(
                            person.id
                        )}"
                        data-field="year"
                    >

                </div>


                <div class="person-field">

                    <label>
                        Combination
                    </label>

                    <input
                        type="text"
                        value="${escapeHTML(
                            person.combination
                        )}"
                        placeholder="e.g. MATH-ECO"
                        data-person-id="${escapeHTML(
                            person.id
                        )}"
                        data-field="combination"
                    >

                </div>


                <div class="person-field">

                    <label>
                        New?
                    </label>

                    <select
                        data-person-id="${escapeHTML(
                            person.id
                        )}"
                        data-field="isNew"
                    >

                        <option
                            value="false"
                            ${
                                !person.isNew
                                    ? "selected"
                                    : ""
                            }
                        >
                            No
                        </option>


                        <option
                            value="true"
                            ${
                                person.isNew
                                    ? "selected"
                                    : ""
                            }
                        >
                            Yes
                        </option>

                    </select>

                </div>


                <div class="person-field">

                    <label>
                        Outcome
                    </label>

                    <select
                        data-person-id="${escapeHTML(
                            person.id
                        )}"
                        data-field="outcome"
                    >

                        <option
                            value="Saved"
                            ${
                                person.outcome ===
                                "Saved"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Saved
                        </option>


                        <option
                            value="In Progress"
                            ${
                                person.outcome ===
                                "In Progress"
                                    ? "selected"
                                    : ""
                            }
                        >
                            In Progress
                        </option>


                        <option
                            value="Interested"
                            ${
                                person.outcome ===
                                "Interested"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Interested
                        </option>


                        <option
                            value="Follow-up Needed"
                            ${
                                person.outcome ===
                                "Follow-up Needed"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Follow-up Needed
                        </option>


                        <option
                            value="Not Yet / No Decision"
                            ${
                                person.outcome ===
                                "Not Yet / No Decision"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Not Yet / No Decision
                        </option>

                    </select>

                </div>


                <button
                    type="button"
                    class="person-remove-button"
                    data-remove-person="${escapeHTML(
                        person.id
                    )}"
                    aria-label="Remove person ${index + 1}"
                >
                    Remove
                </button>

            `;


            peopleReachedContainer.appendChild(
                row
            );

        }
    );


    peopleRecordsSummary.textContent =
        "Individual records: " +
        reachedPeople.length;

}


/* =====================================================
   HANDLE PEOPLE INPUTS
   ===================================================== */

peopleReachedContainer.addEventListener(
    "input",
    function(event) {

        const target =
            event.target;


        const personId =
            target.dataset.personId;


        const field =
            target.dataset.field;


        if (
            !personId ||
            !field
        ) {

            return;

        }


        updatePerson(
            personId,
            field,
            target.value
        );

    }
);


peopleReachedContainer.addEventListener(
    "change",
    function(event) {

        const target =
            event.target;


        if (
            target.matches(
                "[data-field='isNew']"
            )
        ) {

            updatePerson(
                target.dataset.personId,
                "isNew",
                target.value
            );

        }


        else if (
            target.matches(
                "[data-field='outcome']"
            )
        ) {

            updatePerson(
                target.dataset.personId,
                "outcome",
                target.value
            );

        }

    }
);


peopleReachedContainer.addEventListener(
    "click",
    function(event) {

        const button =
            event.target.closest(
                "[data-remove-person]"
            );


        if (!button) {

            return;

        }


        removePerson(
            button.dataset.removePerson
        );

    }
);


/* =====================================================
   CALCULATE OUTCOMES FROM PEOPLE
   ===================================================== */

function calculatePeopleOutcomes() {

    const result = {

        reached:
            reachedPeople.length,

        newPeople:
            0,

        saved:
            0,

        inProgress:
            0,

        interested:
            0,

        followUpNeeded:
            0,

        notYet:
            0

    };


    reachedPeople.forEach(
        function(person) {

            if (
                person.isNew
            ) {

                result.newPeople++;

            }


            switch (
                person.outcome
            ) {

                case "Saved":

                    result.saved++;

                    break;


                case "In Progress":

                    result.inProgress++;

                    break;


                case "Interested":

                    result.interested++;

                    break;


                case "Follow-up Needed":

                    result.followUpNeeded++;

                    break;


                case "Not Yet / No Decision":

                    result.notYet++;

                    break;

            }

        }
    );


    return result;

}


/* =====================================================
   UPDATE TOTALS FROM PEOPLE
   ===================================================== */

function updateTotalsFromPeople() {

    if (
        reachedPeople.length === 0
    ) {

        updateOutcomeSummary();

        peopleRecordsSummary.textContent =
            "Individual records: 0";

        return;

    }


    const totals =
        calculatePeopleOutcomes();


    peopleReached.value =
        totals.reached;


    newPeople.value =
        totals.newPeople;


    savedCount.value =
        totals.saved;


    progressCount.value =
        totals.inProgress;


    interestedCount.value =
        totals.interested;


    followUpCount.value =
        totals.followUpNeeded;


    notYetCount.value =
        totals.notYet;


    peopleRecordsSummary.textContent =
        "Individual records: " +
        totals.reached +
        " • Saved: " +
        totals.saved +
        " • In Progress: " +
        totals.inProgress +
        " • Interested: " +
        totals.interested +
        " • Follow-up: " +
        totals.followUpNeeded +
        " • Not Yet: " +
        totals.notYet;


    updateOutcomeSummary();

}


/* =====================================================
   CALCULATE OUTCOME TOTAL
   ===================================================== */

function calculateOutcomeTotal() {

    return (

        (Number(savedCount.value) || 0)

        +

        (Number(progressCount.value) || 0)

        +

        (Number(interestedCount.value) || 0)

        +

        (Number(followUpCount.value) || 0)

        +

        (Number(notYetCount.value) || 0)

    );

}


/* =====================================================
   UPDATE OUTCOME SUMMARY
   ===================================================== */

function updateOutcomeSummary() {

    const reached =
        Number(
            peopleReached.value
        ) || 0;


    const outcomes =
        calculateOutcomeTotal();


    outcomeSummary.classList.remove(
        "warning"
    );


    if (
        outcomes > reached
    ) {

        outcomeSummary.textContent =
            "Warning: outcomes cannot be greater than people reached.";

        outcomeSummary.classList.add(
            "warning"
        );

        return;

    }


    outcomeSummary.textContent =
        "Total outcomes: " +
        outcomes +
        " / " +
        reached;

}


/* =====================================================
   RESET FORM
   ===================================================== */

function resetForm() {

    evangelismForm.reset();


    evangelismId.value =
        "";


    evangelismLeader.innerHTML = `
        <option value="">
            Select a cell first
        </option>
    `;


    evangelismLeader.disabled =
        true;


    peopleReached.value =
        0;


    newPeople.value =
        0;


    savedCount.value =
        0;


    progressCount.value =
        0;


    interestedCount.value =
        0;


    followUpCount.value =
        0;


    notYetCount.value =
        0;


    reachedPeople = [];


    renderPeople();


    outcomeSummary.textContent =
        "Total outcomes: 0 / 0";


    outcomeSummary.classList.remove(
        "warning"
    );


    evangelismMessage.textContent =
        "";


    evangelismModalTitle.textContent =
        "Record Evangelism";

}


/* =====================================================
   OPEN MODAL
   ===================================================== */

function openModal() {

    refreshData();

    resetForm();

    loadCells();


    evangelismDate.value =
        getToday();


    evangelismModal.style.display =
        "flex";

}


/* =====================================================
   CLOSE MODAL
   ===================================================== */

function closeModal() {

    evangelismModal.style.display =
        "none";

}


/* =====================================================
   COLLECT DATA
   ===================================================== */

function collectEvangelismData() {

    const now =
        new Date().toISOString();


    const existing =
        evangelismRecords.find(
            record =>
                String(record.id) ===
                String(evangelismId.value)
        );


    let reached =
        Number(
            peopleReached.value
        ) || 0;


    let newCount =
        Number(
            newPeople.value
        ) || 0;


    let saved =
        Number(
            savedCount.value
        ) || 0;


    let progress =
        Number(
            progressCount.value
        ) || 0;


    let interested =
        Number(
            interestedCount.value
        ) || 0;


    let followUp =
        Number(
            followUpCount.value
        ) || 0;


    let notYet =
        Number(
            notYetCount.value
        ) || 0;


    /*
       Individual people become the
       source of truth when present.
    */

    if (
        reachedPeople.length > 0
    ) {

        const totals =
            calculatePeopleOutcomes();


        reached =
            totals.reached;

        newCount =
            totals.newPeople;

        saved =
            totals.saved;

        progress =
            totals.inProgress;

        interested =
            totals.interested;

        followUp =
            totals.followUpNeeded;

        notYet =
            totals.notYet;

    }


    return {

        id:
            evangelismId.value ||
            generateId(),


        cellId:
            evangelismCell.value,


        cellName:
            getCellName(
                evangelismCell.value
            ),


        leaderId:
            evangelismLeader.value,


        leaderName:
            getLeaderName(
                evangelismLeader.value
            ),


        date:
            evangelismDate.value,


        evangelismType:
            evangelismType.value,


        location:
            evangelismLocation.value.trim(),


        peopleReached:
            reached,


        newPeople:
            newCount,


        saved:
            saved,


        inProgress:
            progress,


        interested:
            interested,


        followUpNeeded:
            followUp,


        notYet:
            notYet,


        people:
            reachedPeople.map(
                normalizePerson
            ),


        details:
            evangelismDetails.value.trim(),


        nextAction:
            evangelismNextAction.value.trim(),


        createdAt:
            existing?.createdAt ||
            now,


        updatedAt:
            now

    };

}


/* =====================================================
   VALIDATION
   ===================================================== */

function validateEvangelism() {

    if (
        !evangelismCell.value
    ) {

        alert(
            "Please select a cell."
        );

        evangelismCell.focus();

        return false;

    }


    if (
        !evangelismLeader.value
    ) {

        alert(
            "Please select the cell leader who recorded this activity."
        );

        evangelismLeader.focus();

        return false;

    }


    if (
        !evangelismDate.value
    ) {

        alert(
            "Please select the date."
        );

        evangelismDate.focus();

        return false;

    }


    if (
        !evangelismType.value
    ) {

        alert(
            "Please select the evangelism type."
        );

        evangelismType.focus();

        return false;

    }


    const reached =
        Number(
            peopleReached.value
        ) || 0;


    const outcomes =
        calculateOutcomeTotal();


    if (
        reached < 0
    ) {

        alert(
            "People reached cannot be negative."
        );

        return false;

    }


    if (
        outcomes > reached
    ) {

        alert(
            "The total of the outcomes cannot be greater than People Reached."
        );

        return false;

    }


    if (
        reachedPeople.length > 0
    ) {

        for (
            const person of reachedPeople
        ) {

            if (
                !String(
                    person.name || ""
                ).trim()
            ) {

                alert(
                    "Please enter the name of every person you added."
                );

                return false;

            }


            if (
                !person.outcome
            ) {

                alert(
                    "Please select an outcome for every person."
                );

                return false;

            }

        }

    }


    return true;

}


/* =====================================================
   RECORDS CENTER
   ===================================================== */

function createRecordEntry(evangelism) {

    let records =
        readStorage(
            "cmsRecords",
            []
        );


    const existingIndex =
        records.findIndex(
            record =>
                record.sourceType === "Evangelism"
                &&
                String(record.sourceId) ===
                String(evangelism.id)
        );


    const record = {

        id:
            existingIndex >= 0
                ? records[existingIndex].id
                : (
                    "record_" +
                    Date.now() +
                    "_" +
                    Math.random()
                        .toString(36)
                        .substring(2, 8)
                ),


        sourceType:
            "Evangelism",


        sourceId:
            evangelism.id,


        title:
            "Evangelism - " +
            evangelism.cellName,


        cellId:
            evangelism.cellId,


        cellName:
            evangelism.cellName,


        leaderId:
            evangelism.leaderId,


        leaderName:
            evangelism.leaderName,


        date:
            evangelism.date,


        evangelismType:
            evangelism.evangelismType,


        location:
            evangelism.location,


        peopleReached:
            evangelism.peopleReached,


        newPeople:
            evangelism.newPeople,


        saved:
            evangelism.saved,


        inProgress:
            evangelism.inProgress,


        interested:
            evangelism.interested,


        followUpNeeded:
            evangelism.followUpNeeded,


        notYet:
            evangelism.notYet,


        /*
           COMPLETE INDIVIDUAL PEOPLE
           INCLUDING PHONE.
        */

        people:
            evangelism.people || [],


        description:
            evangelism.details,


        details:
            evangelism.details,


        nextAction:
            evangelism.nextAction,


        createdAt:
            evangelism.createdAt,


        updatedAt:
            evangelism.updatedAt

    };


    if (
        existingIndex >= 0
    ) {

        records[existingIndex] =
            record;

    }

    else {

        records.push(
            record
        );

    }


    localStorage.setItem(
        "cmsRecords",
        JSON.stringify(records)
    );

}


/* =====================================================
   DELETE RECORD CENTER ENTRY
   ===================================================== */

function deleteRecordEntry(
    evangelismId
) {

    let records =
        readStorage(
            "cmsRecords",
            []
        );


    records =
        records.filter(
            record =>
                !(
                    record.sourceType ===
                        "Evangelism"
                    &&
                    String(record.sourceId) ===
                    String(evangelismId)
                )
        );


    localStorage.setItem(
        "cmsRecords",
        JSON.stringify(records)
    );

}


/* =====================================================
   SAVE EVANGELISM
   ===================================================== */

function saveEvangelismRecord() {

    if (
        !validateEvangelism()
    ) {

        return;

    }


    const record =
        collectEvangelismData();


    const index =
        evangelismRecords.findIndex(
            item =>
                String(item.id) ===
                String(record.id)
        );


    if (
        index >= 0
    ) {

        evangelismRecords[index] =
            record;

    }

    else {

        evangelismRecords.push(
            record
        );

    }


    saveEvangelism();


    createRecordEntry(
        record
    );


    renderEvangelism();

    updateStatistics();


    closeModal();


    alert(
        "Evangelism activity saved successfully!"
    );

}


/* =====================================================
   RENDER EVANGELISM
   ===================================================== */

function renderEvangelism(
    searchTerm = ""
) {

    evangelismTableBody.innerHTML =
        "";


    const search =
        String(searchTerm)
            .toLowerCase()
            .trim();


    const filtered =
        evangelismRecords.filter(
            function(record) {

                const peopleText =
                    Array.isArray(record.people)
                        ? record.people
                            .map(
                                person =>
                                    [
                                        person.name,
                                        person.phone,
                                        person.year,
                                        person.combination,
                                        person.outcome
                                    ].join(" ")
                            )
                            .join(" ")
                        : "";


                const text = [

                    record.cellName,

                    record.leaderName,

                    record.date,

                    record.evangelismType,

                    record.location,

                    record.peopleReached,

                    record.saved,

                    record.followUpNeeded,

                    peopleText

                ]
                    .join(" ")
                    .toLowerCase();


                return text.includes(
                    search
                );

            }
        );


    if (
        filtered.length === 0
    ) {

        evangelismTableBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="empty-row"
                >

                    ${
                        search
                            ? "No evangelism activities match your search."
                            : "No evangelism activities recorded yet."
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
            function(record) {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>

                        <strong>

                            ${escapeHTML(
                                displayValue(
                                    record.cellName
                                )
                            )}

                        </strong>

                    </td>


                    <td>

                        ${escapeHTML(
                            displayValue(
                                record.leaderName
                            )
                        )}

                    </td>


                    <td>

                        ${formatDate(
                            record.date
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            displayValue(
                                record.evangelismType
                            )
                        )}

                    </td>


                    <td>

                        ${Number(
                            record.peopleReached
                        ) || 0}

                    </td>


                    <td>

                        ${Number(
                            record.saved
                        ) || 0}

                    </td>


                    <td>

                        ${Number(
                            record.followUpNeeded
                        ) || 0}

                    </td>


                    <td>

                        <button
                            type="button"
                            class="evangelism-action-button"
                            onclick="viewEvangelism('${escapeHTML(
                                record.id
                            )}')"
                        >
                            View
                        </button>


                        <button
                            type="button"
                            class="evangelism-action-button"
                            onclick="editEvangelism('${escapeHTML(
                                record.id
                            )}')"
                        >
                            Edit
                        </button>


                        <button
                            type="button"
                            class="evangelism-action-button"
                            onclick="downloadEvangelismById('${escapeHTML(
                                record.id
                            )}')"
                        >
                            Download
                        </button>


                        <button
                            type="button"
                            class="evangelism-action-button"
                            onclick="printEvangelismById('${escapeHTML(
                                record.id
                            )}')"
                        >
                            Print
                        </button>


                        <button
                            type="button"
                            class="evangelism-action-button danger"
                            onclick="deleteEvangelism('${escapeHTML(
                                record.id
                            )}')"
                        >
                            Delete
                        </button>

                    </td>

                `;


                evangelismTableBody.appendChild(
                    row
                );

            }
        );

}


/* =====================================================
   BUILD PEOPLE TEXT
   ===================================================== */

function buildPeopleText(
    people
) {

    if (
        !Array.isArray(people) ||
        people.length === 0
    ) {

        return "No individual people were recorded.";

    }


    return people
        .map(
            function(person, index) {

                person =
                    normalizePerson(
                        person
                    );


                return (

                    (index + 1) +
                    ". " +

                    displayValue(
                        person.name
                    ) +

                    " | Phone: " +

                    displayValue(
                        person.phone
                    ) +

                    " | Year: " +

                    displayValue(
                        person.year
                    ) +

                    " | Combination: " +

                    displayValue(
                        person.combination
                    ) +

                    " | New: " +

                    (
                        person.isNew
                            ? "Yes"
                            : "No"
                    ) +

                    " | Outcome: " +

                    displayValue(
                        person.outcome
                    )

                );

            }
        )
        .join("\n");

}


/* =====================================================
   VIEW
   ===================================================== */

function viewEvangelism(id) {

    const record =
        evangelismRecords.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!record) {

        alert(
            "Evangelism record could not be found."
        );

        return;

    }


    alert(

        "EVANGELISM RECORD\n\n" +

        "Cell:\n" +
        displayValue(
            record.cellName
        ) +
        "\n\n" +

        "Recorded By:\n" +
        displayValue(
            record.leaderName
        ) +
        "\n\n" +

        "Date:\n" +
        formatDate(
            record.date
        ) +
        "\n\n" +

        "Type:\n" +
        displayValue(
            record.evangelismType
        ) +
        "\n\n" +

        "Location:\n" +
        displayValue(
            record.location
        ) +
        "\n\n" +

        "People Reached:\n" +
        displayValue(
            record.peopleReached
        ) +
        "\n\n" +

        "New People:\n" +
        displayValue(
            record.newPeople
        ) +
        "\n\n" +

        "Saved:\n" +
        displayValue(
            record.saved
        ) +
        "\n\n" +

        "In Progress:\n" +
        displayValue(
            record.inProgress
        ) +
        "\n\n" +

        "Interested:\n" +
        displayValue(
            record.interested
        ) +
        "\n\n" +

        "Follow-up Needed:\n" +
        displayValue(
            record.followUpNeeded
        ) +
        "\n\n" +

        "Not Yet / No Decision:\n" +
        displayValue(
            record.notYet
        ) +
        "\n\n" +

        "INDIVIDUAL PEOPLE\n" +
        "------------------------------\n" +

        buildPeopleText(
            record.people
        ) +

        "\n\n" +

        "Details:\n" +
        displayValue(
            record.details
        ) +

        "\n\n" +

        "Next Action:\n" +
        displayValue(
            record.nextAction
        )

    );

}


/* =====================================================
   EDIT
   ===================================================== */

function editEvangelism(id) {

    const record =
        evangelismRecords.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!record) {

        alert(
            "Evangelism record could not be found."
        );

        return;

    }


    refreshData();

    resetForm();

    loadCells();


    evangelismId.value =
        record.id;


    evangelismCell.value =
        record.cellId;


    loadLeadersForCell(
        record.leaderId
    );


    evangelismDate.value =
        record.date || "";


    evangelismType.value =
        record.evangelismType || "";


    evangelismLocation.value =
        record.location || "";


    /*
       Restore detailed people,
       including Phone.
    */

    reachedPeople =
        Array.isArray(record.people)
            ? record.people.map(
                normalizePerson
            )
            : [];


    renderPeople();


    /*
       Individual records are the
       source of truth when present.
    */

    if (
        reachedPeople.length > 0
    ) {

        updateTotalsFromPeople();

    }

    else {

        peopleReached.value =
            record.peopleReached ?? 0;


        newPeople.value =
            record.newPeople ?? 0;


        savedCount.value =
            record.saved ?? 0;


        progressCount.value =
            record.inProgress ?? 0;


        interestedCount.value =
            record.interested ?? 0;


        followUpCount.value =
            record.followUpNeeded ?? 0;


        notYetCount.value =
            record.notYet ?? 0;


        updateOutcomeSummary();

    }


    evangelismDetails.value =
        record.details || "";


    evangelismNextAction.value =
        record.nextAction || "";


    evangelismModalTitle.textContent =
        "Edit Evangelism Record";


    evangelismModal.style.display =
        "flex";

}


/* =====================================================
   DELETE
   ===================================================== */

function deleteEvangelism(id) {

    const record =
        evangelismRecords.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!record) {

        return;

    }


    const confirmed =
        confirm(
            "Are you sure you want to delete this evangelism record?"
        );


    if (!confirmed) {

        return;

    }


    evangelismRecords =
        evangelismRecords.filter(
            item =>
                String(item.id) !==
                String(id)
        );


    saveEvangelism();


    deleteRecordEntry(
        id
    );


    renderEvangelism();

    updateStatistics();

}


/* =====================================================
   DOWNLOAD
   ===================================================== */

function downloadEvangelismById(id) {

    const record =
        evangelismRecords.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!record) {

        alert(
            "Record could not be found."
        );

        return;

    }


    const content =

        "CELL MANAGEMENT SYSTEM\n" +
        "EVANGELISM RECORD\n" +
        "========================================\n\n" +

        "Cell:\n" +
        displayValue(
            record.cellName
        ) +
        "\n\n" +

        "Recorded By:\n" +
        displayValue(
            record.leaderName
        ) +
        "\n\n" +

        "Date:\n" +
        formatDate(
            record.date
        ) +
        "\n\n" +

        "Evangelism Type:\n" +
        displayValue(
            record.evangelismType
        ) +
        "\n\n" +

        "Location / Area:\n" +
        displayValue(
            record.location
        ) +
        "\n\n" +

        "People Reached:\n" +
        displayValue(
            record.peopleReached
        ) +
        "\n\n" +

        "New People:\n" +
        displayValue(
            record.newPeople
        ) +
        "\n\n" +

        "Saved:\n" +
        displayValue(
            record.saved
        ) +
        "\n\n" +

        "In Progress:\n" +
        displayValue(
            record.inProgress
        ) +
        "\n\n" +

        "Interested:\n" +
        displayValue(
            record.interested
        ) +
        "\n\n" +

        "Follow-up Needed:\n" +
        displayValue(
            record.followUpNeeded
        ) +
        "\n\n" +

        "Not Yet / No Decision:\n" +
        displayValue(
            record.notYet
        ) +
        "\n\n" +

        "INDIVIDUAL PEOPLE\n" +
        "========================================\n" +

        buildPeopleText(
            record.people
        ) +

        "\n\n" +

        "DETAILS\n" +
        "========================================\n" +

        displayValue(
            record.details
        ) +

        "\n\n" +

        "NEXT ACTION\n" +
        "========================================\n" +

        displayValue(
            record.nextAction
        ) +

        "\n\n" +

        "Created:\n" +
        displayValue(
            record.createdAt
        ) +

        "\n\n" +

        "Last Updated:\n" +
        displayValue(
            record.updatedAt
        ) +

        "\n\n" +

        "========================================";


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
        "CMS-Evangelism-" +
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
   PRINT
   ===================================================== */

function printEvangelismById(id) {

    const record =
        evangelismRecords.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!record) {

        alert(
            "Record could not be found."
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
            "Please allow pop-ups to print this record."
        );

        return;

    }


    let peopleRows = "";


    if (
        Array.isArray(record.people) &&
        record.people.length > 0
    ) {

        peopleRows =
            record.people
                .map(
                    function(person) {

                        person =
                            normalizePerson(
                                person
                            );


                        return `

                            <tr>

                                <td>
                                    ${escapeHTML(
                                        displayValue(
                                            person.name
                                        )
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        displayValue(
                                            person.phone
                                        )
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        displayValue(
                                            person.year
                                        )
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        displayValue(
                                            person.combination
                                        )
                                    )}
                                </td>

                                <td>
                                    ${
                                        person.isNew
                                            ? "Yes"
                                            : "No"
                                    }
                                </td>

                                <td>
                                    ${escapeHTML(
                                        displayValue(
                                            person.outcome
                                        )
                                    )}
                                </td>

                            </tr>

                        `;

                    }
                )
                .join("");

    }


    const peopleTable =
        peopleRows

            ? `

                <h2>
                    People Reached
                </h2>

                <table>

                    <thead>

                        <tr>

                            <th>
                                Name
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
                                New?
                            </th>

                            <th>
                                Outcome
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${peopleRows}

                    </tbody>

                </table>

            `

            : `

                <h2>
                    People Reached
                </h2>

                <p>
                    No individual people were recorded.
                </p>

            `;


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                CMS - Evangelism Record
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

                    margin-top:
                        25px;

                }


                .field {

                    margin-bottom:
                        14px;

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
                        4px;

                }


                .value {

                    font-size:
                        14px;

                    line-height:
                        1.6;

                    white-space:
                        pre-wrap;

                }


                table {

                    width:
                        100%;

                    border-collapse:
                        collapse;

                    margin-top:
                        12px;

                    font-size:
                        11px;

                }


                th,
                td {

                    border:
                        1px solid #ccc;

                    padding:
                        7px;

                    text-align:
                        left;

                }


                th {

                    background:
                        #f1f3f6;

                }

            </style>

        </head>


        <body>

            <h1>
                CELL MANAGEMENT SYSTEM
            </h1>

            <p>
                Evangelism Record
            </p>


            <div class="field">

                <span class="label">
                    Cell
                </span>

                <div class="value">
                    ${escapeHTML(
                        displayValue(
                            record.cellName
                        )
                    )}
                </div>

            </div>


            <div class="field">

                <span class="label">
                    Recorded By
                </span>

                <div class="value">
                    ${escapeHTML(
                        displayValue(
                            record.leaderName
                        )
                    )}
                </div>

            </div>


            <div class="field">

                <span class="label">
                    Date
                </span>

                <div class="value">
                    ${formatDate(
                        record.date
                    )}
                </div>

            </div>


            <div class="field">

                <span class="label">
                    Evangelism Type
                </span>

                <div class="value">
                    ${escapeHTML(
                        displayValue(
                            record.evangelismType
                        )
                    )}
                </div>

            </div>


            <div class="field">

                <span class="label">
                    Location / Area
                </span>

                <div class="value">
                    ${escapeHTML(
                        displayValue(
                            record.location
                        )
                    )}
                </div>

            </div>


            <h2>
                Summary
            </h2>


            <div class="field">

                <span class="label">
                    People Reached
                </span>

                <div class="value">
                    ${record.peopleReached ?? 0}
                </div>

            </div>


            <div class="field">

                <span class="label">
                    New People
                </span>

                <div class="value">
                    ${record.newPeople ?? 0}
                </div>

            </div>


            <div class="field">

                <span class="label">
                    Saved
                </span>

                <div class="value">
                    ${record.saved ?? 0}
                </div>

            </div>


            <div class="field">

                <span class="label">
                    In Progress
                </span>

                <div class="value">
                    ${record.inProgress ?? 0}
                </div>

            </div>


            <div class="field">

                <span class="label">
                    Interested
                </span>

                <div class="value">
                    ${record.interested ?? 0}
                </div>

            </div>


            <div class="field">

                <span class="label">
                    Follow-up Needed
                </span>

                <div class="value">
                    ${record.followUpNeeded ?? 0}
                </div>

            </div>


            <div class="field">

                <span class="label">
                    Not Yet / No Decision
                </span>

                <div class="value">
                    ${record.notYet ?? 0}
                </div>

            </div>


            ${peopleTable}


            <h2>
                Details
            </h2>


            <div class="value">
                ${escapeHTML(
                    displayValue(
                        record.details
                    )
                )}
            </div>


            <h2>
                Next Action
            </h2>


            <div class="value">
                ${escapeHTML(
                    displayValue(
                        record.nextAction
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
   UPDATE STATISTICS
   ===================================================== */

function updateStatistics() {

    let reached = 0;

    let saved = 0;

    let progress = 0;

    let interested = 0;

    let followUp = 0;


    evangelismRecords.forEach(
        function(record) {

            reached +=
                Number(
                    record.peopleReached
                ) || 0;


            saved +=
                Number(
                    record.saved
                ) || 0;


            progress +=
                Number(
                    record.inProgress
                ) || 0;


            interested +=
                Number(
                    record.interested
                ) || 0;


            followUp +=
                Number(
                    record.followUpNeeded
                ) || 0;

        }
    );


    totalActivities.textContent =
        evangelismRecords.length;


    totalReached.textContent =
        reached;


    totalSaved.textContent =
        saved;


    totalProgress.textContent =
        progress;


    totalInterested.textContent =
        interested;


    totalFollowUpNeeded.textContent =
        followUp;

}


/* =====================================================
   EVENTS
   ===================================================== */

evangelismCell.addEventListener(
    "change",
    function() {

        loadLeadersForCell();

    }
);


peopleReached.addEventListener(
    "input",
    function() {

        if (
            reachedPeople.length === 0
        ) {

            updateOutcomeSummary();

        }

    }
);


[
    savedCount,
    progressCount,
    interestedCount,
    followUpCount,
    notYetCount
].forEach(
    function(input) {

        input.addEventListener(
            "input",
            function() {

                if (
                    reachedPeople.length === 0
                ) {

                    updateOutcomeSummary();

                }

            }
        );

    }
);


newEvangelismButton.addEventListener(
    "click",
    openModal
);


closeEvangelismModal.addEventListener(
    "click",
    closeModal
);


cancelEvangelismButton.addEventListener(
    "click",
    closeModal
);


addPersonButton.addEventListener(
    "click",
    addPerson
);


evangelismForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        saveEvangelismRecord();

    }
);


evangelismSearch.addEventListener(
    "input",
    function() {

        renderEvangelism(
            evangelismSearch.value
        );

    }
);


evangelismModal.addEventListener(
    "click",
    function(event) {

        if (
            event.target ===
            evangelismModal
        ) {

            closeModal();

        }

    }
);


/* =====================================================
   ESCAPE KEY
   ===================================================== */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeModal();

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
                "cmsCellLeaders",
                "cmsLeaders",
                "cmsEvangelism",
                "cmsRecords"
            ].includes(
                event.key
            )
        ) {

            refreshData();

            loadCells();

            renderEvangelism();

            updateStatistics();

        }

    }
);


/* =====================================================
   INITIALIZE
   ===================================================== */

refreshData();

loadCells();

renderPeople();

renderEvangelism();

updateStatistics();


console.log(
    "CMS Evangelism module loaded successfully."
);

console.log(
    "Cells:",
    cells
);

console.log(
    "Cell Leaders:",
    cellLeaders
);

console.log(
    "Evangelism Records:",
    evangelismRecords
);