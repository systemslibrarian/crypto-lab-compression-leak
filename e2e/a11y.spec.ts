import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('real interactive states pass axe WCAG A/AA and keyboard access at two widths',async({page})=>{
  for(const width of [1280,390]){
    await page.setViewportSize({width,height:850});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('./');
    await expect(page.locator('#workbench h2').first()).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.scripture-footer')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    expect(audit.violations).toEqual([]);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(()=>document.activeElement?.tagName==='A'||document.activeElement?.tagName==='BUTTON')).toBe(true);
  }
});
