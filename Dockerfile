FROM ghcr.io/grafana/k6-operator:runner-v0.0.17

# create node_modules directory to satisfy license scanner
RUN mkdir /src/node_modules

COPY packages/k6-tests /scripts
