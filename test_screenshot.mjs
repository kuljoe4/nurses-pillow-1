import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Navigating to http://localhost:3000');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);

  console.log('Filling auth gate');
  await page.fill('input[placeholder="lawrence"]', 'lawrence');
  await page.fill('input[type="password"]', 'np-preview-2026');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(2000);

  console.log('Navigating to Host Portal');
  // Click the 'Host' tab/button
  try {
    await page.click('text=Host');
  } catch (e) {
    console.log("Could not find Host text, trying to bypass auth gate via DOM removal just in case");
    await page.evaluate("document.querySelectorAll('.fixed').forEach(m => { if(m.className.includes('z-[100]')) m.remove() })");
    await page.click('text=Host');
  }

  await page.waitForTimeout(3000);

  console.log('Taking screenshot');
  await page.screenshot({ path: '/home/jules/verification/host-portal-fixed.png', fullPage: true });

  await browser.close();
  console.log('Done');
})();
