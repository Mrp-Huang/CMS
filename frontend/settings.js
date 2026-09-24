/* =====================================================
   CMS - SETTINGS MANAGEMENT
   ===================================================== */


/* =====================================================
   DEFAULT SETTINGS
   ===================================================== */

const DEFAULT_SETTINGS = {

    systemName:
        "CELL MANAGEMENT SYSTEM",

    organization:
        "GBU Rukara"

};



/* =====================================================
   ELEMENTS
   ===================================================== */

const settingsForm =
    document.getElementById(
        "settingsForm"
    );


const systemNameInput =
    document.getElementById(
        "system-name"
    );


const organizationInput =
    document.getElementById(
        "organization"
    );


const settingsMessage =
    document.getElementById(
        "settingsMessage"
    );



/* =====================================================
   LOAD SETTINGS
   ===================================================== */

function loadSettings() {

    const storedSettings =
        JSON.parse(
            localStorage.getItem(
                "cmsSettings"
            )
        ) || {};


    const settings = {

        ...DEFAULT_SETTINGS,

        ...storedSettings

    };


    if (systemNameInput) {

        systemNameInput.value =
            settings.systemName;

    }


    if (organizationInput) {

        organizationInput.value =
            settings.organization;

    }

}



/* =====================================================
   SAVE SETTINGS
   ===================================================== */

function saveSettings() {

    const systemName =
        systemNameInput.value.trim();


    const organization =
        organizationInput.value.trim();


    if (!systemName) {

        showMessage(
            "Please enter the system name.",
            "error"
        );

        systemNameInput.focus();

        return false;

    }


    if (!organization) {

        showMessage(
            "Please enter the organization name.",
            "error"
        );

        organizationInput.focus();

        return false;

    }


    const settings = {

        systemName:
            systemName,

        organization:
            organization,

        updatedAt:
            new Date().toISOString()

    };


    localStorage.setItem(
        "cmsSettings",
        JSON.stringify(settings)
    );


    /*
       Notify other CMS pages.
    */

    window.dispatchEvent(
        new CustomEvent(
            "cmsSettingsUpdated",
            {
                detail: settings
            }
        )
    );


    showMessage(
        "Settings saved successfully.",
        "success"
    );


    return true;

}



/* =====================================================
   MESSAGE
   ===================================================== */

function showMessage(
    message,
    type
) {

    if (!settingsMessage) {
        return;
    }


    settingsMessage.textContent =
        message;


    settingsMessage.className =
        "settings-message " +
        type;


    setTimeout(
        function () {

            if (
                settingsMessage
            ) {

                settingsMessage.textContent =
                    "";

                settingsMessage.className =
                    "settings-message";

            }

        },
        3000
    );

}



/* =====================================================
   LOAD DATA COUNTS
   ===================================================== */

function getArrayLength(
    key
) {

    try {

        const data =
            JSON.parse(
                localStorage.getItem(
                    key
                )
            );


        return Array.isArray(data)
            ? data.length
            : 0;

    }

    catch (error) {

        return 0;

    }

}



function loadDataCounts() {

    const cellsCount =
        document.getElementById(
            "settingsCellsCount"
        );


    const leadersCount =
        document.getElementById(
            "settingsLeadersCount"
        );


    const membersCount =
        document.getElementById(
            "settingsMembersCount"
        );


    const followUpsCount =
        document.getElementById(
            "settingsFollowUpsCount"
        );


    const reportsCount =
        document.getElementById(
            "settingsReportsCount"
        );


    const attendanceCount =
        document.getElementById(
            "settingsAttendanceCount"
        );


    if (cellsCount) {

        cellsCount.textContent =
            getArrayLength(
                "cmsCells"
            );

    }


    if (leadersCount) {

        const cellLeaders =
            getArrayLength(
                "cmsCellLeaders"
            );


        const leaders =
            getArrayLength(
                "cmsLeaders"
            );


        leadersCount.textContent =
            Math.max(
                cellLeaders,
                leaders
            );

    }


    if (membersCount) {

        membersCount.textContent =
            getArrayLength(
                "cmsMembers"
            );

    }


    if (followUpsCount) {

        followUpsCount.textContent =
            getArrayLength(
                "cmsFollowUps"
            );

    }


    if (reportsCount) {

        reportsCount.textContent =
            getArrayLength(
                "cmsWeeklyReports"
            );

    }


    if (attendanceCount) {

        attendanceCount.textContent =
            getArrayLength(
                "cmsAttendance"
            );

    }

}



/* =====================================================
   FORM SUBMIT
   ===================================================== */

if (settingsForm) {

    settingsForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            saveSettings();

        }
    );

}



/* =====================================================
   STORAGE CHANGES
   ===================================================== */

window.addEventListener(
    "storage",
    function (event) {

        if (
            event.key ===
            "cmsSettings"
        ) {

            loadSettings();

        }


        if (
            [
                "cmsCells",
                "cmsCellLeaders",
                "cmsLeaders",
                "cmsMembers",
                "cmsFollowUps",
                "cmsWeeklyReports",
                "cmsAttendance"
            ].includes(
                event.key
            )
        ) {

            loadDataCounts();

        }

    }
);



/* =====================================================
   INITIALIZE
   ===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadSettings();

        loadDataCounts();

    }
);