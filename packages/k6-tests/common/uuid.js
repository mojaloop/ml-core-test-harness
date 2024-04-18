import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const random = len => randomString(len, '0123456789abcdef')
export function uuid() {
  const t = Date.now().toString(16).padStart(12, 0);
  return `${t.substring(0,8)}-${t.substring(8,12)}-4${random(3)}-9${random(3)}-${random(12)}`
}

