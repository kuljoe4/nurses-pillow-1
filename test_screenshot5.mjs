import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Navigating to http://localhost:3000');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(5000);

  console.log('Trying to remove auth gate z-[150]');
  await page.evaluate("document.querySelectorAll('.fixed').forEach(m => { if(m.className.includes('z-[100]') || m.className.includes('z-[150]')) m.remove() })");
  await page.waitForTimeout(1000);

  // Instead of navigating from home, try to mock the local storage state to simulate a logged-in user who is a host
  await page.evaluate(() => {
    localStorage.setItem('nursespillow_user', JSON.stringify({
      id: 1,
      email: 'host@example.com',
      username: 'host',
      isHostVerified: true,
      hasDirectDeposit: true,
      stripeConnectId: 'acct_123'
    }));
  });

  await page.reload();
  await page.waitForTimeout(3000);

  await page.evaluate("document.querySelectorAll('.fixed').forEach(m => { if(m.className.includes('z-[100]') || m.className.includes('z-[150]')) m.remove() })");
  await page.waitForTimeout(1000);

  console.log('Clicking on For Property Hosts tab');
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
  await page.screenshot({ path: '/home/jules/verification/host-portal-auth-fixed.png', fullPage: true });

  await browser.close();
  console.log('Done');
})();
