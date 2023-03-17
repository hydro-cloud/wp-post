import * as path from "path";

import WPPost from "../src/WPPost";

const config = require("./config.json");
const docPath = path.join(__dirname, config.samples.post01);

test("postのテスト", async () => {
  //
  const wpost = new WPPost(docPath);

  //
  const html = wpost.render();
  expect(html).not.toBeNull();

  //
  const apiUrl = config.apiUrl;
  const authUser = config.authUser;
  const authPassword = config.authPassword;
  //
  const postId = await wpost.post(apiUrl, authUser, authPassword);

  expect(postId).not.toBeNull();
}, 10000);
