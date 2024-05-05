import puppeteer from "puppeteer";
import Bluebird from "bluebird";
import {
  Logger,
  currentRecordLog,
  getFileContent,
  textFiles,
  writeRes,
} from "./file";
import { convert } from "html-to-text";
import chalk from "chalk";
const waitFor = async (num: number, operation: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    let numCount = num / 1000;
    const time = setInterval(() => {
      console.log(operation, "---->", numCount--);
    }, 1000);
    setTimeout(() => {
      clearInterval(time);
      resolve();
    }, num);
  });
};
(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ devtools: true });

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(10000000);

  // Navigate the page to a URL
  await page.goto("https://chat.openai.com/");

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  // Wait and click on first result
  const loginBtn =
    "#__next > div.relative.z-0.flex.h-full.w-full.overflow-hidden > div.flex-shrink-0.overflow-x-hidden.bg-token-sidebar-surface-primary > div > div > div > div > nav > div:nth-child(2) > div.flex.flex-col.space-y-2 > button.btn.relative.btn-neutral";
  await page.waitForSelector(loginBtn);
  await page.click(loginBtn);

  // 登录
  await page.locator("#email-input").fill("jiaxinyu426855@gmail.com");
  await page
    .locator("#root > div > main > section > div.login-container > button")
    .click();
  // #password
  await page.locator("#password").fill("200231yujiaxin");
  // body > div.oai-wrapper > main > section > div > div > div > form > div.c45d6a94b > button
  await page.locator("button[type='submit']").click();
  // 等待人机验证
  await waitFor(15000, "等待验证操作");

  const createNewWindowRequestChatgpt = async (
    content: string[],
    filename: string
  ): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        await waitFor(2000, "创建一个新的窗口");
        // 创建一个新的窗口
        await page
          .locator(".-mr-2 div.bg-token-sidebar-surface-primary")
          .click();
        // 输入内容
        const text = content.filter((item) => Boolean(item)).join("");
        // await page.focus('textarea#prompt-textarea')
        // await page.keyboard.type(' ')
        await page.locator("#prompt-textarea").fill(" ");
        await waitFor(10000, "xxx");
        await page.$eval(
          "textarea#prompt-textarea",
          (el, text) => {
            el.value = text;
          },
          text
        );
        await waitFor(5000, "等待输入框文字输入完毕");
        const node = await page.$('button[data-testid="send-button');
        if (!node) {
          await page
            .locator('button[as="button"]')
            .filter((button) => !button.disabled)
            .click();
        } else {
          // 请求响应
          await page
            .locator('button[data-testid="send-button')
            .filter((button) => !button.disabled)
            .click();
        }

        // await waitFor(20000, '等待Chatgpt响应');
        await page.waitForSelector(
          'button:disabled[data-testid="send-button"]',
          { timeout: 0 }
        );

        await waitFor(5000, "只取第一个结果");
        // 只取第一个
        const innerHtml = await page.$eval(
          "div.markdown.prose",
          (element) => element.innerHTML
        );

        const textHTML = convert(innerHtml);
        console.log(textHTML, filename);
        writeRes(filename, textHTML);
        await page.$eval(
          "textarea#prompt-textarea",
          (el, text) => {
            el.value = "";
          },
          ""
        );
        await waitFor(10000, "准备进行下一轮");
        resolve();
      } catch (e) {
        console.log(e);
        reject(e);
      }
    });
  };
  const sum = textFiles.length
  let finished = 0
  console.log("当前已有", textFiles.length, "个文件");
  Bluebird.Promise.each(textFiles, (filePath, index) => {
    const fileName = filePath.split("/")[1];
    if (Object.values(currentRecordLog).includes(fileName)) {
      console.log("已完成", ++finished/sum * 100 + '%',fileName, "文件");

      return Promise.resolve();
    } else {
      console.log("正在完成", (sum - finished)/sum * 100 + '%',fileName, "文件");
      return getFileContent(filePath)
        .then((content) =>
          createNewWindowRequestChatgpt(content, fileName)
        )
        .then(() => {
          console.log("已完成", ++finished/sum * 100 + '%',fileName, "文件");
          return Logger(filePath);
        });
    }
  })
    .then(async () => {
      await browser.close();
    })
    .catch(() => {});

  //
})();
