const puppeteer = require('puppeteer');
require('dotenv').config();

const captureOrderTracking = async (orderNumber) => {
    // We fetch credentials from the master-data-service instead of env
    let manproUrl = process.env.MANPRO_URL || 'https://manpro.id';
    let username = '';
    let password = '';

    try {
        const masterDataApi = process.env.MASTER_DATA_API || 'http://master-data-service:4001';
        // We'll use a fetch-like approach or direct integration
        // For simplicity in this microservice environment, assuming we can call the internal API
        const response = await fetch(`${masterDataApi}/api/settings`);
        if (response.ok) {
            const settings = await response.json();
            const urlSetting = settings.find(s => s.key === 'manpro_url');
            const userSetting = settings.find(s => s.key === 'manpro_username');
            const passSetting = settings.find(s => s.key === 'manpro_password');
            if (urlSetting) manproUrl = urlSetting.value;
            if (userSetting) username = userSetting.value;
            if (passSetting) password = passSetting.value;
        }
    } catch (err) {
        console.warn('Could not fetch settings from API, falling back to env:', err.message);
        username = process.env.MANPRO_USER;
        password = process.env.MANPRO_PASSWORD;
    }

    if (!username || !password) {
        throw new Error('Manpro credentials (username/password) are not set in the system configuration.');
    }

    const browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        console.log(`Navigating to ${manproUrl}...`);
        await page.goto(manproUrl, { waitUntil: 'networkidle2' });

        // --- Mock Login Logic (Requires actual selector to be correct) ---
        // TODO: Update these selectors when user provides them
        console.log('Attempting login...');
        const userSelector = 'input[name="username"], input[type="text"], #username';
        const passSelector = 'input[name="password"], input[type="password"], #password';
        const submitSelector = 'button[type="submit"], .btn-login';

        await page.waitForSelector(userSelector, { timeout: 10000 });
        await page.type(userSelector, username);
        await page.type(passSelector, password);
        await page.click(submitSelector);

        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log('Login successful');

        // --- Mock Search Logic ---
        // TODO: Update this logic when user provides it
        // Example: Search for order number in a search box
        console.log(`Searching for order: ${orderNumber}`);
        const searchSelector = 'input[name="search"], .search-box';
        await page.waitForSelector(searchSelector, { timeout: 10000 });
        await page.type(searchSelector, orderNumber);
        await page.keyboard.press('Enter');

        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        // --- Screenshot Logic ---
        // Take a screenshot of the whole page or a specific selector
        console.log('Taking screenshot...');
        const screenshot = await page.screenshot({ fullPage: true });

        console.log('Capture finished');
        return screenshot;

    } catch (error) {
        console.error('Capture error:', error);
        throw error;
    } finally {
        await browser.close();
    }
};

module.exports = { captureOrderTracking };
