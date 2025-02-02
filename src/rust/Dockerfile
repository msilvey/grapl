FROM rust:1-slim-buster AS build

ARG CARGO_PROFILE=debug

SHELL ["/bin/bash", "-c"]

RUN apt-get update && apt-get install -y --no-install-recommends \
        wget \
        zip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /tmp

RUN wget -q https://github.com/mozilla/sccache/releases/download/v0.2.15/sccache-v0.2.15-x86_64-unknown-linux-musl.tar.gz && \
    tar xvzf sccache-v0.2.15-x86_64-unknown-linux-musl.tar.gz && \
    chmod +x sccache-v0.2.15-x86_64-unknown-linux-musl/sccache && \
    cp sccache-v0.2.15-x86_64-unknown-linux-musl/sccache /usr/local/bin/sccache

ENV RUSTC_WRAPPER=/usr/local/bin/sccache

# Install rust toolchain before copying sources to avoid unecessarily
# resinstalling on source file changes.
WORKDIR /grapl
COPY rust/rust-toolchain rust/rust-toolchain
WORKDIR /grapl/rust
# 'rustup show' will install components in the rust-toolchain file
RUN rustup show

# copy sources
WORKDIR /grapl
COPY proto proto
COPY rust rust

WORKDIR /grapl/rust

RUN --mount=type=cache,mode=0777,target=/root/.cache/sccache \
    --mount=type=secret,id=rust_env,dst=/grapl/env \
    source /grapl/env; \
    case "${CARGO_PROFILE}" in \
      debug) \
        cargo build ;; \
      release) \
        cargo build --release ;; \
      *) \
        echo "ERROR: Unknown profile: ${CARGO_PROFILE}"; \
        exit 1 ;; \
    esac



# metric-forwarder-zip
################################################################################
FROM build AS metric-forwarder-zip

RUN mkdir -p /grapl/zips; \
    grapl-zip() { \
      TMPDIR="$(mktemp -d)"; \
      cd "$TMPDIR"; \
      cp "/grapl/rust/target/${CARGO_PROFILE}/${1}" bootstrap && \
      zip --quiet -9 "/grapl/zips/${1}.zip" bootstrap; \
    }; \
    grapl-zip metric-forwarder


# build test stages
################################################################################
FROM build AS build-test-unit

RUN --mount=type=cache,mode=0777,target=/root/.cache/sccache \
    --mount=type=secret,id=rust_env,dst=/grapl/env \
    source /grapl/env; \
    cargo test --no-run


FROM build AS build-test-integration

RUN --mount=type=cache,mode=0777,target=/root/.cache/sccache \
    --mount=type=secret,id=rust_env,dst=/grapl/env \
    source /grapl/env; \
    cargo test --features node-identifier/integration,sqs-executor/integration --test '*' --no-run


# images for running services
################################################################################
FROM debian:buster-slim AS rust-dist

ARG CARGO_PROFILE=debug

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        netbase \
    && rm -rf /var/lib/apt/lists/*

USER nobody

# analyzer-dispatcher
FROM rust-dist AS analyzer-dispatcher-deploy

COPY --from=build "/grapl/rust/target/${CARGO_PROFILE}/analyzer-dispatcher" /
CMD ["/analyzer-dispatcher"]

# generic-subgraph-generator
FROM rust-dist AS generic-subgraph-generator-deploy

COPY --from=build "/grapl/rust/target/${CARGO_PROFILE}/generic-subgraph-generator" /
CMD ["/generic-subgraph-generator"]

# graph-merger
FROM rust-dist AS graph-merger-deploy

COPY --from=build "/grapl/rust/target/${CARGO_PROFILE}/graph-merger" /
CMD ["/graph-merger"]

# node-identifier
FROM rust-dist AS node-identifier-deploy

COPY --from=build "/grapl/rust/target/${CARGO_PROFILE}/node-identifier" /
CMD ["/node-identifier"]

# node-identifier-retry-handler
FROM rust-dist AS node-identifier-retry-handler-deploy

COPY --from=build "/grapl/rust/target/${CARGO_PROFILE}/node-identifier-retry-handler" /
CMD ["/node-identifier-retry-handler"]

# sysmon-subgraph-generator
FROM rust-dist AS sysmon-subgraph-generator-deploy

COPY --from=build "/grapl/rust/target/${CARGO_PROFILE}/sysmon-subgraph-generator" /
CMD ["/sysmon-subgraph-generator"]

# osquery-subgraph-generator
FROM rust-dist AS osquery-subgraph-generator-deploy

COPY --from=build "/grapl/rust/target/${CARGO_PROFILE}/osquery-subgraph-generator" /
CMD ["/osquery-subgraph-generator"]
