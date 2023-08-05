ALTER USER 'central_ledger'@'%' identified WITH mysql_native_password by 'password';
CREATE USER 'exporter'@'%' IDENTIFIED BY 'password';
GRANT PROCESS, REPLICATION CLIENT ON *.* TO 'exporter'@'%';
GRANT SELECT ON performance_schema.* TO 'exporter'@'%';
FLUSH PRIVILEGES;
