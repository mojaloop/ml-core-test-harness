#!/bin/sh
# kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-centralledger-service                  --patch-file patch/ledger-service.yaml
# sleep 10 # wait for schema creation
# kubectl scale            --kubeconfig k8s.yaml --namespace mojaloop deployment/moja-centralledger-service       --replicas=8
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-account-lookup-service                 --patch-file patch/account-service.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-ml-api-adapter-service                 --patch-file patch/adapter-service.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-ml-api-adapter-handler-notification    --patch-file patch/adapter-handler.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-centralledger-handler-admin-transfer   --patch-file patch/transfer-admin.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-centralledger-handler-transfer-get     --patch-file patch/transfer-get.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-centralledger-handler-transfer-prepare --patch-file patch/transfer-prepare.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-centralledger-handler-transfer-fulfil  --patch-file patch/transfer-fulfil.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-handler-pos-batch                      --patch-file patch/transfer-position.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-centralledger-handler-timeout          --patch-file patch/transfer-timeout.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-quoting-service                        --patch-file patch/quoting-service.yaml
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-quoting-service-handler                --patch-file patch/quoting-handler.yaml
