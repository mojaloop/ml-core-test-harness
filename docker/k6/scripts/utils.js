

export const Trace = {
  generateTraceParent: () => {
    return `00-${crypto.randomBytes(16)}-${crypto.randomBytes(8)}-${crypto.randomBytes(1)}`
  }
}
