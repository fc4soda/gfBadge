import './index.scss';
import _ from 'lodash';
import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'
import 'bootstrap-vue/dist/bootstrap-vue.min.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue/dist/bootstrap-vue.min.js'
import VueI18n from 'vue-i18n'
import axios from 'axios';
import fontsCss from 'fonts.css/dist/fonts.css';

import jsonData from './data_format.json';
import { jsonTexts } from './langs.js';
Vue.use(BootstrapVue)
Vue.use(VueI18n)

function importAll(r) {
	return r.keys().map(r);
}

const messages = jsonTexts.textData;

const isPrd = (process.env.NODE_ENV === 'production' ? true : false);
const prdPrefix = PRD_PREFIX;
const sitePvUrl = SITE_PV_URL, sitePvChartUrl = SITE_PV_CHART_URL;

const images = importAll(require.context('../static/img/', true, /\.(png|jpe?g|svg)$/, 'sync'));

const STORE_KEY_SELECTED = 'selected', STORE_KEY_MOD = 'selectedMod', STORE_KEY_DEBOUNCE = 'selectedDebounce',
	  STORE_KEY_POSTER = 'selectedPoster', STORE_KEY_LANG = 'lang', STORE_KEY_RATE = 'selectedRate', STORE_KEY_SERVER = 'server';

const b64toChar1 = (b64Data) => {
	return atob(b64Data.split(',')[1]);
}

const b64toChar2 = (b64Data) => {
	return decodeURIComponent(b64Data.split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}
const encodeStr = (str) => {
	return encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    });
}
const b64CharToByteArray = (byteCharacters, sliceSize=512) => {
	const byteArrays = [];

	for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
		const slice = byteCharacters.slice(offset, offset + sliceSize);

		const byteNumbers = new Array(slice.length);
		for (let i = 0; i < slice.length; i++) {
			byteNumbers[i] = slice.charCodeAt(i);
		}

		const byteArray = new Uint8Array(byteNumbers);
		byteArrays.push(byteArray);
	}

	return byteArrays;
}

var saveData = (function () {
	var a = document.createElement("a");
	document.body.appendChild(a);
	a.style = "display: none";
	return function (byteArrays, contentType, fileName) {
		var blob = new Blob(byteArrays, {type: contentType}),
			url = window.URL.createObjectURL(blob);
		a.href = url;
		a.download = fileName;
		a.click();
		window.URL.revokeObjectURL(url);
		//a.remove();
	};
}());

function drawBox(ctx, x, y, w, h, lineWidth, percent){
	let grd = ctx.createLinearGradient(x, 0, x+w, 0);
	grd.addColorStop(0, "#b30000");
	grd.addColorStop(0.5, "#ffff00");
	grd.addColorStop(1, "#47d147");
	ctx.fillStyle = grd;
	ctx.lineWidth = lineWidth;
	ctx.fillRect(x, y, Math.floor(percent*w), h);
	ctx.strokeRect(x, y, w, h);
}

function drawGun(ctx, img, gunInfo, R){
	return drawHexagonImg(ctx, img, gunInfo.img, gunInfo.x, gunInfo.y, R, gunInfo.fillColor, 'black', UIData[currentCanvas]["guns"]["lineWidth"]);
}

function drawGunBlank(ctx, gunInfo, R){
	drawHexagon(ctx, gunInfo.x, gunInfo.y, R, gunInfo.fillColor, 'black', UIData[currentCanvas]["guns"]["lineWidth"]);
}

function drawHexagonImg(ctx, image, newSrc, x0, y0, R, fillColor, strokeStyle, lineWidth){
	let numberOfSides = 6,
		size = R,
		x = x0,
		y = y0,
		fx = Math.cos(1 / 6 * Math.PI),
		w = size * 2 * fx,
		h = size * 2,
		Xcenter = fx*size,
		Ycenter = size;


	let fun = function(){
		ctx.save();
		ctx.lineWidth = lineWidth;
		// outer line
		ctx.beginPath();
		ctx.moveTo( x0 +  Math.floor(size * Math.sin(0)), y0 +  Math.floor(size *  Math.cos(0)) );
		for (let i=1; i<=numberOfSides; i++) {
			ctx.lineTo (x0 + size * Math.sin(i * 2 * Math.PI / numberOfSides), y0 + size * Math.cos(i * 2 * Math.PI / numberOfSides));
		}
		ctx.closePath();
		ctx.clip();
		ctx.drawImage(image, 0, 0, image.width, image.width, Math.floor(x-size), y-size, 2*size, 2*size);
		ctx.strokeStyle = strokeStyle;
		ctx.stroke();
		ctx.restore();
	}
	return fun;
}



function drawHexagon(ctx, Xcenter, Ycenter, size, fillColor, strokeStyle, lineWidth){
	let numberOfSides = 6;

	ctx.lineWidth = lineWidth;
	ctx.globalAlpha = UIData[currentCanvas]["guns"]["alpha"];
	// fill hexagon
	ctx.beginPath();
	ctx.moveTo(Xcenter + size * Math.sin(0), Ycenter + size * Math.cos(0));
	for (let i=1; i<=numberOfSides; i++) {
		ctx.lineTo(Xcenter + size * Math.sin(i * 2 * Math.PI / numberOfSides), Ycenter + size * Math.cos(i * 2 * Math.PI / numberOfSides));
	}
	ctx.fillStyle = fillColor;
	ctx.fill();
	// outer line
	ctx.globalAlpha = 1;
	ctx.beginPath();
	ctx.moveTo (Xcenter +  size * Math.sin(0), Ycenter +  size *  Math.cos(0));
	for (let i=1; i<=numberOfSides; i++) {
		ctx.lineTo (Xcenter + size * Math.sin(i * 2 * Math.PI / numberOfSides), Ycenter + size * Math.cos(i * 2 * Math.PI / numberOfSides));
	}
	ctx.strokeStyle = strokeStyle;
	ctx.stroke();		
}

