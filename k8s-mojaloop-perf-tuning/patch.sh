#!/bin/sh
DIR=`dirname $(readlink -f "$0" 2> /dev/null)`

case "$1" in
audit)
    echo "switching to direct audit events"
    export ACCOUNT_TAG=v15.2.5-snapshot.3
    export QUOTE_TAG=v15.7.2-snapshot.4
    export LEDGER_TAG=v17.6.4-snapshot.2
    export ML_API_TAG=v14.0.6-snapshot.0
    export EVENT_SDK_KAFKA=./.EVENT_SDKrc
    export EVENT_SIDECAR_DISABLED=false
    export EVENT_SDK_AUDIT=kafka
    export EVENT_SDK_TRACE=off
    export EVENT_SDK_LOG=off
;;
direct)
    echo "switching to direct events"
    export ACCOUNT_TAG=v15.2.5-snapshot.3
    export QUOTE_TAG=v15.7.2-snapshot.4
    export LEDGER_TAG=v17.6.4-snapshot.2
    export ML_API_TAG=v14.0.6-snapshot.0
    export EVENT_SDK_KAFKA=./.EVENT_SDKrc
    export EVENT_SIDECAR_DISABLED=false
    export EVENT_SDK_AUDIT=
    export EVENT_SDK_TRACE=
    export EVENT_SDK_LOG=
;;
disabled)
    echo "switching to disabled sidecar"
    export ACCOUNT_TAG=v15.2.4
    export QUOTE_TAG=v15.7.1
    export LEDGER_TAG=v17.6.2
    export ML_API_TAG=v14.0.5
    export EVENT_SDK_KAFKA=
    export EVENT_SIDECAR_DISABLED=true
;;
schema)
    echo "schema creation"
    export LEDGER_TAG=v17.6.2
    kubectl patch deployment --kubeconfig k8s.yaml --namespace mojaloop moja-centralledger-service                  -p "$(envsubst <$DIR/ledger-service.yaml)"
    sleep 10 # wait for schema creation
    kubectl scale            --kubeconfig k8s.yaml --namespace mojaloop deployment/moja-centralledger-service       --replicas=8
    exit 0
;;
init)
    echo "installing RedPanda"
    kubectl apply --kubeconfig k8s.yaml -f "$DIR/redpanda-app.yaml"
    sleep 10
    kubectl apply --kubeconfig k8s.yaml -f "$DIR/redpanda-service.yaml"
    exit 0
;;
*)
    echo "switching to baseline"
    export ACCOUNT_TAG=v15.2.4
    export QUOTE_TAG=v15.7.1
    export LEDGER_TAG=v17.6.2
    export ML_API_TAG=v14.0.5
    export EVENT_SDK_KAFKA=
    export EVENT_SIDECAR_DISABLED=false
;;
esac

kubectl apply --kubeconfig k8s.yaml -f "$DIR/config-override.yaml"
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
