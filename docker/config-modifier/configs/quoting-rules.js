// RULE_CURRENCY_LIMITS=USD:outgoing:incoming,EUR:outgoing:incoming
const currencyLimits = process.env.RULE_CURRENCY_LIMITS?.split(',').map(currencyLimit => currencyLimit.trim().split(':').map(part => part.trim())) || []
const proxyList = process.env.RULE_PROXY_LIST?.split(',').map(proxy => proxy.trim()) || []

const buffer = [...currencyLimits.map(([currency, outgoing, incoming]) => [{
    conditions: { // maximum outgoing amount
        all: [
            { fact: 'operation', operator: 'equal', value: 'fxQuoteRequest' },
            { fact: 'headers', path: '$.fspiop-proxy', operator: 'truthy', value: false },
            { fact: 'payload', path: '$.sourceAmount.currency', operator: 'equal', value: currency },
            { fact: 'payload', path: '$.sourceAmount.amount', operator: '>', value: Number(outgoing) }
        ]
    },
    event: {
        type: 'INVALID_QUOTE_REQUEST',
        params: { FSPIOPError: 'PAYER_LIMIT_ERROR', message: 'Invalid outgoing amount' }
    }
}, {
    conditions: { // maximum incoming amount
        all: [
            { fact: 'operation', operator: 'equal', value: 'quoteRequest' },
            { fact: 'headers', path: '$.fspiop-proxy', operator: 'truthy', value: true },
            { fact: 'payload', path: '$.amount.currency', operator: 'equal', value: currency },
            { fact: 'payload', path: '$.amount.amount', operator: '>', value: Number(incoming) }
        ]
    },
    event: {
        type: 'INVALID_QUOTE_REQUEST',
        params: { FSPIOPError: 'PAYER_LIMIT_ERROR', message: 'Invalid incoming amount' }
    }
}]).flat(), {
    conditions: { // outgoing corridor allowed currencies
        all: [
            { fact: 'operation', operator: 'equal', value: 'quoteRequest' },
            { fact: 'headers', path: '$.fspiop-proxy', operator: 'truthy', value: false },
            { fact: 'payload', path: '$.amount.currency', operator: 'notIn', value: currencyLimits.map(([currency]) => currency )}
        ]
    },
    event: {
        type: 'INVALID_QUOTE_REQUEST',
        params: { FSPIOPError: 'PAYER_UNSUPPORTED_CURRENCY', message: 'Invalid currency' }
    }
}]


const regional = [...currencyLimits.map(([currency, limit]) => ({
    conditions: { // transfer limit
        all: [
            { fact: 'operation', operator: 'equal', value: 'quoteRequest' },
            { fact: 'payload', path: '$.amount.currency', operator: 'equal', value: currency },
            { fact: 'payload', path: '$.amount.amount', operator: '>', value: Number(limit) }
        ]
    },
    event: {
        type: 'INVALID_QUOTE_REQUEST',
        params: { FSPIOPError: 'PAYER_LIMIT_ERROR', message: 'Invalid amount' }
    }
})), {
    conditions: { // allowed proxies
        all: [
            { fact: 'operation', operator: 'equal', value: 'quoteRequest' },
            { fact: 'headers', path: '$.fspiop-proxy', operator: 'truthy', value: true },
            { fact: 'headers', path: '$.fspiop-proxy', operator: 'notIn', value: proxyList }
        ]
    },
    event: {
        type: 'INVALID_QUOTE_REQUEST',
        params: { FSPIOPError: 'DESTINATION_FSP_ERROR', message: 'Invalid proxy' }
    }
}, {
    conditions: { // allowed currencies
        all: [
            { fact: 'operation', operator: 'equal', value: 'quoteRequest' },
            { fact: 'payload', path: '$.amount.currency', operator: 'notIn', value: currencyLimits.map(([currency]) => currency) }
        ]
    },
    event: {
        type: 'INVALID_QUOTE_REQUEST',
        params: { FSPIOPError: 'PAYER_UNSUPPORTED_CURRENCY', message: 'Invalid currency' }
    }
}
]

module.exports = { buffer, regional }[process.env.RULE_PROFILE] || []
