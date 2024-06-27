#!/bin/bash
export K6_SCRIPT_CONFIG_FOLDER_NAME="config-k8s"

args="$1$2$3"

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
    echo "Testing account discoveries with ramping rates"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopDiscoveryRampingRate.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
quote)
    echo "Testing single quote"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopSingleQuote.json docker compose --project-name load -f docker-compose-load.yml up
;;
fxquote)
    echo "Testing single FX quote"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopSingleFXQuote.json docker compose --project-name load -f docker-compose-load.yml up
;;
quotes)
    echo "Testing quotes"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopQuotes.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
fxquotes)
    echo "Testing FX quotes"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopFXQuotes.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
quotesrate)
    echo "Testing quotes with ramping rates"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopQuotesRampingRate.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
fxquotesrate)
    echo "Testing FX quotes with ramping rates"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopFXQuotesRampingRate.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
transfer)
    echo "Testing single transfer"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopSingleTransfer.json docker compose --project-name load -f docker-compose-load.yml up
;;
fxtransfer)
    echo "Testing single FX transfer"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopSingleFXTransfer.json docker compose --project-name load -f docker-compose-load.yml up
;;
transfers)
    echo "Testing transfers"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopTransfers.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
fxtransfers)
    echo "Testing FX transfers"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopFXTransfers.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
transfersrate)
    echo "Testing transfers with ramping rates"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopTransfersRampingRate.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
fxtransfersrate)
    echo "Testing FX transfers with ramping rates"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopFXTransfersRampingRate.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
dqtrate)
    echo "Testing account discoveries, quotes and transfers in parallel with ramping rates"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopDQTRampingRate.json docker compose --project-name load -f docker-compose-load.yml up -d
;;
dfxrate)
    echo "Testing account discoveries, FX quotes and FX transfers in parallel with ramping rates"
    env K6_SCRIPT_CONFIG_FILE_NAME=fspiopDFXRampingRate.json docker compose --project-name load -f docker-compose-load.yml up -d
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
    echo "Restarting the simulators"
    docker compose --project-name simulators -f docker-compose-perf.yml --profile 8dfsp --profile testing-toolkit --profile oracle down -v
    docker compose --project-name simulators -f docker-compose-perf.yml --profile 8dfsp --profile testing-toolkit --profile ttk-provisioning-remote-k8s --profile oracle up -d
;;
simupdate)
    echo "Updating the simulators"
    docker compose --project-name simulators -f docker-compose-perf.yml --profile 8dfsp --profile testing-toolkit --profile oracle up -d
;;
*)
    echo "Usage: "
    echo "   $0 discovery         - Test single account discovery"
    echo "   $0 discoveries       - Test account discoveries"
    echo "   $0 discoveries rate  - Test account discoveries with ramping rates"
    echo "   $0 quote             - Test single quote"
    echo "   $0 quotes            - Test quotes"
    echo "   $0 quotes rate       - Test quotes with ramping rates"
    echo "   $0 transfer          - Test single transfer"
    echo "   $0 transfers         - Test transfers"
    echo "   $0 transfers rate    - Test transfers with ramping rates"
    echo "   $0 fx quote          - Test single FX quote"
    echo "   $0 fx quotes         - Test FX quotes"
    echo "   $0 fx quotes rate    - Test FX quotes with ramping rates"
    echo "   $0 fx transfer       - Test single FX transfer"
    echo "   $0 fx transfers      - Test FX transfers"
    echo "   $0 fx transfersrate  - Test FX transfers with ramping rates"
    echo "   $0 dqtrate           - Test account discoveries, quotes and transfers in parallel with ramping rates"
    echo "   $0 dfxrate           - Test account discoveries, FX quotes and FX transfers in parallel with ramping rates"
    echo "   $0 e2e               - Test multiple end to end"
    echo "   $0 e2e single        - Test single end to end"
    echo "   $0 sim start         - Star the simulators"
    echo "   $0 sim stop          - Stop the simulators"
    echo "   $0 sim restart       - Restart the simulators"
    echo "   $0 sim update        - Update the simulators"
    exit 1
;;
esac
