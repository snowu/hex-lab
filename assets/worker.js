importScripts('harness.js');
onmessage = async (e) => {
  const out = await self.runTests(e.data.code);
  postMessage(out);
};
