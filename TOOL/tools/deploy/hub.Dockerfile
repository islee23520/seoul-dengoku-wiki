FROM node:26-bookworm-slim@sha256:582460f614631b59b824ac6020533b9bf339c7fdf3a6d7db31abb6b4065f0212

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates git python3 tar \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /work
COPY build-hub-in-docker.sh /usr/local/bin/build-hub
RUN chmod +x /usr/local/bin/build-hub

ENTRYPOINT ["/usr/local/bin/build-hub"]
