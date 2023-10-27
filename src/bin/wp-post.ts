#!/usr/bin/env node

const fs = require("fs");
const { program } = require("commander");
import inquirer, { Answers } from "inquirer";

import { wppostAync } from "../index";

// import WPPost, { WPPostOption,Config } from "../WPPost";
import WPPost, { Config } from "../lib/WPPost";
//
const config = new Config();

program
  .version(require("../../package.json").version)
  .arguments("<path>")
  .option("-a, --api <value>", "enter wordpress api url.")
  .option("-u, --user <value>", "enter wordpress api userName.")
  .option("-p, --password <value>", "enter wordpress api password.")
  .option("-o, --options <value>", "Set options in json format.")
  .option(
    "-c, --check",
    "markdwon img link or check workspace file references."
  )

  .action(async (filePath: string, params: any) => {
    try {
      //
      if (!fs.existsSync(filePath)) {
        console.log(`Error: File not found: ${filePath}`);
        return;
      }
      //
      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        console.log(`Error:  ${filePath} is not a file`);
        return;
      }
      //
      if (params.check) {
        console.log("file check.");
        const result = await checkAsync(filePath);
        console.log(result);
        return;
      }
      //
      let api = params.api;
      let user = params.user;
      let password = params.password;
      //
      const useParam =
        params.api != null || params.user != null || params.password != null;
      if (!useParam) {
        await config.readConfig();
        //
        api = config.apiUrl;
        user = config.authUser;
        password = config.authPassword;
      }

      const postId = await wppostAync(filePath, api, user, password);
      //
      console.log("complete:😀 ", postId);
    } catch (_err) {
      console.error(`Error:${_err.message}`);
    }
  })
  .command("config")
  .description("A command-line tool to manage configuration")
  .option("-s, --show", "Show the current configuration")
  .option("-d, --delete", "Delete the current configuration")
  .action(async (options: any) => {
    if (options.show) {
      // Show the current configuration
      await config.readConfig();
      if (config) {
        console.log(`Config file path: ${config.getSavePath()}`);
        console.log("apiUrl:", config.apiUrl);
        console.log("authUser:", config.authUser);
        console.log("authPassword:", config.authPassword);
        console.log("apiPostUrl:", config.apiPostUrl);
        console.log("apiMediaUrl:", config.apiMediaUrl);
        console.log(
          "useLinkCardHtmlGenerator:",
          config.useLinkCardHtmlGenerator
        );
        // console.log(`authPassword: ${"*".repeat(config.authPassword.length)}`);
      }
    } else if (options.delete) {
      // Delete the current configuration
      const confirm = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: "Are you sure you want to delete the current configuration?",
          default: false,
        },
      ]);
      if (confirm.confirm) {
        await config.deleteConfig();
        console.log("Configuration deleted.");
      } else {
        console.log("Configuration not deleted.");
      }
    } else {
      // Prompt the user for input
      await config.readConfig();
      //
      const answers: Answers = await inquirer.prompt([
        {
          type: "input",
          name: "apiUrl",
          message: "What is your apiUrl?",
          default: config.apiUrl,
        },
        {
          type: "input",
          name: "authUser",
          message: "What is your authUser ?",
          default: config.authUser,
        },
        {
          type: "input",
          name: "authPassword",
          message: "What is your authPassword ?",
          default: config.authPassword,
        },
        {
          type: "input",
          name: "apiPostUrl",
          message: "What is your wp-api of Post(ex.'posts') ?",
          default: config.apiPostUrl ? config.apiPostUrl : "posts",
        },
        {
          type: "input",
          name: "apiMediaUrl",
          message: "What is your wp-api of Media(ex.'media') ?",
          default: config.apiMediaUrl ? config.apiMediaUrl : "media",
        },
        {
          type: "confirm",
          name: "useLinkCardHtmlGenerator",
          message: "Automatically convert a-tags into link cards? ?",
          default: config.useLinkCardHtmlGenerator,
        },
      ]);

      // Ask for confirmation before saving the configuration
      const confirmation = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: "Do you want to save these changes?",
          default: false,
        },
      ]);

      if (confirmation.confirm) {
        // Display the changes for confirmation
        console.log(); //empty line

        console.log("Here are the changes you made:");
        console.log("apiUrl:", answers["apiUrl"]);
        console.log("authUser:", answers["authUser"]);
        console.log("apiPostUrl:", answers["apiPostUrl"]);
        console.log("apiMediaUrl:", answers["apiMediaUrl"]);
        console.log(
          "automaticallyLinkCard:",
          answers["useLinkCardHtmlGenerator"]
        );
        // console.log(`authPassword: ${"*".repeat(answers.authPassword.length)}`);

        // Save the configuration to a file
        config.apiUrl = answers["apiUrl"];
        config.authUser = answers["authUser"];
        config.authPassword = answers["authPassword"];
        config.apiPostUrl = answers["apiPostUrl"];
        config.apiMediaUrl = answers["apiMediaUrl"];
        config.useLinkCardHtmlGenerator = answers["useLinkCardHtmlGenerator"];
        await config.writeConfig();

        console.log(); //empty line

        console.log(`Configuration saved to ${config.getSavePath()}`);
      } else {
        console.log("Configuration not saved.");
      }
    }
  });

export const checkAsync = async (docPath: string): Promise<string> => {
  //
  const checker = new WPPost(docPath);
  //
  const files1 = await checker.getLinksAsync();
  const files2 = await checker.getFileReferencesAsync();
  //
  const exists1 = files1.filter((a) => a.exists).length;
  const noExists1 = files1.filter((a) => !a.exists).length;
  const exists2 = files2.filter((a) => a.exists).length;
  const noExists2 = files2.filter((a) => !a.exists).length;

  //
  let response = "";
  response += `target:\n`;
  response += `${docPath}\n`;
  response += `dir:\n`;
  response += `${checker.parentDir}\n`;
  response += `\n`;

  response += `📄 markdown :🌱 ${exists1} ⚠️ ${noExists1}\n`;
  response += `📥 workspace :🌱 ${exists2} ⚠️ ${noExists2}\n`;
  response += `\n`;

  response += `📄 markdown \n`;
  if (files1.length == 0) {
    response += ` No images in markdown. \n`;
  } else {
    for (const item of files1) {
      response += ` ${item.exists ? "🌱" : "⚠️"} ${item.file}\n`;
    }
  }

  response += `📥 workspace \n`;
  if (files2.length == 0) {
    response += ` No files in workspace. \n`;
  } else {
    for (const item of files2) {
      response += ` ${item.exists ? "🌱" : "⚠️"} ${item.file}\n`;
    }
  }

  return response;
};

program.parse(process.argv);

// if (process.argv.length < 3) {
//   program.outputHelp();
// }
