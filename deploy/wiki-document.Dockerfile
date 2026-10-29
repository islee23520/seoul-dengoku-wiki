FROM node:26-bookworm-slim@sha256:582460f614631b59b824ac6020533b9bf339c7fdf3a6d7db31abb6b4065f0212
WORKDIR /app
# The owner creates a closed context containing only tracked runtime modules,
# locked dependencies and the selected commit's hydrated public database.
COPY package.json package-lock.json ./
COPY vendor/*.tgz ./vendor/
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force
COPY server/ ./server/
COPY scripts/ ./scripts/
COPY data/canonical/wiki-cast.sqlite ./data/canonical/wiki-cast.sqlite
COPY public/ ./public/
COPY runtime-public-binding.json ./runtime-public-binding.json
RUN chmod -R a+rX /app && chmod 0444 /app/data/canonical/wiki-cast.sqlite
# The document API reads PostgreSQL only (there is no SQLite fallback at
# runtime): the owner injects WIKI_DOCUMENT_PG at deployment time. The sealed
# SQLite archive stays in the image as the migration dialogue/reference copy.
ENV NODE_ENV=production HOST=0.0.0.0 DATA_DIR=/app/public
ENV WIKI_DOCUMENT_PG=/run/secrets/wiki_document_pg
USER node
EXPOSE 8787 8788
HEALTHCHECK --interval=3s --timeout=20s --retries=3 CMD node --input-type=module -e "await Promise.all([[8788,'documents'],[8787,'health']].map(async([port,path])=>{const r=await fetch('http://127.0.0.1:'+port+'/wiki/api/'+path,{signal:AbortSignal.timeout(18000)});const v=await r.json();if(!r.ok||(path==='documents'?(!Array.isArray(v)||!v.length):(!v.ok||!v.people||!v.tokens)))process.exit(1)}))"
CMD ["node", "server/wiki-runtime.mjs"]
