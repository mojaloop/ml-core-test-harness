openssl genrsa -out privatekey.pem 2048
openssl req -new -x509 -key privatekey.pem -out publickey.cer -days 1825 -subj "/CN=fspiopsimpayee/C=US/ST=Ohio/L=Columbus/O=User/OU=Testing"
