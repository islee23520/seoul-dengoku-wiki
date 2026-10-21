FROM node:26-bookworm-slim@sha256:582460f614631b59b824ac6020533b9bf339c7fdf3a6d7db31abb6b4065f0212
WORKDIR /app
# The owner creates a closed context containing only tracked runtime modules,
# locked dependencies and the selected commit's hydrated public database.
COPY package.json package-lock.json ./
COPY vendor/ ./vendor/
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force
COPY server/ ./server/
COPY scripts/ ./scripts/
COPY data/canonical/wiki-cast.sqlite ./data/canonical/wiki-cast.sqlite
RUN chmod -R a+rX /app && chmod 0444 /app/data/canonical/wiki-cast.sqlite
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8788 WIKI_DOCUMENT_DB=/app/data/canonical/wiki-cast.sqlite
USER node
EXPOSE 8788
HEALTHCHECK --interval=3s --timeout=20s --retries=3 CMD node --input-type=module -e "const r=await fetch('http://127.0.0.1:8788/wiki/api/documents',{signal:AbortSignal.timeout(18000)});const v=await r.json();if(!r.ok||!Array.isArray(v)||!v.length)process.exit(1)"
CMD ["node", "server/wiki-document-api.mjs"]