function drawUserAvatar(ctx){
	let c = UIData[currentCanvas].userAvatar;
	let img = new Image();
	img.onload = function(){
		// resize and cut to fit avatar box
		let sw=img.width, sh=img.height, 
			dw=c.w, dh=c.h;
		//ctx.clearRect(c.x,c.y,dw,dh);
		let xs=0, ys=0, ws=0, hs=0, f=0;
		if(sw<sh){
			xs=0, ws=sw, f=sw/dw, ys=0.5*(sh-dh*f), hs=dh*f; 
		} else {
			ys=0, hs=sh, f=sh/dh, xs=0.5*(sw-dw*f), ws=dw*f; 
		}
		ctx.drawImage(img, xs, ys, ws, hs, c.x, c.y, dw, dh);
	};
	img.src = selectedMod.userAvatar;
}

function drawText(ctx, content, x, y, font, fillStyle, lineWidth, strokeStyle, align, baseline){
	ctx.font = font;
	ctx.textAlign = align;
	ctx.textBaseline = baseline;
	if(lineWidth > 0){
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = strokeStyle;
		ctx.strokeText(content, x, y);
	}
	ctx.fillStyle = fillStyle;
	ctx.fillText(content, x, y);
}

const langs = jsonTexts.langs,
	  servers = jsonTexts.servers;

const star6 = '#ff4d4d',
	  star5 = '#ffb24d',
	  star4 = '#d4dca9',
	  star3 = '#b3e6ff',
	  star2 = 'white',
	  starEx = '#ccb3ff';
let userAvatarSize = 116, userAvatarX = 40, userAvatarY = 44,
	font = '-apple-system, "Noto Sans", "Helvetica Neue", Helvetica,\
	 "Nimbus Sans L", Arial, "Liberation Sans", "PingFang SC", "Hiragino Sans GB",\
	 "Noto Sans CJK SC", "Source Han Sans SC", "Source Han Sans CN", "Microsoft YaHei", \
	 "Wenquanyi Micro Hei", "WenQuanYi Zen Hei", "ST Heiti", SimHei, "WenQuanYi Zen Hei Sharp", sans-serif';
// TODO change px to ratio
var now = new Date().toISOString().split('T')[0],
	logo = "Girls' Frontline";
var UIData = {
	"mod":{
		"background":{
			"sw": Math.floor(850*1.1),
			"sh": Math.floor(220*1.1),
			"w": 850,
			"h": 220,
			"x": 0,
			"y": 400,
			"alpha": 0.7
		},
		"adjutant":{
			"x": 300,
			"y": -20,
			"w": 850,
			"h": 800
		},
		"userAvatar": {
			"x": userAvatarX,
			"y": userAvatarY,
			"w": userAvatarSize,
			"h": userAvatarSize,
			"lineWidth": 1,
			"strokeStyle": "black",
		},
		"collectionRateBox": {
			"x": 850-300-10,
			"y": 190,
			"w": 300,
			"h": 9,
		},
		"userName": {
			"x": 30,
			"y": 35,
			"font": '1.25rem '+font,
			"strokeStyle": "black",
			"lineWidth": 3,
			"fillStyle": "white",
			"align": 'left',
			"baseline": 'bottom',
		},
		"userLevel": {
			"x": userAvatarX + userAvatarSize/2,
			"y": userAvatarY + userAvatarSize + 21,
			"font": ".9rem "+font,
			"strokeStyle": "black",
			"lineWidth": 2,
			"fillStyle": "white",
			"align": 'center',
			"baseline": 'bottom',
			"w": 30,
			"h": 16,
		},
		"userServer": {
			"x": userAvatarX + userAvatarSize/2,
			"y": userAvatarY + userAvatarSize + 21 + 20,
			"font": "0.9rem "+font,
			"strokeStyle": "black",
			"lineWidth": 2,
			"fillStyle": "white",
			"align": 'center',
			"baseline": 'bottom',
			"w": 60,
			"h": 16,
		},
		"now": {
			"x": 5,
			"y": 217,
			"font": "0.65rem "+font,
			"strokeStyle": "grey",
			"lineWidth": 0,
			"fillStyle": "white",
			"align": 'left',
			"baseline": 'bottom'
		},
		"logo": {
			"x": 65,
			"y": 217,
			"font": "0.65rem "+font,
			"strokeStyle": "grey",
			"lineWidth": 0,
			"fillStyle": "white",
			"align": 'left',
			"baseline": 'bottom'
		},
		"collectionRate": {
			"x": 845,
			"y": 190,
			"font": "1.2rem "+font,
			"strokeStyle": "black",
			"lineWidth": 3,
			"fillStyle": "white",
			"align": 'right',
			"baseline": 'alphabetic'
		}, 
		"guns":{
			"x": 250,
			"y": 25,
			"r": 20,
			"limit": 10,
			"alpha": 0.3,
			"gap":0,
			"lineWidth": 0.7,
			"typeText":{
				"offset": -15,
				"font": '1.1rem '+font,
				"fillStyle":"white",
				"lineWidth": 2,
				"strokeStyle":'black',
				"align":'right',
				"baseline":'middle'
			},
			"numText":{
				"offset": 15,
				"font": '.9rem '+font,
				"fillStyle":"white",
				"lineWidth": 2,
				"strokeStyle":'black',
				"align":'left',
				"baseline":'middle'
			}
		},
		"fairy":{
			"x": 250,
			"y": 25,
			"r": 20,
			"limit": 10,
			"alpha": 0.3,
			"gap":0,
			"lineWidth": 0.7,
			"typeText":{
				"offset": -15,
				"font": '1.1rem '+font,
				"fillStyle":"white",
				"lineWidth": 2,
				"strokeStyle":'black',
				"align":'right',
				"baseline":'middle'
			},
			"numText":{
				"offset": 15,
				"font": '.9rem '+font,
				"fillStyle":"white",
				"lineWidth": 2,
				"strokeStyle":'black',
				"align":'left',
				"baseline":'middle'
			}
		}
	},
	"poster":{
		"background":{
			"sw": Math.floor(850*1.1),
			"sh": Math.floor(510*1.1),
			"w": 850,
			"h": 510,
			"x": 50,
			"y": 230,
			"alpha": 0.7
		},
		"adjutant":{
			"x": 300,
			"y": 100,
			"w": 850,
			"h": 800
		},
		"collectionRateBox": {
			"x": 850-300-10,
			"y": 510-20,
			"w": 300,
			"h": 9,
		},
		"userName": {
			"x": 30,
			"y": 32,
			"font": '1.25rem '+font,
			"strokeStyle": "black",
			"lineWidth": 3,
			"fillStyle": "white",
			"align": 'left',
			"baseline": 'bottom',
		},
		"userLevel": {
			"x": 850/2,
			"y": 30,
			"font": ".9rem "+font,
			"strokeStyle": "black",
			"lineWidth": 2,
			"fillStyle": "white",
			"align": 'center',
			"baseline": 'bottom',
			"w": 30,
			"h": 16,
		},
		"userServer": {
			"x": 850-30,
			"y": 30,
			"font": "1.1rem "+font,
			"strokeStyle": "black",
			"lineWidth": 2,
			"fillStyle": "white",
			"align": 'right',
			"baseline": 'bottom',
			"w": 60,
			"h": 16,
		},
		"now": {
			"x": 5,
			"y": 510-3,
			"font": "0.65rem "+font,
			"strokeStyle": "grey",
			"lineWidth": 0,
			"fillStyle": "white",
			"align": 'left',
			"baseline": 'bottom'
		},
		"logo": {
			"x": 65,
			"y": 510-3,
			"font": "0.65rem "+font,
			"strokeStyle": "grey",
			"lineWidth": 0,
			"fillStyle": "white",
			"align": 'left',
			"baseline": 'bottom'
		},
		"collectionRate": {
			"x": 845,
			"y": 510-20,
			"font": "1.2rem "+font,
			"strokeStyle": "black",
			"lineWidth": 3,
			"fillStyle": "white",
			"align": 'right',
			"baseline": 'alphabetic'
		}, 
		"guns":{
			"x": 80,
			"y": 30,
			"r": 11,
			"limit": 30,
			"alpha": 0.3,
			"gap": 12*0.8,
			"lineWidth": 0.7,
			"typeText":{
				"offset": -13,
				"font": '.9rem '+font,
				"fillStyle":"white",
				"lineWidth": 2,
				"strokeStyle":'black',
				"align":'right',
				"baseline":'middle'
			},
			"numText":{
				"offset": 13,
				"font": '.8rem '+font,
				"fillStyle":"white",
				"lineWidth": 1,
				"strokeStyle":'black',
				"align":'left',
				"baseline":'middle'
			}
		}
	}
};


