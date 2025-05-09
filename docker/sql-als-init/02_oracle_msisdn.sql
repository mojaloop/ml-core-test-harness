-- Create the oracle_msisdn database
CREATE DATABASE IF NOT EXISTS oracle_msisdn;

-- Create the oracle_msisdn user
CREATE USER 'oracle_msisdn'@'%' IDENTIFIED WITH mysql_native_password BY 'password';

-- Grant all privileges on the oracle_msisdn database to the oracle_msisdn user
GRANT ALL PRIVILEGES ON oracle_msisdn.* TO 'oracle_msisdn'@'%';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;