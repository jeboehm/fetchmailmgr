import { exec } from "node:child_process";
import { client } from "./redisconnection.js";
import { getPath, getConfigPath } from "./config.js";

const fetchmailPath = process.env.FETCHMAIL_PATH || "/usr/bin/fetchmail";
const args = ["-N", "--nosyslog"];

const writeRuntimeInfo = async (accountId, lastRun, lastLog, isSuccess) => {
  const key = `fetchmail_accounts_runtime_${accountId}`;
  const value = JSON.stringify({
    lastRun,
    lastLog,
    isSuccess,
  });

  await client.set(key, value);
};

export const startProcess = async (account) => {
  const fetchmailHome = getPath(account.id);
  let stdout = "";
  let stderr = "";

  try {
    const process = exec(
      `"${fetchmailPath}" ${args.join(" ")} --fetchmailrc "${getConfigPath(account.id)}"`,
      {
        env: {
          HOME: fetchmailHome,
          FETCHMAILHOME: fetchmailHome,
        },
        timeout: 600000,
      },
    );

    process.stdout.on("data", (data) => {
      stdout += data;
    });

    process.stderr.on("data", (data) => {
      stderr += data;
    });

    process.on("close", (code) => {
      console.debug(
        `[${account.id}] Process for account ${account.id} ended with code ${code}`,
      );
      console.debug(`[${account.id}] stdout:`, stdout);
      console.debug(`[${account.id}] stderr:`, stderr);

      writeRuntimeInfo(
        account.id,
        new Date().toISOString(),
        stdout + stderr,
        code <= 1,
      );
    });
  } catch (err) {
    console.error(`[${account.id}] Error starting process:`, err);
    writeRuntimeInfo(account.id, new Date().toISOString(), err.message, false);
  }
};
