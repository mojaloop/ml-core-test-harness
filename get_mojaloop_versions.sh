#!/bin/bash
: <<'COMMENT'
License
 --------------
 Copyright © 2026 Mojaloop Foundation

 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0
 (the "License") and you may not use these files except in compliance with the [License](http://www.apache.org/licenses/LICENSE-2.0).

 You may obtain a copy of the License at [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the [License](http://www.apache.org/licenses/LICENSE-2.0).

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
- Alexander Koh <senkoh.san@gmail.com> [Assisted by GPT-5.6 Luna] 

 --------------
COMMENT
set -e

# Gets Mojaloop version variables from .env
set -a
source .env
set +a

if [ -z "$MOJALOOP_VERSION" ]; then
    echo "ERROR: MOJALOOP_VERSION is not set"
    exit 1
fi

echo "Set Mojaloop Version: $MOJALOOP_VERSION"

# Get Chart.yaml from the Mojaloop version using the Helm repository.
curl -f -o Chart.yaml \
    "https://raw.githubusercontent.com/mojaloop/helm/$MOJALOOP_VERSION/mojaloop/Chart.yaml"

# Grab appVersion from Chart.yaml that contains all versions.
if ! APP_VERSION=$(grep '^appVersion:' Chart.yaml); then
    echo "ERROR: appVersion not found in Chart.yaml"
    exit 1
fi

# Remove ALL whitespace.
APP_VERSION="${APP_VERSION//[[:space:]]/}"

# Remove "appVersion:" prefix.
APP_VERSION=${APP_VERSION#appVersion:}

# Remove surrounding quotes.
APP_VERSION=${APP_VERSION#\"}
APP_VERSION=${APP_VERSION%\"}

# Parse appVersion to find all versions.
IFS=';' read -ra SERVICES <<< "$APP_VERSION"

for SERVICE in "${SERVICES[@]}"; do
    IFS=':' read -r NAME VERSION <<< "$SERVICE"

    case "$NAME" in
        ml-api-adapter)
            ML_API_ADAPTER_VERSION="$VERSION"
            ;;

        account-lookup-service)
            ACCOUNT_LOOKUP_SERVICE_VERSION="$VERSION"
            ;;

        quoting-service)
            QUOTING_SERVICE_VERSION="$VERSION"
            ;;

        central-ledger)
            CENTRAL_LEDGER_VERSION="$VERSION"
            ;;

        sdk-scheme-adapter)
            SDK_SCHEME_ADAPTER_VERSION="$VERSION"
            ;;

        central-settlement)
            CENTRAL_SETTLEMENT_VERSION="$VERSION"
            ;;
    esac
done


# ============================================================
# Validate known versions were actually found
# ============================================================

REQUIRED_VERSIONS=(
    ML_API_ADAPTER_VERSION
    ACCOUNT_LOOKUP_SERVICE_VERSION
    QUOTING_SERVICE_VERSION
    CENTRAL_LEDGER_VERSION
    SDK_SCHEME_ADAPTER_VERSION
    CENTRAL_SETTLEMENT_VERSION
)

for VAR in "${REQUIRED_VERSIONS[@]}"; do
    if [ -z "${!VAR}" ]; then
        echo "ERROR: $VAR was not found in Mojaloop Chart.yaml"
        exit 1
    fi
done

# ============================================================
# ALS MSISDN Oracle
#
# This is NOT in the main Mojaloop Chart.yaml.
#
# Newer releases:
#   helm/<version>/als-msisdn-oracle/Chart.yaml
#
# Older releases:
#   keep the existing .env value.
# ============================================================

MANUAL_ALS_MSISDN_ORACLE_SVC_VERSION="$ALS_MSISDN_ORACLE_SVC_VERSION"

ALS_MSISDN_ORACLE_CHART_URL="https://raw.githubusercontent.com/mojaloop/helm/$MOJALOOP_VERSION/als-msisdn-oracle/Chart.yaml"

echo "Checking ALS MSISDN Oracle chart..."

