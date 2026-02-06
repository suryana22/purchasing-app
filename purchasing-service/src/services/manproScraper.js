const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const COOKIE_FILE = path.join(process.cwd(), 'manpro_cookies.json');

class ScraperService {
    async loadSession(page) {
        if (fs.existsSync(COOKIE_FILE)) {
            try {
                const cookiesString = fs.readFileSync(COOKIE_FILE);
                const cookies = JSON.parse(cookiesString);
                if (cookies.length > 0) {
                    await page.setCookie(...cookies);
                    console.log(`[Scraper] Session loaded: ${cookies.length} cookies.`);
                }
            } catch (e) {
                console.warn('[Scraper] Failed to load cookies:', e.message);
            }
        }
    }

    async saveSession(page) {
        try {
            const cookies = await page.cookies();
            fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
            console.log(`[Scraper] Session saved: ${cookies.length} cookies.`);
        } catch (e) {
            console.warn('[Scraper] Failed to save cookies:', e.message);
        }
    }

    async scrapeManproPosition(url, username, password) {
        if (!url) throw new Error('URL is required');

        console.log(`[Scraper] Starting browser for: ${url}`);
        const browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        try {
            const page = await browser.newPage();
            await page.setViewport({ width: 1280, height: 800 });

            // 1. Try to load session first
            await this.loadSession(page);

            console.log(`[Scraper] Navigating to ${url}...`);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            console.log(`[Scraper] Navigation complete. URL: ${page.url()}`);

            // Check if we are on a login page
            let isLoginPage = await page.evaluate(() => {
                const hasPassword = !!document.querySelector('input[type="password"]');
                const titleHasLogin = document.title.toLowerCase().includes('login');
                const hasLoginText = document.body.innerText.toLowerCase().includes('login') || document.body.innerText.toLowerCase().includes('masuk');
                const hasSubmit = !!document.querySelector('button[type="submit"], input[type="submit"]');
                return hasPassword || (titleHasLogin && hasSubmit) || (hasLoginText && hasPassword);
            });

            console.log(`[Scraper] Is Login Page: ${isLoginPage} / Creds provided: ${username ? 'YES' : 'NO'}`);

            if (isLoginPage) {
                if (!username || !password) {
                    // Can't login, and session is apparently invalid.
                    // But maybe the user just wants public info if available? 
                    // Usually Manpro requires login. We'll warn but proceed to extract what we can (often nothing).
                    console.warn('[Scraper] Session expired/invalid and no credentials provided. Extraction may fail.');
                } else {
                    console.log('[Scraper] Session invalid or expired. Logging in...');

                    try {
                        await page.waitForSelector('input[type="password"]', { timeout: 10000 });

                        const userField = await page.$('input[type="text"], input[name="username"], input[name="email"], #username, #email, #user_email, #user_login');
                        if (userField) {
                            await userField.click({ clickCount: 3 });
                            await userField.press('Backspace');
                            await userField.type(username, { delay: 30 });
                        }

                        const passField = await page.$('input[type="password"], #password, #user_password');
                        if (passField) {
                            await passField.type(password, { delay: 30 });
                        }

                        console.log('[Scraper] Submitting login form...');
                        const submitBtn = await page.$('button[type="submit"], input[type="submit"], button.btn-primary, .btn-login, #login_button, .login-button');

                        if (submitBtn) {
                            await Promise.all([
                                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => { }),
                                submitBtn.click()
                            ]);
                        } else {
                            await page.keyboard.press('Enter');
                            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => { });
                        }

                        console.log(`[Scraper] Post-login URL: ${page.url()}`);

                        // Verify if login succeeded
                        isLoginPage = await page.evaluate(() => !!document.querySelector('input[type="password"]'));

                        if (!isLoginPage) {
                            await this.saveSession(page);
                        } else {
                            console.error('[Scraper] Login failed. Still on login page.');
                        }

                    } catch (loginErr) {
                        console.error('[Scraper] Login step failed:', loginErr.message);
                    }
                }
            } else {
                console.log('[Scraper] Session is valid. Skipping login.');
            }

            console.log(`[Scraper] Extracting content from: ${await page.title()} (${page.url()})`);
            // Wait for dynamic content
            await new Promise(r => setTimeout(r, 5000));

