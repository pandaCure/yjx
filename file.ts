import path from "node:path";
import fs from "fs";
import { glob } from "glob";
import { EOL } from "node:os";
import crypto from "node:crypto";

const SALT = "$ome$alt";

const generateHash = (pass: string) => {
  return crypto.createHmac("sha256", SALT).update(pass).digest("hex");
};
const textFiles = glob.sync("resource/*.txt", {
  ignore: "node_modules/**",
  root: path.join(__dirname),
});

const readLog = () => {
  try {
    const dataStr = fs.readFileSync(path.resolve(__dirname, "log.json"), {
      encoding: "utf8",
    });
    return JSON.parse(dataStr) as Record<any, any>;
  } catch {
    return {} as Record<any, any>;
  }
};

const getFileContent = (filePath: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path.resolve(__dirname, filePath),
      { encoding: "utf8" },
      (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data.split(/[\n\r|\r]/g));
        }
      }
    );
  });
};
const Logger = async (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const dataStr = fs.readFileSync(path.resolve(__dirname, "log.json"), {
        encoding: "utf8",
      });
      const data = JSON.parse(dataStr);
      const writeData = Object.assign({}, data, {
        [generateHash(filePath)]: `${filePath.split("/")[1]}`,
      });
      fs.writeFileSync(
        path.resolve(__dirname, "log.json"),
        JSON.stringify(writeData, null, 2),
        { encoding: "utf8" }
      );
      resolve();
    } catch {
      reject();
    }
  });
};

const writeRes = async (filename: string, content: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      fs.writeFileSync(
        path.resolve(__dirname, "response", `${filename}.txt`),
        content,
        { encoding: "utf8" }
      );
      resolve();
    } catch {
      reject();
    }
  });
};

const currentRecordLog = readLog();
export { textFiles, getFileContent, Logger, currentRecordLog, writeRes };