var lang = "cn",
	server = "cn";
var selected = {
	"background":"BGDefult_fixed",
	"userServer": messages[lang].tabGeneral.server.nameDefault,
	"userAdjutant":"M4A1",
	"showAdjutant": true,
	"adjutantOffsetX": 0,
	"adjutantOffsetY": 0,
	"adjutantScaleFactor": 1,
	"adjutantCustomImg": "",
	"adjutantCustomOffsetX": 0,
	"adjutantCustomOffsetY": 0,
	"adjutantCustomScaleFactor": 1,
	"now": now,
	"logo": logo,
	"backgroundOffsetX": 0,
	"backgroundOffsetY": 0,
	"backgroundScaleFactor": 1,
	"backgroundAlpha": UIData.mod.background.alpha,
	"gunLiteBackgroundAlpha": UIData.mod.guns.alpha,
	"backgroundCustomImg": "",
	"backgroundCustomOffsetX": 0,
	"backgroundCustomOffsetY": 0,
	"backgroundCustomScaleFactor": 1,
	"backgroundCustomAlpha": UIData.mod.background.alpha,
	"backgroundCustomStretch": false,
}
var selectedMod = {
	"guns":[],
	"userAvatar": "",
}
var selectedPoster = {
	"guns":[],
}
var selectedDebounce = {
	"userName": messages[lang].tabGeneral.nameDefault,
	"userLevel": 1,
	"userServerCustom": "",
	"userUid": "",
}
var currentTab = 0;
var currentCanvas = "mod";
//var tabList = ["general", "team", "mod", "poster", "background", "adjust"];
var selectedRate = {
	"mod":{
		"collectionRate":{
			"got": 0,
			"AR":0,
			"SMG":0,
			"RF":0,
			"HG":0,
			"MG":0,
		},
		"coll":{
			"ARchecked": false,
			"SMGchecked": false,
			"RFchecked": false,
			"HGchecked": false,
			"MGchecked": false,
			"Allchecked": false,
		},
	},
	"poster": {
		"collectionRate":{
			"got": 0,
			"AR":0,
			"SMG":0,
			"RF":0,
			"HG":0,
			"SG":0,
			"MG":0,
		},
		"coll":{
			"ARchecked": false,
			"SMGchecked": false,
			"RFchecked": false,
			"HGchecked": false,
			"SGchecked": false,
			"MGchecked": false,
			"Allchecked": false,
		},
	},
}

