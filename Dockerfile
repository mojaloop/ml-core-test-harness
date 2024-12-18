FROM ghcr.io/grafana/k6-operator:runner-v0.0.17
COPY packages/k6-tests /scripts
