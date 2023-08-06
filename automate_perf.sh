#!/bin/bash

source ./automate_perf.env

# define the list of dashboards
declare -a dashboards=("dashboard-account-lookup-service" "Docker%20Prometheus%20Monitoring" "NodeJS%20Application%20Dashboard" "Official%20k6%20Test%20Result")

# store current time in a variable
echo "Start Time : $(date +"%T")"
startTestSeconds=$(date +"%s")

env K6_SCRIPT_CONFIG_FILE_NAME=$K6_SCENARIO_CONFIG docker compose --project-name load -f docker-compose-load.yml up -d

# Replace 'your_container_name' with the actual name of your Docker container
CONTAINER_NAME="load-k6-1"

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

# # create a directory to store the results with date timestamp in the name, check if the directory exists
resultsSubDir="$(date +"%Y-%m-%d")"

if [ ! -d "results/$resultsSubDir/$K6_SCENARIO_NAME" ]; then
  mkdir -p results/$resultsSubDir/$K6_SCENARIO_NAME
fi

# Add sleep 10s for grafana to catchup with the metrics
sleep 10

# loop through the array
for dashboard in "${dashboards[@]}"
do
   echo "$dashboard"
   dashboardUrl=$(curl http://$GRAFANA_USERNAME:$GRAFANA_PASSWORD@$GRAFANA_HOSTNAME:$GRAFANA_PORT/api/search\?query\=$dashboard | jq -r '.[].url')
   curl http://$GRAFANA_USERNAME:$GRAFANA_PASSWORD@$GRAFANA_HOSTNAME:$GRAFANA_PORT/render$dashboardUrl\?height\=4000\&width\=2000\&from\=now-5m\&to\=now > ./results/$resultsSubDir/$K6_SCENARIO_NAME/$dashboard.png
done

