import { Page } from "playwright";

/**
 *
 * Recaptcha Try to pass
 *
 * @param page
 * @returns
 */
export const googleRecaptcha = async (page: Page) => {
  console.info("Recaptcha", "Try to pass");
  const iframe = page.locator('iframe[title="reCAPTCHA"]');
  const frameLocator = iframe.contentFrame();
  const checkbox = frameLocator.locator(".recaptcha-checkbox");

  if ((await checkbox.count()) > 0) {
    await checkbox.waitFor({ state: "visible", timeout: 8000 });
    await checkbox.scrollIntoViewIfNeeded();

    await checkbox.click();
    await frameLocator
      .locator(".recaptcha-checkbox-loading")
      .waitFor({ state: "visible", timeout: 8000 });
    await frameLocator
      .locator(".recaptcha-checkbox-loading")
      .waitFor({ state: "detached", timeout: 8000 });

    const imageselect = page.locator(".g-recaptcha-bubble-arrow"); // iframe #rc-imageselect

    if ((await imageselect.count()) > 0) {
      return true;
    } else {
      return false;
    }
  }
};
