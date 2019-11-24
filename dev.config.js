const path = require('path');
const merge = require('webpack-merge')
const common = require('./common.config.js')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

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
		new webpack.DefinePlugin({
			PRD_PREFIX: JSON.stringify('test/'),
			SITE_PV_URL: JSON.stringify('https://www.fc4soda.moe/kis3/stats?view=count&url=localhost:8888&format=json'),
			SITE_PV_CHART_URL: JSON.stringify('https://www.fc4soda.moe/kis3/stats?view=months&url=localhost:8888&format=chart'),
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
			"vue$": "vue/dist/vue.min.js"
		}
	}
});
