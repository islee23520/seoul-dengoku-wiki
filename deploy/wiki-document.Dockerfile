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
# The document API reads PostgreSQL only at runtime (no SQLite fallback):
# the owner injects the WIKI_DOCUMENT_PG connection URL as a runtime
# environment variable — it is never baked into the image. The sealed SQLite
# archive copied above is kept as the migration reference copy only.
ENV NODE_ENV=production HOST=0.0.0.0 DATA_DIR=/app/public
USER node
EXPOSE 8787 8788
HEALTHCHECK --interval=3s --timeout=20s --retries=3 CMD node --input-type=module -e "await Promise.all([[8788,'documents'],[8787,'health']].map(async([port,path])=>{const r=await fetch('http://127.0.0.1:'+port+'/wiki/api/'+path,{signal:AbortSignal.timeout(18000)});const v=await r.json();if(!r.ok||(path==='documents'?(!Array.isArray(v)||!v.length):(!v.ok||!v.people||!v.tokens)))process.exit(1)}))"
CMD ["node", "server/wiki-runtime.mjs"]
