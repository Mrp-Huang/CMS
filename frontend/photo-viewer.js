(function() {
    "use strict";

    const state = {
        items: [],
        index: -1,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        dragging: false,
        pointerX: 0,
        pointerY: 0,
        startOffsetX: 0,
        startOffsetY: 0,
        returnFocus: null,
        downloadUrl: null,
        downloadTimer: null,
        inertElements: new Map()
    };

    const overlay =
        document.createElement("div");

    overlay.className =
        "cms-photo-viewer";

    overlay.hidden =
        true;

    overlay.innerHTML = `
        <section
            class="cms-photo-viewer-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
        >
            <header class="cms-photo-viewer-toolbar">
                <p class="cms-photo-viewer-title" aria-live="polite"></p>
                <div class="cms-photo-viewer-controls">
                    <button type="button" data-photo-action="zoom-out" aria-label="Zoom out">−</button>
                    <button type="button" data-photo-action="reset" aria-label="Reset zoom">100%</button>
                    <button type="button" data-photo-action="zoom-in" aria-label="Zoom in">+</button>
                    <button type="button" data-photo-action="download">Download</button>
                    <button type="button" data-photo-action="close" aria-label="Close photo viewer">×</button>
                </div>
            </header>
            <div class="cms-photo-viewer-stage">
                <button type="button" class="cms-photo-viewer-nav cms-photo-viewer-previous" data-photo-action="previous" aria-label="Previous photo">‹</button>
                <img class="cms-photo-viewer-image" alt="">
                <button type="button" class="cms-photo-viewer-nav cms-photo-viewer-next" data-photo-action="next" aria-label="Next photo">›</button>
            </div>
            <p class="cms-photo-viewer-status" role="status" aria-live="polite"></p>
            <p class="cms-photo-viewer-help">Scroll or use + / − to zoom. Drag the photo when zoomed. Press Esc to close.</p>
        </section>
    `;

    document.body.appendChild(overlay);

    const viewerImage =
        overlay.querySelector(".cms-photo-viewer-image");

    const viewerTitle =
        overlay.querySelector(".cms-photo-viewer-title");

    const viewerStatus =
        overlay.querySelector(".cms-photo-viewer-status");

    const resetButton =
        overlay.querySelector('[data-photo-action="reset"]');

    const zoomInButton =
        overlay.querySelector('[data-photo-action="zoom-in"]');

    const zoomOutButton =
        overlay.querySelector('[data-photo-action="zoom-out"]');

    const downloadButton =
        overlay.querySelector('[data-photo-action="download"]');

    function visibleGalleryItems(gallery) {
        return Array.from(
            gallery.querySelectorAll("[data-photo-viewer]")
        ).filter(function(item) {
            return item.getClientRects().length > 0;
        });
    }

    function updateZoom() {
        viewerImage.style.transform =
            `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.zoom})`;

        viewerImage.classList.toggle(
            "is-zoomed",
            state.zoom > 1
        );

        resetButton.textContent =
            `${Math.round(state.zoom * 100)}%`;

        resetButton.disabled =
            state.zoom === 1;

        zoomOutButton.disabled =
            state.zoom === 1;

        zoomInButton.disabled =
            state.zoom === 4;
    }

    function resetZoom() {
        state.zoom = 1;
        state.offsetX = 0;
        state.offsetY = 0;
        updateZoom();
    }

    function renderPhoto() {
        const item =
            state.items[state.index];

        if (!item) {
            return;
        }

        const thumbnail =
            item.querySelector("img");

        const url =
            item.dataset.photoUrl ||
            item.getAttribute("href") ||
            thumbnail?.currentSrc ||
            thumbnail?.src ||
            "";

        viewerImage.onerror =
            function() {

                viewerStatus.textContent =
                    "This photo could not be loaded. Close and reopen the report to refresh its secure link.";

            };

        viewerImage.src =
            url;

        viewerImage.alt =
            thumbnail?.alt ||
            item.dataset.photoName ||
            "Meeting photo";

        viewerTitle.textContent =
            item.dataset.photoName ||
            viewerImage.alt;

        viewerStatus.textContent =
            "";

        overlay.querySelector(
            '[data-photo-action="previous"]'
        ).disabled =
            state.items.length < 2;

        overlay.querySelector(
            '[data-photo-action="next"]'
        ).disabled =
            state.items.length < 2;

        resetZoom();
    }

    function openPhoto(item) {
        const gallery =
            item.closest(
                ".report-photo-gallery, .records-report-photo-gallery, .media-library-gallery"
            );

        if (!gallery) {
            return;
        }

        state.items =
            visibleGalleryItems(gallery);

        state.index =
            state.items.indexOf(item);

        if (state.index < 0) {
            return;
        }

        state.returnFocus =
            item;

        state.inertElements.clear();

        Array.from(document.body.children).forEach(function(element) {
            if (element === overlay) {
                return;
            }

            state.inertElements.set(
                element,
                element.inert
            );

            element.inert = true;
        });

        overlay.hidden =
            false;

        document.body.classList.add(
            "cms-photo-viewer-open"
        );

        renderPhoto();

        overlay.querySelector(
            '[data-photo-action="close"]'
        ).focus();
    }

    function closeViewer() {
        overlay.hidden =
            true;

        document.body.classList.remove(
            "cms-photo-viewer-open"
        );

        state.inertElements.forEach(function(wasInert, element) {
            element.inert = wasInert;
        });

        state.inertElements.clear();

        viewerImage.removeAttribute("src");

        if (state.returnFocus?.isConnected) {
            state.returnFocus.focus();
        }
    }

    function movePhoto(direction) {
        if (state.items.length < 2) {
            return;
        }

        state.index =
            (state.index + direction + state.items.length) %
            state.items.length;

        renderPhoto();
    }

    async function downloadPhoto() {
        const item =
            state.items[state.index];

        if (!item) {
            return;
        }

        const url =
            item.dataset.photoUrl ||
            item.getAttribute("href") ||
            viewerImage.currentSrc;

        downloadButton.disabled =
            true;

        viewerStatus.textContent =
            "Preparing download...";

        try {
            const response =
                await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `Download failed (${response.status}).`
                );
            }

            const blob =
                await response.blob();

            if (state.downloadUrl) {
                URL.revokeObjectURL(state.downloadUrl);
            }

            state.downloadUrl =
                URL.createObjectURL(blob);

            const downloadLink =
                document.createElement("a");

            downloadLink.href =
                state.downloadUrl;

            const downloadName =
                item.dataset.downloadName ||
                item.dataset.photoName ||
                "meeting-photo";

            const extensionByType = {
                "image/jpeg": ".jpg",
                "image/png": ".png",
                "image/webp": ".webp"
            };

            downloadLink.download =
                /\.[a-z0-9]{2,5}$/i.test(downloadName)
                    ? downloadName
                    : `${downloadName}${extensionByType[blob.type] || ""}`;

            document.body.appendChild(downloadLink);
            downloadLink.click();
            downloadLink.remove();

            if (state.downloadTimer) {
                window.clearTimeout(state.downloadTimer);
            }

            const downloadUrl =
                state.downloadUrl;

            state.downloadTimer =
                window.setTimeout(function() {
                    URL.revokeObjectURL(downloadUrl);
                    if (state.downloadUrl === downloadUrl) {
                        state.downloadUrl = null;
                    }
                    state.downloadTimer = null;
                }, 60000);

            viewerStatus.textContent =
                "Download started.";
        }

        catch (error) {
            console.error(
                "CMS photo viewer download error:",
                error
            );

            viewerStatus.textContent =
                "The photo could not be downloaded. Check your connection and try again.";
        }

        finally {
            downloadButton.disabled =
                false;
        }
    }

    document.addEventListener(
        "click",
        function(event) {
            const item =
                event.target.closest("[data-photo-viewer]");

            if (!item) {
                return;
            }

            event.preventDefault();
            openPhoto(item);
        }
    );

    overlay.addEventListener(
        "click",
        function(event) {
            if (event.target === overlay) {
                closeViewer();
                return;
            }

            const button =
                event.target.closest("[data-photo-action]");

            if (!button || button.disabled) {
                return;
            }

            switch (button.dataset.photoAction) {
                case "close":
                    closeViewer();
                    break;
                case "previous":
                    movePhoto(-1);
                    break;
                case "next":
                    movePhoto(1);
                    break;
                case "zoom-in":
                    state.zoom = Math.min(4, state.zoom + 0.25);
                    updateZoom();
                    break;
                case "zoom-out":
                    state.zoom = Math.max(1, state.zoom - 0.25);
                    if (state.zoom === 1) {
                        state.offsetX = 0;
                        state.offsetY = 0;
                    }
                    updateZoom();
                    break;
                case "reset":
                    resetZoom();
                    break;
                case "download":
                    downloadPhoto();
                    break;
            }
        }
    );

    overlay.addEventListener(
        "wheel",
        function(event) {
            if (overlay.hidden) {
                return;
            }

            event.preventDefault();

            state.zoom =
                Math.max(
                    1,
                    Math.min(
                        4,
                        state.zoom + (event.deltaY < 0 ? 0.15 : -0.15)
                    )
                );

            if (state.zoom === 1) {
                state.offsetX = 0;
                state.offsetY = 0;
            }

            updateZoom();
        },
        {
            passive: false
        }
    );

    viewerImage.addEventListener(
        "pointerdown",
        function(event) {
            if (state.zoom <= 1) {
                return;
            }

            state.dragging = true;
            state.pointerX = event.clientX;
            state.pointerY = event.clientY;
            state.startOffsetX = state.offsetX;
            state.startOffsetY = state.offsetY;
            viewerImage.setPointerCapture(event.pointerId);
        }
    );

    viewerImage.addEventListener(
        "pointermove",
        function(event) {
            if (!state.dragging) {
                return;
            }

            state.offsetX =
                state.startOffsetX + event.clientX - state.pointerX;

            state.offsetY =
                state.startOffsetY + event.clientY - state.pointerY;

            updateZoom();
        }
    );

    viewerImage.addEventListener(
        "pointerup",
        function() {
            state.dragging = false;
        }
    );

    viewerImage.addEventListener(
        "pointercancel",
        function() {
            state.dragging = false;
        }
    );

    document.addEventListener(
        "keydown",
        function(event) {
            if (overlay.hidden) {
                return;
            }

            if (event.key === "Escape") {
                event.preventDefault();
                closeViewer();
            }
            else if (event.key === "Tab") {
                const focusable =
                    Array.from(
                        overlay.querySelectorAll(
                            'button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
                        )
                    ).filter(function(element) {
                        return element.getClientRects().length > 0;
                    });

                if (!focusable.length) {
                    event.preventDefault();
                    return;
                }

                const first =
                    focusable[0];

                const last =
                    focusable[focusable.length - 1];

                if (
                    event.shiftKey &&
                    document.activeElement === first
                ) {
                    event.preventDefault();
                    last.focus();
                }
                else if (
                    !event.shiftKey &&
                    document.activeElement === last
                ) {
                    event.preventDefault();
                    first.focus();
                }
            }
            else if (event.key === "ArrowLeft") {
                event.preventDefault();
                movePhoto(-1);
            }
            else if (event.key === "ArrowRight") {
                event.preventDefault();
                movePhoto(1);
            }
            else if (event.key === "+" || event.key === "=") {
                state.zoom = Math.min(4, state.zoom + 0.25);
                updateZoom();
            }
            else if (event.key === "-") {
                state.zoom = Math.max(1, state.zoom - 0.25);
                if (state.zoom === 1) {
                    state.offsetX = 0;
                    state.offsetY = 0;
                }
                updateZoom();
            }
            else if (event.key === "0") {
                resetZoom();
            }
        }
    );
})();
