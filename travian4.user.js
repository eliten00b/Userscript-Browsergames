// ==UserScript==
// @name           Travian+
// @namespace      Travain
// @description    Version 2.1 für Travian 4.0
// @include        http://t*.travian.de/*
// @exclude        http://*.travian.de/login.php
// ==/UserScript==
/*****   Funktionen  ***
 * - Multiacountnutzung möglich
 * - Händleroption Autohändlerbeladung (Alles, ohne/nur Getreide)
 * - Dorfliste erweitert
 *   - Entfernung zu eigenen Dörfern
 *   - Getreide Produktion der Dörfer
 *     - Über Dorfübersicht-Lager aktuallisierbar
 **/

/*****   Updates  ***
 * preview
 * - Anspassung an Volk spezifische Werte
 * - Spieltag + weitere Infos
 *
 * 2.1
 * - Umstellung auf localStorage
 *
 * 2.0
 * - Scriptstruktur überarbeitet
 *
 * 1.7
 * - Händleroption erweiter
 * - Händleroption Ansicht geändert
 * - Getreideproduktion auf Dorfübersicht-Lager aktuallisierbar
 **/

var TravExtension = function() {

	var Utils = {
		// storeTyp: "cookie", // cookie, localStorage

		// readStored: function(name) {
			// var nameEQ = name + "=";
			// var ca = document.cookie.split(';');
			// for(var i=0;i < ca.length;i++) {
				 // var c = ca[i];
				 // while (c.charAt(0)==' ') c = c.substring(1,c.length);
				 // if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
			// }
			// return null;
		// },
		// writeStore: function(name,value) {
			// var date = new Date();
			// date.setTime(date.getTime()+(2*24*60*60*1000)); // 2 Tage
			// var expires = "; expires="+date.toGMTString();
			// document.cookie = name+"="+value+expires+"; path=/";
		// },
		readStored: function(name) {
			return localStorage.getItem(name)
		},
		writeStore: function(name,value) {
			localStorage.setItem(name, value)
		},
		cleanStore: function(name){
			localStorage.removeItem(name)
		},
		addTimer: function(targetNode, restTime, moreStyle) {
			var newTimer = document.createElement("span");
			newTimer.appendChild(document.createTextNode(restTime));
			newTimer.setAttribute("style", moreStyle);
			newTimer.setAttribute("id", "timer"+timerId);
			targetNode.appendChild(newTimer);
			timerId++;
		},
		XPath: function(path, context, type) {
			try {
				if (!context) context = document;
				mydoc = context.ownerDocument || document;
				if (!type) type = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE;
				return mydoc.evaluate(path, context, null, type, null)
			}
			catch (e) {Utils.log(e); }
		},
		XPathSingle: function(path, context) {
			return this.XPath(path, context, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE).snapshotItem(0);
		},
		log: function (str) {
			if (Utils.gmEnabled)
				GM_log(str);
			else if (Utils.isOpera)
				window.opera.postError(str);
			else if (Utils.isChrome)
				console.log('Travian+: '+str);
		},
		Init: function() {
			// this.createStyleSheet();

			this.isOpera = (window.opera) ? true : false;
			this.isFirefox = (window.navigator.userAgent.indexOf('Firefox') > -1 ) ? true : false;
			this.isChrome = (window.navigator.userAgent.indexOf('Chrome') > -1 ) ? true : false;

		},
		number_format: function(number, decimals, dec_point, thousands_sep) {
			number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
			var n = !isFinite(+number) ? 0 : +number,
				prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
					sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
					dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
					s = '',
					toFixedFix = function (n, prec) {
						var k = Math.pow(10, prec);
						return '' + Math.round(n * k) / k;
					};
			s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
			if (s[0].length > 3) { s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep); }
			if ((s[1] || '').length < prec) {
				s[1] = s[1] || '';
				s[1] += new Array(prec - s[1].length + 1).join('0');
			}
			return s.join(dec);
		},
		newElement: function(tag, content, attr) {
			var element = document.createElement(tag)
			if( typeof attr == "string" ) element.setAttribute("style", attr)
				else for(var i=0;i<attr.length;i++) element.setAttribute(attr[i][0], attr[i][1])
			if( typeof content == "string" ) element.appendChild(document.createTextNode(content))
				else if(typeof content == "object")	element.appendChild(content)
			return element
		},
		appendBefore: function(node, newNode) {
			node.parentNode.insertBefore(newNode,node)
		},
		currentTitle: function() {
			var title = this.XPathSingle('/html/body/div/div[2]/div[2]/div[2]/div[2]/div/h1')
			if (title != null) {
				return title.innerHTML
			} else {
				return null
			}
		},
		addUniq: function(list, element, ids) {
			for(var i=0;i<list.length; i++) {
				uniq = false
				for(var j=0;j<ids.length; j++) {
					if(list[i][ids[j]] != element[ids[j]]) uniq = true
				}
				if(!uniq) element = ''
			}
			if(element != '') {
				list[list.length] = element
				return true
			}
			return false
		},
		updateUniq: function(list, element, ids) {
		pos = -1
			for(var i=0;i<list.length; i++) {
				uniq = false
				for(var j=0;j<ids.length; j++) {
					if(list[i][ids[j]] != element[ids[j]]) uniq = true
				}
				if(!uniq) pos = i
			}
			if(pos > -1) {
				list[pos] = element
			} else {
				list[list.length] = element
			}
		}
	};

	var Village = {
		currentVillageName: '',
		villages: [],
		Init: function() {
			this.currentVillageName = Utils.XPathSingle('//a[@class="active"]').innerHTML
			this.loadVillages()
			this.readProduktion()
		},
		currentVillage: function() {
			for(var i = 0; i < this.villages.length; i++) {
				if(this.villages[i].name == this.currentVillageName) {
					return this.villages[i];
				}
			}
			return this.currentVillageName;
		},
		nameOrCoords: function(dorf) {
			if(dorf instanceof Object) {
				return "new Array(\""+dorf.x+"\", \""+dorf.y+"\")";
			} else {
				return "'"+dorf+"'";
			}
		},
		dorfName: function(dorf) {
			if(dorf instanceof Object) {
				return dorf.name;
			} else {
				return dorf;
			}
		},
		loadVillages: function() {
			var storedList = Utils.readStored("villages."+PlayerSettings.player);
			if(storedList != '' & storedList != null) {
				// alert("villages."+PlayerSettings.player + ' = '+storedList)
				this.villages = eval('(' + storedList + ')');
			}
		},
		saveVillages: function() {
			Utils.writeStore("villages."+PlayerSettings.player,JSON.stringify(this.villages));
		},
		analyze: function() {
			var i = 1;
			var table = Utils.XPathSingle('//*[@id="villages"]');
			var table = table.childNodes[3];
			var line = table.childNodes[i];
			var jsonString = "[";
			while(line != null) {
				if(i>1) jsonString += ",";
				var dorfname = /">(.*)<\/a>/.exec(line.childNodes[1].innerHTML)[1];
				var coords = /.*coordinateX">\(([-0-9]*)<\/span.*coordinateY">([-0-9]*)\)<\/span.*/.exec(line.childNodes[7].innerHTML);
				jsonString += "{name: \""+dorfname+"\", x: \""+coords[1]+"\", y: \""+coords[2]+"\"}";
				i++; i++;
				var line = table.childNodes[i];
			}
			jsonString += "]";
			this.villages = eval('(' + jsonString + ')');
			this.saveVillages();
		},
		isVillagePage: function() {
			return (/position_details.php/.exec(document.URL) != null)
		},
		addMarkMarkplace: function() {
			var link = Utils.XPathSingle('//*[@id="tileDetails"]/div/div/div[3]')
			if(link == null) return
			if(/Händler schicken/.exec(link.innerHTML) == null) return
			var link = link.firstChild
			var dorfname = Utils.XPathSingle('//*[@id="content"]/h1/span/span').innerHTML
			var title = Utils.XPathSingle('//*[@id="content"]/h1/span')
			var coords = /.*coordinateX">\(([-0-9]*)<\/span.*coordinateY">([-0-9]*)\)<\/span.*/.exec(title.innerHTML);
			var village = {name: dorfname, x: coords[1], y: coords[2]}
			var neu = Utils.newElement('a', 'Favorit', [['onmouseup','add2Marketplace(\''+JSON.stringify(village)+'\')'],['onclick','return false'],['href', '#'],['style', 'float: right; background-image: url("http://tx3.travian.de/gpack/travian_Travian_4.0_Mephisto/img/a/plus.gif"); height: 16px; padding-left: 18px;']])
			Utils.appendBefore(link, neu)
			var script = Utils.newElement('script', '<!--\nvar writeStore = '+Utils.writeStore+'\nfunction add2Marketplace(json){writeStore(\'temp.'+PlayerSettings.player+'\', json)}\n//-->', [['type','text/javascript']])
			Utils.appendBefore(link, script)
		},
		readProduktion: function() {
			// alert(Utils.XPathSingle('//*[@id="res"]').innerHTML)
			p = new Array(4)
			r = new Array(4)
			l = new Array(4)
			for(var i=0;i<4;i++) {
				var resP = Utils.XPathSingle('//*[@id="res"]/li[@class="r'+ (i+1) + '"]')
				p[i] = Utils.isChrome ? window.resources.production["l"+(i+1)] : /-*[0-9]+/.exec(resP.getAttribute("title"))[0]
				var resRL = Utils.XPathSingle('//*[@id="l'+ (i+1) + '"]')
				var resRL = /([0-9]+)\/([0-9]+)/.exec(resRL.innerHTML)
				r[i] = resRL[1]
				l[i] = resRL[2]
			}
			Utils.updateUniq(PlayerSettings["resVillages"], {name: this.currentVillageName, p: p, r: r, l: l}, ["name"])
			Player.savePlayerSettings()
			// alert(JSON.stringify(PlayerSettings))
			// alert("Produktion: "+p.toString() +"\n" + "Vorhanden: "+r.toString() +"\n" + "Lager: "+l.toString() +"\n")
		}
	};

	var Units = [
		// createUnit: function(name, speed) {
			// return new Array(name, speed);
		// },
		// Units[2]['x1'][0]
		{
			volk: ''
		},
		{
			volk: 'Römer'
		},
		{
			volk: 'Germanen'
		},
		{
			volk: 'Galliar',
			x1: [
				{n: 'Phalanx', s: 7}, {n: 'Schwertkämpfer', s: 6},
				{n: 'Späher', s: 17}, {n: 'Theutates Blitz', s: 19}, {n: 'Druidenreiter', s: 16}, {n: 'Haeduaner', s: 13},
				{n: 'Rammholz', s: 4}, {n: 'Kriegskatapult', s: 3},
				{n: 'Häuptling', s: 5}, {n: 'Siedler', s: 5},
				{n: 'Händler', s: 24}
			],
			x3: [
				{n: 'Phalanx', s: 14}, {n: 'Schwertkämpfer', s: 12},
				{n: 'Späher', s: 34}, {n: 'Theutates Blitz', s: 38}, {n: 'Druidenreiter', s: 32}, {n: 'Haeduaner', s: 26},
				{n: 'Rammholz', s: 8}, {n: 'Kriegskatapult', s: 6},
				{n: 'Häuptling', s: 10}, {n: 'Siedler', s: 10},
				{n: 'Händler', s: 72}
			]
		}
	];
	
	var UnitsFnc = {
		rangeTimeTravler: function(x,y,x2,y2) {
			var handlerSpeed = 72;
			var x1 = parseInt(x);
			var y1 = parseInt(y);
			var x2 = parseInt(x2);
			var y2 = parseInt(y2);
			var range = range = Math.sqrt(Math.pow(x1-x2,2) + Math.pow(y1-y2,2));
			var time = (range/handlerSpeed)*60;
			//time = Math.floor(time*100)/100;
			var m = Math.floor(time);
			var str = Math.floor(time)+":"+Math.round((time-m)*60);
			return str;
		},
		calcRange: function(x,y,x2,y2) {
			var x1 = parseInt(x);
			var y1 = parseInt(y);
			var x2 = parseInt(x2);
			var y2 = parseInt(y2);
			var range = Math.sqrt(Math.pow(x1-x2,2) + Math.pow(y1-y2,2));
			return range;
		}
	}

	var Player = {
		Init: function() {
			PlayerSettings.player = this.getPlayer()
			this.loadPlayerSettings()
			var temp = Utils.readStored("temp."+PlayerSettings.player)
			if(temp != '' & temp != null) {
				var dorf = eval('(' + temp + ')')
				for(var i=0;i<PlayerSettings.marketVillages.length;	i++) {
					if(PlayerSettings.marketVillages[i].x==dorf.x && PlayerSettings.marketVillages[i].y==dorf.y) dorf = ''
				}
				if(dorf.length != '') {
					PlayerSettings.marketVillages[PlayerSettings.marketVillages.length] = dorf
					this.savePlayerSettings()
				}
			} 
			Utils.cleanStore("temp."+PlayerSettings.player)
		},
		getPlayer: function() {
			return Utils.XPathSingle('/html/body/div/div[2]/div[2]/div[3]/div[2]/a/span').innerHTML;
		},
		loadPlayerSettings: function() {
			var storedList = Utils.readStored("playerSettings."+PlayerSettings.player)
			if(storedList != '' & storedList != null) {
				// alert("playerSettings."+PlayerSettings.player+" = "+storedList)
				PlayerSettings = eval('(' + storedList + ')')
				return true
			}
			return false
		},
		savePlayerSettings: function() {
			Utils.writeStore("playerSettings."+PlayerSettings.player,JSON.stringify(PlayerSettings));
		},
		isProfil: function(title) {
			if (title == null)
				return false;
			var re = new RegExp('Spieler Profil - '+PlayerSettings.player)
			var title = re.exec(title);
			if (title == null)
				return false;
			else
				return true;
		},
		analyze: function() {
			var nationStr = Utils.XPathSingle('//*[@id="details"]/tbody/tr[2]/td').innerHTML
			nationStr == "Gallier" ? PlayerSettings.nation = 3 : nationStr == "Germanen" ? PlayerSettings.nation = 2 : PlayerSettings.nation = 1
			this.savePlayerSettings()
		}
	};

	var PlayerSettings = {
		player: '',
		nation: '',
		marketVillages: [],
		resVillages: [],
		villages: function() {alert("hier ist noch eins...")}
	};

	var Marketplace = {
		is: function(title) {
			if (title == null) return false;
			return (/Marktplatz/.exec(title) != null)
		},
		createMenuPoint: function(village) {
			var menuPoint = document.createElement("div");
			menuPoint.appendChild(Utils.newElement("span", Village.dorfName(village)+": ", "display: inline-block; width: 80px; overflow: hidden; height: 13px; white-space: nowrap;"));
			menuPoint.appendChild(Utils.newElement("a", "ALLES", [["href", "#"],["onclick", "return false;"], ["onmouseup", "sendRessis("+Village.nameOrCoords(village)+", 0)"]]));
			menuPoint.appendChild(Utils.newElement("span", " || ", ""));
			menuPoint.appendChild(Utils.newElement("a", "OHNE G3d", [["href", "#"],["onclick", "return false;"], ["onmouseup", "sendRessis("+Village.nameOrCoords(village)+", 1)"]]));
			menuPoint.appendChild(Utils.newElement("span", " || ", ""));
			menuPoint.appendChild(Utils.newElement("a", "NUR G3d", [["href", "#"],["onclick", "return false;"], ["onmouseup", "sendRessis("+Village.nameOrCoords(village)+", 2)"]]));
			return menuPoint;
		},
		createMenu: function(villages) {
			var menu = document.getElementById("contract").nextSibling.nextSibling;
			for(var i = 0; i < villages.length;i++) {
				menuPoint = this.createMenuPoint(villages[i]);
				document.getElementById("build").insertBefore(menuPoint, menu);
			}
			if(Utils.XPathSingle("/html/body/div/div[2]/div[2]/div[2]/div[2]/div/div/form/div[2]/input") == null)
				var x2only = false;
			else
				var x2only = true;
         var lieferScript = Utils.newElement("script",
				"<!--\n \
				function sendRessis(dorf, r) { \
					var x2only = "+x2only+";\
					var ressi1 = document.getElementById(\"l1\"); \
					var ressi2 = document.getElementById(\"l2\"); \
					var ressi3 = document.getElementById(\"l3\"); \
					var ressi4 = document.getElementById(\"l4\"); \
					lager = new Array(); \
					var ausdruckRessis = /([0-9]*)\\/[0-9]*/; \
					lager[0] = parseInt(ausdruckRessis.exec(ressi1.innerHTML)[1]); \
					lager[1] = parseInt(ausdruckRessis.exec(ressi2.innerHTML)[1]); \
					lager[2] = parseInt(ausdruckRessis.exec(ressi3.innerHTML)[1]); \
					lager[3] = parseInt(ausdruckRessis.exec(ressi4.innerHTML)[1]); \
					if(dorf instanceof Array) { \
						document.getElementById(\"xCoordInput\").value=dorf[0]; \
						document.getElementById(\"yCoordInput\").value=dorf[1]; \
						document.getElementsByName(\"dname\")[0].value=''; \
					} else { \
						document.getElementsByName(\"dname\")[0].value=dorf; \
						document.getElementById(\"xCoordInput\").value=''; \
						document.getElementById(\"yCoordInput\").value=''; \
					} \
					if(r == 1) { lager[3] = 0;} \
					else if(r == 2) { lager[0] = 0;lager[1] = 0;lager[2] = 0;} \
					var ressisgesammt = lager[0] + lager[1] + lager[2] + lager[3]; \
					if(ressisgesammt <= (haendler * carry)) { \
						document.getElementById(\"r1\").value=lager[0]; \
						document.getElementById(\"r2\").value=lager[1]; \
						document.getElementById(\"r3\").value=lager[2]; \
						document.getElementById(\"r4\").value=lager[3]; \
						if(!x2only) \
							document.getElementsByName(\"x2\")[0].selectedIndex = 0; \
					} else { \
						ressisfaktor = new Array(); \
						for(var i = 0; i<4;i++) { \
							if(lager[i]==0) {ressisfaktor[i] = 0;} \
							else {ressisfaktor[i] = ressisgesammt/lager[i]} \
							} \
							var ressisSenden = new Array(); \
							for(var i = 0; i<4;i++) { \
								if(ressisfaktor[i]==0) {ressisSenden[i] = 0;} \
								else {ressisSenden[i] = Math.ceil((haendler * carry)/ressisfaktor[i])-1;} \
							} \
							document.getElementById(\"r1\").value=ressisSenden[0]; \
							document.getElementById(\"r2\").value=ressisSenden[1]; \
							document.getElementById(\"r3\").value=ressisSenden[2]; \
							document.getElementById(\"r4\").value=ressisSenden[3]; \
							if(!x2only) {\
								if((lager[0] + lager[1] + lager[2] + lager[3]) <= (haendler * carry * 2)) { \
									document.getElementsByName(\"x2\")[0].selectedIndex = 1; \
								} else { \
									document.getElementsByName(\"x2\")[0].selectedIndex = 2; \
								} \
							} else {\
								document.getElementsByName(\"x2\")[0].checked = true;\
							} \
						} \
					}\n \
				//-->", "");
         lieferScript.setAttribute("language", "JavaScript");
         document.getElementById("build").insertBefore(lieferScript, menu);
		}
	};

	var DorfList = {
		listTable: "",
		listEntry: "",
		expendList: function() {
         this.listTable.setAttribute("style", "width: 300px; left: -7px;");
         this.listTable.childNodes[1].setAttribute("style", "background-size: 300px 64px; width: 300px;");
         this.listTable.childNodes[3].setAttribute("style", "background-size: 300px 2px; width: 300px;");
         this.listTable.childNodes[5].setAttribute("style", "background-size: 300px 39px; width: 300px;");
		},
		addTitle: function(element) {
			this.listTable.childNodes[1].appendChild(Utils.newElement('div','Weg','font-size: 12px; position: absolute; top: 21px; left: 149px;'));
			this.listTable.childNodes[1].appendChild(Utils.newElement('div','G3d/h','font-size: 12px; position: absolute; top: 21px; left: 189px;'));
		},
		createRange: function(villageName, currentVillage) {
			for(var i = 0;i<Village.villages.length;i++) {
				if(villageName == Village.villages[i].name) {
					var range = UnitsFnc.calcRange(currentVillage.x,currentVillage.y,Village.villages[i].x,Village.villages[i].y);
					/*range = Math.floor(range*10)/10;*/
					var style = 'display: inline-block; overflow: hidden; font-size: 10px; color: rgb(68, 68, 68); text-align: right; position: relative; width: 30px;'
					var spanElement = Utils.newElement('div', ""+Utils.number_format(range,1,'.',''), style);
					spanElement.setAttribute("class", "none");
					return spanElement;
				}
			}
			return null;
		},
		addGProd: function(villageName) {
			for(var i = 0;i<PlayerSettings.resVillages.length;i++) {
				if(villageName == PlayerSettings.resVillages[i].name) {
					var gPro = PlayerSettings.resVillages[i].p[3]
					var spanElement = Utils.newElement('div', ""+gPro, 'display: inline-block; overflow: hidden; width: 48px; font-size: 10px; color: rgb(68, 68, 68); text-align: right;');
					spanElement.setAttribute("class", "none");
					return spanElement;
				}
			}
			return null;
		},
		sumGPro: function() {
			var sum = 0
			for(var i = 0;i<PlayerSettings.resVillages.length;i++) {
				sum += parseInt(PlayerSettings.resVillages[i].p[3])
			}
			return sum
		},
		Init: function() {
			this.listTable = Utils.XPathSingle('//*[@id="villageList"]');
			this.listEntry = Utils.XPathSingle('//*[@id="villageList"]/div/ul/li');
			this.expendList();
			this.addTitle();

			var currentVillage = Village.currentVillage();
			var entry = this.listEntry;
			while(entry != null) {
				var spanElement = this.createRange(entry.childNodes[1].innerHTML, currentVillage);
				if(spanElement != null) {
					entry.childNodes[1].setAttribute("style", "float: left;");
					entry.appendChild(spanElement);
				}
				var spanElement = this.addGProd(entry.childNodes[1].innerHTML);
				if(spanElement != null) {
					entry.childNodes[1].setAttribute("style", "float: left;");
					entry.appendChild(spanElement);
				}
				entry = entry.nextSibling.nextSibling;
			}
			var bottom = Utils.XPathSingle("/html/body/div/div[2]/div[2]/div[3]/div[4]/div[3]")
			var style = 'position: absolute; font-size: 10px; text-align: right; width: 48px; font-weight: bold; bottom: 12px; left: 174px;'
			bottom.appendChild(Utils.newElement("div", ""+this.sumGPro(), style));
		}
	};

	var Stable = {
		
		is: function(title) {
			if (title == null) return false;
			return (/Stall/.exec(title) != null)
		}
	}
	
	var Report = {
	}

	// alert("läuft")
	try {
		Utils.Init()
		Player.Init()
		Village.Init()
		DorfList.Init()

		currentTitle = Utils.currentTitle()
		if(Marketplace.is(currentTitle) & /t=./.exec(document.location.search) == null) {
			Marketplace.createMenu(PlayerSettings.marketVillages)
		} else if(Player.isProfil(currentTitle)) {
			Village.analyze()
			Player.analyze()
		} else if(Village.isVillagePage()) {
			Village.addMarkMarkplace()
		}
		// alert("läuft!!");
	} catch (e) { Utils.log(e)}
}
window.TravExtension = TravExtension

TravExtension()