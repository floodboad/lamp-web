'use strict'
const settings = require('./src/settings.js')
const path = require('path')
function resolve (dir) {
  return path.join(__dirname, dir)
}

const name = settings.title // page title
// If your port is set to 80,
// use administrator privileges to execute the command line.
// For example, Mac: sudo npm run
// const port = 9527 // dev port

const targetUrl = process.env.VUE_APP_DEV_REQUEST_DOMAIN_PREFIX
const proxyUrl = process.env.VUE_APP_BASE_API

// console.log(process.env.VUE_APP_DEV_REQUEST_DOMAIN_PREFIX)
// console.log(process.env.VUE_APP_BASE_API)
// console.log(process.env.VUE_APP_PROD_REQUEST_DOMAIN_PREFIX)
// console.log(process.env)

// All configuration item explanations can be find in https://cli.vuejs.org/config/
module.exports = {
  /**
   * You will need to set publicPath if you plan to deploy your site under a sub path,
   * for example GitHub Pages. If you plan to deploy your site to https://foo.github.io/bar/,
   * then publicPath should be set to "/bar/".
   * In most cases please use '/' !!!
   * Detail: https://cli.vuejs.org/config/#publicpath
   */
  publicPath: './',
  outputDir: 'dist',
  // outputDir: process.env.VUE_APP_PROJECT_NAME,
  assetsDir: 'static',
  lintOnSave: process.env.NODE_ENV === 'development',
  productionSourceMap: false,
  devServer: {
    // port: port,
    open: true,
    overlay: {
      warnings: false,
      errors: true
    },
    contentBase: './',
    proxy: {
      // change xxx-api/login => ≥mock/login
      // detail: https://cli.vuejs.org/config/#devserver-proxy
      [proxyUrl]: {
        target: targetUrl,
        changeOrigin: true,
        pathRewrite: {
          // lamp-boot 项目 请使用以下的配置
          // ['^/api/tenant/']: '/',
          // ['^/api/oauth/']: '/',
          // ['^/api/authority/']: '/',
          // ['^/api/msg/']: '/',
          // ['^/api/file/']: '/',
          // ['^/api/gateway/']: '/gateway',
          // ['^/api/gate/']: '/',
          // ['^/api/activiti/']: '/',

          // lamp-cloud  项目使用这段配置
          ['^' + proxyUrl]: proxyUrl,
        }
      }
    }
  },
  configureWebpack: {
    // provide the app's title in webpack's name field, so that
    // it can be accessed in index.html to inject the correct title.
    name: name,
    resolve: {
      alias: {
        '@': resolve('src')
      }
    }
  },
  chainWebpack (config) {
    config.plugins.delete('preload') // TODO: need test
    config.plugins.delete('prefetch') // TODO: need test

    // set svg-sprite-loader
    config.module
      .rule('svg')
      .exclude.add(resolve('src/icons'))
      .end()
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: '[name]'
        // symbolId: 'icon-[name]'
      })
      .end().use('svgo-loader').loader('svgo-loader')
      .tap(options => ({...options, plugins: [{removeAttrs: {attrs: 'fill'}}]})).end();

    // set preserveWhitespace
    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap(options => {
        options.compilerOptions.preserveWhitespace = true
        return options
      })
      .end()

    config
      // https://webpack.js.org/configuration/devtool/#development
      .when(process.env.NODE_ENV === 'development',
        config => config.devtool('cheap-source-map')
      )

    config
      .when(process.env.NODE_ENV !== 'development',
        config => {
          config
            .plugin('ScriptExtHtmlWebpackPlugin')
            .after('html')
            .use('script-ext-html-webpack-plugin', [{
              // `runtime` must same as runtimeChunk name. default is `runtime`
              inline: /runtime\..*\.js$/
            }])
            .end()
          config
            .optimization.splitChunks({
              chunks: 'all',
              cacheGroups: {
                libs: {
                  name: 'chunk-libs',
                  test: /[\\/]node_modules[\\/]/,
                  priority: 10,
                  chunks: 'initial' // only package third parties that are initially dependent
                },
                elementUI: {
                  name: 'chunk-elementUI', // split elementUI into a single package
                  priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
                  test: /[\\/]node_modules[\\/]_?element-ui(.*)/ // in order to adapt to cnpm
                },
                commons: {
                  name: 'chunk-commons',
                  test: resolve('src/components'), // can customize your rules
                  minChunks: 3, //  minimum common number
                  priority: 5,
                  reuseExistingChunk: true
                }
              }
            })
          config.optimization.runtimeChunk('single')
        }
      )
  }
}
