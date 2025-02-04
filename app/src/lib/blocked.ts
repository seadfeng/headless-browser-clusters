import { TRACKING_HOSTS } from "config";
import { Page } from "playwright";

export const needBlocked = async (page: Page) => {
  await page.route("**/*", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const resourceType = request.resourceType();

    const blockedTypes = ["image", "media", "stylesheet", "font"];

    const matchHost = (host: string, hostList: string[]) =>
      hostList.some(
        (allowedHost) =>
          host === allowedHost || host.endsWith(`.${allowedHost}`),
      );

    if (blockedTypes.includes(resourceType)) {
      route.abort("blockedbyclient");
      return;
    }

    if (resourceType === "script" && matchHost(url.hostname, TRACKING_HOSTS)) {
      route.abort("blockedbyclient");
      return;
    }
    route.continue();
  });
};

export const navigationBlocked = async (page: Page) => {
  await page.route("**/*", async (route) => {
    if (
      route.request().isNavigationRequest() &&
      route.request().url().includes("sei")
    ) {
      console.log("Blocked navigation to:", route.request().url());
      await route.abort();
    } else {
      await route.continue();
    }
  });
};
