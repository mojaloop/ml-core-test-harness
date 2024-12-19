export function replaceHeaders(headers) {
    if (__ENV.API_TYPE === 'iso20022') {
        headers['Accept'] = headers['Accept'].replace('.interoperability.', '.interoperability.iso20022.').replace(/version=.*/, 'version=2.0');
        headers['Content-Type'] = headers['Content-Type'].replace('.interoperability.', '.interoperability.iso20022.').replace(/version=.*/, 'version=2.0');
    }
    return headers;
}
