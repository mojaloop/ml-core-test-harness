FROM ghcr.io/grafana/k6-operator:runner-v0.0.17

# create node_modules directory to satisfy license scanner
USER root
RUN mkdir -p /opt/ml-core-test-harness/node_modules/foo
USER k6

COPY packages/k6-tests /scripts
