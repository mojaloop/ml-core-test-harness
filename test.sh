#!/bin/bash

args="$1$2"

case "$args" in
quote)
    echo "Testing single quote"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopSingleQuote.json docker compose --project-name load -f docker-compose-load.yml up
;;
quotes)
    echo "Testing quotes"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopQuotes.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
transfer)
    echo "Testing single transfer"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopSingleTransfer.json docker compose --project-name load -f docker-compose-load.yml up
;;
transfer)
    echo "Testing transfers"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopTransfers.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
simstart)
    echo "Starting the simulators"
    docker compose --project-name simulators -f docker-compose-perf.yml --profile 8dfsp --profile testing-toolkit --profile ttk-provisioning-remote-k8s --profile oracle up -d
;;
simstop)
    echo "Stopping the simulators"
    docker compose --project-name simulators -f docker-compose-perf.yml --profile 8dfsp --profile testing-toolkit --profile oracle down -v
;;
simrestart)
    echo "Restartung the simulators"
    docker compose --project-name simulators -f docker-compose-perf.yml --profile 8dfsp --profile testing-toolkit --profile oracle down -v
    docker compose --project-name simulators -f docker-compose-perf.yml --profile 8dfsp --profile testing-toolkit --profile ttk-provisioning-remote-k8s --profile oracle up -d
;;
*)
    echo "Usage: "
    echo "   $0 quote"
    echo "   $0 quotes"
    echo "   $0 transfer"
    echo "   $0 transfers"
    echo "   $0 sim start"
    echo "   $0 sim stop"
    echo "   $0 sim restart"
    exit 1
;;
esac
