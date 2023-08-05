ALTER USER 'central_ledger'@'%' identified WITH mysql_native_password by 'password';
CREATE USER 'exporter'@'%' IDENTIFIED BY 'password';
GRANT PROCESS, REPLICATION CLIENT ON *.* TO 'exporter'@'%';
GRANT SELECT ON performance_schema.* TO 'exporter'@'%';
CREATE USER 'grafanaReader' IDENTIFIED BY 'password';
GRANT SELECT ON central_ledger.transferStateChange TO 'grafanaReader';
GRANT SELECT ON information_schema.TABLES TO 'grafanaReader';
FLUSH PRIVILEGES;
