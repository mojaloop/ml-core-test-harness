#!/bin/bash

Help()
{
  # Display Help
  echo "Usage: automate_perf.sh [ -c | --capture-results-only ]
              [ -f | --capture-from-time ]
              [ -t | --capture-to-time ]
              [ -h | --help  ]"
  echo "options:"
  echo "-c | --capture-results-only   Capture dashboards only, skip test execution."
  echo "-f | --capture-from-time      From time for capturing results"
  echo "-t | --capture-to-time        To time for capturing results"
  echo "h     Print this Help."
  exit;
}

SHORT=c,f:,t:,h
LONG=capture-results-only,capture-from-time:,capture-to-time:,help
OPTS=$(getopt -a -n automate_perf.sh --options $SHORT --longoptions $LONG -- "$@")

VALID_ARGUMENTS=$# # Returns the count of arguments that are in short or long options

# Replace 'your_container_name' with the actual name of your Docker container
CONTAINER_NAME="load-k6-1"

# if [ "$VALID_ARGUMENTS" -eq 0 ]; then
#   Help
# fi

eval set -- "$OPTS"

while :
do
  case "$1" in
    -c | --capture-results-only )
      captureResultsOnly="true"
      shift 1
      ;;
    -f | --capture-from-time )
      captureFromTime="$2"
      shift 2
      ;;
    -t | --capture-to-time )
      captureToTime="$2"
      shift 2
      ;;
    -h | --help)
      Help
      ;;
    --)
      shift;
      break;
      ;;
    *)
      echo "ERROR: Unexpected option: $1"
      echo
      Help
      ;;
  esac
done

if [ "$captureResultsOnly" ] && ([ -z "$captureFromTime" ] || [ -z "$captureToTime" ])
then
  echo "ERROR: capture-from-time and capture-to-time should be provided in capture-result-only mode"
  echo
  Help
fi

source ./automate_perf.env

# define the list of dashboards
declare -a dashboards=(\
  "dashboard-account-lookup-service" \
  "Central%20Ledger%20DB" \
  "Kafka%20Exporter%20Overview" \
  "mojaloop-central-ledger" \
  "Mojaloop%20-%20Central-Ledger%20-%20Performance%20Characterization" \
  "Mojaloop%20-%20ML-API" \
  "Docker%20Prometheus%20Monitoring" \
  "NodeJS%20Application%20Dashboard" \
  "Official%20k6%20Test%20Result" \
  "MySQL%20Overview" \
  "Supporting%20Services%20-%20Callback%20Hander%20Service"
  )

# # create a directory to store the results with date timestamp in the name, check if the directory exists
resultsSubDir="$(date +"%Y%m%d")"

if [ ! -d "results/$resultsSubDir/$K6_SCENARIO_NAME" ]; then
  mkdir -p results/$resultsSubDir/$K6_SCENARIO_NAME
fi

if [ -z "$captureResultsOnly" ]
then
  # store current time in a variable
  echo "Start Time : $(date +"%T")"
  startTestSeconds=$(date +"%s")
  # get milliseconds
  echo "Epoch Start Time : $(date +"%s%3N")"
  startTestMilliseconds=$(date +"%s%3N")

  if [ ! -d "results/$resultsSubDir/$K6_SCENARIO_NAME/logs" ]; then
    mkdir -p results/$resultsSubDir/$K6_SCENARIO_NAME/logs
  fi
  env K6_SCRIPT_CONFIG_FILE_NAME=$K6_SCENARIO_CONFIG docker compose --project-name load -f docker-compose-load.yml up > results/$resultsSubDir/$K6_SCENARIO_NAME/logs/$CONTAINER_NAME.log

  # Interval in seconds between status checks
  CHECK_INTERVAL=1

  while true; do
    # Check if the container is running
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
      echo "Container '${CONTAINER_NAME}' is running."
    else
      # Check if the container is stopped
      if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "Container '${CONTAINER_NAME}' is stopped."
        echo "End Time : $(date +"%T")"
        endTestSeconds=$(date +"%s")
        # get milliseconds
        echo "Epoch End Time plus 2 minutes : $(date +"%s%3N")"
        endTestMilliseconds=$(date -d '+2 minutes' +"%s%3N")
        break
      else
        echo "Container '${CONTAINER_NAME}' not found."
        break
      fi
    fi

    # Wait for the specified interval before checking again
    sleep $CHECK_INTERVAL
  done

  # Calculate the difference in seconds
  difference=$((endTestSeconds - startTestSeconds))


  s=$difference
  ((h=s/3600))
  ((m=s%3600/60))
  ((s=s%60))
  printf "Time taken to run the test := %d:%02d:%02d\n" $h $m $s
  # echo "Difference between timestamps: $difference seconds."


  # Add sleep 10s for grafana to catchup with the metrics
  sleep 10
