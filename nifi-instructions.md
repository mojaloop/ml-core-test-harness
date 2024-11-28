# Instructions to start apache nifi and configuration steps

Run `apache nifi`

## Pre-requisites

- git
- docker
- docker-compose

## Starting mojaloop core services 

Execute the following commands to run mojaloop in local machine to boot up Finance portal

```bash
git clone https://github.com/mojaloop/ml-core-test-harness.git
cd ml-core-test-harness
docker-compose --profile all-services --profile fx --profile finance-portal --profile ttk-provisioning-fx --profile ttk-fx-tests --profile debug up -d
```

Wait for some time to get all the containers up and healthy.
You can check the status of the containers using the command `docker ps`.

## Opening apache nifi in web browser

Once the finance-portal profile is running and is in healthy state.

- Open the URL `https://localhost:8443/nifi`
- Now enter username as `admin` and password as `password@1234`
- This will open the apache nifi web interface and you can take a look at the flows defined and running

## Update nifi configuration

Following are the environment variables that are being used at the moment and can be updated

- `SINGLE_USER_CREDENTIALS_USERNAME` Sets the username for the user login
- `SINGLE_USER_CREDENTIALS_PASSWORD` Sets the password for the user login , password must be minimum 12 characters.
- `MONGO_CONNECTION_URI` URL for the mongodb connection used by the connection service in nifi
- `MYSQL_CONNECTION_URI` URL for the mysql conncetion used by the connection service in nifi
