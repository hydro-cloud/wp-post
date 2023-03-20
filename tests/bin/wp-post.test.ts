import { promisify } from "util";
import { exec } from "child_process";
// const { spawn } = require('child_process');

const execPromise = promisify(exec);

//
import { Config } from "../../src/lib/WPPost";

describe("#version", () => {
  test("default", async () => {
    const { stdout } = await execPromise("node ./dist/bin/wp-post -V");
    expect(stdout.trim()).toBe(require("../../package.json").version);
  });
});

describe("#config", () => {
  const config = new Config();

  test("default", async () => {
    
    {
      config.apiUrl = "a";
      config.authUser = "b";
      config.authPassword = "c";
      config.writeConfig();

      const { stdout } = await execPromise("node ./dist/bin/wp-post config -s");
      expect(stdout).toBe(
        `Config file path: ${config.getSavePath()}\napiUrl: a\nauthUser: b\nauthPassword: c\n`
      );
    }
  });

  
  // test("delete", async () => {

  //   const child = spawn('"node ./dist/bin/wp-post config -d');

  //   // 出力の受信待ち
  //   const outputPromise = new Promise(resolve => {
  //     child.stdout.once('data', (data:Buffer) => {
  //       resolve(data.toString());
  //     });
  //   });

  //   // 名前入力の送信
  //   child.stdin.write('y\n');

  //   // 出力の検証
  //   const output = await outputPromise;
  //   expect(output).toMatch('Hello, John!');

  //   // プロセスの終了待ち
  //   child.stdin.end();
  //   await new Promise(resolve => child.on('exit', resolve));

  // });

});

describe("#check", () => {
  test("default", async () => {
    const { stdout } = await execPromise(
      "node ./dist/bin/wp-post ./tests/samples/sample/sample.md -c"
    );
    expect(stdout.trim()).not.toBeNull();
  });
});
