import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Navigating to http://localhost:3000');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(5000);

  console.log('Trying to remove auth gate');
  await page.evaluate("document.querySelectorAll('.fixed').forEach(m => { if(m.className.includes('z-[100]')) m.remove() })");
  await page.waitForTimeout(1000);

  console.log('Clicking on For Property Hosts tab');
  // Click the 'For Property Hosts' tab based on exact text
  try {
    await page.getByRole('button', { name: 'For Property Hosts', exact: true }).click();
    await page.waitForTimeout(2000);
    console.log('Clicking Enter Host Portal');
    await page.getByRole('button', { name: 'Enter Host Portal' }).click();
    await page.waitForTimeout(4000);
  } catch (e) {
    console.error(e);
  }

  console.log('Taking screenshot');
  await page.screenshot({ path: '/home/jules/verification/host-portal-fixed.png', fullPage: true });

  await browser.close();
  console.log('Done');
})();
