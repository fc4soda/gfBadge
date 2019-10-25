const path = require('path');
const merge = require('webpack-merge')
const common = require('./common.config.js')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const devMode = process.env.NODE_ENV !== 'production';

module.exports = merge(common, {
	mode: 'development',
	devtool: 'inline-source-map',
	devServer: {
		hot: true,
		contentBase: './dist',
		host: 'localhost',
		port: '8888',
		//publicPath: '/gfbadge/',
		//open: true,
	},	
	plugins: [
		new MiniCssExtractPlugin({
			filename: '[name].css',
			chunkFilename: '[id].css',
			ignoreOrder: false,
		}),
	],
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist_dev'),
		//path: path.join(__dirname, 'dist'),
		//publicPath: '/gfbadge/',
	},
	module: {
		rules: [
			{
				test: /\.(sa|sc|c)ss$/i,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							hmr: process.env.NODE_ENV === 'development',
						},
					},
					'css-loader',
					'sass-loader',
				],
			},
			{
				test: /\.(png|svg|jpg|gif|ico)$/,
				use: [
					{
						loader: "file-loader",
						options: {
							name: '[path][name].[ext]',
						}
					}
				]
			}
		]
	},
	resolve: {
		alias: {
			"vue$": "vue/dist/vue.js"
		}
	}
});
