#! /bin/bash

# set the env vars from the IGNORE.env file
set -a
source ./IGNORE.env
set +a

# Start the server in the background
node localhost.js & SERVER_PID=$!

# Run k6 test
K6_SCRIPT_CONFIG_FILE_NAME=localhost.json k6 run ./index.js

# Stop the server after k6 finishes
kill $SERVER_PID
