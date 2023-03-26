import * as path from "path";

import { wppostAync, getLinksAsync, getFileReferencesAsync } from "../src";

const config = require("./config.json");
const docPath01 = path.join(path.resolve(__dirname, '..', '__tests__'), config.samples.post01);
const docPath02 = path.join(path.resolve(__dirname, '..', '__tests__'), config.samples.sample);
describe("#wppostAync", () => {
  test("default", async () => {
    //

    const docPath = docPath01;

    const apiUrl = config.apiUrl;
    const authUser = config.authUser;
    const authPassword = config.authPassword;

    //
    const postId = await wppostAync(docPath, apiUrl, authUser, authPassword);
    //
    expect(postId).not.toBeNull();
  }, 30000);
});

//
describe("#getLinksAsync", () => {
  test("default", async () => {
    const docPath = path.join(docPath02);

    const results = await getLinksAsync(docPath);

    expect(results.length).toBe(3); // LocalFeaturedImage x1 + image x2
  });
});

//
describe("#getFileReferencesAsync", () => {
  test("default", async () => {
    const docPath = path.join(docPath02);

    const results = await getFileReferencesAsync(docPath);

    expect(results.length).toBe(4);
  });
});
