import { once } from "node:events";
import { referencesFixture } from "./references-fixture.ts";

const fixture = await referencesFixture();
await fetch(
	`${fixture.origin}/tools/api/connections/${fixture.payload().connectionId}`,
	{ method: "DELETE", headers: fixture.headers },
);
console.log(
	`TASK15_BROWSER_READY ${JSON.stringify({ origin: fixture.origin, providerUrl: fixture.providerUrl, root: fixture.root, identityResultId: fixture.identityResultId, personId: fixture.person.id })}`,
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
	process.once(signal, () => {
		void fixture.close().then(() => process.exit(0));
	});
await once(process, "beforeExit");
