// ==UserScript==
// @name         CueScore Account Switcher
// @namespace    https://cuescore.com/
// @version      3.0.0
// @description  Manage and switch between multiple CueScore accounts
// @author       Tony
// @match        https://cuescore.com/*
// @match        https://www.cuescore.com/*
// @connect      cuescore.com
// @connect      www.cuescore.com
// @grant        GM.xmlHttpRequest
// @grant        GM.cookie
// @grant        GM.getValue
// @grant        GM.setValue
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    /*
     * =========================================================
     * Configuration
     * =========================================================
     */

    const LOGIN_URL =
        'https://cuescore.com/ajax/user/login.php';

    const COOKIE_URL =
        'https://cuescore.com/';

    const COOKIE_NAME =
        'PHPSESSID';

    const STORAGE_KEY =
        'cuescore_saved_accounts_v3';

    const HEADER_ICON_ID =
        'cs-account-switcher';

    const MODAL_ID =
        'cs-account-switcher-overlay';

    /*
     * =========================================================
     * CSS
     * =========================================================
     */

    const CSS = `
        /*
         * -----------------------------------------------------
         * Account icon
         * -----------------------------------------------------
         */

        #${HEADER_ICON_ID} {
            cursor: pointer;
        }

        #${HEADER_ICON_ID}::before {
            content: '';

            display: block;

            width: 18px;
            height: 18px;

            margin: auto;

            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;

            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='8' r='3.5'/%3E%3Cpath d='M5 20c.8-4 3.2-6 7-6s6.2 2 7 6'/%3E%3C/svg%3E");
        }

        /*
         * -----------------------------------------------------
         * Overlay
         * -----------------------------------------------------
         */

        #${MODAL_ID} {
            position: fixed;

            inset: 0;

            z-index: 2147483647;

            display: flex;

            align-items: flex-start;
            justify-content: center;

            padding-top: 70px;

            background: rgba(0, 0, 0, 0.45);

            font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                Arial,
                sans-serif;
        }

        /*
         * -----------------------------------------------------
         * Modal
         * -----------------------------------------------------
         */

        #cs-account-switcher-modal {
            width: 440px;

            max-width:
                calc(100vw - 30px);

            max-height:
                calc(100vh - 100px);

            overflow-y: auto;

            background: #fff;

            color: #222;

            border-radius: 8px;

            box-shadow:
                0 12px 45px rgba(0, 0, 0, .30);
        }

        /*
         * -----------------------------------------------------
         * Header
         * -----------------------------------------------------
         */

        #cs-account-switcher-header {
            display: flex;

            align-items: center;
            justify-content: space-between;

            padding: 15px 18px;

            border-bottom:
                1px solid #ddd;
        }

        #cs-account-switcher-title {
            font-size: 17px;

            font-weight: 600;
        }

        #cs-account-switcher-close {
            width: 30px;
            height: 30px;

            padding: 0;

            border: 0;

            background: transparent;

            color: #777;

            font-size: 25px;

            line-height: 30px;

            cursor: pointer;
        }

        #cs-account-switcher-close:hover {
            color: #222;
        }

        /*
         * -----------------------------------------------------
         * Content
         * -----------------------------------------------------
         */

        #cs-account-switcher-content {
            padding: 15px;
        }

        /*
         * -----------------------------------------------------
         * Saved accounts
         * -----------------------------------------------------
         */

        .cs-saved-account {
            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 10px;

            min-height: 44px;

            padding: 7px 9px;

            margin-bottom: 8px;

            border:
                1px solid #ddd;

            border-radius: 5px;

            background: #fff;

            box-sizing: border-box;
        }

        .cs-saved-account:hover {
            background: #f7f7f7;
        }

        .cs-saved-account-name {
            min-width: 0;

            overflow: hidden;

            text-overflow: ellipsis;

            white-space: nowrap;

            font-size: 14px;

            font-weight: 500;
        }

        .cs-saved-account-actions {
            display: flex;

            flex-shrink: 0;

            gap: 5px;
        }

        /*
         * -----------------------------------------------------
         * Buttons
         * -----------------------------------------------------
         */

        .cs-account-button {
            padding: 5px 8px;

            border:
                1px solid #ccc;

            border-radius: 4px;

            background: #fff;

            color: #333;

            font-size: 12px;

            cursor: pointer;
        }

        .cs-account-button:hover {
            background: #eee;
        }

        .cs-account-button-switch {
            border-color: #0e2666;

            background: #0e2666;

            color: #fff;
        }

        .cs-account-button-switch:hover {
            background: #172f78;
        }

        .cs-account-button-delete {
            color: #b00020;
        }

        /*
         * -----------------------------------------------------
         * Empty accounts
         * -----------------------------------------------------
         */

        #cs-account-switcher-empty {
            padding: 10px 5px 15px;

            color: #777;

            text-align: center;

            font-size: 13px;
        }

        /*
         * -----------------------------------------------------
         * Add account section
         * -----------------------------------------------------
         */

        #cs-add-account-section {
            margin-top: 18px;

            padding-top: 16px;

            border-top:
                1px solid #ddd;
        }

        #cs-add-account-title {
            margin-bottom: 12px;

            font-size: 14px;

            font-weight: 600;
        }

        .cs-account-field {
            margin-bottom: 10px;
        }

        .cs-account-field label {
            display: block;

            margin-bottom: 4px;

            font-size: 12px;

            color: #555;
        }

        .cs-account-field input {
            width: 100%;

            box-sizing: border-box;

            padding: 9px 10px;

            border:
                1px solid #ccc;

            border-radius: 4px;

            background: #fff;

            color: #222;

            font-family: inherit;

            font-size: 13px;

            outline: none;
        }

        .cs-account-field input:focus {
            border-color: #0e2666;

            box-shadow:
                0 0 0 2px rgba(
                    14,
                    38,
                    102,
                    .10
                );
        }

        /*
         * -----------------------------------------------------
         * Login button
         * -----------------------------------------------------
         */

        #cs-login-save-account {
            width: 100%;

            margin-top: 3px;

            padding: 10px;

            border: 0;

            border-radius: 5px;

            background: #0e2666;

            color: #fff;

            font-family: inherit;

            font-size: 13px;

            font-weight: 600;

            cursor: pointer;
        }

        #cs-login-save-account:hover {
            background: #172f78;
        }

        #cs-login-save-account:disabled {
            opacity: .55;

            cursor: default;
        }

        /*
         * -----------------------------------------------------
         * Status
         * -----------------------------------------------------
         */

        #cs-account-status {
            min-height: 18px;

            margin-top: 10px;

            text-align: center;

            font-size: 12px;
        }

        #cs-account-status.error {
            color: #b00020;
        }

        #cs-account-status.success {
            color: #267326;
        }

        #cs-account-status.loading {
            color: #666;
        }

        /*
         * -----------------------------------------------------
         * Mobile
         * -----------------------------------------------------
         */

        @media (max-width: 500px) {
            #${MODAL_ID} {
                padding-top: 30px;
            }

            #cs-account-switcher-modal {
                width: calc(100vw - 20px);
            }

            .cs-saved-account {
                align-items: flex-start;
            }

            .cs-saved-account-actions {
                flex-wrap: wrap;
                justify-content: flex-end;
            }
        }
    `;

    /*
     * =========================================================
     * Utility
     * =========================================================
     */

    function injectStyles() {
        if (
            document.getElementById(
                'cs-account-switcher-styles'
            )
        ) {
            return;
        }

        const style =
            document.createElement('style');

        style.id =
            'cs-account-switcher-styles';

        style.textContent =
            CSS;

        document.head.appendChild(
            style
        );
    }

    function generateId() {
        if (
            typeof crypto !== 'undefined' &&
            typeof crypto.randomUUID === 'function'
        ) {
            return crypto.randomUUID();
        }

        return (
            Date.now().toString(36) +
            Math.random()
                .toString(36)
                .slice(2)
        );
    }

    /*
     * =========================================================
     * Storage
     * =========================================================
     */

    async function getAccounts() {
        const accounts =
            await GM.getValue(
                STORAGE_KEY,
                []
            );

        return Array.isArray(accounts)
            ? accounts
            : [];
    }

    async function saveAccounts(
        accounts
    ) {
        await GM.setValue(
            STORAGE_KEY,
            accounts
        );
    }

    /*
     * =========================================================
     * Cookie helpers
     * =========================================================
     */

    async function getCurrentSession() {
        try {
            const cookies =
                await GM.cookie.list({
                    url: COOKIE_URL,
                    name: COOKIE_NAME
                });

            if (!Array.isArray(cookies)) {
                return null;
            }

            /*
             * Prefer the normal CueScore root-path cookie.
             */
            return (
                cookies.find(
                    cookie =>
                        cookie.path === '/' &&
                        (
                            cookie.domain ===
                            '.cuescore.com' ||
                            cookie.domain ===
                            'cuescore.com'
                        )
                ) ||
                cookies.find(
                    cookie =>
                        cookie.path === '/'
                ) ||
                cookies[0] ||
                null
            );

        } catch (error) {
            console.error(
                '[CueScore Account Switcher] ' +
                'Unable to read PHPSESSID:',
                error
            );

            return null;
        }
    }

    async function deleteCurrentSession() {
        try {
            const cookies =
                await GM.cookie.list({
                    url: COOKIE_URL,
                    name: COOKIE_NAME
                });

            if (
                !Array.isArray(cookies) ||
                !cookies.length
            ) {
                return;
            }

            /*
             * Delete every matching PHPSESSID.
             *
             * This handles the possibility of CueScore having
             * both a host/domain cookie.
             */
            for (
                const cookie of cookies
            ) {
                const options = {
                    url: COOKIE_URL,
                    name: COOKIE_NAME
                };

                if (
                    cookie.partitionKey
                ) {
                    options.partitionKey =
                        cookie.partitionKey;
                }

                try {
                    await GM.cookie.delete(
                        options
                    );
                } catch (error) {
                    console.warn(
                        '[CueScore Account Switcher] ' +
                        'Unable to delete cookie:',
                        error
                    );
                }
            }

        } catch (error) {
            console.error(
                '[CueScore Account Switcher] ' +
                'Unable to delete PHPSESSID:',
                error
            );

            throw error;
        }
    }

    async function setSessionCookie(
        cookie
    ) {
        if (
            !cookie ||
            !cookie.value
        ) {
            throw new Error(
                'The saved account does not contain a PHPSESSID.'
            );
        }

        const options = {
            url:
                COOKIE_URL,

            name:
                COOKIE_NAME,

            value:
                cookie.value,

            domain:
                cookie.domain ||
                '.cuescore.com',

            path:
                cookie.path ||
                '/',

            secure:
                cookie.secure !== false,

            httpOnly:
                cookie.httpOnly !== false
        };

        /*
         * PHPSESSID from the login response is normally a
         * session cookie. Do not add an artificial expiration.
         */

        if (
            cookie.sameSite
        ) {
            options.sameSite =
                cookie.sameSite;
        }

        if (
            cookie.firstPartyDomain
        ) {
            options.firstPartyDomain =
                cookie.firstPartyDomain;
        }

        if (
            cookie.partitionKey
        ) {
            options.partitionKey =
                cookie.partitionKey;
        }

        await GM.cookie.set(
            options
        );
    }

    /*
     * =========================================================
     * Parse Set-Cookie
     * =========================================================
     */

    function getSetCookieHeaders(
        responseHeaders
    ) {
        if (
            !responseHeaders ||
            typeof responseHeaders !==
                'string'
        ) {
            return [];
        }

        /*
         * Tampermonkey exposes response headers as a string.
         *
         * Multiple Set-Cookie headers are normally separated
         * by CRLF. Do not split on commas because cookie
         * Expires attributes themselves contain commas.
         */
        return responseHeaders
            .split(/\r?\n/)
            .filter(
                line =>
                    /^set-cookie\s*:/i.test(
                        line
                    )
            )
            .map(
                line =>
                    line.replace(
                        /^set-cookie\s*:\s*/i,
                        ''
                    )
            );
    }

    function parseCookieHeader(
        header
    ) {
        /*
         * We only need the first name=value pair.
         */
        const match =
            header.match(
                /^([^=;\s]+)=([^;]*)/
            );

        if (!match) {
            return null;
        }

        const attributes = {};

        const parts =
            header.split(';');

        for (
            let i = 1;
            i < parts.length;
            i++
        ) {
            const part =
                parts[i].trim();

            if (!part) {
                continue;
            }

            const equalsIndex =
                part.indexOf('=');

            if (equalsIndex === -1) {
                attributes[
                    part.toLowerCase()
                ] = true;

                continue;
            }

            const key =
                part
                    .slice(
                        0,
                        equalsIndex
                    )
                    .trim()
                    .toLowerCase();

            const value =
                part
                    .slice(
                        equalsIndex + 1
                    )
                    .trim();

            attributes[key] =
                value;
        }

        return {
            name:
                match[1],

            value:
                match[2],

            domain:
                attributes.domain ||
                '.cuescore.com',

            path:
                attributes.path ||
                '/',

            secure:
                'secure' in
                attributes,

            httpOnly:
                'httponly' in
                attributes,

            sameSite:
                attributes.samesite ||
                undefined,

            expirationDate:
                parseCookieExpiration(
                    attributes
                )
        };
    }

    function parseCookieExpiration(
        attributes
    ) {
        /*
         * Prefer Max-Age because it is relative to the response
         * time and avoids having to parse the HTTP date.
         */
        if (
            attributes['max-age'] !==
            undefined
        ) {
            const seconds =
                Number(
                    attributes['max-age']
                );

            if (
                Number.isFinite(
                    seconds
                )
            ) {
                return (
                    Math.floor(
                        Date.now() /
                        1000
                    ) +
                    seconds
                );
            }
        }

        if (
            attributes.expires
        ) {
            const timestamp =
                Date.parse(
                    attributes.expires
                );

            if (
                Number.isFinite(
                    timestamp
                )
            ) {
                return Math.floor(
                    timestamp /
                    1000
                );
            }
        }

        return undefined;
    }

    function extractPHPSESSID(
        responseHeaders
    ) {
        const headers =
            getSetCookieHeaders(
                responseHeaders
            );

        for (
            const header of headers
        ) {
            const cookie =
                parseCookieHeader(
                    header
                );

            if (
                cookie &&
                cookie.name ===
                    COOKIE_NAME &&
                cookie.value
            ) {
                return cookie;
            }
        }

        /*
         * Some Tampermonkey/browser combinations have historically
         * represented repeated response headers differently.
         *
         * Fall back to searching the complete response header
         * string for PHPSESSID.
         */
        const match =
            responseHeaders.match(
                /(?:^|\r?\n)\s*set-cookie\s*:\s*PHPSESSID=([^;\r\n]+)/i
            );

        if (match) {
            return {
                name:
                    COOKIE_NAME,

                value:
                    match[1],

                domain:
                    '.cuescore.com',

                path:
                    '/',

                secure:
                    true,

                httpOnly:
                    true
            };
        }

        return null;
    }

    /*
     * =========================================================
     * CueScore login
     * =========================================================
     */

    async function loginToCueScore(
        username,
        password
    ) {
        const body =
            new URLSearchParams({
                postUrl:
                    '/ajax/user/login.php',

                domPath:
                    '.User+.login+>+form',

                redirect:
                    '',

                callback:
                    '',

                hideOnOK:
                    'true',

                useSpinner:
                    'true',

                cover:
                    '',

                username:
                    username,

                password:
                    password,

                remember:
                    'on'
            }).toString();

        let response;

        try {
            response =
                await GM.xmlHttpRequest({
                    method:
                        'POST',

                    url:
                        LOGIN_URL,

                    headers: {
                        'Content-Type':
                            'application/x-www-form-urlencoded',

                        /*
                         * This is what the normal CueScore
                         * browser login sends.
                         */
                        'Accept':
                            '*/*'
                    },

                    data:
                        body,

                    /*
                     * Do not send the currently logged-in
                     * account's cookies.
                     */
                    anonymous:
                        true,

                    /*
                     * We want the response containing the
                     * Set-Cookie headers, not a redirect
                     * after it.
                     */
                    redirect:
                        'manual',

                    timeout:
                        30000
                });

        } catch (error) {
            throw new Error(
                'The login request failed.'
            );
        }

        if (
            response.status < 200 ||
            response.status >= 400
        ) {
            throw new Error(
                `CueScore returned HTTP ${response.status}.`
            );
        }

        const session =
            extractPHPSESSID(
                response.responseHeaders
            );

        if (!session) {
            /*
             * Don't expose the password or complete response
             * to the console.
             */
            throw new Error(
                'CueScore did not return a PHPSESSID. ' +
                'The username or password may be incorrect.'
            );
        }

        return session;
    }

    /*
     * =========================================================
     * Add account
     * =========================================================
     */

    async function addAccount(
        username,
        password,
        name
    ) {
        /*
         * Login in an isolated request.
         *
         * The returned session is NOT immediately installed
         * into the browser.
         */
        const session =
            await loginToCueScore(
                username,
                password
            );

        /*
         * Store ONLY the session and the chosen display name.
         *
         * Username and password are deliberately discarded.
         */
        const accounts =
            await getAccounts();

        accounts.push({
            id:
                generateId(),

            name:
                name,

            cookie: {
                name:
                    COOKIE_NAME,

                value:
                    session.value,

                domain:
                    session.domain ||
                    '.cuescore.com',

                path:
                    session.path ||
                    '/',

                secure:
                    session.secure !== false,

                httpOnly:
                    session.httpOnly !== false,

                sameSite:
                    session.sameSite,

                expirationDate:
                    session.expirationDate
            }
        });

        await saveAccounts(
            accounts
        );

        return session;
    }

    /*
     * =========================================================
     * Rename
     * =========================================================
     */

    async function renameAccount(
        id
    ) {
        const accounts =
            await getAccounts();

        const account =
            accounts.find(
                item =>
                    item.id === id
            );

        if (!account) {
            return;
        }

        const name =
            prompt(
                'Account name:',
                account.name
            );

        if (name === null) {
            return;
        }

        const trimmed =
            name.trim();

        if (!trimmed) {
            return;
        }

        account.name =
            trimmed;

        await saveAccounts(
            accounts
        );

        await renderModal();

        setStatus(
            'Account renamed.',
            'success'
        );
    }

    /*
     * =========================================================
     * Delete
     * =========================================================
     */

    async function deleteAccount(
        id
    ) {
        const accounts =
            await getAccounts();

        const account =
            accounts.find(
                item =>
                    item.id === id
            );

        if (!account) {
            return;
        }

        if (
            !confirm(
                `Delete "${account.name}"?`
            )
        ) {
            return;
        }

        const remaining =
            accounts.filter(
                item =>
                    item.id !== id
            );

        await saveAccounts(
            remaining
        );

        await renderModal();
    }

    /*
     * =========================================================
     * Switch account
     * =========================================================
     */

    async function switchAccount(
        id
    ) {
        const accounts =
            await getAccounts();

        const account =
            accounts.find(
                item =>
                    item.id === id
            );

        if (!account) {
            return;
        }

        if (
            !account.cookie ||
            !account.cookie.value
        ) {
            alert(
                'This account has no valid saved session.'
            );

            return;
        }

        if (
            !confirm(
                `Switch to "${account.name}"?`
            )
        ) {
            return;
        }

        try {
            /*
             * Remove current PHPSESSID.
             */
            await deleteCurrentSession();

            /*
             * Install selected account's PHPSESSID.
             */
            await setSessionCookie(
                account.cookie
            );

            /*
             * Give the browser a short moment to commit the
             * cookie before navigating.
             */
            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        250
                    )
            );

            window.location.reload();

        } catch (error) {
            console.error(
                '[CueScore Account Switcher] ' +
                'Switch failed:',
                error
            );

            alert(
                'Unable to switch account.\n\n' +
                error.message
            );
        }
    }

    /*
     * =========================================================
     * Status
     * =========================================================
     */

    function setStatus(
        message,
        type = ''
    ) {
        const element =
            document.getElementById(
                'cs-account-status'
            );

        if (!element) {
            return;
        }

        element.textContent =
            message;

        element.className =
            type;
    }

    /*
     * =========================================================
     * Modal close
     * =========================================================
     */

    function closeModal() {
        const modal =
            document.getElementById(
                MODAL_ID
            );

        if (modal) {
            modal.remove();
        }
    }

    /*
     * =========================================================
     * Login form submit
     * =========================================================
     */

    async function handleLogin(
        event
    ) {
        event.preventDefault();

        const usernameInput =
            document.getElementById(
                'cs-account-username'
            );

        const passwordInput =
            document.getElementById(
                'cs-account-password'
            );

        const nameInput =
            document.getElementById(
                'cs-account-name'
            );

        const loginButton =
            document.getElementById(
                'cs-login-save-account'
            );

        const username =
            usernameInput.value.trim();

        const password =
            passwordInput.value;

        const name =
            nameInput.value.trim();

        if (!username) {
            usernameInput.focus();

            setStatus(
                'Enter your CueScore username.',
                'error'
            );

            return;
        }

        if (!password) {
            passwordInput.focus();

            setStatus(
                'Enter your CueScore password.',
                'error'
            );

            return;
        }

        if (!name) {
            nameInput.focus();

            setStatus(
                'Enter a name for this account.',
                'error'
            );

            return;
        }

        /*
         * Prevent duplicate submissions.
         */
        loginButton.disabled =
            true;

        usernameInput.disabled =
            true;

        passwordInput.disabled =
            true;

        nameInput.disabled =
            true;

        setStatus(
            'Logging in...',
            'loading'
        );

        try {
            await addAccount(
                username,
                password,
                name
            );

            /*
             * Explicitly clear the password from the form
             * after successful authentication.
             */
            passwordInput.value =
                '';

            /*
             * Also clear username so it isn't accidentally
             * retained in the DOM.
             */
            usernameInput.value =
                '';

            setStatus(
                'Account saved.',
                'success'
            );

            /*
             * Re-render the account list while keeping the
             * modal open.
             */
            await renderModal();

            setStatus(
                'Account saved.',
                'success'
            );

        } catch (error) {
            console.error(
                '[CueScore Account Switcher] ' +
                'Login failed:',
                error
            );

            setStatus(
                error.message ||
                    'Login failed.',
                'error'
            );

            loginButton.disabled =
                false;

            usernameInput.disabled =
                false;

            passwordInput.disabled =
                false;

            nameInput.disabled =
                false;
        }
    }

    /*
     * =========================================================
     * Modal rendering
     * =========================================================
     */

    async function renderModal() {
        closeModal();

        const accounts =
            await getAccounts();

        /*
         * Overlay
         */

        const overlay =
            document.createElement('div');

        overlay.id =
            MODAL_ID;

        overlay.addEventListener(
            'click',
            event => {
                if (
                    event.target ===
                    overlay
                ) {
                    closeModal();
                }
            }
        );

        /*
         * Modal
         */

        const modal =
            document.createElement('div');

        modal.id =
            'cs-account-switcher-modal';

        /*
         * -----------------------------------------------------
         * Header
         * -----------------------------------------------------
         */

        const header =
            document.createElement('div');

        header.id =
            'cs-account-switcher-header';

        const title =
            document.createElement('div');

        title.id =
            'cs-account-switcher-title';

        title.textContent =
            'CueScore Accounts';

        const close =
            document.createElement('button');

        close.id =
            'cs-account-switcher-close';

        close.type =
            'button';

        close.textContent =
            '×';

        close.setAttribute(
            'aria-label',
            'Close'
        );

        close.addEventListener(
            'click',
            closeModal
        );

        header.append(
            title,
            close
        );

        /*
         * -----------------------------------------------------
         * Content
         * -----------------------------------------------------
         */

        const content =
            document.createElement('div');

        content.id =
            'cs-account-switcher-content';

        /*
         * Saved accounts
         */

        if (!accounts.length) {
            const empty =
                document.createElement('div');

            empty.id =
                'cs-account-switcher-empty';

            empty.textContent =
                'No saved accounts.';

            content.appendChild(
                empty
            );

        } else {
            for (
                const account of accounts
            ) {
                const row =
                    document.createElement('div');

                row.className =
                    'cs-saved-account';

                /*
                 * Name
                 */

                const name =
                    document.createElement('div');

                name.className =
                    'cs-saved-account-name';

                name.textContent =
                    account.name;

                /*
                 * Actions
                 */

                const actions =
                    document.createElement('div');

                actions.className =
                    'cs-saved-account-actions';

                /*
                 * Switch
                 */

                const switchButton =
                    document.createElement('button');

                switchButton.type =
                    'button';

                switchButton.className =
                    'cs-account-button ' +
                    'cs-account-button-switch';

                switchButton.textContent =
                    'Switch';

                switchButton.addEventListener(
                    'click',
                    () =>
                        switchAccount(
                            account.id
                        )
                );

                /*
                 * Rename
                 */

                const renameButton =
                    document.createElement('button');

                renameButton.type =
                    'button';

                renameButton.className =
                    'cs-account-button';

                renameButton.textContent =
                    'Rename';

                renameButton.addEventListener(
                    'click',
                    () =>
                        renameAccount(
                            account.id
                        )
                );

                /*
                 * Delete
                 */

                const deleteButton =
                    document.createElement('button');

                deleteButton.type =
                    'button';

                deleteButton.className =
                    'cs-account-button ' +
                    'cs-account-button-delete';

                deleteButton.textContent =
                    'Delete';

                deleteButton.addEventListener(
                    'click',
                    () =>
                        deleteAccount(
                            account.id
                        )
                );

                actions.append(
                    switchButton,
                    renameButton,
                    deleteButton
                );

                row.append(
                    name,
                    actions
                );

                content.appendChild(
                    row
                );
            }
        }

        /*
         * -----------------------------------------------------
         * Add account
         * -----------------------------------------------------
         */

        const addSection =
            document.createElement('div');

        addSection.id =
            'cs-add-account-section';

        const addTitle =
            document.createElement('div');

        addTitle.id =
            'cs-add-account-title';

        addTitle.textContent =
            'Add account';

        addSection.appendChild(
            addTitle
        );

        /*
         * Form
         */

        const form =
            document.createElement('form');

        form.id =
            'cs-add-account-form';

        form.addEventListener(
            'submit',
            handleLogin
        );

        /*
         * Username
         */

        const usernameField =
            document.createElement('div');

        usernameField.className =
            'cs-account-field';

        const usernameLabel =
            document.createElement('label');

        usernameLabel.htmlFor =
            'cs-account-username';

        usernameLabel.textContent =
            'Username';

        const usernameInput =
            document.createElement('input');

        usernameInput.id =
            'cs-account-username';

        usernameInput.type =
            'text';

        usernameInput.autocomplete =
            'username';

        usernameInput.placeholder =
            'CueScore username';

        usernameInput.required =
            true;

        usernameField.append(
            usernameLabel,
            usernameInput
        );

        /*
         * Password
         */

        const passwordField =
            document.createElement('div');

        passwordField.className =
            'cs-account-field';

        const passwordLabel =
            document.createElement('label');

        passwordLabel.htmlFor =
            'cs-account-password';

        passwordLabel.textContent =
            'Password';

        const passwordInput =
            document.createElement('input');

        passwordInput.id =
            'cs-account-password';

        passwordInput.type =
            'password';

        passwordInput.autocomplete =
            'current-password';

        passwordInput.placeholder =
            'CueScore password';

        passwordInput.required =
            true;

        passwordField.append(
            passwordLabel,
            passwordInput
        );

        /*
         * Account name
         */

        const nameField =
            document.createElement('div');

        nameField.className =
            'cs-account-field';

        const nameLabel =
            document.createElement('label');

        nameLabel.htmlFor =
            'cs-account-name';

        nameLabel.textContent =
            'Account name';

        const nameInput =
            document.createElement('input');

        nameInput.id =
            'cs-account-name';

        nameInput.type =
            'text';

        nameInput.placeholder =
            'e.g. Main account';

        nameInput.required =
            true;

        nameField.append(
            nameLabel,
            nameInput
        );

        /*
         * Login button
         */

        const loginButton =
            document.createElement('button');

        loginButton.id =
            'cs-login-save-account';

        loginButton.type =
            'submit';

        loginButton.textContent =
            'Login & Save';

        form.append(
            usernameField,
            passwordField,
            nameField,
            loginButton
        );

        addSection.append(
            form
        );

        /*
         * Status
         */

        const status =
            document.createElement('div');

        status.id =
            'cs-account-status';

        addSection.append(
            status
        );

        /*
         * Put everything together.
         */

        content.append(
            addSection
        );

        modal.append(
            header,
            content
        );

        overlay.appendChild(
            modal
        );

        document.body.appendChild(
            overlay
        );
    }

    /*
     * =========================================================
     * Header icon
     * =========================================================
     */

    function createHeaderIcon() {
        /*
         * Already exists.
         */
        if (
            document.getElementById(
                HEADER_ICON_ID
            )
        ) {
            return true;
        }

        const header =
            document.getElementById(
                'header'
            );

        if (!header) {
            return false;
        }

        /*
         * This is the exact element from the CueScore markup
         * supplied:
         *
         * <a class="notif circle ...">
         */
        const notification =
            header.querySelector(
                'a.notif.circle'
            ) ||
            header.querySelector(
                'a.notif'
            );

        if (!notification) {
            return false;
        }

        const accountIcon =
            document.createElement('a');

        accountIcon.id =
            HEADER_ICON_ID;

        accountIcon.className =
            'circle';

        accountIcon.href =
            'javascript:void(0);';

        accountIcon.title =
            'Accounts';

        accountIcon.setAttribute(
            'aria-label',
            'CueScore accounts'
        );
        accountIcon.setAttribute("style", "background: linear-gradient(51deg, #91f310, transparent);");

        accountIcon.addEventListener(
            'click',
            event => {
                event.preventDefault();

                event.stopPropagation();

                renderModal();
            }
        );

        /*
         * Insert immediately after Notifications.
         */
        notification.insertAdjacentElement(
            'afterend',
            accountIcon
        );

        return true;
    }

    /*
     * =========================================================
     * Initialization
     * =========================================================
     */

    function init() {
        injectStyles();

        createHeaderIcon();

        /*
         * CueScore may rebuild the header after the userscript
         * has already run.
         *
         * Restore our icon if it disappears.
         */
        const observer =
            new MutationObserver(
                () => {
                    if (
                        !document.getElementById(
                            HEADER_ICON_ID
                        )
                    ) {
                        createHeaderIcon();
                    }
                }
            );

        observer.observe(
            document.body,
            {
                childList:
                    true,

                subtree:
                    true
            }
        );
    }

    /*
     * =========================================================
     * Start
     * =========================================================
     */

    if (
        document.readyState ===
        'loading'
    ) {
        document.addEventListener(
            'DOMContentLoaded',
            init,
            {
                once:
                    true
            }
        );
    } else {
        init();
    }

})();
