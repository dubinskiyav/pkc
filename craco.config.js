const CracoAntDesignPlugin = require("craco-antd");
const path = require("path");

process.env.BROWSER = "none";

module.exports = {
  plugins: [
    {
      plugin: require('craco-less'),
      options: {
        lessLoaderOptions: {
          lessOptions: {
            javascriptEnabled: true
          }
        }
      }
    },    
    {
      plugin: CracoAntDesignPlugin,
      options: {
        customizeThemeLessPath: path.join(
          __dirname,
          "src/resources/css/theme.less"
        ),
      }
    },
  ],
};