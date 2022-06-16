set -e

while getopts o: flag
do
    case "${flag}" in
        o) OUT_DIR=${OPTARG};;
    esac
done
echo "Out Directory: $OUT_DIR";

source .env

# Set versions
ML_API_ADAPTER_VERSION="${ML_API_ADAPTER_VERSION:-local}"
ACCOUNT_LOOKUP_SERVICE_VERSION="${ACCOUNT_LOOKUP_SERVICE_VERSION:-local}"
QUOTING_SERVICE_VERSION="${QUOTING_SERVICE_VERSION:-local}"
CENTRAL_LEDGER_VERSION="${CENTRAL_LEDGER_VERSION:-local}"

# Create a folder
mkdir -p $OUT_DIR

# Get the files from docker images

## ml-api-adapter
echo -n "Getting default.json from docker image mojaloop/ml-api-adapter:$ML_API_ADAPTER_VERSION ..."
docker cp $(docker create --rm mojaloop/ml-api-adapter:$ML_API_ADAPTER_VERSION):/opt/app/config/default.json ./$OUT_DIR/ml-api-adapter.json
echo "Done"

## account-lookup-service
echo -n "Getting default.json from docker image mojaloop/account-lookup-service:$ACCOUNT_LOOKUP_SERVICE_VERSION ..."
docker cp $(docker create --rm mojaloop/account-lookup-service:$ACCOUNT_LOOKUP_SERVICE_VERSION):/opt/account-lookup-service/config/default.json ./$OUT_DIR/account-lookup-service.json
echo "Done"

## quoting-service
echo -n "Getting default.json from docker image mojaloop/quoting-service:$QUOTING_SERVICE_VERSION ..."
docker cp $(docker create --rm mojaloop/quoting-service:$QUOTING_SERVICE_VERSION):/opt/app/config/default.json ./$OUT_DIR/quoting-service.json
echo "Done"


## central-ledger
echo -n "Getting default.json from docker image mojaloop/central-ledger:$CENTRAL_LEDGER_VERSION ..."
docker cp $(docker create --rm mojaloop/central-ledger:$CENTRAL_LEDGER_VERSION):/opt/app/config/default.json ./$OUT_DIR/central-ledger.json
originalConfig=`docker run mojaloop/central-ledger:$CENTRAL_LEDGER_VERSION cat /opt/app/config/default.json`
echo "Done"
