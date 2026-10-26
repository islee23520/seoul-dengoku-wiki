# Wiki deployment caller

`.woodpecker/deploy.yaml` runs only for pushes to `main`.
The Node 26 step sends the commit to the deployment owner, then checks the public
site with `check-live-contract.mjs --public-edge`. The owner performs the release and rollback;
this repository does not hold deployment host credentials.

Configure the Woodpecker secret `seoul_deploy_token`. `SEOUL_DEPLOY_URL` currently
points to `http://172.28.0.4:8080/api/deployments/seoul-wiki`, the dashboard's
address on the outer `linalab-ci-tools_build` network. Outer Docker aliases do
not resolve inside the nested build engine. Update this workflow value if the
dashboard address changes. Reachability still requires a successful probe from
the build environment; the runtime deployment endpoint must also be installed
before rollout. The caller uses `SEOUL_DEPLOY_TOKEN`
as bearer authentication and sends only `{"sha": CI_COMMIT_SHA}` in the POST body.
It does not retry a request or follow redirects.

The owner returns NDJSON. Blank lines and `{"status":"running"}` keepalives are
accepted. A terminal record must contain the requested `sha` and a `status` of
`success`, `failed`, or `rolled-back`. Only `success` passes. A mismatched SHA,
invalid response, HTTP error, missing terminal record, or 35-minute deadline
fails the step. Responses are limited to 8 MiB total and 64 Ki characters per
line. Neither upstream response text nor the token is logged.

The catalog is not tracked. `npm ci --ignore-scripts` installs the generator's
dependencies, and `node scripts/generate-catalog.mjs` creates it from repository
lore and checked-in build snapshots. No full Vite build, crest generation, or
observed-geography generation is needed for the HTTP check. The check command is:

```sh
node deploy/check-live-contract.mjs --public-edge https://sss.linalab.io live-http-green.json src/generated/wikiCatalog.ts
```

Public-edge mode requires HTTP 200 and the React entry marker on every catalog
wiki route, compatibility wiki route, `/wiki/`, and `/wiki/states`. It does not
follow redirects. `/system-design/regions`, `/system-design/regions/`, and `/gdd/`
must return HTTP 302 to the HTTPS `linalab.cloudflareaccess.com` login path for
the checked host. HTTP 200 or 308 fails: either would bypass the Access boundary.
Access Location query values are never included in the result.

Without `--public-edge`, the checker remains the origin contract (default
`http://127.0.0.1:8080`), including the region redirects' HTTP 308 and destination.
The deployment owner runs that contract against the origin during promotion;
the public check does not replace it.

Deployment test suites were removed by owner decision. The deployment caller and live HTTP contract checker remain operational.
