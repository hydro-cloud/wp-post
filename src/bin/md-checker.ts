#!/usr/bin/env node

import { ArgumentParser } from "argparse";
import MDChecker from "../MDChecker";

export const main = async (docPath: string): Promise<string> => {
  //
  const checker = new MDChecker(docPath);
  //
  const files1 = checker.getLinks();
  const files2 = checker.getFileReferences();
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

  response += `📄 markdown :\t🌱 ${exists1} ⚠️ ${noExists1}n`;
  response += `📥 workspace :\t🌱 ${exists2} ⚠️ ${noExists2}\n`;
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

//
var parser = new ArgumentParser({
  prog: "md-check",
  add_help: true,
});

//
parser.add_argument("file", {
  type: "str",
  help: "select .md",
});
//
parser.add_argument("-v", "--version", {
  action: "version",
  version: require("../../package.json").version,
});

//
var arg = parser.parse_args();
var docPath = arg.file;
//
main(docPath)
  .then((resulet) => {
    console.log(resulet);
  })
  .catch((error) => {
    console.error("error occured!:", error.message);
  });
