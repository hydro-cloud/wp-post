import { Config } from "../../../src/lib/WPPost";

describe("#Config", () => {
  test("default", async () => {
    //
    const config = new Config();

    let savePath = config.getSavePath();
    expect(savePath).not.toBeNull();

    //
    await config.deleteConfig();


    await config.readConfig();
    //
    expect(config.apiUrl).toBe("");
    expect(config.authUser).toBe("");
    expect(config.authPassword).toBe("");

    config.apiUrl = "a";
    config.authUser = "b";
    config.authPassword = "c";
    await config.writeConfig();

    await config.readConfig();
    //
    expect(config.apiUrl).toBe("a");
    expect(config.authUser).toBe("b");
    expect(config.authPassword).toBe("c");

    await config.deleteConfig();
    //
    await config.readConfig();
    //
    expect(config.apiUrl).toBe("");
    expect(config.authUser).toBe("");
    expect(config.authPassword).toBe("");

    //
  });
});
