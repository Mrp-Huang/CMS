/* =========================================================
   CMS - EVANGELISM SUPABASE BRIDGE
   ========================================================= */

(function () {

    "use strict";

    console.log("CMS Evangelism Supabase Bridge loading...");

    /* =====================================================
       SAFETY CHECK
       ===================================================== */

    if (!window.supabaseClient) {
        console.error(
            "CMS Evangelism: Supabase client not available."
        );
        return;
    }

    const supabase =
        window.supabaseClient;


    /* =====================================================
       HELPERS
       ===================================================== */

    function safeArray(value) {
        return Array.isArray(value)
            ? value
            : [];
    }


    function numberValue(value) {
        const n = Number(value);
        return Number.isFinite(n)
            ? n
            : 0;
    }


    function isUUID(value) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            .test(String(value || ""));
    }


    function getCellNameFromRow(row) {

        return (
            row?.cells?.name ||
            row?.cell_name ||
            "Unknown Cell"
        );
    }


    function getLeaderNameFromRow(row) {

        return (
            row?.cell_leader_directory?.full_name ||
            row?.leader_name ||
            "Unknown Leader"
        );
    }


    /* =====================================================
       CONVERT SUPABASE -> FRONTEND
       ===================================================== */

    function convertSupabaseRecord(row) {

        return {

            id:
                row.id,

            cellId:
                row.cell_id,

            cellName:
                getCellNameFromRow(row),

            leaderId:
                row.leader_id || "",

            leaderName:
                getLeaderNameFromRow(row),

            date:
                row.evangelism_date || "",

            evangelismType:
                row.evangelism_type || "",

            location:
                row.location || "",

            peopleReached:
                numberValue(
                    row.people_reached
                ),

            newPeople:
                numberValue(
                    row.new_people
                ),

            saved:
                numberValue(
                    row.saved
                ),

            inProgress:
                numberValue(
                    row.in_progress
                ),

            interested:
                numberValue(
                    row.interested
                ),

            followUpNeeded:
                numberValue(
                    row.follow_up_needed
                ),

            notYet:
                numberValue(
                    row.not_yet
                ),

            people:
                safeArray(
                    row.people
                ),

            details:
                row.details ||
                row.notes ||
                "",

            nextAction:
                row.next_action ||
                "",

            createdAt:
                row.created_at ||
                new Date().toISOString(),

            updatedAt:
                row.updated_at ||
                row.created_at ||
                new Date().toISOString()
        };
    }


    /* =====================================================
       LOAD FROM SUPABASE
       ===================================================== */

    async function loadEvangelismFromSupabase() {

        console.log(
            "CMS Evangelism: loading live Supabase data..."
        );

        const {
            data,
            error
        } = await supabase
            .from("evangelism")
            .select(`
                id,
                cell_id,
                leader_id,
                evangelism_date,
                location,
                people_reached,
                decisions,
                follow_up_needed,
                notes,
                created_by,
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
                next_action,
                cells (
                    id,
                    name
                ),
                cell_leader_directory (
                    id,
                    full_name,
                    email,
                    phone,
                    cell_id
                )
            `)
            .order(
                "evangelism_date",
                {
                    ascending: false
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(
                "CMS Evangelism: failed to load Supabase data:",
                error
            );

            return [];
        }


        const records =
            safeArray(data)
                .map(
                    convertSupabaseRecord
                );


        console.log(
            "SUPABASE EVANGELISM ROWS:",
            records.length
        );


        /*
           Keep the existing frontend variable
           synchronized with Supabase.
        */

        try {

            if (
                typeof evangelismRecords !==
                "undefined"
            ) {

                evangelismRecords =
                    records;
            }

        } catch (error) {

            console.warn(
                "Could not update evangelismRecords directly.",
                error
            );
        }


        window.evangelismRecords =
            records;


        /*
           Keep localStorage as a backup/cache.
           We DO NOT clear the old backup.
        */

        try {

            localStorage.setItem(
                "cmsEvangelism",
                JSON.stringify(records)
            );

        } catch (error) {

            console.warn(
                "Could not update cmsEvangelism cache.",
                error
            );
        }


        /*
           Refresh existing UI.
        */

        try {

            if (
                typeof renderEvangelism ===
                "function"
            ) {

                renderEvangelism();
            }

        } catch (error) {

            console.warn(
                "renderEvangelism refresh failed:",
                error
            );
        }


        try {

            if (
                typeof updateStatistics ===
                "function"
            ) {

                updateStatistics();
            }

        } catch (error) {

            console.warn(
                "updateStatistics refresh failed:",
                error
            );
        }


        return records;
    }


    /* =====================================================
       UPDATE LOCAL RECORD AFTER SUPABASE SAVE
       ===================================================== */

    function replaceLocalRecordId(
        oldId,
        newId,
        savedRecord
    ) {

        try {

            if (
                typeof evangelismRecords !==
                "undefined"
            ) {

                const index =
                    evangelismRecords.findIndex(
                        item =>
                            String(item.id) ===
                            String(oldId)
                    );


                if (index >= 0) {

                    evangelismRecords[index] = {
                        ...savedRecord,
                        id: newId
                    };

                }

                else {

                    evangelismRecords.push({
                        ...savedRecord,
                        id: newId
                    });

                }
            }

        } catch (error) {

            console.warn(
                "Could not update local Evangelism array.",
                error
            );
        }


        window.evangelismRecords =
            typeof evangelismRecords !==
            "undefined"
                ? evangelismRecords
                : window.evangelismRecords;


        /*
           Update local backup.
        */

        try {

            localStorage.setItem(
                "cmsEvangelism",
                JSON.stringify(
                    window.evangelismRecords || []
                )
            );

        } catch (error) {

            console.warn(
                "Could not update local Evangelism backup.",
                error
            );
        }


        /*
           IMPORTANT:
           The Records Center entry created by
           the original Evangelism module still
           contains the old local ID.

           Replace it with the Supabase UUID.
        */

        try {

            const records =
                JSON.parse(
                    localStorage.getItem(
                        "cmsRecords"
                    ) || "[]"
                );


            records.forEach(
                record => {

                    if (
                        record.sourceType ===
                            "Evangelism"
                        &&
                        String(record.sourceId) ===
                            String(oldId)
                    ) {

                        record.sourceId =
                            newId;

                    }

                }
            );


            localStorage.setItem(
                "cmsRecords",
                JSON.stringify(records)
            );

        } catch (error) {

            console.warn(
                "Could not synchronize Records Center ID.",
                error
            );
        }
    }


    /* =====================================================
       SAVE TO SUPABASE
       ===================================================== */

    async function saveEvangelismToSupabase(
        record
    ) {

        if (!record) {

            throw new Error(
                "No Evangelism record supplied."
            );
        }


        const payload = {

            cell_id:
                record.cellId ||
                null,

            leader_id:
                isUUID(record.leaderId)
                    ? record.leaderId
                    : null,

            evangelism_date:
                record.date ||
                null,

            location:
                record.location ||
                null,

            people_reached:
                numberValue(
                    record.peopleReached
                ),

            decisions:
                numberValue(
                    record.saved
                ),

            follow_up_needed:
                String(
                    numberValue(
                        record.followUpNeeded
                    )
                ),

            notes:
                record.details ||
                null,

            evangelism_type:
                record.evangelismType ||
                null,

            new_people:
                numberValue(
                    record.newPeople
                ),

            saved:
                numberValue(
                    record.saved
                ),

            in_progress:
                numberValue(
                    record.inProgress
                ),

            interested:
                numberValue(
                    record.interested
                ),

            not_yet:
                numberValue(
                    record.notYet
                ),

            people:
                safeArray(
                    record.people
                ),

            details:
                record.details ||
                null,

            next_action:
                record.nextAction ||
                null,

            updated_at:
                new Date().toISOString()
        };


        let result;


        /* =================================================
           UPDATE EXISTING SUPABASE RECORD
           ================================================= */

        if (
            isUUID(record.id)
        ) {

            result =
                await supabase
                    .from("evangelism")
                    .update(payload)
                    .eq(
                        "id",
                        record.id
                    )
                    .select(`
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
                        next_action,
                        cells (
                            id,
                            name
                        ),
                        cell_leader_directory (
                            id,
                            full_name,
                            email,
                            phone,
                            cell_id
                        )
                    `)
                    .single();
        }


        /* =================================================
           INSERT NEW SUPABASE RECORD
           ================================================= */

        else {

            result =
                await supabase
                    .from("evangelism")
                    .insert(
                        payload
                    )
                    .select(`
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
                        next_action,
                        cells (
                            id,
                            name
                        ),
                        cell_leader_directory (
                            id,
                            full_name,
                            email,
                            phone,
                            cell_id
                        )
                    `)
                    .single();
        }


        if (result.error) {

            console.error(
                "CMS Evangelism: Supabase save failed:",
                result.error
            );

            throw result.error;
        }


        const savedRecord =
            convertSupabaseRecord(
                result.data
            );


        /*
           If this was a new local record,
           replace its temporary ID with
           the real Supabase UUID.
        */

        if (
            String(record.id) !==
            String(savedRecord.id)
        ) {

            replaceLocalRecordId(
                record.id,
                savedRecord.id,
                savedRecord
            );
        }


        console.log(
            "CMS Evangelism: Supabase save successful:",
            savedRecord
        );


        return savedRecord;
    }


    /* =====================================================
       DELETE FROM SUPABASE
       ===================================================== */

    async function deleteEvangelismFromSupabase(
        id
    ) {

        if (
            !isUUID(id)
        ) {

            console.warn(
                "CMS Evangelism: ID is not a Supabase UUID. Nothing deleted from Supabase:",
                id
            );

            return;
        }


        const {
            error
        } =
            await supabase
                .from("evangelism")
                .delete()
                .eq(
                    "id",
                    id
                );


        if (error) {

            console.error(
                "CMS Evangelism: Supabase delete failed:",
                error
            );

            throw error;
        }


        console.log(
            "CMS Evangelism: Supabase delete successful:",
            id
        );
    }


    /* =====================================================
       CONNECT EXISTING SAVE FUNCTION
       ===================================================== */

    function connectSave() {

        if (
            typeof saveEvangelismRecord !==
            "function"
        ) {

            console.warn(
                "CMS Evangelism: saveEvangelismRecord() not found yet."
            );

            return;
        }


        const originalSave =
            saveEvangelismRecord;


        /*
           Replace the existing global function.

           The original frontend function remains
           responsible for validation, collecting data,
           rendering, closing the modal and existing
           localStorage behavior.

           We add Supabase synchronization after it.
        */

        saveEvangelismRecord =
            async function () {

                let record = null;


                /*
                   Collect BEFORE the original function
                   closes/resets the modal.
                */

                try {

                    if (
                        typeof collectEvangelismData ===
                        "function"
                    ) {

                        record =
                            collectEvangelismData();
                    }

                } catch (error) {

                    console.error(
                        "CMS Evangelism: could not collect record before save.",
                        error
                    );

                    throw error;
                }


                /*
                   Run original save.
                */

                const result =
                    originalSave();


                /*
                   If validation failed, the original
                   function simply returns.
                */

                if (!record) {

                    return result;
                }


                /*
                   Synchronize with Supabase.
                */

                try {

                    const saved =
                        await saveEvangelismToSupabase(
                            record
                        );


                    /*
                       Final local refresh using the
                       Supabase version.
                    */

                    try {

                        if (
                            typeof evangelismRecords !==
                            "undefined"
                        ) {

                            const index =
                                evangelismRecords.findIndex(
                                    item =>
                                        String(item.id) ===
                                        String(record.id)
                                );


                            if (index >= 0) {

                                evangelismRecords[index] =
                                    saved;

                            }

                            else {

                                evangelismRecords.push(
                                    saved
                                );
                            }

                        }

                    } catch (error) {

                        console.warn(
                            "Could not refresh local record after Supabase save.",
                            error
                        );
                    }


                    window.evangelismRecords =
                        typeof evangelismRecords !==
                        "undefined"
                            ? evangelismRecords
                            : window.evangelismRecords;


                    try {

                        localStorage.setItem(
                            "cmsEvangelism",
                            JSON.stringify(
                                window.evangelismRecords || []
                            )
                        );

                    } catch (error) {

                        console.warn(
                            "Could not update local Evangelism cache.",
                            error
                        );
                    }


                    console.log(
                        "CMS Evangelism: local + Supabase save complete."
                    );

                } catch (error) {

                    console.error(
                        "CMS Evangelism: Supabase synchronization failed:",
                        error
                    );


                    alert(
                        "The Evangelism record was saved locally, but could not be synchronized with Supabase. Check the console."
                    );
                }
            };


        console.log(
            "CMS Evangelism: Save function connected to Supabase."
        );
    }


    /* =====================================================
       CONNECT DELETE FUNCTION
       ===================================================== */

    function connectDelete() {

        if (
            typeof deleteEvangelism !==
            "function"
        ) {

            console.warn(
                "CMS Evangelism: deleteEvangelism() not found yet."
            );

            return;
        }


        /*
           Replace the existing delete function.

           We keep the same confirmation behavior,
           then delete Supabase + local data.
        */

        deleteEvangelism =
            async function (id) {

                const records =
                    typeof evangelismRecords !==
                    "undefined"
                        ? evangelismRecords
                        : (
                            window.evangelismRecords ||
                            []
                        );


                const record =
                    records.find(
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


                /*
                   Delete Supabase first when this
                   is a real Supabase record.
                */

                try {

                    if (
                        isUUID(id)
                    ) {

                        await deleteEvangelismFromSupabase(
                            id
                        );
                    }

                } catch (error) {

                    console.error(
                        "CMS Evangelism: delete cancelled because Supabase deletion failed.",
                        error
                    );


                    alert(
                        "The Evangelism record could not be deleted from Supabase."
                    );

                    return;
                }


                /*
                   Delete local record.
                */

                try {

                    evangelismRecords =
                        records.filter(
                            item =>
                                String(item.id) !==
                                String(id)
                        );

                } catch (error) {

                    window.evangelismRecords =
                        records.filter(
                            item =>
                                String(item.id) !==
                                String(id)
                        );
                }


                window.evangelismRecords =
                    typeof evangelismRecords !==
                    "undefined"
                        ? evangelismRecords
                        : window.evangelismRecords;


                /*
                   Update local backup.
                */

                try {

                    localStorage.setItem(
                        "cmsEvangelism",
                        JSON.stringify(
                            window.evangelismRecords || []
                        )
                    );

                } catch (error) {

                    console.warn(
                        "Could not update cmsEvangelism after delete.",
                        error
                    );
                }


                /*
                   Remove Records Center entry.
                */

                try {

                    let cmsRecords =
                        JSON.parse(
                            localStorage.getItem(
                                "cmsRecords"
                            ) || "[]"
                        );


                    cmsRecords =
                        cmsRecords.filter(
                            item =>
                                !(
                                    item.sourceType ===
                                        "Evangelism"
                                    &&
                                    String(
                                        item.sourceId
                                    ) ===
                                    String(id)
                                )
                        );


                    localStorage.setItem(
                        "cmsRecords",
                        JSON.stringify(
                            cmsRecords
                        )
                    );

                } catch (error) {

                    console.warn(
                        "Could not update Records Center after Evangelism delete.",
                        error
                    );
                }


                /*
                   Refresh UI.
                */

                try {

                    if (
                        typeof renderEvangelism ===
                        "function"
                    ) {

                        renderEvangelism();
                    }

                } catch (error) {

                    console.warn(
                        "renderEvangelism failed after delete.",
                        error
                    );
                }


                try {

                    if (
                        typeof updateStatistics ===
                        "function"
                    ) {

                        updateStatistics();
                    }

                } catch (error) {

                    console.warn(
                        "updateStatistics failed after delete.",
                        error
                    );
                }


                console.log(
                    "CMS Evangelism: record deleted:",
                    id
                );
            };


        console.log(
            "CMS Evangelism: Delete function connected to Supabase."
        );
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.CMSEvangelismSupabase = {

        load:
            loadEvangelismFromSupabase,

        save:
            saveEvangelismToSupabase,

        delete:
            deleteEvangelismFromSupabase

    };


    /* =====================================================
       INITIALIZE
       ===================================================== */

    async function initialize() {

        try {

            /*
               Give evangelism.js time to create its
               global functions and DOM bindings.
            */

            connectSave();
            connectDelete();


            /*
               Load the authoritative Supabase data.
            */

            await loadEvangelismFromSupabase();


            console.log(
                "CMS Evangelism Supabase Bridge initialized successfully."
            );

        } catch (error) {

            console.error(
                "CMS Evangelism Supabase Bridge initialization failed:",
                error
            );
        }
    }


    /* =====================================================
       WAIT FOR DOM
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once: true
            }
        );

    }

    else {

        initialize();
    }


})();