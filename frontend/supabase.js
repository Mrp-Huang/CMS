// ==========================================
// SUPABASE CONFIGURATION
// ==========================================

const SUPABASE_URL =
    "https://plfcjuzhfienfawzlorl.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_mQR91zYIv8uvN_N3btChRA_WwT6FR4C";


// ==========================================
// SHARED DATA LOADING INDICATOR
// ==========================================

const cmsLoadingStyle =
    document.createElement("style");

cmsLoadingStyle.textContent = `
    .cms-data-loading {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.9);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 180ms ease, visibility 180ms ease;
    }

    .cms-data-loading.is-visible {
        opacity: 1;
        visibility: visible;
    }

    .cms-data-loading__content {
        display: grid;
        justify-items: center;
        gap: 18px;
        color: #17336f;
        font-family: Arial, sans-serif;
    }

    .cms-data-loading__mark {
        position: relative;
        display: grid;
        place-items: center;
        width: 104px;
        height: 104px;
    }

    .cms-data-loading__orbit {
        position: absolute;
        inset: 0;
        border: 3px solid rgba(36, 82, 154, 0.16);
        border-top-color: #087ab8;
        border-right-color: #24529a;
        border-radius: 50%;
        animation: cms-data-orbit 1.35s linear infinite;
    }

    .cms-data-loading__orbit::after {
        position: absolute;
        top: -5px;
        left: 50%;
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: #087ab8;
        content: "";
        transform: translateX(-50%);
    }

    .cms-data-loading__letters {
        display: flex;
        align-items: center;
        color: #17336f;
        font-size: 29px;
        font-weight: 800;
        line-height: 1;
    }

    .cms-data-loading__letter {
        display: inline-block;
        animation: cms-data-letter 1.2s ease-in-out infinite;
    }

    .cms-data-loading__letter:nth-child(2) {
        animation-delay: 120ms;
    }

    .cms-data-loading__letter:nth-child(3) {
        animation-delay: 240ms;
    }

    .cms-data-loading__label {
        color: #24529a;
        font-size: 14px;
        font-weight: 600;
    }

    @keyframes cms-data-orbit {
        to { transform: rotate(360deg); }
    }

    @keyframes cms-data-letter {
        0%, 60%, 100% { opacity: 0.72; transform: translateY(0); }
        30% { opacity: 1; transform: translateY(-4px); }
    }

    @media (prefers-reduced-motion: reduce) {
        .cms-data-loading { transition: none; }
        .cms-data-loading__orbit,
        .cms-data-loading__letter { animation: none; }
    }
`;

document.head.appendChild(cmsLoadingStyle);

const cmsLoadingOverlay =
    document.createElement("div");

cmsLoadingOverlay.className = "cms-data-loading";
cmsLoadingOverlay.setAttribute("role", "status");
cmsLoadingOverlay.setAttribute("aria-live", "polite");
cmsLoadingOverlay.innerHTML =
    '<div class="cms-data-loading__content">' +
        '<span class="cms-data-loading__mark" aria-hidden="true">' +
            '<span class="cms-data-loading__orbit"></span>' +
            '<span class="cms-data-loading__letters">' +
                '<span class="cms-data-loading__letter">C</span>' +
                '<span class="cms-data-loading__letter">M</span>' +
                '<span class="cms-data-loading__letter">S</span>' +
            '</span>' +
        '</span>' +
        '<span class="cms-data-loading__label">Loading data</span>' +
    '</div>';
cmsLoadingOverlay.setAttribute("aria-hidden", "true");

document.body.appendChild(cmsLoadingOverlay);

let cmsPendingDataRequests = 0;
let cmsLoadingShowTimer = null;

async function cmsSupabaseFetch(input, init) {
    const requestUrl = new URL(
        typeof input === "string" ? input : input.url,
        window.location.href
    );
    const isSupabaseRequest =
        requestUrl.origin === new URL(SUPABASE_URL).origin;

    if (isSupabaseRequest) {
        cmsPendingDataRequests += 1;

        if (cmsLoadingShowTimer === null) {
            cmsLoadingShowTimer = window.setTimeout(() => {
                cmsLoadingShowTimer = null;

                if (cmsPendingDataRequests > 0) {
                    cmsLoadingOverlay.classList.add("is-visible");
                    cmsLoadingOverlay.setAttribute("aria-hidden", "false");
                }
            }, 180);
        }
    }

    try {
        return await window.fetch(input, init);
    } finally {
        if (isSupabaseRequest) {
            cmsPendingDataRequests -= 1;

            if (cmsPendingDataRequests === 0) {
                if (cmsLoadingShowTimer !== null) {
                    window.clearTimeout(cmsLoadingShowTimer);
                    cmsLoadingShowTimer = null;
                }

                cmsLoadingOverlay.classList.remove("is-visible");
                cmsLoadingOverlay.setAttribute("aria-hidden", "true");
            }
        }
    }
}


// ==========================================
// CREATE SUPABASE CLIENT
// ==========================================

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
            global: {
                fetch: cmsSupabaseFetch
            }
        }
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