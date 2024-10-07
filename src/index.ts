import puppeteer from "puppeteer-core";
import dotenv from "dotenv";

//@ts-ignore
import PCR from "puppeteer-chromium-resolver";
// @ts-ignore
import { onChange } from "./helpers/checkOnChange";
import { makeCurrentClassActivity } from "./helpers/makeCurrentClassActivity";

interface class_activity_pageType {
  [key: string]: {
    title: string | null;
    publish_date: string | null;
    due_date: string | null;
  }[];
}

dotenv.config();

(async () => {
  const stats = await PCR();
  const browser = await puppeteer.launch({
    headless: false, // set to false to see browser UI
    executablePath: stats.executablePath,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  console.log("Navigating to login page...");
  await page.goto(
      "https://login1.leb2.org/login?app_id=1&redirect_uri=https%3A%2F%2Fapp.leb2.org%2Flogin"
  );

  console.log("Typing username...");
  await page.type("#username", process.env.KMUTTID as string);

  console.log("Typing password...");
  await page.type("#password", process.env.PASSWORD as string);
  console.log("Waiting for 2 seconds before submitting...");
  await page.waitForTimeout(1000);
  console.log("Clicking submit button and waiting for navigation...");
  await Promise.all([
    page.click("button[type=submit]"),
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
  ]);

  console.log("Current URL after login:", page.url());
  console.log("Navigating to class page...");
  await page.goto(
      "https://app.leb2.org/class"
  );

  console.log("Getting class section...");
  const class_section = await page.evaluate(() => {
    return Array.from(
        document.querySelectorAll(
            'div[class="col-xs-12 col-md-6 col-lg-4 col-xl-3 whole-card "] > div'
        )
        //@ts-ignore
    ).map((item) => item.attributes["data-url"].value);
  });

  console.log("Total class", class_section);
  const class_activity = class_section.map((item) => {
    return item.replace("/checkAfterAccessClass", "/activity");
  });

  var prev_class_activity_page: class_activity_pageType = { 'GEN 121-5': [] };

  console.log(new Date().toLocaleTimeString());

  // do first-time check
  var class_activity_page: class_activity_pageType =
    await makeCurrentClassActivity(page, class_activity);
  onChange(class_activity_page, prev_class_activity_page);
  prev_class_activity_page = class_activity_page;

  // fetch every 20 minutes
  setInterval(async () => {
    console.log(new Date().toLocaleTimeString());
    var class_activity_page: class_activity_pageType =
      await makeCurrentClassActivity(page, class_activity);

    onChange(class_activity_page, prev_class_activity_page);

    prev_class_activity_page = class_activity_page;
  }, 1000 * 60 * 20);
})();
