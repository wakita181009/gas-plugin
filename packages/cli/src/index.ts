import { defineCommand, runMain } from "citty";

const main = defineCommand({
  meta: {
    name: "gas-plugin",
    version: "0.1.0",
    description: "Extensible CLI tool for Google Apps Script projects",
  },
  subCommands: {
    create: () => import("./commands/create.js").then((m) => m.default),
  },
});

runMain(main).catch(() => process.exit(1));
