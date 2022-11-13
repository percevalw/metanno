const config = require('@jupyterlab/galata/lib/playwright-config');
export default {
    ...config,
    testDir: './ui-tests',
}
