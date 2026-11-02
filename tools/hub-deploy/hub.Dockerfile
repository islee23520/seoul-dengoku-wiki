FROM node:26-bookworm-slim@sha256:582460f614631b59b824ac6020533b9bf339c7fdf3a6d7db31abb6b4065f0212

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates git python3 python3-pip tar \
    && rm -rf /var/lib/apt/lists/*
# WIKI's lore JSON schema runner needs jsonschema's referencing registry (4.18+); bookworm ships 4.10.
RUN pip3 install --no-cache-dir --break-system-packages jsonschema==4.26.0

WORKDIR /work
COPY build-hub-in-docker.sh /usr/local/bin/build-hub
RUN chmod +x /usr/local/bin/build-hub

ENTRYPOINT ["/usr/local/bin/build-hub"]
