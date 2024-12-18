FROM ghcr.io/grafana/k6-operator:runner-v0.0.17
CMD mkdir /src/node_modules
COPY packages/k6-tests /scripts
