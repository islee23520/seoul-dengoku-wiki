import { runFullAcceptanceCLI } from "../../src/acceptance-ingress.js";

process.exitCode = await runFullAcceptanceCLI(process.argv.slice(2));
