#!/bin/sh
if [ "$#" -ne 1 ] ; then
  echo "Usage: $0 <container_name>" >&2
  exit 1
fi

while true
do
  if output=$(docker wait $1 2>&1); then
    echo "Container $1 exited with success status"
    exit 0
  else
    if [[ $output =~ "No such container" ]]; then
      echo "Waiting for the container $1 ..."
    else
      echo "Container $1 exited with failed status"
      exit 1
    fi
  fi
  sleep 1
done
