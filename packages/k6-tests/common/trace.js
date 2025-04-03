import crypto from "k6/crypto";

// Precomputed Hex Octets w/ for Loop (Fastest/Baseline)
const byteToHex = [];

for (let n = 0; n <= 0xff; ++n)
{
    const hexOctet = n.toString(16).padStart(2, "0");
    byteToHex.push(hexOctet);
}

function hex(arrayBuffer)
{
    const buff = new Uint8Array(arrayBuffer);
    const hexOctets = []; // new Array(buff.length) is even faster (preallocates necessary array size), then use hexOctets[i] instead of .push()

    for (let i = 0; i < buff.length; ++i)
        hexOctets.push(byteToHex[buff[i]]);

    return hexOctets.join("");
}

// Trace utilities
class TraceParent {
  traceId;
  parentId;
  traceFlags;
  constructor () {
    // Ref: https://github.com/mojaloop/mojaloop-specification/blob/master/fspiop-api/documents/Tracing%20v1.0.md#table-2--data-model-for-tracing-values
    this.traceId = hex(crypto.randomBytes(16));
    this.parentId = hex(crypto.randomBytes(8));
    this.traceFlags = '00';
  }

  toString () {
    return `00-${this.traceId}-${this.parentId}-${this.traceFlags}`;
  };

}

export function Trace (...args) {
  return new TraceParent(...args);
}
