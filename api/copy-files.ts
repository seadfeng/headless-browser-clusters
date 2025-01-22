import fs from "fs-extra";
import path from "path";

const sourceDir = path.join(
  ".",
  "node_modules",
  "header-generator",
  "data_files",
);
const targetDir = path.join("dist", "data_files");

// 使用 Promise 方式
async function copyFiles() {
  try {
    await fs.copy(sourceDir, targetDir);
    console.log("Directory copied successfully!");
  } catch (err) {
    console.error("Error copying directory:", err);
  }
}

// 或者使用回调方式
fs.copy(sourceDir, targetDir)
  .then(() => {
    console.log("Directory copied successfully!");
  })
  .catch((err) => {
    console.error("Error copying directory:", err);
  });
