#!/bin/bash
export K6_SCRIPT_CONFIG_FOLDER_NAME="config-k8s"

args="$1$2"

case "$args" in
discovery)
    echo "Testing single account discovery"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopDiscoverySingle.json docker compose --project-name load -f docker-compose-load.yml up
;;
discoveries)
    echo "Testing account discoveries"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopDiscovery.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
discoveriesrate)
    echo "Testing account discoveries with constant rates"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopDiscoveryRampingRate.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
quote)
    echo "Testing single quote"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopSingleQuote.json docker compose --project-name load -f docker-compose-load.yml up
;;
quotes)
    echo "Testing quotes"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopQuotes.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
quotesrate)
    echo "Testing quotes"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopQuotesRampingRate.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
transfer)
    echo "Testing single transfer"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopSingleTransfer.json docker compose --project-name load -f docker-compose-load.yml up
;;
transfers)
    echo "Testing transfers"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopTransfers.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
transfersrate)
    echo "Testing transfers"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopTransfersRampingRate.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
dqtrate)
    echo "Testing account discoveries, quotes and transfers in parallel with constant rates"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopDQTRampingRate.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
e2e)
    echo "Testing multiple end to end"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopE2E.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
e2esingle)
    echo "Testing single end to end"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopE2Esingle.json docker compose --project-name load -f docker-compose-load.yml up
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
    echo "   $0 discovery"
    echo "   $0 discoveries"
    echo "   $0 discoveries rate"
    echo "   $0 quote"
    echo "   $0 quotes"
    echo "   $0 transfer"
    echo "   $0 transfers"
    echo "   $0 dqt rate"
    echo "   $0 e2e"
    echo "   $0 e2e single"
    echo "   $0 sim start"
    echo "   $0 sim stop"
    echo "   $0 sim restart"
    exit 1
;;
esac
