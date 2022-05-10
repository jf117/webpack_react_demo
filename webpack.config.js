const HtmlWebPackPlugin = require('html-webpack-plugin')
const path = require('path')
const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin') //使用 terser 来压缩 JavaScript 体积
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin  //各个js代码体积大小分布
// 把任务分解成多个子线程，并发执行
// 1.HappyPack 多进程模型，加速代码的构建
const HappyPack = require('happyPack')
// 根据cpu的数量创建线程池
const os = require('os'); 
const happyThreadPool = HappyPack.ThreadPool({size: 5})
// 2.thread-loader 将loader放到线程池里，达到多线程构建的功能


const { CleanWebpackPlugin } = require('clean-webpack-plugin')  // 清理dist文件夹

// tree-shaking 消除无用的js代码，集成在webpack中，无需另外配置

// 引入将css生成单独文件的插件
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  optimization: {
    // 使用缓存可以加快构建速度
    minimize: true,
    minimizer: [new TerserPlugin({
      // cache: true, //在webpack5中被忽略,使用上面的minimize
      parallel: true, // 开启打包多线程
      terserOptions: {
        compress: {
          unused: true, // 剔除无用的代码
          drop_debugger: true,  //剔除debug
          drop_console: true, //剔除console
          dead_code: true
        }
      }
    })],
    splitChunks: {
      cacheGroups: {
        styles: {
          name: "styles",
          type: "css/mini-extract",
          chunks: "all",
          enforce: true,
          minChunks: 1
        },
      },
    },
  },
  // 设置模块如何被解析
  resolve: {
     // 在引入模块时使用别名
    alias: {
      '@image': path.resolve(__dirname, 'src/image'),
    },
    // 在引入模块时不带扩展
    extensions: ['.wasm','.mjs','.js','.jsx','.json'],
  },
  entry: path.resolve(__dirname, 'src/index.jsx'),
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'bundle.js',
  },
  devServer: {
    hot: true,  //热更新-2
    // -- 指定服务端口，默认值=8080
    port: 3000,
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
  },
  // loader， loader本质是一个文件加载器，实现文件的转译编译功能
  module: {
    noParse: /node_modules\/(jquery\.js)/,  //不需要构建node_modules里的jquery
    rules: [
      // thread-loader 放在所有的最前面
      // {
      //   test: /\.js$/,
      //   include: path.resolve('src'),
      //   use: [
      //     'thread-loader'
      //   ]
      // },
      {
        test: /\.jsx?/,
        exclude: /node_modules/,
        use: [
          {
            // 编译文件
            loader: 'babel-loader',
            options: {
              babelrc: false, //不需要遍历去找babelrc文件
              presets: [  //指定规则
                require.resolve('@babel/preset-react'),
                // 后面一个参数：编译es6的时候，是否需要把import当做es6的一部分进行编译，
                // 因为webpack能够识别import和export，所以就不要去编译
                [require.resolve('@babel/preset-env',{module: false})],
              ],
              cacheDirectory: true, //是否对编译结果做缓存
            }
          },
        ]
      },
      {
        test: /\.css$/, // 对于.css结尾的文件
        exclude: /node_modules/, // 排除node_modules，不对其进行处理
        use: [ // 使用指定的loader 执行顺序 下 → 上,所以要先用css-loader解析，然后用style-loader生成style标签插入页面
          // 注意此处的style-loader改成使用MiniCssExtractPlugin插件的loader
          MiniCssExtractPlugin.loader,
          // 'style-loader', // 为解析后的样式生成style标签并插入页面中 npm install style-loader --save-dev
          'css-loader', // 使用css-loader解决css语法解析的问题 需 npm install css-loader --save-dev
        ]
      },
      {
        test: /\.(png|jpg|gif)/i,
        use: [
          // 'file-loader',
          {
            // 具体使用的loader
            loader: 'url-loader',
            // 配置该loader的选项
            options: {
              esModule: false,
              // 超过指定大小的图片参与打包，否则转为base64编码，单位是字节
              limit: 1024*4, // 超过4kb大小的图片参与打包
              // 将打包的图片统一放到img目录下，名称为：图片名称+8位hash码+图片后缀
              name: 'img/[name].[hash:8].[ext]'
            }
          },
        ]
      }
    ]
  },
  plugins:[
    // 该插件将为你生成一个 HTML5 文件， 
    // 在 body 中使用 script 标签引入你所有 webpack 生成的 bundle。
    new HtmlWebPackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
      filename: 'index.html'
    }),
    new CleanWebpackPlugin(),
    new webpack.HotModuleReplacementPlugin(), //热更新-1，在应用运行过程中，修改模块无需重新加载整个页面
    // new BundleAnalyzerPlugin(),
    new HappyPack({
      id: 'jsx',
      threadPool: happyThreadPool,
      loaders: ['babel-loader'],  //要支持happyPack的loader
    }),
    // 使用单独生成css文件的插件，打包时会将css文件独立出去
    new MiniCssExtractPlugin({
      // 指定文件的输出路径和文件名
      filename: "css/[name].css",
    })
  ]
}