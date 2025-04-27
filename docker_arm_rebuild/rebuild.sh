#!/bin/bash

# Load the .env file into the environment
set -a
source ../.env
set +a

# Function to clone repo, checkout specific tag, and build docker image
build_docker_image_from_repo() {
  IMAGE=$1
  REPO=$2
  TAG=$3

  # Extract repo name for tagging image
  REPO_NAME=$(basename "$REPO" .git)

  echo "Building Docker image from repo $REPO with tag $TAG"

  # Clone the repo
  git clone "$REPO"
  cd "$REPO_NAME" || exit

  # Checkout the specified tag
  git checkout "$TAG"

  # Build the Docker image for ARM64
  docker build -t "$IMAGE" .

  # Cleanup and go back to parent directory
  cd .. || exit
  rm -rf "$REPO_NAME"
}

# Extract all images from docker-compose.yaml that reference environment variables
IMAGES=$(grep -o 'image:.*${.*}' ../docker-compose.yml | sed -E 's/image: *//')

# 2. Create a temporary file to track unique image repo + tag combinations
touch processed_images.txt

for IMAGE in $IMAGES
do
  # Remove any quotes around the image string
  IMAGE=$(echo $IMAGE | sed 's/^"//;s/"$//')

  # Extract the base image and variable name
  BASE_IMAGE=$(echo "$IMAGE" | cut -d':' -f1)
  VAR_NAME=$(echo "$IMAGE" | sed -E 's/.*\$\{([^}]+)\}.*/\1/')

  # Check if the variable exists in the environment
  if [ -z "${!VAR_NAME}" ]; then
    echo "Error: Variable $VAR_NAME not found in the environment"
    exit 1
  fi

  # Construct the full image name with the resolved version
  RESOLVED_IMAGE="$BASE_IMAGE:${!VAR_NAME}"

  # Check if the image starts with "mojaloop/"
  if [[ $RESOLVED_IMAGE == mojaloop/* ]] ; then
    if { [[ $# -eq 0 ]] || [[ $RESOLVED_IMAGE == mojaloop/$*:* ]]; }; then
      # Extract the image repo name (mojaloop/account-lookup-service) and tag (v15.4.0-snapshot.33)
      REPO_NAME=$(echo "$RESOLVED_IMAGE" | cut -d ':' -f 1 | sed 's#mojaloop/##') # account-lookup-service
      TAG=$(echo "$RESOLVED_IMAGE" | cut -d ':' -f 2)                             # v15.4.0-snapshot.33

      # Construct the Git repository URL based on the repo name
      GIT_REPO="https://github.com/mojaloop/$REPO_NAME"

      # Create a unique key combining the repo and tag (to handle duplicates)
      UNIQUE_KEY="$REPO_NAME:$TAG"

      # Check if this unique key has already been processed
      if ! grep -q "$UNIQUE_KEY" processed_images.txt; then
        # Mark this image as processed by writing it to the temporary file
        echo "$UNIQUE_KEY" >> processed_images.txt

        # Run the build function in the background
        echo "Building Docker image $RESOLVED_IMAGE from repo $GIT_REPO with tag $TAG"
        build_docker_image_from_repo "$RESOLVED_IMAGE" "$GIT_REPO" "$TAG" &
      else
        echo "Skipping duplicate image: $RESOLVED_IMAGE"
      fi
    else
      echo "Skipping image: $RESOLVED_IMAGE"
    fi
  else
    echo "Skipping non-mojaloop image: $RESOLVED_IMAGE"
  fi
done

# Wait for all background jobs to finish
wait

# Clean up the temporary file
rm processed_images.txt
