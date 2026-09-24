// ==========================================
// SUPABASE CONFIGURATION
// ==========================================

const SUPABASE_URL =
    "https://plfcjuzhfienfawzlorl.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_mQR91zYIv8uvN_N3btChRA_WwT6FR4C";


// ==========================================
// CREATE SUPABASE CLIENT
// ==========================================

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ==========================================
// MAKE CLIENT AVAILABLE TO ALL CMS SCRIPTS
// ==========================================

window.supabaseClient =
    supabaseClient;


// ==========================================
// CONFIRM CONNECTION
// ==========================================

console.log(
    "Supabase client initialized successfully."
);