            const extraction = await page.evaluate(() => {
                const bodyText = document.body.innerText;
                const names = ['Yulisar Khiat', 'Eri Wijaya', 'Esa Setiawan', 'Suryana'];
                const closedIndicators = [
                    'status: closed', 'status dokumen: closed', 'dokumen ditutup',
                    'status : closed', 'status:closed', 'archive', '(closed)',
                    'disetujui direktur utama', 'selesai diproses', 'status: selesai',
                    'dokumen telah selesai', 'permohonan selesai'
                ];

                // Detection 1: Text search (more precise)
                let isClosed = false;
                const lowerText = bodyText.toLowerCase();

                // Expanded indicators based on common Manpro patterns
                const strictClosedIndicators = [
                    'status dokumen: closed', 'status dokumen : closed',
                    'status: closed', 'status : closed', 'status:closed',
                    'disetujui direktur utama', 'dokumen telah selesai', 'permohonan selesai',
                    'status: archive', 'status : archive', 'status:archive',
                    '(closed)', '[closed]', 'status: selesai', 'status : selesai'
                ];

                isClosed = strictClosedIndicators.some(indicator => lowerText.includes(indicator));

                // Detection 2: Badge/Label Search (Manpro specific)
                const badges = Array.from(document.querySelectorAll('.badge, .label, [class*="badge"], [class*="label"], .btn, span, strong, div, b'));

                // Helper to check if color is "greenish"
                const isGreenish = (colorStr) => {
                    const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                    if (!match) return false;
                    const [_, r, g, b] = match.map(Number);
                    // Green is significantly higher than red and blue, and has a minimum intensity
                    return g > r && g > b && g > 50;
                };

                const successBadge = badges.find(b => {
                    const t = b.innerText.toLowerCase().trim();
                    const words = ['closed', 'selesai', 'disetujui', 'approved', 'archive', 'finish', 'done', 'acc'];

                    // The text must contain one of our success words and be relatively short (to avoid big blocks)
                    if (t.length > 20 || !words.some(w => t === w || t.includes(w))) return false;

                    const style = window.getComputedStyle(b);
                    const bgColor = style.backgroundColor;
                    const textColor = style.color;
                    const borderColor = style.borderColor;

                    return isGreenish(bgColor) || isGreenish(textColor) || isGreenish(borderColor);
                });

                if (successBadge) {
                    isClosed = true;
                }

                // Additional Check: If it's literally "Closed" or "Selesai" in any prominent element, even without color
                if (!isClosed) {
                    const statusWords = ['status: closed', 'status : closed', 'status:closed', 'status: archive', 'status dokumen: closed'];
                    isClosed = statusWords.some(sw => lowerText.includes(sw));
                }

                // Detection 3: Robust Regex Search on Full Body Text
                // We search for the *last* occurrence of "Kepada : Name" or similar patterns
                // This is often more reliable than traversing complex DOM structures

                let targetAssignee = '';

                // Patterns to look for. We want to capture the name after the label.
                // Added various delimiters like :, -, or just space
                const regex = /(?:Kepada|Ditujukan Kepada|Next Process|Assigned To|Posisi Dokumen)\s*[:|-]?\s*([a-zA-Z0-9\.\, \(\)\-\']{3,50})/gi;

                let match;
                let lastFoundName = null;

                // Iterating to find the LAST match (most recent)
                while ((match = regex.exec(bodyText)) !== null) {
                    if (match[1] && match[1].trim().length > 2) {
                        lastFoundName = match[1].trim();
                        // Filter out common false positives if any (e.g. dates)
                        if (!lastFoundName.match(/(\d{2}:\d{2})|(\d{4}-\d{2})/)) {
                            // Valid name candidate
                        }
                    }
                }

                if (lastFoundName) {
                    // Cleanup trailing junk if the regex captured too much (e.g. newline or next label)
                    // Usually innerText handles newlines well, but regex might span if not careful.
                    // The regex [...] character set avoids newlines, so it should be safe and stop at end of line.
                    targetAssignee = lastFoundName;
                }

                // Fallback: If regex failed, try to finding the Last Mentioned Priority Actor in the text
                // This is a "dumb" fallback but can save us if the label is missing
                if (!targetAssignee) {
                    const actorPriority = [
                        'drg. Iing Ichsan Hanafi', 'Sekretaris Korporasi',
                        'Yulisar Khiat', 'Eri Wijaya', 'Esa Setiawan',
                        'Bagian Umum Rumah Tangga', 'Rumah Tangga', 'Rumga',
                        'Purchasing', 'Gudang', 'Warehouse', 'Keuangan', 'Finance',
                        'Suryana'
                    ];

                    // Search for the last occurrence of any actor
                    let maxIndex = -1;

                    for (const actor of actorPriority) {
                        const index = bodyText.lastIndexOf(actor);
                        if (index > maxIndex) {
                            maxIndex = index;
                            targetAssignee = actor;
                        }
                    }
                }

                const detectedName = targetAssignee || 'Pending';

                // Check if the detected name is actually one of our key actors to "normalize" it
                // e.g. "Esa Setiawan S.Kom" -> "Esa Setiawan" if we want strict mapping, 
                // but usually raw name is better.

                // Detection 4: Check for "Canceled" specific status - User Request
                // Look for badge "Canceled" and extract the reason/note below it
                let isCanceled = false;
                let cancelReason = '';

                const canceledBadge = Array.from(document.querySelectorAll('.badge, .label, span')).find(el =>
                    el.innerText.trim().toLowerCase() === 'canceled' ||
                    el.innerText.trim().toLowerCase() === 'cancelled'
                );

                if (canceledBadge) {
                    isCanceled = true;
                    isClosed = true; // Canceled implies closed

                    // Try to extract metadata: "Oleh [Name] At [Date] [Reason]"
                    // Usually they are in the same container or subsequent siblings
                    const container = canceledBadge.closest('div, td, li') || canceledBadge.parentElement;

                    if (container) {
                        const text = container.innerText;
                        // Format in screenshot: 
                        // Canceled
                        // Oleh Suryana
                        // At 22 Dec 2025 13:40
                        // Revisi Penawaran

                        // strategy: Split by "At [Date]"
                        // Regex to find "At <Date> <Time>"
                        // Date patterns: DD Mon YYYY HH:MM

                        const atRegex = /At\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s+\d{1,2}:\d{2}/i;
                        const parts = text.split(atRegex);

                        if (parts.length > 1) {
                            // The reason is usually the part AFTER the date
                            let reason = parts[1].trim();
                            // Cleanup
                            if (reason) cancelReason = reason;
                        }

                        // Fallback: just get the last line if regex fails
                        if (!cancelReason) {
                            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                            const lastLine = lines[lines.length - 1];
                            if (lastLine && !lastLine.includes('At ') && !lastLine.includes('Oleh ') && !lastLine.toLowerCase().includes('canceled')) {
                                cancelReason = lastLine;
                            }
                        }
                    }
                }

                return {
                    isClosed: !!isClosed,
                    detectedName,
                    htmlLength: bodyText.length,
                    isCanceled,
                    cancelReason
                };
            });

            // Debug screenshot to see what's happening
            await page.screenshot({ path: '/tmp/manpro_last_scrape.png' }).catch(() => { });

            console.log(`[Scraper] Extraction Result - Closed: ${extraction.isClosed}, Canceled: ${extraction.isCanceled}, Reason: ${extraction.cancelReason}, Position: ${extraction.detectedName}`);

            return {
                manpro_current_position: extraction.detectedName,
                manpro_is_closed: extraction.isClosed,
                manpro_is_canceled: extraction.isCanceled,
                manpro_cancel_reason: extraction.cancelReason
            };

        } catch (error) {
            console.error('[Scraper] Error during scraping:', error);
            throw error;
        } finally {
            console.log('[Scraper] Closing browser.');
            await browser.close();
        }
    }
    async createManproIssue(data, username, password, dryRun = true) {
        const { judul, kategori, prioritas, ditujukan_kepada, cc, deskripsi, tanggal_target, lampiran, lampiranName } = data;
        const fs = require('fs');
        const path = require('path');
        const puppeteer = require('puppeteer');

        console.log(`[Scraper] Creating new Manpro issue (DryRun: ${dryRun}): ${judul}`);

        const launchOptions = {
            headless: true,
            protocolTimeout: 300000, // Increase to 5 minutes
            pipe: true, // Use pipe instead of websocket for more stability
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-extensions',
                '--disable-component-update',
                '--disable-background-networking',
                '--disable-sync',
                '--disable-gpu'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
        };

        const browser = await puppeteer.launch(launchOptions);

        try {
            const page = await browser.newPage();
            page.setDefaultNavigationTimeout(120000);
            page.setDefaultTimeout(120000);
            await page.setViewport({ width: 1280, height: 1200 });

            // 1. Try to load session first
            await this.loadSession(page);

            console.log('[Scraper] Navigating to Manpro Issue Notice...');
            const baseUrl = 'https://manpro.systems/view/issue-notice';

            try {
                await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
            } catch (navErr) {
                console.warn('[Scraper] Initial navigation failed:', navErr.message);
            }

            // Check for 404 or Webuzo Error immediately
            const isErrorPage = await page.evaluate(() => {
                const text = document.body.innerText.toLowerCase();
                const title = document.title.toLowerCase();
                return title.includes('404') || text.includes('not found') || text.includes('webuzo');
            });

            if (isErrorPage) {
                console.log('[Scraper] Detected 404/Error Page. Session might be valid but URL is bad. Restarting navigation from Home...');
                await page.goto('https://manpro.systems/view/index', { waitUntil: 'networkidle2' });
            }

            const passwordField = await page.$('input[type="password"]');

            if (passwordField) {
                if (username && password) {
                    console.log('[Scraper] Session expired/invalid. Logging in...');
                    const userField = await page.$('input[type="text"], #username, #email');
                    if (userField) await userField.type(username);
                    await passwordField.type(password);
                    await Promise.all([
                        page.click('button[type="submit"], .btn-primary'),
                        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => { })
                    ]);
                    console.log(`[Scraper] Post-login URL: ${page.url()}`);

                    // Save session if successful and not still on login
                    if (!page.url().includes('login')) {
                        await this.saveSession(page);
                    }
                } else {
                    console.warn('[Scraper] Login required but no credentials provided.');
                }
            } else {
                console.log('[Scraper] Session appears valid (No login form).');
            }

            // FORCE NAVIGATION CHECK: If we are not on issue-notice (due to 404 redirect OR login redirect), perform manual nav
            if (!page.url().includes('issue-notice') || isErrorPage) {
                console.log('[Scraper] Not on Issue Notice list. Starting robust manual navigation flow...');

                // 1. Ensure we are at /view/index
                if (!page.url().includes('view/index')) {
                    await page.goto('https://manpro.systems/view/index', { waitUntil: 'networkidle2' });
                }

                // Helper to click by text
                const clickByText = async (text, type = 'item') => {
                    return await page.evaluate((t) => {
                        const elements = Array.from(document.querySelectorAll('a, span, div.folder-name, .folder-title, .item-name'));
                        const found = elements.find(el => el.innerText.trim().includes(t));
                        if (found) {
                            found.click();
                            return true;
                        }
                        return false;
                    }, text);
                };

                // 2. Click "Manajemen Rumah Sakit"
                console.log('[Scraper] Nav: Step 1 - Manajemen Rumah Sakit');
                let foundRS = await clickByText('Manajemen Rumah Sakit');
                if (!foundRS) {
                    console.log('[Scraper] Folder not found by text, trying to find any folder icon...');
                    await page.click('.fa-folder, .folder-icon').catch(() => { });
                    await new Promise(r => setTimeout(r, 1000));
                    foundRS = await clickByText('Manajemen Rumah Sakit');
                }
                await new Promise(r => setTimeout(r, 2000));

                // 3. Click "Departemen Teknologi Informasi"
                console.log('[Scraper] Nav: Step 2 - Departemen Teknologi Informasi');
                let foundIT = await clickByText('Departemen Teknologi Informasi');
                if (!foundIT) {
                    console.warn('[Scraper] Dept IT not found, waiting longer...');
                    await new Promise(r => setTimeout(r, 3000));
                    foundIT = await clickByText('Departemen Teknologi Informasi');
                }

                if (foundIT) {
                    console.log('[Scraper] Dept IT clicked, waiting for content load...');
                    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => { });
                } else {
                    console.warn('[Scraper] FB: Could not find Dept IT. Trying direct URL to Dept TI if possible...');
                    // Sometimes direct URL to dept works even if list fails
                    // But we'll try to find any "Isu" link first in the broad page
                }

                // 4. Click "Isu" tab/button
                console.log('[Scraper] Nav: Step 3 - Isu Tab');
                const isuClicked = await page.evaluate(() => {
                    const targets = Array.from(document.querySelectorAll('a, button, .nav-link')).filter(el => {
                        const txt = el.innerText.toLowerCase();
                        return (txt.includes('isu') || txt.includes('issue')) && !txt.includes('log');
                    });
                    if (targets.length > 0) {
                        // Priority to links with "issue-notice"
                        const best = targets.find(t => t.href && t.href.includes('issue-notice')) || targets[0];
                        best.click();
                        return true;
                    }
                    return false;
                });

                if (!isuClicked) {
                    console.log('[Scraper] Isu tab not found by click. Trying direct navigation to issue-notice...');
                    await page.goto('https://manpro.systems/view/issue-notice', { waitUntil: 'networkidle2' }).catch(() => { });
                } else {
                    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => { });
                }

