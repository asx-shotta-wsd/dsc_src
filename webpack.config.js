const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // 追加
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './index.js', // 入力ファイル
  output: {
    filename: 'bundle.js', // 出力されるバンドルファイル
    path: path.resolve(__dirname, 'dist') // 出力先ディレクトリ
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/, // CSS ファイルを処理
        use: [MiniCssExtractPlugin.loader, 'css-loader'] // MiniCssExtractPlugin を利用
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html' // HTMLのテンプレート
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'assets', to: 'assets' },
        { from: 'favicon.ico', to: 'favicon.ico' }, // favicon.ico を dist にコピー
      ]
    }),
    new MiniCssExtractPlugin({ filename: 'index.css' }) // CSS を dist に出力
  ],
  resolve: {
    alias: {
      three: path.resolve(__dirname, 'node_modules/three'),
    },
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // console.logを削除
            drop_debugger: true, // debuggerを削除
            passes: 3, // 圧縮の繰り返し回数を増やす
          },
          output: {
            comments: false, // コメントを削除
          },
        },
      }),
    ],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000,
    open: true, // 自動でブラウザを開く
    historyApiFallback: true, // ルーティング問題を防ぐ
  },
  mode: 'production' // 本番環境用の設定,

};

