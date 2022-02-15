#!/usr/bin/env node
// build command cant be run with npm run build. Use npx and copy paste it from the package.json.
import chalk from "chalk";
import inquirer from "inquirer";
import figlet from "figlet";
import { createSpinner } from "nanospinner";
import puppeteer from "puppeteer";
import path from "path";

function welcome() {
  console.clear();
  console.log(
    chalk.yellowBright(
      figlet.textSync("Webpage\nto PDF\nConverter", {
        font: "Calvin S",
      })
    ) + "\n"
  );
}

async function askURL() {
  const data = await inquirer.prompt([
    {
      name: "URL",
      type: "input",
      message:
        "Enter the URL of the page to be converted (should be contain http(s)): ",
      default() {
        return null;
      },
      validate(value) {
        if (value === null)
          return "No input. Enter a URL or press Ctrl+C to exit";
        const pattern = new RegExp(
          /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i
        );
        if (!pattern.test(value))
          return `Entry not valid. Enter a valid URL or press Ctrl+C to exit ${pattern.test(
            value
          )}`;
        return true;
      },
    },
    {
      name: "filename",
      type: "input",
      message:
        "Enter the filename to be saved (a-z, A-Z, 0-9, -, _, no spaces or other special characters): ",
      default() {
        return "page";
      },
      validate(value) {
        const pattern = new RegExp(/^[a-zA-Z0-9_-]+$/g);
        if (!pattern.test(value)) return "Enter a valid filename";
        return true;
      },
    },
  ]);
  return data;
}

// function setHttp(link) {
//   if (link.search(/^http[s]?\:\/\//) == -1) {
//     link = "http://" + link;
//   }
//   return link;
// }

async function generatePDF(data) {
  const { URL, filename } = data;
  let spinner = createSpinner("Launching browser...").start();
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
    });
    spinner.success({ text: "Browser Opened" });
  } catch (error) {
    spinner.error({ text: "Failed to open browser. Try again." });
    process.exit(0);
  }

  spinner = createSpinner("Opening tab...").start();
  let webPage;
  try {
    webPage = await browser.newPage();
    spinner.success({ text: "New tab opened" });
  } catch (error) {
    spinner.error({ text: "Failed to open a new tab. Try again." });
    process.exit(0);
  }

  spinner = createSpinner("Opening URL...").start();
  try {
    await webPage.goto(URL, {
      waitUntil: "networkidle0",
    });
    spinner.success({ text: "URL loaded" });
  } catch (error) {
    spinner.error({ text: "Failed to open the URL. Try again." });
    process.exit(0);
  }

  spinner = createSpinner(
    "Converting page to PDF and saving to disk..."
  ).start();
  try {
    await webPage.pdf({
      path: path.join(process.cwd(), `${filename}.pdf`),
      printBackground: true,
      format: "A4",
    });
    spinner.success({
      text: `PDF saved at ${path.join(process.cwd(), `${filename}.pdf`)}`,
    });
  } catch (error) {
    spinner.error({
      text: "Failed to covert and save the PDF. Try again." + error,
    });
    process.exit(0);
  }
  await browser.close();
}

welcome();
const data = await askURL();
await generatePDF(data);
process.exit(0);