else
  startTestMilliseconds=$captureFromTime
  endTestMilliseconds=$captureToTime
fi

if [ ! -d "results/$resultsSubDir/$K6_SCENARIO_NAME/images" ]; then
  mkdir -p results/$resultsSubDir/$K6_SCENARIO_NAME/images
fi
# loop through the array
for dashboard in "${dashboards[@]}"
do
  echo "$dashboard"
  dashboard_string=$(echo $dashboard | sed 's/%20/ /g' | tr -d ' ')
  #  printf -v dashboard_string "%b" "${dashboard//\%/\\x}"
  echo "$dashboard_string"
  dashboardUrl=$(curl "http://$GRAFANA_USERNAME:$GRAFANA_PASSWORD@$GRAFANA_HOSTNAME:$GRAFANA_PORT/api/search?query=$dashboard" | jq -r '.[].url')
  #check if dashboard is NodeJSApplicationDashboard
  if [[ $dashboard_string == *"NodeJSApplicationDashboard"* ]]; then
      curl "http://$GRAFANA_USERNAME:$GRAFANA_PASSWORD@$GRAFANA_HOSTNAME:$GRAFANA_PORT/render$dashboardUrl?height=5000&width=2000&from=$startTestMilliseconds&to=$endTestMilliseconds&var-prefix=moja_als&var-instance=All&var-serviceName=All&var-podName=All" > ./results/$resultsSubDir/$K6_SCENARIO_NAME/images/$dashboard_string-moja_als.png
      curl "http://$GRAFANA_USERNAME:$GRAFANA_PASSWORD@$GRAFANA_HOSTNAME:$GRAFANA_PORT/render$dashboardUrl?height=5000&width=2000&from=$startTestMilliseconds&to=$endTestMilliseconds&var-prefix=moja_cl&var-instance=All&var-serviceName=All&var-podName=All" > ./results/$resultsSubDir/$K6_SCENARIO_NAME/images/$dashboard_string-moja_cl.png
      curl "http://$GRAFANA_USERNAME:$GRAFANA_PASSWORD@$GRAFANA_HOSTNAME:$GRAFANA_PORT/render$dashboardUrl?height=5000&width=2000&from=$startTestMilliseconds&to=$endTestMilliseconds&var-prefix=moja_ml&var-instance=All&var-serviceName=All&var-podName=All" > ./results/$resultsSubDir/$K6_SCENARIO_NAME/images/$dashboard_string-moja_ml.png
      curl "http://$GRAFANA_USERNAME:$GRAFANA_PASSWORD@$GRAFANA_HOSTNAME:$GRAFANA_PORT/render$dashboardUrl?height=5000&width=2000&from=$startTestMilliseconds&to=$endTestMilliseconds&var-prefix=cbs&var-instance=All&var-serviceName=All&var-podName=All" > ./results/$resultsSubDir/$K6_SCENARIO_NAME/images/$dashboard_string-cbs.png
  elif [[ $dashboard_string == *"MySQLOverview"* ]]; then
      curl "http://$GRAFANA_USERNAME:$GRAFANA_PASSWORD@$GRAFANA_HOSTNAME:$GRAFANA_PORT/render$dashboardUrl?height=6500&width=2000&from=$startTestMilliseconds&to=$endTestMilliseconds" > ./results/$resultsSubDir/$K6_SCENARIO_NAME/images/$dashboard_string.png
  else
      curl "http://$GRAFANA_USERNAME:$GRAFANA_PASSWORD@$GRAFANA_HOSTNAME:$GRAFANA_PORT/render$dashboardUrl?height=5000&width=2000&from=$startTestMilliseconds&to=$endTestMilliseconds" > ./results/$resultsSubDir/$K6_SCENARIO_NAME/images/$dashboard_string.png
  fi
done

# Generate an empty README
echo "# Scenario ${K6_SCENARIO_NAME}: ${K6_SCENARIO_DESCRIPTION}
Params: &from=${startTestMilliseconds}&to=${endTestMilliseconds}
" > ./results/$resultsSubDir/$K6_SCENARIO_NAME/README.md

echo "Epoch &from=${startTestMilliseconds}&to=${endTestMilliseconds}"
