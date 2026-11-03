import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 450, height: 812 } });
  const page = await context.newPage();

  await page.goto('http://localhost:3000/');

  const unlockBtn = await page.$('text=Unlock Preview');
  if (unlockBtn) await unlockBtn.click();
  const clientReviewBtn = await page.$('text=Client Review Access');
  if (clientReviewBtn) await clientReviewBtn.click();

  await page.waitForTimeout(1000);

  const menuBtn = page.locator('button[aria-label="Open mobile navigation menu"]');
  await menuBtn.click();
  await page.waitForTimeout(1000);

  // Let's examine the DOM tree for the mobile drawer
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync('/home/jules/verification/body.html', bodyHTML);

  await browser.close();
})();
