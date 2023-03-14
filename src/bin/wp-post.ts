#!/usr/bin/env node
import { ArgumentParser } from "argparse";
import { wppost } from "../index";

export const main = async (
  docPath: string,
  apiUrl: string,
  authUser: string,
  authPassword: string
) => {
  //
  const postId = await wppost(docPath, apiUrl, authUser, authPassword);
  //
  return postId;
};

//
var parser = new ArgumentParser({
  prog: "wp-post ", // 省略するとファイル名になる
  description: "for",
  add_help: true,
});

parser.add_argument("file", {
  type: "str",
  help: "select .md",
});

parser.add_argument("-a", "--api", {
  type: "str",
  help: "enter wordpress api url.",
  required: true,
});

parser.add_argument("-u", "--user", {
  type: "str",
  help: "enter wordpress api userName",
  required: true,
});

parser.add_argument("-p", "--password", {
  type: "str",
  help: "enter wordpress api password",
  required: true,
});

parser.add_argument("-v", "--version", {
  action: "version",
  version: require("../../package.json").version,
});

//
var arg = parser.parse_args();
var docPath = arg.file;
var apiUrl = arg.api;
var authUser = arg.user;
var authPassword = arg.password;

main(docPath, apiUrl, authUser, authPassword)
  .then((resulet) => {
    console.log("complete:😀 ", resulet);
  })
  .catch((error) => {
    console.error("error occured!:", error.message);
  });
