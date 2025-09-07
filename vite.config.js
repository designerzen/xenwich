export default {
  base: process.env.NODE_ENV === 'production' ? '/xenwich/' : '/',
  server: {
    port: 5174 // Match the port Audiotool expects
  }
}