function initGunPosition(xPos, yPos, R, gunList, limit, gap){
	let typeSum = Object.keys(gunList).length,
		fx = Math.cos(1/6*Math.PI),
		fy = R,
		fyy = Math.sin(1/6*Math.PI),
		result = {"guns":{}, "text":{}};
	let delta = 1;
	let jPrev = 1, sum=0, tt=0;
	for(let t in gunList){
		let l = gunList[t].length;
		if(l>0){
			for(let i=0; i<l; i++){
				//x = xPos+fx*R*(2*i+j%2);
				//y = yPos+j*R*(2-fyy);
				let ii = i%limit,
					jj = jPrev+Math.floor(i/limit),
					x = xPos+fx*R*(2*ii+(jj+1)%2),
					y = yPos+jj*R*(2-fyy)+tt*gap;
				let stars = gunList[t][i].stars, fillColor = "";
				switch(stars){
				case 2:
					fillColor = star2;
					break;
				case 3:
					fillColor = star3;
					break;
				case 4:
					fillColor = star4;
					break;
				case 5:
					fillColor = star5;
					break;
				case 6:
					fillColor = star6;
					break;
				case 'ex':
					fillColor = starEx;
					break;
				default:
					fillColor = star2;
				};
				result.guns[gunList[t][i].no] = {"x":Math.floor(x), "y":Math.floor(y), "fillColor":fillColor, "img":genImgName(gunList[t][i].img, 'avatar')};
				if(i==0){
					result.text[t] = {};
					result.text[t].name = {"x":Math.floor(x-fx*R), "y":Math.floor(y), "text":t };
				}
				if(i==(l-1)){ result.text[t].num = {"x":Math.floor(x+fx*R), "y":Math.floor(y), "text":l }; }
			}
			jPrev += Math.floor((l-1)/limit+1);
			tt ++;
			sum += l;
		}
	}
	result.sum = sum;
	return result;
}

function genImgName(img, type, damaged){
	let r = img;
	switch(type){
	case 'avatar':
		r = 'avatar/' + img;
		break;
	case 'tachie':
		r = 'tachie/' + img;
		break;
	case 'back':
		r = 'background/' + img;
		break;
	}
	if(damaged){
		r += '_D'
	}
	r = 'static/img/' + r;
	if(isPrd){
		r = prdPrefix + r;
	}
	r = r + '.png';
	return r;
}

function percentCalc(got, sum){
	return got+"/"+sum+" ("+(got*100/sum).toString().split('.')[0]+"%)";
}


function prepareData(initData, server){
	let result = {}
	let hgList=[], arList=[], smgList=[], rfList=[], mgList=[], sgList=[],
		hgSkinList=[], arSkinList=[], smgSkinList=[], rfSkinList=[], mgSkinList=[], sgSkinList=[];
	let modHgList=[], modArList=[], modSmgList=[], modRfList=[], modMgList=[], modSgList=[];
	for(let no in initData.allGun){
		let gun = initData.allGun[no],
			item = {
				"name": gun.name,
				"cnname": gun.cnname,
				"enname": gun.enname,
				"no": no,
				"stars": gun.stars,
				"imgs": gun.imgs,
				"mods": gun.mods,
				"skins": gun.skins,
				"img":gun.imgs[0]["img"],
				"imgDamaged":gun.imgs[0]["imgDamaged"]
			};
		if(server == 'cn' || gun[server+'exist']){

			if(gun.type=='AR'){
				arList.push(item);
				arSkinList.push(item);
			} else if(gun.type=='SMG'){
				smgList.push(item);
				smgSkinList.push(item);
			} else if(gun.type=='RF'){
				rfList.push(item);
				rfSkinList.push(item);
			} else if(gun.type=='HG'){
				hgList.push(item);
				hgSkinList.push(item);
			} else if(gun.type=='MG'){
				mgList.push(item);
				mgSkinList.push(item);
			} else if(gun.type=='SG'){
				sgList.push(item);
				sgSkinList.push(item);
			}

			if(gun.mods && (server=='cn' || gun.mods.mod3[server+'exist'])){
				var itemMod = {
					"name": gun.mods.mod3.name,
					"cnname": gun.mods.mod3.cnname,
					"enname": gun.mods.mod3.enname,
					"no": gun.mods.mod3.no,
					"img":gun.mods.mod3.img,
					"imgDamaged":gun.mods.mod3.imgDamaged,
					'stars': gun.mods.mod3.stars,
				};

				if(gun.type=='AR'){
					arSkinList.push(itemMod);
					modArList.push(itemMod);
				} else if(gun.type=='SMG'){
					smgSkinList.push(itemMod);
					modSmgList.push(itemMod);
				} else if(gun.type=='RF'){
					rfSkinList.push(itemMod);
					modRfList.push(itemMod);
				} else if(gun.type=='HG'){
					hgSkinList.push(itemMod);
					modHgList.push(itemMod);
				} else if(gun.type=='MG'){
					mgSkinList.push(itemMod);
					modMgList.push(itemMod);
				} else if(gun.type=='SG'){
					sgSkinList.push(itemMod);
					modSgList.push(itemMod);
				}
			}
			
			for(let s in gun.skins){
				let skin = gun.skins[s],
					itemSkin = {
						"name": skin.name,
						"cnname": skin.cnname,
						"enname": skin.enname,
						"no": skin.no,
						"img":skin.img,
						"imgDamaged":skin.imgDamaged
					};
				if(server=='cn' || skin[server+'exist']){
					if(gun.type=='AR'){
						arSkinList.push(itemSkin);
					} else if(gun.type=='SMG'){
						smgSkinList.push(itemSkin);
					} else if(gun.type=='RF'){
						rfSkinList.push(itemSkin);
					} else if(gun.type=='HG'){
						hgSkinList.push(itemSkin);
					} else if(gun.type=='MG'){
						mgSkinList.push(itemSkin);
					} else if(gun.type=='SG'){
						sgSkinList.push(itemSkin);
					}
				}

			}
		}
	}

	result.skinGunList = {
		AR: arSkinList,
		SMG: smgSkinList,
		RF: rfSkinList,
		MG: mgSkinList,
		SG: sgSkinList,
		HG: hgSkinList
	}

	result.skinGunList.NPC = [];
	for(let no in initData.npc){
		let gun = initData.npc[no],
			item = {
				"name": gun.name,
				"cnname": gun.cnname,
				"enname": gun.enname,
				"no": no,
				"imgs": gun.imgs,
				"img":gun.imgs[0]["img"],
				"imgDamaged":gun.imgs[0]["imgDamaged"],
				"type": gun.type
			};
		if(server == 'cn' || gun[server+'exist']){
			result.skinGunList.NPC.push(item);
		}

		for(let s in gun.skins){
			let skin = gun.skins[s],
				itemSkin = {
					"name": skin.name,
					"cnname": skin.cnname,
					"enname": skin.enname,
					"no": skin.no,
					"img":skin.img,
					"imgDamaged":skin.imgDamaged
				};
			if(server=='cn' || skin[server+'exist']){
				result.skinGunList.NPC.push(itemSkin);
			}

		}
	}
	result.skinGunList.ENEMY = [];
	for(let no in initData.enemy){
		let gun = initData.enemy[no],
			item = {
				"name": gun.name,
				"cnname": gun.cnname,
				"enname": gun.enname,
				"no": no,
				"imgs": gun.imgs,
				"skins": gun.skins,
				"img":gun.imgs[0]["img"],
				"imgDamaged":gun.imgs[0]["imgDamaged"],
				"type": gun.type
			};
		if(server == 'cn' || gun[server+'exist']){
			result.skinGunList.ENEMY.push(item);
		}
	}

	result.allGunList = {
		AR: arList,
		SMG: smgList,
		RF: rfList,
		MG: mgList,
		SG: sgList,
		HG: hgList
	}

	result.modGunList = {
		AR: modArList,
		SMG: modSmgList,
		RF: modRfList,
		MG: modMgList,
		SG: modSgList,
		HG: modHgList
	}

	result.modGunList = {
		AR: modArList,
		SMG: modSmgList,
		RF: modRfList,
		MG: modMgList,
		SG: modSgList,
		HG: modHgList
	}

	result.background = initData.background;

	return result;
}



