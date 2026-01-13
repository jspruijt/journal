console.log = (...args) => { window.__COPILOT_LOG = (window.__COPILOT_LOG || []).concat([args]); };