                // Final check
                if (!page.url().includes('issue-notice')) {
                    console.warn('[Scraper] Still not on issue-notice, using direct jump as last resort...');
                    await page.goto('https://manpro.systems/view/issue-notice', { waitUntil: 'networkidle2' }).catch(() => { });
                }
            }


            // Take Debug Screenshot before seeking button
            // Save to 'debug_screenshots' folder in project root (mounted volume)
            const debugDir = process.env.SCRAPER_DEBUG_DIR || path.join(process.cwd(), 'debug_screenshots');
            if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });

            const preScreenshotPath = path.join(debugDir, 'manpro_pre_add_debug.png');
            await page.screenshot({ path: preScreenshotPath }).catch(() => { });
            console.log(`[Scraper] Pre-add Screenshot saved: ${preScreenshotPath} (URL: ${page.url()})`);

            // 2. Click Plus Button (+)
            console.log('[Scraper] Opening form...');
            const plusSelector = '[title*="Add Issue"], [data-original-title*="Add Issue"], .fa-plus-circle, .fa-plus, [title*="Tambah"], .btn-danger .fa-plus, a[href*="create"]';
            try {
                await new Promise(r => setTimeout(r, 4000)); // Wait more for list
                await page.waitForSelector(plusSelector, { timeout: 15000 });

                const clicked = await page.evaluate(() => {
                    // Strategy 1: Find by "Add Issue" title
                    const addIssueBtn = Array.from(document.querySelectorAll('a, button, i, span')).find(el => {
                        const title = (el.title || el.getAttribute('data-original-title') || '').toLowerCase();
                        return title.includes('add issue');
                    });
                    if (addIssueBtn) {
                        const clickTarget = (addIssueBtn.tagName === 'I' || addIssueBtn.tagName === 'SPAN') ? (addIssueBtn.closest('a, button') || addIssueBtn) : addIssueBtn;
                        clickTarget.click();
                        return true;
                    }

                    // Strategy 2: Find target color
                    const icons = Array.from(document.querySelectorAll('.fa-plus, .fa-plus-circle'));
                    const isTargetColor = (color) => {
                        return color.includes('255, 0, 0') || color.includes('rgb(243') ||
                            color.includes('rgb(220') || color.includes('rgb(231') ||
                            color.includes('rgb(240, 173, 78)');
                    };

                    const targetIcon = icons.find(i => {
                        const btn = i.closest('a, button');
                        if (!btn) return false;
                        const iconStyle = window.getComputedStyle(i);
                        const btnStyle = window.getComputedStyle(btn);
                        return isTargetColor(iconStyle.color) || isTargetColor(btnStyle.backgroundColor);
                    });

                    if (targetIcon) {
                        (targetIcon.closest('a, button') || targetIcon).click();
                        return true;
                    }
                    return false;
                });

                if (!clicked) {
                    await page.click(plusSelector);
                }
            } catch (err) {
                console.log('[Scraper] Plus button not found with standard selector, trying fallback based on chart icon sibling...');
                const clicked = await page.evaluate(() => {
                    // Try to find ANY chart/graph icon
                    const chartIcon = document.querySelector('.fa-chart-bar, .fa-bar-chart, .fa-line-chart, .fa-area-chart, .fa-signal');
                    if (chartIcon) {
                        // In Manpro, the buttons are usually siblings in a container
                        const container = chartIcon.closest('div, td, .btn-group, .pull-right, .float-right, .toolbar');
                        if (container) {
                            const plus = container.querySelector('.fa-plus, .fa-plus-circle');
                            if (plus) {
                                (plus.closest('a, button') || plus).click();
                                return true;
                            }
                        }
                    }

                    // Emergency: click the first orange-ish button in the header area
                    const orangeBtn = Array.from(document.querySelectorAll('a, button')).find(el => {
                        const bg = window.getComputedStyle(el).backgroundColor;
                        return bg.includes('243') || bg.includes('240') || bg.includes('220');
                    });
                    if (orangeBtn) {
                        orangeBtn.click();
                        return true;
                    }

                    return false;
                });
                if (!clicked) {
                    console.log('[Scraper] Emergency fallback. Trying pro_id detection...');
                    const currentUrl = page.url();
                    const proIdMatch = currentUrl.match(/pro_id=([^&#]+)/);
                    if (proIdMatch) {
                        const proId = proIdMatch[1];
                        console.log(`[Scraper] Found pro_id ${proId}, attempting direct create URL...`);
                        await page.goto(`https://manpro.systems/view/issue-notice-create?pro_id=${proId}`, { waitUntil: 'networkidle2' }).catch(() => { });
                    } else {
                        await page.goto('https://manpro.systems/view/issue-notice-create', { waitUntil: 'networkidle2' }).catch(() => { });
                    }
                }
            }

            // 3. Fill Form
            console.log('[Scraper] Filling fields...');

            // Wait for Form to be Ready (Vital for Fallback Navigation)
            try {
                console.log('[Scraper] Waiting for form inputs...');
                await page.waitForSelector('input, textarea, select', { visible: true, timeout: 20000 });
                // specific wait for title or description
                await Promise.race([
                    page.waitForSelector('input[name="title"]', { timeout: 5000 }).catch(() => null),
                    page.waitForSelector('#title', { timeout: 5000 }).catch(() => null),
                    page.waitForSelector('textarea', { timeout: 5000 }).catch(() => null)
                ]);
            } catch (waitErr) {
                console.warn('[Scraper] Warning: Form inputs not detected properly inside timeout. Screenshotting...');
            }

            // Take initial form screenshot
            const debugDirForForm = process.env.SCRAPER_DEBUG_DIR || path.join(process.cwd(), 'debug_screenshots');
            const initialFormPath = path.join(debugDirForForm, 'manpro_form_initial.png');
            await page.screenshot({ path: initialFormPath }).catch(() => { });
            console.log(`[Scraper] Initial form screenshot saved: ${initialFormPath}`);

            // A. Title
            console.log('[Scraper] Attempting to fill Title...');
            const titleSelector = 'input[name="title"], #title, input[placeholder="Judul"], input[placeholder*="Judul"]';
            let titleFilled = false;

            try {
                // Wait for any input to be visible first
                await page.waitForSelector('input', { timeout: 10000 }).catch(() => { });

                // Find the input that is best for Title
                const titleInput = await page.evaluateHandle(() => {
                    // Try exact match first
                    let el = document.querySelector('input[name="title"]') || document.querySelector('#title') || document.querySelector('input[placeholder="Judul"]');
                    if (el && el.offsetParent !== null) return el;

                    // Try looking for a label
                    const labels = Array.from(document.querySelectorAll('label'));
                    const titleLabel = labels.find(l => l.innerText.toLowerCase().includes('judul'));
                    if (titleLabel && titleLabel.control) return titleLabel.control;
                    if (titleLabel) {
                        const nextInput = titleLabel.parentElement.querySelector('input');
                        if (nextInput) return nextInput;
                    }

                    // Fallback to first text input that isn't hidden
                    return Array.from(document.querySelectorAll('input[type="text"]'))
                        .find(i => i.offsetParent !== null && !i.readOnly && !i.disabled);
                });

                if (titleInput && titleInput.asElement()) {
                    const el = titleInput.asElement();
                    await el.focus();
                    await el.click({ clickCount: 3 });
                    await page.keyboard.press('Backspace');
                    await page.keyboard.type(judul, { delay: 50 });

                    // Verify
                    const val = await page.evaluate(el => el.value, el);
                    console.log(`[Scraper] Title value after typing: "${val}"`);
                    if (val && val.trim().toLowerCase() === judul.trim().toLowerCase()) {
                        titleFilled = true;
                    } else {
                        console.log('[Scraper] Title mismatch or empty after typing, falling back to injection');
                    }
                }
            } catch (e) {
                console.log('[Scraper] Standard title fill failed:', e.message);
            }

            if (!titleFilled) {
                console.log('[Scraper] Title primary fail or mismatch, using aggressive EVAL injection...');
                try {
                    titleFilled = await page.evaluate((t) => {
                        const findTitleEl = () => {
                            // 1. Direct selectors
                            let el = document.querySelector('input[name="title"]') ||
                                document.querySelector('#title') ||
                                document.querySelector('input[placeholder="Judul"]') ||
                                document.querySelector('input[placeholder*="Judul"]');
                            if (el && el.offsetParent !== null) return el;

                            // 2. Label based
                            const labels = Array.from(document.querySelectorAll('label'));
                            const titleLabel = labels.find(l => l.innerText.toLowerCase().includes('judul'));
                            if (titleLabel) {
                                if (titleLabel.control) return titleLabel.control;
                                const parent = titleLabel.closest('div, td, tr, .form-group');
                                if (parent) {
                                    const input = parent.querySelector('input[type="text"]');
                                    if (input) return input;
                                }
                            }

                            // 3. Any visible text input that's likely (not a search box)
                            return Array.from(document.querySelectorAll('input[type="text"]'))
                                .find(i => i.offsetParent !== null &&
                                    !i.readOnly &&
                                    !i.disabled &&
                                    !i.className.includes('search') &&
                                    !i.className.includes('select2'));
                        };

                        const el = findTitleEl();
                        if (el) {
                            el.value = t;
                            el.dispatchEvent(new Event('input', { bubbles: true }));
                            el.dispatchEvent(new Event('change', { bubbles: true }));
                            el.dispatchEvent(new Event('blur', { bubbles: true }));
                            // Trigger vendor-specific events if needed
                            if (window.jQuery) {
                                window.jQuery(el).trigger('input').trigger('change').trigger('blur');
                            }
                            return true;
                        }
                        return false;
                    }, judul);
                } catch (e) {
                    console.error('[Scraper] Eval injection also failed:', e.message);
                }
            }

            // Double check verification with a small delay
            await new Promise(r => setTimeout(r, 1000));
            const finalTitleVal = await page.evaluate((judulVal) => {
                const els = Array.from(document.querySelectorAll('input[type="text"]')).filter(i => i.offsetParent !== null);
                const found = els.find(el => el.value === judulVal);
                return found ? found.value : (els.length > 0 ? els[0].value : 'NO_INPUTS');
            }, judul);
            console.log(`[Scraper] Final Title Value Check: "${finalTitleVal}"`);

            if ((!finalTitleVal || finalTitleVal === 'NO_INPUTS' || finalTitleVal.trim() === '') && !dryRun) {
                // In real run, empty title is fatal
                throw new Error('FATAL: Gagal mengisi kolom Judul. Kolom masih kosong saat divalidasi.');
            }

            // B. THE BULLETPROOF DROPDOWN HELPER (Force Click)
            const fillManproDropdown = async (selector, value, label, extraWait = 1500) => {
                if (!value) return;
                console.log(`[Scraper] -> Filling ${label}: ${value}`);
                try {
                    const actualSelector = selector;

                    await page.evaluate((sel) => {
                        const el = document.querySelector(sel);
                        if (el) el.scrollIntoView({ behavior: 'auto', block: 'center' });
                    }, actualSelector);
                    await new Promise(r => setTimeout(r, 500));

                    const libType = await page.evaluate((sel) => {
                        const el = document.querySelector(sel);
                        if (!el) return 'none';
                        if (el.style.display !== 'none' && el.offsetParent !== null) return 'standard';
                        const next = el.nextElementSibling;
                        if (next && next.classList.contains('chosen-container')) return 'chosen';
                        if (next && next.classList.contains('select2-container')) return 'select2';
                        return 'unknown';
                    }, actualSelector);

                    if (libType === 'chosen') {
                        // CHOSEN LOGIC
                        await page.evaluate((sel) => {
                            const container = document.querySelector(sel).nextElementSibling;
                            if (container) {
                                const trigger = container.querySelector('a.chosen-single') || container.querySelector('ul.chosen-choices');
                                if (trigger) trigger.click();
                            }
                        }, actualSelector);

                        await new Promise(r => setTimeout(r, 1000));

                        const sBox = await page.$(`${actualSelector} + .chosen-container input`);
                        if (sBox) {
                            await sBox.focus();

                            // Clean Input
                            await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control');
                            await page.keyboard.press('Backspace');
                            await new Promise(r => setTimeout(r, 200));

                            // Type
                            const typeValue = value.charAt(0).toUpperCase() + value.slice(1);
                            await page.keyboard.type(typeValue, { delay: 100 });

                            console.log(`[Scraper]    Waiting 5 seconds for results (User Request)...`);
                            await new Promise(r => setTimeout(r, 5000));

                            // FORCE CLICK with Mouse Events
                            const result = await page.evaluate((val) => {
                                // Select all active results
                                const results = Array.from(document.querySelectorAll('.chosen-results li.active-result, .chosen-drop li.active-result'));

                                // Strategy: Prefer exact match, then contains, then just the first valid one
                                let target = results.find(r => r.innerText.trim().toLowerCase() === val.trim().toLowerCase());
                                if (!target) target = results.find(r => r.innerText.toLowerCase().includes(val.toLowerCase()));
                                if (!target && results.length > 0) target = results[0];

                                if (target) {
                                    // Robust Click Sequence
                                    target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                                    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                                    target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                                    target.click();
                                    return { success: true, text: target.innerText };
                                }
                                return { success: false, count: results.length };
                            }, value);

                            if (result.success) {
                                console.log(`[Scraper]    Clicked Chosen result: ${result.text}`);
                            } else {
                                console.log(`[Scraper]    No results found after 5s wait for ${value}. Found ${result.count} options.`);
                                // Emergency Enter
                                await page.keyboard.press('Enter');
                            }
                        }

                    } else if (libType === 'select2') {
                        // SELECT2
                        const isMulti = await page.evaluate((sel) => document.querySelector(sel).multiple, actualSelector);
                        await page.evaluate((sel, multi) => {
                            const c = document.querySelector(sel).nextElementSibling;
                            const t = multi ? (c.querySelector('.select2-search__field') || c) : c.querySelector('.select2-selection');
                            if (t) t.click();
                        }, actualSelector, isMulti);
                        await new Promise(r => setTimeout(r, 800));
                        let sBox;
                        if (isMulti) sBox = await page.$(`${actualSelector} + .select2-container .select2-search__field`);
                        else sBox = await page.waitForSelector('.select2-container--open .select2-search__field, .select2-dropdown .select2-search__field', { timeout: 2000 }).catch(() => null);
                        if (sBox) {
                            await sBox.focus();
                            await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace');
                            await page.keyboard.type(value, { delay: 100 });
                            console.log(`[Scraper]    Waiting 5 seconds for Select2 results...`);
                            await new Promise(r => setTimeout(r, 5000));

                            // Explicit click for Select2 as well
                            await page.evaluate(() => {
                                const opt = document.querySelector('.select2-results__option--highlighted') || document.querySelector('.select2-results__option');
                                if (opt) {
                                    opt.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                                    opt.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                                    opt.click();
                                }
                            });
                            await page.keyboard.press('Enter'); // Backup
                        }

                    } else {
                        // STANDARD SELECT
                        await page.evaluate((sel, val) => {
                            const el = document.querySelector(sel);
                            if (el) {
                                const options = Array.from(el.options);
                                const opt = options.find(o => o.text.toLowerCase().includes(val.toLowerCase()) || o.value === val);
                                if (opt) {
                                    opt.selected = true;
                                    el.value = opt.value;
                                    el.dispatchEvent(new Event('change', { bubbles: true }));
                                    el.dispatchEvent(new Event('input', { bubbles: true }));
                                }
                            }
                        }, actualSelector, value).catch(() => { });
                    }

                } catch (e) {
                    console.log(`[Scraper] Error filling ${label}: ${e.message}`);
                }
            };
            // C. Fill Meta Fields
            // Optimized delays with Hybrid Library Support
            if (kategori) await fillManproDropdown('#category-issue', kategori, 'Category', 2000);
            if (prioritas) await fillManproDropdown('#issue-priority', prioritas, 'Priority', 1000);
            if (ditujukan_kepada) await fillManproDropdown('#space', ditujukan_kepada, 'Recipient', 10000);
            if (cc) await fillManproDropdown('#issue-cc', cc, 'CC', 3000);

            // D. Date Field (Tanggal Target)
            if (tanggal_target) {
                console.log(`[Scraper] Filling Target Date: ${tanggal_target}`);
                try {
                    // Convert YYYY-MM-DD to DD Mon YYYY (e.g. 12 Feb 2026)
                    const dateObj = new Date(tanggal_target);
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const month = months[dateObj.getMonth()];
                    const year = dateObj.getFullYear();
                    const formattedDate = `${day} ${month} ${year}`; // "05 Feb 2026"

                    console.log(`[Scraper]    Formatted Date: ${formattedDate}`);

                    const dateSelector = 'input[name="target_date"], .input-target_date';

                    await page.evaluate((sel, val) => {
                        // 1. Try jQuery Datepicker API (Most reliable for Manpro/Legacy apps)
                        if (window.jQuery && window.jQuery(sel).datepicker) {
                            window.jQuery(sel).datepicker('setDate', val);
                            return;
                        }

                        // 2. Fallback: Direct Input
                        const el = document.querySelector(sel);
                        if (el) {
                            el.removeAttribute('readonly'); // Unlock
                            el.value = val;
                            el.dispatchEvent(new Event('input', { bubbles: true }));
                            el.dispatchEvent(new Event('change', { bubbles: true }));
                            el.dispatchEvent(new Event('blur', { bubbles: true }));
                        }
                    }, dateSelector, formattedDate);

                } catch (e) {
                    console.log('[Scraper] Date error:', e.message);
                }
            }

            // E. DESCRIPTION (Hyper Injection)
            console.log('[Scraper] Filling Description...');
            try {
                // Wait briefly for editor components
                await new Promise(r => setTimeout(r, 1000));

                const methodResult = await page.evaluate((text) => {
                    const html = text.replace(/\n/g, '<br>');
                    let m = 'none';

                    // 1. CKEditor JS API
                    if (window.CKEDITOR && window.CKEDITOR.instances) {
                        for (let key in window.CKEDITOR.instances) {
                            window.CKEDITOR.instances[key].setData(html);
                            m = 'CKEDITOR_API';
                        }
                    }

                    // 2. Summernote JS API
                    if (m === 'none' && window.jQuery && window.jQuery.fn && window.jQuery.fn.summernote) {
                        window.jQuery('.note-editable').summernote('code', html);
                        m = 'SUMMERNOTE_API';
                    }

                    // 3. Iframe/Direct DOM Search
                    if (m === 'none') {
                        const frames = document.querySelectorAll('iframe');
                        for (let f of frames) {
                            try {
                                const d = f.contentDocument || f.contentWindow.document;
                                if (d.body.contentEditable === 'true' || d.body.classList.contains('cke_editable')) {
                                    d.body.innerHTML = html;
                                    m = 'IFRAME_DOM';
                                }
                            } catch (e) { }
                        }
                    }

                    // 4. Fallback DOM
                    if (m === 'none') {
                        const fall = document.querySelector('.cke_editable, .note-editable, [contenteditable="true"]');
                        if (fall) {
                            fall.innerHTML = html;
                            m = 'FALLBACK_DOM';
                        } else {
                            const area = document.querySelector('textarea[name="description"], #description');
                            if (area) {
                                area.value = text;
                                m = 'FALLBACK_TEXTAREA';
                            }
                        }
                    }
                    return m;
                }, deskripsi);

                console.log(`[Scraper] Description filled via: ${methodResult}`);
                await new Promise(r => setTimeout(r, 1000));
            } catch (e) {
                console.log('[Scraper] Description Error:', e.message);
            }

            // Attachment Upload
            if (lampiran && lampiranName) {
                console.log(`[Scraper] Uploading ${lampiranName}...`);
                try {
                    const base64Data = lampiran.split(',')[1];
                    const tmpPath = path.join('/tmp', lampiranName);
                    fs.writeFileSync(tmpPath, base64Data, { encoding: 'base64' });

                    // Find the most likely file input
                    const fileInput = await page.$('input[type="file"]');
                    if (fileInput) {
                        await fileInput.uploadFile(tmpPath);

                        // Force UI Refresh (some frameworks need this)
                        await page.evaluate(() => {
                            const input = document.querySelector('input[type="file"]');
                            if (input) {
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                            // If Dropzone.js is used
                            if (window.Dropzone) {
                                window.Dropzone.instances.forEach(dz => {
                                    // Dropzone usually handles it, but we can try to force processing
                                    dz.processQueue();
                                });
                            }
                        });

                        console.log('[Scraper] File attached and events triggered.');
                        await new Promise(r => setTimeout(r, 2000)); // Wait for upload preview
                    } else {
                        console.log('[Scraper] No file input found for attachment.');
                    }
                } catch (uploadErr) {
                    console.error('[Scraper] Upload error:', uploadErr.message);
                }
            }

            // Take Debug Screenshot - save to app dir for visibility
            const postFillDir = process.env.SCRAPER_DEBUG_DIR || path.join(process.cwd(), 'debug_screenshots');
            const screenshotPath = path.join(postFillDir, 'manpro_post_fill_debug.png');
            await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => { });
            console.log(`[Scraper] Post-fill Screenshot saved: ${screenshotPath}`);

            if (dryRun) {
                console.log('[Scraper] Dry Run: Success.');
                return { url: 'Dry Run Mode: Dokumen berhasil disimulasikan (cek screenshot)', isDryRun: true };
            }

            // 4. Submit
            console.log('[Scraper] Submitting form...');
            const submitSelectors = [
                'button[type="submit"]',
                '.btn-submit',
                '#submit_btn',
                'button.btn-warning',
                'button.btn-danger',
                'input[type="submit"]',
                '.modal-footer .btn-primary'
            ];

            const submitClicked = await page.evaluate((selectors) => {
                for (let sel of selectors) {
                    const btn = document.querySelector(sel);
                    if (btn && btn.offsetParent !== null && (btn.innerText.toLowerCase().includes('submit') || (btn.value && btn.value.toLowerCase().includes('submit')))) {
                        btn.click();
                        return true;
                    }
                }
                // Fallback to any button with "Submit" text in the modal
                const modal = document.querySelector('.modal-dialog, .modal-content, #modal-default');
                const container = modal || document;
                const anySubmit = Array.from(container.querySelectorAll('button, input[type="button"], input[type="submit"]'))
                    .find(b => b.innerText.toLowerCase().includes('submit') || (b.value && b.value.toLowerCase().includes('submit')));
                if (anySubmit) {
                    anySubmit.click();
                    return true;
                }
                return false;
            }, submitSelectors);

            if (!submitClicked) {
                console.warn('[Scraper] Could not find submit button by standard selectors, trying one more aggressive click...');
                await page.click('button[type="submit"], .btn-submit, #submit_btn').catch(() => { });
            }

            // Wait a bit and check for validation errors
            await new Promise(r => setTimeout(r, 2000));
            const hasError = await page.evaluate(() => {
                const errorElements = Array.from(document.querySelectorAll('.text-danger, .error, .help-block-error, .invalid-feedback, [style*="red"]'));
                const errorVisible = errorElements.find(el => el.offsetParent !== null && el.innerText.trim().length > 0);
                if (errorVisible) return errorVisible.innerText;

                // Specific for Manpro "Must not be empty" pink box
                const pinkBox = document.querySelector('div[style*="background-color: rgb(255, 235, 238)"], .alert-danger');
                if (pinkBox && pinkBox.offsetParent !== null) return pinkBox.innerText;

                return null;
            });

            if (hasError) {
                console.error(`[Scraper] Validation Error detected after submit: "${hasError}"`);
                // Take error screenshot
                const errScreenshotPath = path.join(process.cwd(), 'debug_screenshots', 'manpro_submit_error.png');
                await page.screenshot({ path: errScreenshotPath, fullPage: true }).catch(() => { });

                // If the error is "Must not be empty", let's try to re-fill and re-submit once more if possible, 
                // but for now let's just throw to let the user know exactly what happened.
                throw new Error(`Manpro Validation Error: ${hasError}. Please check the screenshot at ${errScreenshotPath}`);
            }

            // Wait for navigation or redirect
            console.log('[Scraper] Waiting for redirection after submit...');
            try {
                // Wait up to 30s for the URL to change to a view page
                await page.waitForFunction(() =>
                    window.location.href.includes('issue-notice-view') ||
                    (window.location.href.includes('view/issue-notice') && !window.location.href.includes('create')),
                    { timeout: 30000 }
                );
                console.log('[Scraper] Detected URL change:', page.url());
            } catch (navErr) {
                console.log('[Scraper] Redirect timeout or not detected, proceed to check current page and then list page.');
            }

            // 5. Check if we are already on the view page
            let issueUrl = null;
            if (page.url().includes('issue-notice-view')) {
                issueUrl = page.url();
                console.log('[Scraper] Success! Landed directly on view page:', issueUrl);
            }

            if (!issueUrl) {
                // 6. Navigate to Issue Notice (List Page) if not already there
                if (!page.url().includes('view/issue-notice') || page.url().includes('create')) {
                    console.log('[Scraper] Navigating to List Page for verification...');
                    await page.goto('https://manpro.systems/view/issue-notice', { waitUntil: 'networkidle2', timeout: 60000 });
                }

                // Wait for table to load
                await page.waitForSelector('table', { timeout: 30000 }).catch(() => console.log('[Scraper] Table not found immediately.'));
                await new Promise(r => setTimeout(r, 2000)); // Extra wait for data

                // SCREENSHOT LIST PAGE
                const listPath = path.join(process.cwd(), 'debug_screenshots', 'manpro_list_debug.png');
                await page.screenshot({ path: listPath }).catch(() => { });
                console.log(`[Scraper] List page screenshot saved: ${listPath}`);

                // 7. Extract URL from List
                console.log(`[Scraper] Searching for issue with title: ${judul}`);

                issueUrl = await page.evaluate((searchTitle) => {
                    const rows = Array.from(document.querySelectorAll('tbody tr'));

                    // Cleanup search title (sometimes titles in table are simplified or have timestamps)
                    const cleanSearch = searchTitle.trim().toLowerCase();

                    // Strategy 1: Look for exact or partial match in row text
                    let targetRow = rows.find(r => r.innerText.toLowerCase().includes(cleanSearch));

                    // Strategy 2: If long title, try searching for key components (e.g. PO number)
                    if (!targetRow) {
                        const poMatch = searchTitle.match(/PO-\d+/);
                        if (poMatch) {
                            targetRow = rows.find(r => r.innerText.includes(poMatch[0]));
                        }
                    }

                    // Strategy 3: Just look for the MOST RECENT row if the title is very long and might be truncated
                    if (!targetRow && rows.length > 0) {
                        // In Manpro, the first row (after header) is usually the newest
                        // We check if it's "New" or created "Just Now"
                        const firstRow = rows[0];
                        if (firstRow && (firstRow.innerText.includes('Just now') || firstRow.innerText.includes('Baru saja') || firstRow.innerText.includes('06 Feb 2026'))) {
                            targetRow = firstRow;
                        }
                    }

                    if (targetRow) {
                        // 1. Check for Chain Icon Span (Data-Href)
                        const linkSpan = targetRow.querySelector('.mpo-icon-chain, .share-link[data-href]');
                        if (linkSpan && linkSpan.getAttribute('data-href')) {
                            return linkSpan.getAttribute('data-href');
                        }

                        // 2. Check for any link containing issue-notice-view
                        const viewLink = Array.from(targetRow.querySelectorAll('a')).find(a => a.href.includes('issue-notice-view'));
                        if (viewLink) return viewLink.href;

                        // 3. Check for Link Icon (FA)
                        const linkIcon = targetRow.querySelector('.fa-link, .fa-chain');
                        if (linkIcon && linkIcon.closest('a')) return linkIcon.closest('a').href;

                        // 4. Check for the ID link (column 1 usually)
                        const idLink = targetRow.querySelector('a.issue-link');
                        if (idLink) return idLink.href;
                    }
                    return null;
                }, judul);
            }

            console.log(`[Scraper] Extracted URL: ${issueUrl || 'NOT FOUND'}`);

            if (!issueUrl) {
                // Last ditch effort: if we are on list page, just return the list page URL with a note, 
                // OR throw error to let user know it might have been created but we can't find the link.
                throw new Error('Gagal mengekstrak URL dari dokumen yang baru dibuat. Silakan periksa daftar dokumen Manpro secara manual.');
            }

            return { url: issueUrl, isDryRun: false };

        } catch (error) {
            console.error('[Scraper] Error:', error);
            throw error;
        } finally {
            await browser.close();
        }
    }
}

module.exports = new ScraperService();
