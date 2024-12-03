const puppeteer = require('puppeteer');

async function takeScreenshot(url, filename, device = 'desktop') {
    const browser = await puppeteer.launch({ headless: false }); // Set to 'false' for debugging
    const page = await browser.newPage();

    // Set viewport and user agent based on device type
    if (device === 'desktop') {
        await page.setViewport({ width: 1660, height: 1080 });
    } else if (device === 'tablet') {
        await page.setViewport({ width: 800, height: 1280, isMobile: true });
    } else if (device === 'mobile') {
        await page.setViewport({ width: 375, height: 812, isMobile: true });
    }

    await page.goto(url, { waitUntil: 'networkidle0' });

    // Scroll down the page gradually with a delay between scrolls
    await autoScroll(page);

    // Use a longer delay after scrolling to ensure all content loads completely
    await new Promise(resolve => setTimeout(resolve, 3000));


    // Take a high-quality screenshot
    await page.screenshot({
        path: filename,
        type: 'png',
        fullPage: true
    });

    await browser.close();
    console.log(`Screenshot saved as ${filename} for ${device} view.`);
}

// Helper function to scroll gradually to the bottom
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 200; // Scroll by 200 pixels
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= document.body.scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 500); // Increased delay between scrolls for smoother loading
        });
    });
}

// Specify the URL, filename, and device type
const url = 'https://www.unifiedleadersretreat.com/';
const filename = 'unified-22.png';
const device = 'mobile';

takeScreenshot(url, filename, device)
    .catch(error => {
        console.error('Error taking screenshot:', error);
    });
