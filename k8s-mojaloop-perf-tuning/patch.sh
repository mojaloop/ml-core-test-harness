#!/bin/sh

case "$1" in
direct)
    echo "switching to direct events"
    export ACCOUNT_TAG=v15.2.5-snapshot.2
    export QUOTE_TAG=v15.7.2-snapshot.1
    export LEDGER_TAG=v17.6.4-snapshot.1
    export EVENT_DIRECT=config/default.json
    export EVENT_SIDECAR_DISABLED=false
;;
disabled)
    echo "switching to disabled sidecar"
    export ACCOUNT_TAG=v15.2.5-snapshot.1
    export QUOTE_TAG=v15.7.2-snapshot.0
    export LEDGER_TAG=v17.6.4-snapshot.0
    export EVENT_DIRECT=
    export EVENT_SIDECAR_DISABLED=true
;;
*)
    echo "switching to baseline"
    export ACCOUNT_TAG=v15.2.4
    export QUOTE_TAG=v15.7.1
    export LEDGER_TAG=v17.6.1
    export EVENT_DIRECT=
    export EVENT_SIDECAR_DISABLED=false
;;
esac

DIR=`dirname $(readlink -f "$0" 2> /dev/null)`
# kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-centralledger-service                  --patch-file $DIR/ledger-service.yaml
# sleep 10 # wait for schema creation
# kubectl scale            --kubeconfig k8s.yaml --namespace mojaloop deployment/moja-centralledger-service       --replicas=8
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-account-lookup-service                 -p "$(envsubst <$DIR/account-service.yaml)"
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-ml-api-adapter-service                 -p "$(envsubst <$DIR/adapter-service.yaml)"
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-ml-api-adapter-handler-notification    -p "$(envsubst <$DIR/adapter-handler.yaml)"
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-centralledger-handler-admin-transfer   -p "$(envsubst <$DIR/transfer-admin.yaml)"
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-centralledger-handler-transfer-get     -p "$(envsubst <$DIR/transfer-get.yaml)"
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-centralledger-handler-transfer-prepare -p "$(envsubst <$DIR/transfer-prepare.yaml)"
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-centralledger-handler-transfer-fulfil  -p "$(envsubst <$DIR/transfer-fulfil.yaml)"
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-handler-pos-batch                      -p "$(envsubst <$DIR/transfer-position.yaml)"
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-centralledger-handler-timeout          -p "$(envsubst <$DIR/transfer-timeout.yaml)"
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-quoting-service                        -p "$(envsubst <$DIR/quoting-service.yaml)"
kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-quoting-service-handler                -p "$(envsubst <$DIR/quoting-handler.yaml)"
