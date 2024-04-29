#!/bin/sh
DIR=`dirname $(readlink -f "$0" 2> /dev/null)`

kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-centralledger-service                  --patch-file $DIR/ledger-service.yaml
sleep 10 # wait for schema creation
kubectl scale            --kubeconfig k8s.yaml --namespace mojaloop deployment/moja-centralledger-service       --replicas=8
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-account-lookup-service                 --patch-file $DIR/account-service.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-ml-api-adapter-service                 --patch-file $DIR/adapter-service.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-ml-api-adapter-handler-notification    --patch-file $DIR/adapter-handler.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-centralledger-handler-admin-transfer   --patch-file $DIR/transfer-admin.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-centralledger-handler-transfer-get     --patch-file $DIR/transfer-get.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-centralledger-handler-transfer-prepare --patch-file $DIR/transfer-prepare.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-centralledger-handler-transfer-fulfil  --patch-file $DIR/transfer-fulfil.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-handler-pos-batch                      --patch-file $DIR/transfer-position.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-centralledger-handler-timeout          --patch-file $DIR/transfer-timeout.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-quoting-service                        --patch-file $DIR/quoting-service.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-quoting-service-handler                --patch-file $DIR/quoting-handler.yaml
