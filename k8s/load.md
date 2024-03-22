# Performance characterization report

All tests are performed with VU ramping using the following config:
```json
{
    "executor": "ramping-vus",
    "startVUs": 5,
    "stages": [
        { "duration": "30s", "target": 600 },
        { "duration": "1m", "target": 1000 },
        { "duration": "2m", "target": 1000 }
    ]
}
```

| test           | peak ops/sec  | screenshot                    | DB     | Sidecars | deployment replicas                                            |
| -------------- | ---------     | ----------                    | --     | --       | ------                                                         |
| Account lookup |  825          | ![](als-disk-sidecars-8.png)  | disk   | enabled  |  8 x moja-account-lookup-service                               |
| Account lookup |  1042         | ![](als-disk-sidecars-12.png) | disk   | enabled  | 12 x moja-account-lookup-service                               |
| Quoting        |  107          | ![](qs-ram-sidecars-12.png)   | RAM    | enabled  | 12 x moja-quoting-service-handler, 12 x moja-quoting-service   |
| Quoting        |  109          | ![](qs-ram-12.png)            | RAM    | disabled | 12 x moja-quoting-service-handler, 12 x moja-quoting-service   |
| Quoting        |  61           | ![](qs-ram-sidecars-6.png)    | RAM    | enabled  |  6 x moja-quoting-service-handler,  6 x moja-quoting-service   |
| Quoting        |  62           | ![](qs-ram-6.png)             | RAM    | disabled |  6 x moja-quoting-service-handler,  6 x moja-quoting-service   |