if ALS_MSISDN_ORACLE_CHART=$(curl -fsSL "$ALS_MSISDN_ORACLE_CHART_URL"); then

    CHART_ALS_MSISDN_ORACLE_SVC_VERSION=$(
        echo "$ALS_MSISDN_ORACLE_CHART" |
        sed -n 's/^appVersion:[[:space:]]*//p'
    )

    if [ -n "$CHART_ALS_MSISDN_ORACLE_SVC_VERSION" ]; then
        ALS_MSISDN_ORACLE_SVC_VERSION="${CHART_ALS_MSISDN_ORACLE_SVC_VERSION//\"/}"

        echo "ALS MSISDN Oracle: using Helm chart version $ALS_MSISDN_ORACLE_SVC_VERSION"
    else
        ALS_MSISDN_ORACLE_SVC_VERSION="$MANUAL_ALS_MSISDN_ORACLE_SVC_VERSION"

        echo "ALS MSISDN Oracle: no appVersion, keeping .env value $ALS_MSISDN_ORACLE_SVC_VERSION"
    fi

else

    ALS_MSISDN_ORACLE_SVC_VERSION="$MANUAL_ALS_MSISDN_ORACLE_SVC_VERSION"

    echo "ALS MSISDN Oracle: chart not found, keeping .env value $ALS_MSISDN_ORACLE_SVC_VERSION"

fi

if [ -z "$ALS_MSISDN_ORACLE_SVC_VERSION" ]; then
    echo "ERROR: ALS_MSISDN_ORACLE_SVC_VERSION is not set and no Helm chart version was found"
    exit 1
fi

# ============================================================
# Update .env
# ============================================================
echo
echo "Updating .env file..."
update_env() {
    local key="$1"
    local value="$2"

    if grep -q "^${key}=" .env; then
        sed -i "s|^${key}=.*|${key}=${value}|" .env
    else
        echo "${key}=${value}" >> .env
    fi
}

update_env "ML_API_ADAPTER_VERSION" "$ML_API_ADAPTER_VERSION"
update_env "ACCOUNT_LOOKUP_SERVICE_VERSION" "$ACCOUNT_LOOKUP_SERVICE_VERSION"
update_env "QUOTING_SERVICE_VERSION" "$QUOTING_SERVICE_VERSION"
update_env "CENTRAL_LEDGER_VERSION" "$CENTRAL_LEDGER_VERSION"
update_env "SDK_SCHEME_ADAPTER_VERSION" "$SDK_SCHEME_ADAPTER_VERSION"
update_env "ALS_MSISDN_ORACLE_SVC_VERSION" "$ALS_MSISDN_ORACLE_SVC_VERSION"
update_env "CENTRAL_SETTLEMENT_VERSION" "$CENTRAL_SETTLEMENT_VERSION"

# ============================================================
# Output
# ============================================================

echo
echo "=============================================="
echo "Updated Mojaloop Service Versions"
echo "=============================================="

echo "ML_API_ADAPTER_VERSION=$ML_API_ADAPTER_VERSION"
echo "ACCOUNT_LOOKUP_SERVICE_VERSION=$ACCOUNT_LOOKUP_SERVICE_VERSION"
echo "QUOTING_SERVICE_VERSION=$QUOTING_SERVICE_VERSION"
echo "CENTRAL_LEDGER_VERSION=$CENTRAL_LEDGER_VERSION"
echo "SDK_SCHEME_ADAPTER_VERSION=$SDK_SCHEME_ADAPTER_VERSION"
echo "ALS_MSISDN_ORACLE_SVC_VERSION=$ALS_MSISDN_ORACLE_SVC_VERSION"
echo "CENTRAL_SETTLEMENT_VERSION=$CENTRAL_SETTLEMENT_VERSION"

echo
echo "Done. .env has been updated."

CHART_FILE="Chart.yaml"

cleanup() {
    rm -f "$CHART_FILE"
}

trap cleanup EXIT