function component(){
	Vue.component('team-gun-lite', {
		model: {
			prop: 'value',
			event: 'change'
		},
		props: {
			value: String,
			label: String,
			gun_name: String,
			id: String,
			img: String,
			img_d: String,
		},
		computed: {
			checked() {
				return this.value;
			},
			img_src() {
				return genImgName(this.img, 'avatar');
			},
			myid(){
				return 'team_' + this.id;
			},
			myid_d(){
				return 'team_' + this.id + '_d';
			},
			is_normal() {
				return this.img == this.value;
			},
			is_damaged() {
				return (this.img_d) == this.value;
			},
			has_damaged(){
				let r = this.img_d!=undefined && this.img_d!=''
				return r
			}
		},
		methods: {
			clickRadio(val) {
				this.checked = val;
				this.$emit("change", val);
			}
		},
		template: `
		<label v-b-tooltip.hover :title="label" class="gunLite d-inline-block mx-1 my-1" v-bind:class="{gunLiteSelected:gun_name==value}" label-cols="3" label-align="right"
			   v-bind:checked="checked" v-on:change="$emit('change', $event.target.value)" v-bind:label-for="myid">
		  <b-img v-bind:src="img_src" fluid v-bind:alt="label"></b-img>
		  <span>{{label}}</span>
		  <b-form-radio class="d-none" type="radio" name="teamRadio" :data-id="id" v-bind:value="img" v-bind:id="myid"></b-form-radio>

		  <label v-if="has_damaged" class="gunLiteDamaged border border-secondary" v-bind:class="{'bg-danger':is_damaged, 'text-white':is_damaged}" label-cols="3" label-align="right"
				 v-bind:label-for="myid_d">破
			<b-form-radio class="d-none" name="teamRadio" :data-id="id" v-bind:value="img_d" v-bind:id="myid_d"></b-form-radio>
		  </label>
		</label>`
	})
	
	Vue.component('mod-gun-lite', {
		props: {
			value: Array,
			label: String,
			gun_name: String,
			id: String,
			gun_type: String,
			collection_rate: Object,
		},
		data (){
			return {
				checkedProxy: []
			}
		},
		computed: {
			checked: {
				get() {
					return this.value;
				},
				set (v) {
					this.checkedProxy = v;
				}
			},
			img() {
				return genImgName(this.gun_name, 'avatar');
			},
			myid() {
				return 'mod_' + this.id;
			},
			is_checked() {
				if(this.value.includes(this.id)) {
					return true;
				}
				return false;
			}
		},
		methods: {
			onChange: function(e){
				if(this.is_checked){
					this.collection_rate[this.gun_type]--;
				} else{
					this.collection_rate[this.gun_type]++;
				}
				this.$emit('input', this.checkedProxy)
			},
			select: function(val){
				this.checkedProxy = val;
				this.$emit('input', this.checkedProxy)
			}
		},
		template: `
		  <label v-b-tooltip.hover :title="label" class="gunLite d-inline-block mx-1 my-1" v-bind:class="{gunLiteSelected:is_checked}" v-bind:for="myid">
			<b-img v-bind:src="img" fluid v-bind:alt="label"></b-img>
			<span>{{label}}</span>
			<input class="d-none" type="checkbox" v-bind:id="myid" name="modCheckbox" :data-id="id" :value="id" v-model="checked" @change="onChange" />
		  </label>`
	})
	

	Vue.component('gun-type', {
		props: ['type', 'guns'],
		data: function(){
			return {
				show: this.guns.length>0
			}
		},
		template: `
<div v-show='show' class='gunType border text-md-center mb-1 mt-3'>{{type}}</div v-show='show'>
`
	})

	Vue.component('gun-checkall', {
		model: {
			prop: 'checked',
			event: 'change'
		},
		props: ['guns', 'checked', 'selected'],
		methods: {
			onChange(e){
				var guns = this.guns,
					selected = this.selected;
				if(e=='true'){
					for(var type in guns) {
						guns[type].forEach(function(ele) {
							if(!selected.includes(ele.no)){
								selected.push(ele.no);
							}
						});
					}
				}else{
					for(var type in guns) {
						guns[type].forEach(function(ele) {
							selected.splice( selected.indexOf(ele.no), 1 ); 
						});
					}
				}
				this.$emit('change', e)
			}
		},
		template: `
<b-form-checkbox
type="checkbox"
name="modAll"
value="true"
unchecked-value="false"
v-bind:checked="checked"
v-on:change="onChange"
>全选所有</b-form-checkbox>
`
	})


	Vue.component('gun-type-checkbox', {
		model: {
			prop: 'checked',
			event: 'change'
		},
		props: ['guns', 'checked', 'type', 'selected', 'selected_rate', 'current_tab', 'text'],
		data: function(){
			return {
				show: this.guns.length>0
			}
		},
		methods: {
			onChange(e){
				var type = this.type,
					guns = this.guns,
					sele = this.selected.guns;
				if(e=='true'){
					guns.forEach(function(ele) {
						if(!sele.includes(ele.no)){
							sele.push(ele.no);
						}
					});
					this.selected_rate[this.current_tab].collectionRate[this.type] = this.guns.length;
				}else{
					guns.forEach(function(ele) {
						sele.splice( sele.indexOf(ele.no), 1 ); 
					});
					this.selected_rate[this.current_tab].collectionRate[this.type] = 0;
				}
				this.$emit('change', e)
			}
		},
		template: `
<b-form-checkbox
type="checkbox"
v-show='show'
name="modTypeAll"
value="true"
unchecked-value="false"
v-bind:checked="checked"
v-on:change="onChange"
>{{text}}</b-form-checkbox>
`
	})
	
	/*
	  Vue.directive('longpress', {
	  bind: function(el, binding, vNode){
	  if(typeof binding.value !== 'function'){
	  const compName = vNode.context.name
	  let warn = `[longpress:] provided expression '${binding.expression}' is not a function, but has to be`
	  if (compName) { warn += `Found in component '${compName}' ` }
	  console.warn(warn)
	  }

	  
	  let pressTimer = null
	  let start = (e) => {
	  if(e.type === 'click' && e.button != 0){
	  return;
	  }
	  if(pressTimer == null){
	  pressTimer = setTimeout(() => {
	  handler()
	  }, 1000)
	  }
	  }

	  let cancel = (e) => {
	  if(pressTimer != null){
	  clearTimeout(pressTimer)
	  pressTimer = null
	  }
	  }

	  const handler = (e) => {
	  binding.value(e)
	  }

	  el.addEventListener('mousedown', start)
	  el.addEventListener('touchstart', start)
	  el.addEventListener('click', cancel)
	  el.addEventListener('mouseout', cancel)
	  el.addEventListener('touchend', cancel)
	  el.addEventListener('touchcancel', cancel)
	  }
	  })*/

	
	const i18n = new VueI18n({
		locale: lang,
		fallbackLocale: lang,
		messages,
	})

	var loading = new Vue({
		i18n,
		el: '#loading',
		data: {
			show: true,
		},
	});

	var app = new Vue({
		i18n,
		el: '#app',
		data: {
			langs: langs,
			lang: lang,
			servers: servers,
			server: server,
			selected: selected,
			selectedMod: selectedMod,
			selectedPoster: selectedPoster,
			selectedDebounce: selectedDebounce,
			selectedRate: selectedRate,
			currentCanvas: currentCanvas,
			currentTab: currentTab,
			images: images,
			initData: {},
			UIData: UIData,
			title: title,
			loading: loading,
			msg: '',
			positionData: {"mod": {},"poster": {}},
			pv: 0,
			sitePvChartUrl: sitePvChartUrl,
			isPrd: isPrd,
			restored: false,
			showToast: false,
			toast: "",
		},
		computed: {},
		components: {
		},
		watch: {
			currentCanvas: {
				handler(){
					this.drawCanvas();
				}
			},
			selected: {
				deep: true,
				handler(){
					this.drawCanvas();
				}
			},
			selectedMod: {
				deep: true,
				handler(){
					this.selectedRate['mod'].collectionRate.got = this.selectedMod.guns.length;
					if(this.currentCanvas=='mod'){
						this.drawCanvas();
					}
				}
			},
			selectedPoster: {
				deep: true,
				handler(){
					this.selectedRate['poster'].collectionRate.got = this.selectedPoster.guns.length;
					if(this.currentCanvas=='poster'){
						this.drawCanvas();
					}
				}
			},
			lang: {
				immediate: true,
				handler(){
					this.$i18n.locale = this.lang;
					document.title = this.$i18n.t('title');
				}
			},
			server: {
				immediate: true,
				handler(){
					this.positionData = {
						"mod": {},
						"poster": {}
					}

					this.initData = prepareData(jsonData, this.server);

					let c = UIData.mod.guns;
					let modGunPosition = initGunPosition(c.x, c.y, c.r, this.initData.modGunList, c.limit, c.gap);
					this.positionData.mod = modGunPosition;
					c = UIData.poster.guns;
					let allGunPosition = initGunPosition(c.x, c.y, c.r, this.initData.allGunList, c.limit, c.gap);
					this.positionData.poster = allGunPosition;	
					this.drawCanvas();
				}
			},
		},
		created() {
			this.loading.show = false;
			this.doGet();
		},
		mounted: function () {
			this.$nextTick(function () {
				this.drawCanvas();
			})
		},
		methods: {
			debounceInput: _.debounce(function(e){
				this.drawCanvas()
			}, 500),
			store: function(key, value){
				localStorage.setItem(key, JSON.stringify(value))
			},
			restore: function(key){
				this.msg = this.$i18n.messages[this.lang].message.generatePicture;
				if(localStorage.getItem(key)){
					try {
						return JSON.parse(localStorage.getItem(key))
					} catch(e){
						localStorage.removeItem(key)
					}
				}
				return null;
			},
			storeAll: function(){
				this.msg = this.$i18n.messages[this.lang].message.saveCfg;
				this.store(STORE_KEY_SELECTED, this.selected)
				this.store(STORE_KEY_MOD, this.selectedMod)
				this.store(STORE_KEY_POSTER, this.selectedPoster)
				this.store(STORE_KEY_DEBOUNCE, this.selectedDebounce)
				this.store(STORE_KEY_RATE, this.selectedRate)
				this.store(STORE_KEY_LANG, this.lang)
				this.store(STORE_KEY_SERVER, this.server)
				this.msg = this.$i18n.messages[this.lang].message.saveCfgDone;
			},
			restoreAll: function (){
				this.msg = this.$i18n.messages[this.lang].message.loadCfg;
				this.restored = true;
				let s = this.restore(STORE_KEY_SELECTED), smod = this.restore(STORE_KEY_MOD), sposter = this.restore(STORE_KEY_POSTER),
					sdebounce = this.restore(STORE_KEY_DEBOUNCE), srate = this.restore(STORE_KEY_RATE), l = this.restore(STORE_KEY_LANG),
					server = this.restore(STORE_KEY_SERVER);
				Object.assign(this.selected, s ? s : this.selected);
				Object.assign(this.selectedMod, smod ? smod : this.selectedMod);
				Object.assign(this.selectedPoster, sposter ? sposter : this.selectedPoster);
				Object.assign(this.selectedDebounce, sdebounce ? sdebounce : this.selectedDebounce);
				Object.assign(this.selectedRate, srate ? srate : this.selectedRate);
				this.lang = l ? l : this.lang;
				this.server = server ? server : this.server;
				this.$refs.mod_055m[0].select(this.selectedMod.guns);
				this.restored = false;
				this.msg = this.$i18n.messages[this.lang].message.loadCfgDone;
				alert(this.$i18n.messages[this.lang].message.loadCfgTime + ": " + this.selected.now);
				this.selected.now = now;
			},
			exportJSON: function(){
				let data = {};
				data[STORE_KEY_SELECTED] = this.selected;
				data[STORE_KEY_MOD] = this.selectedMod;
				data[STORE_KEY_POSTER] = this.selectedPoster;
				data[STORE_KEY_DEBOUNCE] = this.selectedDebounce;
				data[STORE_KEY_RATE] = this.selectedRate;
				data[STORE_KEY_LANG] = this.lang;
				data[STORE_KEY_SERVER] = this.server;
				let v1 = JSON.stringify(data);
				let v4 = b64CharToByteArray(encodeStr(v1))
				saveData(v4, 'application/json', 'gfdata.json');
			},
			importJSON: function(event){
				this.msg = this.$i18n.messages[this.lang].message.loadCfg;
				var input = event.target;
				if(input.files && input.files[0]){
					var reader = new FileReader();
					reader.onload = (e) => {
						let data = JSON.parse(b64toChar2(b64toChar1(e.target.result)));
						this.restored = true;
						let s = data[STORE_KEY_SELECTED], smod = data[STORE_KEY_MOD], sposter = data[STORE_KEY_POSTER],
							sdebounce = data[STORE_KEY_DEBOUNCE], srate = data[STORE_KEY_RATE], l = data[STORE_KEY_LANG],
							server = data[STORE_KEY_SERVER];
						Object.assign(this.selected, s ? s : this.selected);
						Object.assign(this.selectedMod, smod ? smod : this.selectedMod);
						Object.assign(this.selectedPoster, sposter ? sposter : this.selectedPoster);
						Object.assign(this.selectedDebounce, sdebounce ? sdebounce : this.selectedDebounce);
						Object.assign(this.selectedRate, srate ? srate : this.selectedRate);
						this.lang = l ? l : this.lang;
						this.server = server ? server : this.server;
						this.$refs.mod_055m[0].select(this.selectedMod.guns);
						this.restored = false;
						this.toast = this.$i18n.messages[this.lang].message.loadCfgTime + ": " + this.selected.now;
						this.showToast = true;
						this.selected.now = now;
					}
					reader.readAsDataURL(input.files[0]);
				}
				this.msg = this.$i18n.messages[this.lang].message.loadCfgDone;
			},
			exportPNG: function(){
				this.msg = this.$i18n.messages[this.lang].message.generatePicture;
				let b64 = document.getElementById('resultCanvas').toDataURL("image/png");
				saveData(b64CharToByteArray(b64toChar1(b64)), 'image/png', 'badge.png');
				this.msg = this.$i18n.messages[this.lang].message.generateDone;
			},
			img2base64: function(event){
				var input = event.target;
				if(input.files && input.files[0]){
					var reader = new FileReader();
					reader.onload = (e) => {
						this.selectedMod.userAvatar = e.target.result;
					}
					reader.readAsDataURL(input.files[0]);
				}
			},
			doGet: function(){
				var _this = this;
				axios.get(sitePvUrl)
					.then(function (response) {
						_this.pv = response.data[0].second;
					})
					.catch(function (error) {
						console.log(error);
					})
					.finally(function () {
					});
			},
			scrollToTop: function (scrollDuration) {
				var cosParameter = window.scrollY / 2,
					scrollCount = 0,
					oldTimestamp = performance.now();
				function step (newTimestamp) {
					scrollCount += Math.PI / (scrollDuration / (newTimestamp - oldTimestamp));
					if (scrollCount >= Math.PI) window.scrollTo(0, 0);
					if (window.scrollY === 0) return;
					window.scrollTo(0, Math.round(cosParameter + cosParameter * Math.cos(scrollCount)));
					oldTimestamp = newTimestamp;
					window.requestAnimationFrame(step);
				}
				window.requestAnimationFrame(step);
			},
			drawCanvas: function(){
				if(this.restored){
					return;
				}
				console.log('drawCanvas')
				this.msg = this.$i18n.messages[this.lang].message.loadPictures;
				var can = document.getElementById('resultCanvas');
				var ctx = can.getContext('2d');
				
				let s = this.currentCanvas,
					uiData = UIData[s],
					position = this.positionData[s];
				let c = uiData["background"];
				//$('#resultCanvas').css('width', c.w);
				//$('#resultCanvas').css('height', c.h);
				can.width = c.w;
				can.height = c.h;
				//ctx.clearRect(0, 0, can.width, can.height);
				//$('#resultMask').css('background-image', 'url(' + selected["background"] + ')');
				//$('#resultMask').css('background-size', 'none');
				//$('#resultMask').css('background-position', uiData["background"].x+' -'+uiData["background"].y);
				let background = new Image();
				let count = 1;
				if(this.selected.showAdjutant){
					count ++
				}
				background.onload = counter;
				let backImg = genImgName(selected["background"], 'back');
				background.src = backImg;
				let adjutant, adjutantImg;
				if(this.selected.showAdjutant){
					adjutant = new Image();
					adjutant.onload = counter
					adjutantImg = genImgName(this.selected.userAdjutant, 'tachie');
					adjutant.src = adjutantImg;
				}
				let _this = this;


				var selectedCanvas;
				if(_this.currentCanvas=='mod'){
					selectedCanvas = this.selectedMod;
				}else if(_this.currentCanvas=='poster'){
					selectedCanvas = this.selectedPoster;
				}

				function counter(){
					count--;
					if(count === 0) {
						drawImages();
						_this.msg = _this.$i18n.messages[_this.lang].message.loadDone;
					}
				}

				
				function drawImages(){
					let c;
					c = uiData["background"];
					ctx.clearRect(0, 0, can.width, can.height);
					ctx.globalAlpha = ( _this.selected.backgroundAlpha != undefined ? _this.selected.backgroundAlpha : c.alpha )
					//ctx.drawImage(background, c.x, c.y, c.sw, c.sh, 0, 0, c.w, c.h);
					ctx.drawImage(background, c.x+_this.selected.backgroundOffsetX, c.y+_this.selected.backgroundOffsetY, c.sw*_this.selected.backgroundScaleFactor, c.sh*_this.selected.backgroundScaleFactor, 0, 0, c.w, c.h);
					ctx.globalAlpha = 1;
					
					if(_this.selected.showAdjutant){
						c = uiData["adjutant"];
						ctx.drawImage(adjutant, 0, 0, c.w-_this.selected.adjutantOffsetY, c.h-_this.selected.adjutantOffsetY, c.x+_this.selected.adjutantOffsetX, c.y+_this.selected.adjutantOffsetY, (c.w-_this.selected.adjutantOffsetY)*_this.selected.adjutantScaleFactor, (c.h-_this.selected.adjutantOffsetY)*_this.selected.adjutantScaleFactor);
					}

					c = uiData["userAvatar"];
					if(c){
						drawUserAvatar(ctx);
						ctx.strokeRect(c.x, c.y, c.w, c.h);
					}

					let R = uiData["guns"]["r"];
					drawGuns(ctx, position, R, can, selectedCanvas);
					
					c = uiData["collectionRateBox"]
					drawBox(ctx, c.x, c.y, c.w, c.h, c.lineWidth, _this.selectedRate[s]['collectionRate']['got']/position.sum)

					c = uiData["userName"]
					drawText(ctx, _this.selectedDebounce.userName, c.x, c.y, c.font, c.fillStyle, c.lineWidth, c.strokeStyle, c.align, c.baseline);
				
					let userLevel = 'Lv. '+_this.selectedDebounce.userLevel;
					if(_this.selectedDebounce.userUid != ''){
						userLevel += '  UID'+ _this.selectedDebounce.userUid;
					}
					c = uiData["userLevel"]
					drawText(ctx, userLevel, c.x, c.y, c.font, c.fillStyle, c.lineWidth, c.strokeStyle, c.align, c.baseline);

					c = uiData["userServer"]
					let userServer = _this.selectedDebounce.userServerCustom == '' ? _this.selected.userServer : _this.selectedDebounce.userServerCustom;
			
					drawText(ctx, userServer, c.x, c.y, c.font, c.fillStyle, c.lineWidth, c.strokeStyle, c.align, c.baseline);

					c = uiData["collectionRate"]
					drawText(ctx, percentCalc(_this.selectedRate[s]['collectionRate']['got'], position.sum), c.x, c.y, c.font, c.fillStyle, c.lineWidth, c.strokeStyle, c.align, c.baseline);
					
					c = uiData["now"]
					drawText(ctx, _this.selected.now, c.x, c.y, c.font, c.fillStyle, c.lineWidth, c.strokeStyle, c.align, c.baseline);

					c = uiData["logo"]
					drawText(ctx, _this.selected.logo, c.x, c.y, c.font, c.fillStyle, c.lineWidth, c.strokeStyle, c.align, c.baseline);
				}

				function drawGuns(ctx, position, R, can, selected){
					let s = _this.currentCanvas,
						ui = UIData[s];
					let c = ui.guns.typeText, c2 = ui.guns.numText;
					for(let i in position.text){
						let selectedNum = _this.selectedRate[s]['collectionRate'][i];
						let name = position.text[i].name, num = position.text[i].num;
						drawText(ctx, name.text, name.x+c.offset, name.y, c.font, c.fillStyle, c.lineWidth, c.strokeStyle, c.align, c.baseline);
						drawText(ctx, selectedNum+'/'+num.text, num.x+c2.offset, num.y, c2.font, c2.fillStyle, c2.lineWidth, c2.strokeStyle, c2.align, c2.baseline);
					}

					let callbackList = [];
					let count = 0;
					for(let no in position.guns){
						drawGunBlank(ctx, position.guns[no], R);
						let idx = selected.guns.indexOf(no);
						if(idx>=0){
							count++;
							let img = new Image();
							img.onload = counter;
							img.src =  position.guns[no].img;
							let fun = drawGun(ctx, img, position.guns[no], R);
							callbackList.push(fun);
						}
					}
					var __this = _this;

					function counter(){
						count--;
						if(count === 0) {
							drawImages();
							__this.msg = __this.$i18n.messages[__this.lang].message.loadDone;
						}
					}

					function drawImages(){
						for(let i=0; i<callbackList.length; i++){
							callbackList[i]();
						}
					}	
				}

			},
		}
	})


}

component();
