const fs = require("fs-extra");

const libs = [
  "@convergence",
  "@convergencelabs",
  "bootstrap",
  "jquery",
  "monaco-editor",
  "popper.js",
  "rxjs",
];

const srcLibs = "src/libs/";

if (!fs.existsSync(srcLibs)) {
  fs.mkdir(srcLibs);
}

const paths = libs
  .forEach(lib => fs.copySync("node_modules/" + lib, srcLibs + lib));

