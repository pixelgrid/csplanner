// ==UserScript==
// @name         CueScore - Disable Dark Mode
// @namespace    https://cuescore.com/
// @version      2.0.0
// @description  Disable CueScore dark-mode CSS dynamically, regardless of CSS version/hash
// @match        https://cuescore.com/*
// @match        https://www.cuescore.com/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @connect      cuescore.com
// ==/UserScript==

(function () {
    'use strict';

    const LOG_PREFIX = '[CueScore Dark Mode]';

    /*
     * Increment this if the transformation logic itself changes.
     * This invalidates previously cached transformed CSS.
     */
    const CACHE_VERSION = 1;

    const CACHE_PREFIX = 'cuescore-dark-mode-css-v' + CACHE_VERSION + ':';

    /*
     * Keep track of stylesheets we've already processed.
     */
    const processedURLs = new Set();

    /*
     * Prevent multiple simultaneous processing attempts for
     * the same stylesheet.
     */
    const processingURLs = new Set();


    // ============================================================
    // Logging
    // ============================================================

    function log(...args) {
        console.log(LOG_PREFIX, ...args);
    }

    function warn(...args) {
        console.warn(LOG_PREFIX, ...args);
    }

    function error(...args) {
        console.error(LOG_PREFIX, ...args);
    }


    // ============================================================
    // Identify CueScore CSS
    // ============================================================

    function isCueScoreStylesheet(link) {
        if (!link || link.tagName !== 'LINK') {
            return false;
        }

        if (
            link.rel &&
            !link.rel
                .toLowerCase()
                .split(/\s+/)
                .includes('stylesheet')
        ) {
            return false;
        }

        if (!link.href) {
            return false;
        }

        try {
            const url = new URL(link.href, location.href);

            return (
                url.protocol === 'https:' &&
                (
                    url.hostname === 'cuescore.com' ||
                    url.hostname.endsWith('.cuescore.com')
                )
            );
        } catch {
            return false;
        }
    }


    // ============================================================
    // Find all CueScore stylesheets
    // ============================================================

    function findCueScoreStylesheets() {
        return [
            ...document.querySelectorAll(
                'link[rel~="stylesheet"]'
            )
        ].filter(isCueScoreStylesheet);
    }


    // ============================================================
    // Cache
    // ============================================================

    function getCacheKey(url) {
        return CACHE_PREFIX + encodeURIComponent(url);
    }

    async function getCachedCSS(url) {
        try {
            return await GM_getValue(getCacheKey(url), null);
        } catch (e) {
            warn('Could not read CSS cache:', e);
            return null;
        }
    }

    async function saveCachedCSS(url, css) {
        try {
            await GM_setValue(
                getCacheKey(url),
                {
                    css,
                    timestamp: Date.now()
                }
            );
        } catch (e) {
            warn('Could not save CSS cache:', e);
        }
    }


    // ============================================================
    // Download CSS
    // ============================================================

    function downloadCSS(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                anonymous: false,

                onload(response) {
                    if (
                        response.status >= 200 &&
                        response.status < 300
                    ) {
                        resolve(response.responseText);
                    } else {
                        reject(
                            new Error(
                                `HTTP ${response.status} while loading ${url}`
                            )
                        );
                    }
                },

                onerror() {
                    reject(
                        new Error(
                            `Network error while loading ${url}`
                        )
                    );
                },

                ontimeout() {
                    reject(
                        new Error(
                            `Timeout while loading ${url}`
                        )
                    );
                }
            });
        });
    }


    // ============================================================
    // Transform CSS
    // ============================================================

    function transformCSS(css) {
        /*
         * Replace all variations of:
         *
         *   @media (prefers-color-scheme: dark)
         *
         * with a media query that never matches.
         *
         * Handles whitespace and capitalization differences.
         */

        return css.replace(
            /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/gi,
            '@media (prefers-color-scheme: never)'
        );
    }


    // ============================================================
    // Check whether CSS contains dark mode
    // ============================================================

    function containsDarkMode(css) {
        return /prefers-color-scheme\s*:\s*dark/i.test(css);
    }


    // ============================================================
    // Count replacements
    // ============================================================

    function countDarkQueries(css) {
        return (
            css.match(
                /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/gi
            ) || []
        ).length;
    }


    // ============================================================
    // Inject replacement stylesheet
    // ============================================================

    function injectStylesheet(css, sourceURL) {
        /*
         * Make sure we don't inject the same stylesheet twice.
         */

        const existing = document.querySelector(
            `style[data-cuescore-replacement="${CSS.escape(sourceURL)}"]`
        );

        if (existing) {
            return existing;
        }

        const style = document.createElement('style');

        style.setAttribute(
            'data-cuescore-replacement',
            sourceURL
        );

        style.setAttribute(
            'data-cuescore-dark-mode-disabled',
            'true'
        );

        /*
         * Adding a sourceURL comment makes debugging easier in
         * Firefox DevTools.
         */

        style.textContent =
            `/* CueScore dark-mode override: ${sourceURL} */\n` +
            css;

        /*
         * Put the replacement at the end of <head>.
         */

        (document.head || document.documentElement)
            .appendChild(style);

        return style;
    }


    // ============================================================
    // Process one stylesheet
    // ============================================================

    async function processStylesheet(link) {
        const url = link.href;

        if (!url) {
            return;
        }

        if (processedURLs.has(url)) {
            return;
        }

        if (processingURLs.has(url)) {
            return;
        }

        processingURLs.add(url);

        try {
            log('Checking stylesheet:', url);

            let css;

            /*
             * First try our cached transformed CSS.
             */

            const cached = await getCachedCSS(url);

            if (cached && typeof cached.css === 'string') {
                css = cached.css;

                log('Using cached transformed CSS:', url);
            } else {
                /*
                 * No cache.
                 */

                css = await downloadCSS(url);

                log(
                    `Downloaded ${css.length.toLocaleString()} characters`
                );

                /*
                 * If this stylesheet doesn't contain dark mode,
                 * leave it alone.
                 */

                if (!containsDarkMode(css)) {
                    log(
                        'No prefers-color-scheme: dark found:',
                        url
                    );

                    processedURLs.add(url);
                    return;
                }

                const darkQueryCount =
                    countDarkQueries(css);

                log(
                    `Found ${darkQueryCount} dark-mode media query(s)`
                );

                css = transformCSS(css);

                await saveCachedCSS(url, css);

                log('Transformed CSS cached:', url);
            }

            /*
             * Remove the original stylesheet first.
             */

            link.remove();

            /*
             * Inject transformed version.
             */

            injectStylesheet(css, url);

            processedURLs.add(url);

            log('Dark mode disabled for:', url);

        } catch (e) {
            error(
                'Failed to process stylesheet:',
                url,
                e
            );
        } finally {
            processingURLs.delete(url);
        }
    }


    // ============================================================
    // Process all currently available stylesheets
    // ============================================================

    function processAllStylesheets() {
        const stylesheets =
            findCueScoreStylesheets();

        for (const link of stylesheets) {
            processStylesheet(link);
        }
    }


    // ============================================================
    // MutationObserver
    // ============================================================

    const observer =
        new MutationObserver(mutations => {

            let shouldProcess = false;

            for (const mutation of mutations) {

                if (mutation.type !== 'childList') {
                    continue;
                }

                for (const node of mutation.addedNodes) {

                    if (
                        node.nodeType !==
                        Node.ELEMENT_NODE
                    ) {
                        continue;
                    }

                    /*
                     * Directly added stylesheet.
                     */

                    if (
                        node.matches &&
                        node.matches(
                            'link[rel~="stylesheet"]'
                        ) &&
                        isCueScoreStylesheet(node)
                    ) {
                        shouldProcess = true;
                        break;
                    }

                    /*
                     * Stylesheet nested somewhere inside
                     * a newly added element.
                     */

                    if (
                        node.querySelector &&
                        node.querySelector(
                            'link[rel~="stylesheet"]'
                        )
                    ) {
                        shouldProcess = true;
                        break;
                    }
                }

                if (shouldProcess) {
                    break;
                }
            }

            if (shouldProcess) {
                processAllStylesheets();
            }
        });


    // ============================================================
    // Start
    // ============================================================

    function start() {

        /*
         * Start observing as early as possible.
         */

        if (document.documentElement) {
            observer.observe(
                document.documentElement,
                {
                    childList: true,
                    subtree: true
                }
            );
        }

        /*
         * Process stylesheets that already exist.
         */

        processAllStylesheets();
    }


    if (document.documentElement) {
        start();
    } else {
        document.addEventListener(
            'DOMContentLoaded',
            start,
            { once: true }
        );
    }


    // ============================================================
    // Debug / maintenance helpers
    // ============================================================

    /*
     * Clear ALL cached CueScore transformed stylesheets.
     *
     * After running:
     *
     *   clearCueScoreDarkModeCache()
     *
     * reload the page.
     */

    window.clearCueScoreDarkModeCache =
        async function () {

            const stylesheets =
                findCueScoreStylesheets();

            for (const link of stylesheets) {
                try {
                    await GM_deleteValue(
                        getCacheKey(link.href)
                    );
                } catch (e) {
                    // Ignore individual failures.
                }
            }

            log(
                'Cache cleared. Reload the page.'
            );
        };


    /*
     * Force a new transformation on the next page load
     * by increasing CACHE_VERSION above.
     */

})();
