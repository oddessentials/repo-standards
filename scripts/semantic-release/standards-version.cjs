const { syncStandardsVersion } = require("../sync-standards-version.cjs");

module.exports = {
  prepare: (pluginConfig, context) => {
    const version = context?.nextRelease?.version;
    syncStandardsVersion({
      version,
      logger: context?.logger ?? console,
    });
  },
};
