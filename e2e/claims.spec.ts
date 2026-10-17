import {test,expect} from '@playwright/test';
test('real compressed ciphertext lengths leak information even when AES-GCM checks pass',async({page})=>{
 await page.goto('./');await expect(page.locator('#compare')).toBeEnabled();await page.locator('#compare').click();
 await expect(page.locator('#status')).toContainText('LENGTH INFORMATION LEAKS');
 await expect(page.locator('#graph .barrow')).toHaveCount(4);
 await expect(page.locator('#auth')).toContainText('authenticated successfully');
 await expect(page.locator('#status')).toContainText('LENGTH INFORMATION LEAKS');
 await expect(page.locator('#readout')).toContainText('DUSK-FOX-7');
 await page.locator('#mode').selectOption('separated');await expect(page.locator('#graph .barrow')).toHaveCount(0);
 await page.locator('#compare').click();await expect(page.locator('#status')).toContainText('NO DISTINGUISHING LENGTH HERE');
 await page.locator('#mode').selectOption('none');await page.locator('#compare').click();await expect(page.locator('#status')).toContainText('NO DISTINGUISHING LENGTH HERE');
});
test('one genuine measurement cannot be reported as proof of length secrecy',async({page})=>{
 await page.goto('./');await expect(page.locator('#probe')).toBeEnabled();
 await page.locator('#probe').click();
 await expect(page.locator('#status')).toContainText('ONE SAMPLE');
 await expect(page.locator('#status')).not.toContainText('NO DISTINGUISHING LENGTH HERE');
 await expect(page.locator('#auth')).toContainText('authenticated successfully');
 await expect(page.locator('#readout')).toContainText('An outside observer learns only lengths');
});
test('invalid guess fails closed, never paints a successful stale verdict',async({page})=>{
 await page.goto('./');await expect(page.locator('#probe')).toBeEnabled();await page.locator('#guess').fill('xx<script>');await page.locator('#probe').click();await expect(page.locator('#status')).toContainText('Probe rejected');
});
