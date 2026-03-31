const { defineConfig } = require('vite');
const { resolve } = require('path');

module.exports = defineConfig({
    build: {
        rollupOptions: {
            input: {
                index: resolve(__dirname, 'index.html'),
                about: resolve(__dirname, 'about.html'),
                throughTheCurtains: resolve(__dirname, 'ThroughTheCurtains.html'),
                amPhotographer: resolve(__dirname, 'AMPhotographer.html'),
                msbFashionStylist: resolve(__dirname, 'MSBFashionStylist.html')
            }
        }
    }
});
