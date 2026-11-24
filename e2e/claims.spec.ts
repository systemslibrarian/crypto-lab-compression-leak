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

test('a reset retires the explanation, byte readout, and an in-flight result', async ({ page }) => {
  await page.goto('./');
  await page.locator('#mode').selectOption('none');
  await page.locator('#probe').click();
  await expect(page.locator('#status')).toContainText('ONE SAMPLE');
  await expect(page.locator('#readout')).toContainText('bytes');
  await page.locator('#restart').click();
  await expect(page.locator('#learning')).toHaveText('No verified measurement for the current settings.');
  await expect(page.locator('#readout')).toBeEmpty();
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('#probe')!.click();
    document.querySelector<HTMLButtonElement>('#restart')!.click();
  });
  await expect(page.locator('#probe')).toBeEnabled();
  await expect(page.locator('#status')).toContainText('Reset complete');
  await expect(page.locator('#auth')).toHaveText('Not tested');
  await expect(page.locator('#graph')).toContainText('No probes yet.');
  await expect(page.locator('#readout')).toBeEmpty();
});

test('an inconsistent round trip cannot receive an authenticated verdict', async ({ page }) => {
  await page.goto('./');
  await page.locator('#mode').selectOption('none');
  await page.evaluate(() => {
    // Simulate a faulty provider returning bytes different from the encrypted message.
    const decrypt = crypto.subtle.decrypt.bind(crypto.subtle);
    crypto.subtle.decrypt = async (...args: Parameters<SubtleCrypto['decrypt']>) => {
      const plain = new Uint8Array(await decrypt(...args));
      plain[0] ^= 1;
      return plain.buffer;
    };
  });
  await page.locator('#probe').click();
  await expect(page.locator('#status')).toContainText('could not be verified');
  await expect(page.locator('#auth')).toHaveText('No verified measurement');
  await expect(page.locator('#graph')).toContainText('No probes yet.');
  await expect(page.locator('#readout')).toBeEmpty();
});
