// ==UserScript==
// @name           Travian+
// @namespace      Travain
// @version        2.18
// @description    Nice extensions for Travian 4.0
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
 * - FIX Gesamt Getreide Berechnung
 * - add button for set debugLevel
 *
 * 2.17
 * - add a log bar
 *
 * 2.16
 * - refactor sendRessis function for Marketplace
 * - add uniq village id to rangeVillages
 *
 * 2.15
 * - refactor SettingsOverview is dynamic now
 *
 * 2.14
 * - update bubble colors
 * - refactor localstorage save object
 * - add more logs
 *
 * 2.13
 * - put all css in one tag
 * - add script version next to option button
 *
 * 2.12
 * - execute script on domready event
 *
 * 2.11
 * - FIX max build level
 *
 * 2.9
 * - color the level bubbles, green can build, red can't build
 *
 * 2.8
 * - REFACTOR Utils.addTimer
 *
 * 2.3
 * - Fix Händlertool
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


T4 = function() {
  // Create global namespace
  TE = {}
  TE.Addons = {}

  // Include all stuff that is useful in other addons to.
  TE.Utils = {
    version:   'v2.18',

    isOpera:   false,
    isFirefox: false,
    isChrome:  false,

    timerId: 0,

    init: function() {
      TE.Utils.log(['Utils.init'], 1)

      this.css()
      this.addLogBar()

      this.isOpera = (window.opera) ? true : false
      this.isFirefox = (window.navigator.userAgent.indexOf('Firefox') > -1 ) ? true : false
      this.isChrome = (window.navigator.userAgent.indexOf('Chrome') > -1 ) ? true : false

      return $$('form[name=login][action^=dorf1]').length > 0
    },

    readStored: function(name, evaluate) {
      var value    = localStorage.getItem(name)
        , evaluate = typeof evaluate === 'undefined' || evaluate

      if(evaluate) {
        try {
          value = eval('(' + value + ')')
        } catch(e) {
          value = null
          this.log(["readStored: value can't eval", name, value], 1)
        }
      }

      return value
    },

    writeStore: function(name, value, jsonfy) {
      var jsonfy = typeof jsonfy === 'undefined' || jsonfy

      try {
        if(jsonfy) {
          value = JSON.stringify(value)
        }

        localStorage.setItem(name, value)
      } catch(e) {
        this.log(["writeStore: value can't stringify; will not save", value], 1)
      }
    },

    cleanStore: function(name){
      localStorage.removeItem(name)
    },

    getNextTimerId: function(argument) {
      var timer   = $$('#timer1')
        , timerId = 1

      while(timer.length > 0) {
        ++timerId
        timer = $$('#timer' + timerId)
      }

      this.timerId = timerId

      return timerId
    },

    addTimer: function(targetNode, restTime, moreStyle) {
      var newTimer = document.createElement("span")
        , timerId  = this.getNextTimerId()

      newTimer.appendChild( document.createTextNode(restTime) )
      newTimer.setAttribute("style", moreStyle)
      newTimer.setAttribute("id", "timer" + timerId)
      targetNode.appendChild(newTimer)

      counter_minus[timerId] = new Object()
      counter_minus[timerId].node = newTimer
      counter_minus[timerId].counter_time = t_format1(newTimer)
    },

    XPath: function(path, context, type) {
      try {
        if(!context) context = document
        mydoc = context.ownerDocument || document
        if(!type) type = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE
        return mydoc.evaluate(path, context, null, type, null)
      }
      catch (e) { this.log("XPath: "+e) }
    },

    XPathSingle: function(path, context) {
      return this.XPath(path, context, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE).snapshotItem(0)
    },

    log: function (str, level) {
      var level      = level || 0
        , debugLevel = this.readStored('debugLevel', false) || -1

      if(level <= debugLevel) {
        if(this.gmEnabled) {
          GM_log('Travian+:')
          GM_log(str)
        } else if(this.isOpera) {
          window.opera.postError('Travian+:')
          window.opera.postError(str)
        } else if(this.isChrome || this.isFirefox) {
          console.log('Travian+:', str)
        }

        if($$('#log_bar').length !== 0 && level === 0) {
          $$('#log_bar')[0].innerHTML = 'Travian+: ' + str.toString()

          clearTimeout(this.logBarTimeout)
          this.logBarTimeout = setTimeout(this.clearLogBar, 2000)
        }
      }
    },

    number_format: function(number, decimals, dec_point, thousands_sep) {
      number = (number + '').replace(/[^0-9+\-Ee.]/g, '')
      var n = !isFinite(+number) ? 0 : +number,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
          sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
          dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
          s = '',
          toFixedFix = function (n, prec) {
            var k = Math.pow(10, prec)
            return '' + Math.round(n * k) / k
          }
      s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.')
      if(s[0].length > 3) { s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep) }
      if((s[1] || '').length < prec) {
        s[1] = s[1] || ''
        s[1] += new Array(prec - s[1].length + 1).join('0')
      }
      return s.join(dec)
    },

    newElement: function(tag, content, attr) {
      var element = document.createElement(tag)

      if(typeof attr == "string") {
        element.setAttribute("style", attr)
      } else {
        for(var i=0; i < attr.length; i++) {
          element.setAttribute(attr[i][0], attr[i][1])
        }
      }

      if(typeof content == "string") {
        element.appendChild(document.createTextNode(content))
      } else if(typeof content == "object") {
        element.appendChild(content)
      }

      return element
    },

    appendBefore: function(node, newNode) {
      node.parentNode.insertBefore(newNode, node)
    },

    currentTitle: function() {
      var title = this.XPathSingle('/html/body/div/div[2]/div[2]/div[2]/div[2]/div/h1')
      if(title != null) {
        return title.innerHTML
      } else {
        return null
      }
    },

    addUniq: function(list, element, ids) {
      for(var i = 0; i < list.length; i++) {
        uniq = false
        for(var j = 0; j < ids.length; j++) {
          if(list[i][ids[j]] != element[ids[j]]) {
            uniq = true
          }
        }
        if(!uniq) {
          element = ''
        }
      }
      if(element != '') {
        list[list.length] = element
        return true
      }
      return false
    },

    updateUniq: function(list, element, ids) {
      var pos = -1

      for(var i = 0; i < list.length; i++) {
        uniq = false
        for(var j = 0; j < ids.length; j++) {
          if(list[i][ids[j]] != element[ids[j]]) {
            uniq = true
          }
        }
        if(!uniq) {
          pos = i
        }
      }
      if(pos > -1) {
        list[pos] = element
      } else {
        list[list.length] = element
      }
    },

    addCssStyle: function(selector, options) {
      var styleElement = $$('#TEstyles')

      if(styleElement.length === 0) {
        styleElement = this.newElement('style', 0, [['type', 'text/css']])
        styleElement.setAttribute('id', 'TEstyles')
      } else {
        styleElement = styleElement[0]
      }

      if(typeOf(options) == 'array') {
        options = options.join(';')
      }

      styleElement.appendChild(document.createTextNode(selector + '{' + options + '}'))
      $$('head')[0].appendChild(styleElement)
    },

    addLogBar: function() {
      $$('#header')[0].appendChild(this.newElement('div', 0, [['id', 'log_bar']]))
    },

    clearLogBar: function() {
      if($$('#log_bar').length !== 0) {
        $$('#log_bar')[0].innerHTML = ''
      }
    },

    css: function() {
      // button
      this.addCssStyle(
        '.button',
        [
          'color: #5d5d5d',
          'background: -moz-linear-gradient(top, white 0%, #efefef 50%) no-repeat',
          'background: -webkit-linear-gradient(top, white 0%, #efefef 50%) no-repeat',
          'background: linear-gradient(top, white 0%, #efefef 50%) no-repeat',
          'padding: 3px 5px',
          'border: 1px solid #5d5d5d',
          'border-radius: 12px',
          'display: inline-block',
          'box-shadow: 0 1px 2px #5D5D5D',
          'cursor: pointer'
        ]
      )
      this.addCssStyle(
        '.button:hover',
        [
          'background: -moz-linear-gradient(top, #efefef 0%, #bbb 50%) no-repeat',
          'background: -webkit-linear-gradient(top, #efefef 0%, #bbb 50%) no-repeat',
          'background: linear-gradient(top, #efefef 0%, #bbb 50%) no-repeat'
        ]
      )
      this.addCssStyle(
        '.button:active',
        [
          'background: #efefef',
          'box-shadow: inset 1px 1px 2px #5d5d5d'
        ]
      )
      this.addCssStyle(
        '.button + .button',
        [
          'margin-top: 3px'
        ]
      )

      // log bar
      this.addCssStyle(
        '#log_bar',
        [
          'margin-left: 193px',
          'padding: 4px 5px',
          'background: white',
          'width: 587px',
          'height: 16px',
          'overflow: hidden',
          'color: red',
          'margin-top: 2px',
          'z-index: 1',
          'position: relative'
        ]
      )
    }
  }

  TE.Plus = {
    Village: {
      currentVillageName: '',

      init: function() {
        TE.Utils.log(['Village.init'], 1)

        this.currentVillageName = $$('#villageNameField')[0].innerHTML

        this.readProduktion()

        this.css()
      },

      currentVillage: function() {
        for(var i = 0; i < TE.Config.PlayerSettings.rangeVillages.length; i++) {
          var village = TE.Config.PlayerSettings.rangeVillages[i]

          if(village.name == this.currentVillageName) {
            return village
          }
        }

        return this.currentVillageName
      },

      currentVillageInfo: function() {
        for(var i = 0; i < TE.Config.PlayerSettings.resVillages.length; i++) {
          if(TE.Config.PlayerSettings.resVillages[i].name == this.currentVillageName) {
            villageInfo = TE.Config.PlayerSettings.resVillages[i]
            return villageInfo
          }
        }
      },

      nameOrCoords: function(dorf) {
        if(dorf instanceof Object) {
          return "new Array(\""+dorf.x+"\", \""+dorf.y+"\")"
        } else {
          return "'"+dorf+"'"
        }
      },

      dorfName: function(dorf) {
        if(dorf instanceof Object) {
          return dorf.name
        } else {
          return dorf
        }
      },

      saveVillages: function() {
        TE.Utils.writeStore("villages." + TE.Config.PlayerSettings.player, this.villages)
      },

      analyze: function() {
        var lines = $$('#villages tbody tr')
          , villages = []

        TE.Utils.log(['analyze', lines], 2)

        for(var i = 0; i < lines.length; ++i) {
          var line     = lines[i]
            , dorfname = line.select('.name a')[0].innerHTML
            , coords   = line.select('.coords a')[0].getAttribute('href').match(/x=(-?[\d]+)&y=(-?[\d]+)/)
            , id       = line.select('.name a')[0].getAttribute('href').match(/d=(\d+)/)[1]

          villages.push({name: dorfname, x: coords[1], y: coords[2], id: id})
        }

        TE.Config.PlayerSettings.rangeVillages = villages

        TE.Config.savePlayerSettings()
      },

      isVillagePage: function() {
        return (/position_details.php/.exec(document.URL) != null)
      },

      addMarkMarkplace: function() {
        var optionsElement = $$('#tileDetails .detailImage .options')

        if(optionsElement.length === 0) { return }

        if(/Händler schicken/.exec(optionsElement[0].innerHTML) == null) { return }

        var dorfname = TE.Utils.XPathSingle('//*[@id="content"]/h1/span/span').innerHTML
          , title    = TE.Utils.XPathSingle('//*[@id="content"]/h1/span')
          , coords   = /.*coordinateX">\(([-0-9]*)<\/span.*coordinateY">([-0-9]*)\)<\/span.*/.exec(title.innerHTML)
          , village  = {name: dorfname, x: coords[1], y: coords[2]}
          , add2List = function(village) {
              TE.Utils.writeStore("temp." + TE.Config.PlayerSettings.player, village)

              return false
          }
          , button   = TE.Utils.newElement('span', 0, [['onclick', '(' + add2List + ')(' + JSON.stringify(village) + ')'], ['class', 'button']])

        button.appendChild(TE.Utils.newElement('span', '', [['class', 'icon-orange-plus']]))
        button.appendChild(TE.Utils.newElement('span', 'Handelsziel', [['style', 'float: right;']]))

        optionsElement[0].appendChild( TE.Utils.newElement('div', button, [['class', 'option']]) )
      },

      readProduktion: function() {
        var p = new Array(4)
          , r = new Array(4)
          , l = new Array(4)
        for(var i=0; i < 4; i++) {
          p[i] = window.resources.production["l" + (i + 1)]
          var resRL = TE.Utils.XPathSingle('//*[@id="l' + (i + 1) + '"]')
            , resRL = /([0-9]+)\/([0-9]+)/.exec(resRL.innerHTML)
          r[i] = resRL[1]
          l[i] = resRL[2]
        }
        TE.Utils.updateUniq(TE.Config.PlayerSettings["resVillages"], {name: this.currentVillageName, p: p, r: r, l: l}, ["name"])
        TE.Config.savePlayerSettings()
      },

      css: function() {
        TE.Utils.addCssStyle('.icon-orange-plus', ['height: 18px',
                                                   'width: 18px',
                                                   'background: transparent url("http://ts3.travian.de/gpack/travian_Travian_4.0_Wurststurm/img/a/btnPlus-small.png") 0 -56px no-repeat',
                                                   'display: inline-block'])
      }
    },

    UnitsFnc: {
      rangeTimeTravler: function(x,y,x2,y2) {
        var handlerSpeed = 72
          , x1 = parseInt(x)
          , y1 = parseInt(y)
          , x2 = parseInt(x2)
          , y2 = parseInt(y2)
          , range = range = Math.sqrt(Math.pow(x1-x2,2) + Math.pow(y1-y2,2))
          , time = (range/handlerSpeed)*60
        //time = Math.floor(time*100)/100
        var m = Math.floor(time)
          , str = Math.floor(time) + ":" + Math.round((time - m) * 60)
        return str
      },

      calcRange: function(x,y,x2,y2) {
        var x1 = parseInt(x)
          , y1 = parseInt(y)
          , x2 = parseInt(x2)
          , y2 = parseInt(y2)
          , range = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
        return range
      }
    },

    Player: {
      init: function() {
        TE.Utils.log(['Player.init'], 1)

        var temp = TE.Utils.readStored("temp." + TE.Config.PlayerSettings.player)

        TE.Utils.log(['temp.' + TE.Config.PlayerSettings.player, temp], 3)

        if(temp != null) {
          var dorf = temp

          TE.Utils.log(['add village to marketVillages', dorf], 2)

          for(var i = 0; i < TE.Config.PlayerSettings.marketVillages.length; i++) {
            if(TE.Config.PlayerSettings.marketVillages[i].x == dorf.x && TE.Config.PlayerSettings.marketVillages[i].y == dorf.y) {
              dorf = ''
            }
          }

          if(dorf.length != '') {
            TE.Config.PlayerSettings.marketVillages[TE.Config.PlayerSettings.marketVillages.length] = dorf
            TE.Config.savePlayerSettings()
          }
        }

        TE.Utils.cleanStore("temp." + TE.Config.PlayerSettings.player)
      },

      getPlayer: function() {
        // TODO: fix break if no playername
        return $$('#side_info .sideInfoPlayer .signLink span')[0].innerHTML
      },

      isProfil: function(title) {
        if(title == null)
          return false
        var re = new RegExp('Spieler Profil - ' + TE.Config.PlayerSettings.player)
          , title = re.exec(title)
        if(title == null)
          return false
        else
          return true
      },

      analyze: function() {
        var nationStr = TE.Utils.XPathSingle('//*[@id="details"]/tbody/tr[2]/td').innerHTML
        nationStr == "Gallier" ? TE.Config.PlayerSettings.nation = 3 : nationStr == "Germanen" ? TE.Config.PlayerSettings.nation = 2 : TE.Config.PlayerSettings.nation = 1
        TE.Config.savePlayerSettings()
      }
    },

    Marketplace: {
      is: function() {
        return $$('#build.gid17 .container.active .favorKey5').length != 0
      },

      createMenuPoint: function(village) {
        var menuPoint = document.createElement("div")
        menuPoint.appendChild(TE.Utils.newElement("span", TE.Plus.Village.dorfName(village) + ": ", "display: inline-block; width: 80px; overflow: hidden; height: 13px; white-space: nowrap;"))
        menuPoint.appendChild(TE.Utils.newElement("a", "ALLES", [["href", "#"],["onclick", "return false;"], ["onmouseup", "sendRessis(" + TE.Plus.Village.nameOrCoords(village) + ", 0)"]]))
        menuPoint.appendChild(TE.Utils.newElement("span", " || ", ""))
        menuPoint.appendChild(TE.Utils.newElement("a", "OHNE G3d", [["href", "#"],["onclick", "return false;"], ["onmouseup", "sendRessis(" + TE.Plus.Village.nameOrCoords(village) + ", 1)"]]))
        menuPoint.appendChild(TE.Utils.newElement("span", " || ", ""))
        menuPoint.appendChild(TE.Utils.newElement("a", "NUR G3d", [["href", "#"],["onclick", "return false;"], ["onmouseup", "sendRessis(" + TE.Plus.Village.nameOrCoords(village) + ", 2)"]]))
        return menuPoint
      },

      createMenu: function(villages) {
        var menu = $$('#build.gid17 .carry')[0]
        for(var i = 0; i < villages.length; i++) {
          var menuPoint = this.createMenuPoint(villages[i])
          document.getElementById("build").insertBefore(menuPoint, menu)
        }
        var lieferScript = TE.Utils.newElement('script', "var sendRessis = " + TE.Plus.Marketplace.sendRessis.toString(), '')
        lieferScript.setAttribute('type', 'text/javascript')
        $$('#build.gid17')[0].insertBefore(lieferScript, menu)
      },

      sendRessis: function(dorf, r) {
        var x2only = $$('#x2.dropdown').length == 0
          , ressis = $$('#l1, #l2, #l3, #l4')
          , lager = new Array()
          , ausdruckRessis = /([0-9]*)\/[0-9]*/

        ressis.each(function(res, i) {
          lager[i] = parseInt(res.innerHTML.match(ausdruckRessis)[1])
        })

        if(dorf instanceof Array) {
          document.getElementById("xCoordInput").value=dorf[0]
          document.getElementById("yCoordInput").value=dorf[1]
          document.getElementsByName("dname")[0].value=''
        } else {
          document.getElementsByName("dname")[0].value=dorf
          document.getElementById("xCoordInput").value=''
          document.getElementById("yCoordInput").value=''
        }

        if(r == 1) {
          lager[3] = 0
        } else if(r == 2) {
          lager[0] = 0
          lager[1] = 0
          lager[2] = 0
        }

        var ressisgesammt = lager[0] + lager[1] + lager[2] + lager[3]
        if(ressisgesammt <= (haendler * carry)) {
          $$('#r1, #r2, #r3, #r4').each(function(res, i) {
            res.value = lager[i]
          })

          if(!x2only) {
            document.getElementsByName("x2")[0].selectedIndex = 0
          }
        } else {
          var ressisfaktor = new Array()
            , ressisSenden = new Array()

          for(var i = 0; i < 4; i++) {
            ressisfaktor[i] = (lager[i] === 0 ? 0 : ressisgesammt / lager[i])
          }

          for(var i = 0; i < 4; i++) {
            ressisSenden[i] = (ressisfaktor[i] === 0 ? 0 : Math.ceil( (haendler * carry) / ressisfaktor[i] ) - 1)
          }

          $$('#r1, #r2, #r3, #r4').each(function(res, i) {
            res.value = ressisSenden[i]
          })

          if(!x2only) {
            if((lager[0] + lager[1] + lager[2] + lager[3]) <= (haendler * carry * 2)) {
              document.getElementsByName("x2")[0].selectedIndex = 1
            } else {
              document.getElementsByName("x2")[0].selectedIndex = 2
            }
          } else {
            document.getElementsByName("x2")[0].checked = true
          }
        }
      }
    },

    DorfList: {
      listTable: "",

      listEntry: "",

      init: function() {
        TE.Utils.log(['DorfList.init'], 1)

        this.listTable = $$('#villageList')[0]
        this.listEntry = $$('#villageList li')

        this.expendList()
        this.addTitle()

        var currentVillage = TE.Plus.Village.currentVillage()
          , entry          = this.listEntry

        for(var i = 0; i < this.listEntry.length; ++i) {
          var entry       = this.listEntry[i]
            , spanElement = this.createRange(entry.childNodes[1].innerHTML, currentVillage)

          if(spanElement != null) {
            entry.childNodes[1].setAttribute("style", "float: left;")
            entry.appendChild(spanElement)
          }

          var spanElement = this.addGProd(entry.childNodes[1].innerHTML)

          if(spanElement != null) {
            entry.childNodes[1].setAttribute("style", "float: left;")
            entry.appendChild(spanElement)
          }
        }

        var bottom = $$('#villageList .foot')[0]
          , style = 'position: absolute; font-size: 10px; text-align: right; width: 48px; font-weight: bold; bottom: 12px; left: 174px;'

        bottom.appendChild(TE.Utils.newElement("div", this.sumGPro().toString(), style))
      },

      expendList: function() {
           this.listTable.setAttribute("style", "width: 300px; left: -7px;")
           this.listTable.childNodes[1].setAttribute("style", "background-size: 300px 64px; width: 300px;")
           this.listTable.childNodes[3].setAttribute("style", "background-size: 300px 2px; width: 300px;")
           this.listTable.childNodes[5].setAttribute("style", "background-size: 300px 39px; width: 300px;")
      },

      addTitle: function(element) {
        this.listTable.childNodes[1].appendChild(TE.Utils.newElement('div','Weg','font-size: 12px; position: absolute; top: 21px; left: 149px;'))
        this.listTable.childNodes[1].appendChild(TE.Utils.newElement('div','G3d/h','font-size: 12px; position: absolute; top: 21px; left: 189px;'))
      },

      createRange: function(villageName, currentVillage) {
        TE.Utils.log(['DorfList.createRange'], 2)

        for(var i = 0; i < TE.Config.PlayerSettings.rangeVillages.length; i++) {
          var village = TE.Config.PlayerSettings.rangeVillages[i]

          if(villageName == village.name) {
            var range       = TE.Plus.UnitsFnc.calcRange(currentVillage.x, currentVillage.y, village.x, village.y)
              , style       = 'display: inline-block; overflow: hidden; font-size: 10px; color: rgb(68, 68, 68); text-align: right; position: relative; width: 30px;'
              , spanElement = TE.Utils.newElement('div', "" + TE.Utils.number_format(range, 1, '.', ''), style)

            spanElement.setAttribute("class", "none")

            return spanElement
          }
        }

        return null
      },

      addGProd: function(villageName) {
        TE.Utils.log(['DorfList.addGProd'], 2)

        for(var i = 0; i < TE.Config.PlayerSettings.resVillages.length; i++) {
          var village = TE.Config.PlayerSettings.resVillages[i]

          if(villageName == village.name) {
            var gPro = village.p[3]
              , spanElement = TE.Utils.newElement('div', "" + gPro, 'display: inline-block; overflow: hidden; width: 48px; font-size: 10px; color: rgb(68, 68, 68); text-align: right;')

            spanElement.setAttribute("class", "none")

            return spanElement
          }
        }

        return null
      },

      sumGPro: function() {
        TE.Utils.log(['DorfList.sumGPro'], 2)

        var sum = 0

        for(var i = 0; i < TE.Config.PlayerSettings.resVillages.length; i++) {
          var village = TE.Config.PlayerSettings.resVillages[i]

          sum += parseInt(village.p[3])
        }

        return sum
      }
    },

    Stable: {
      is: function(title) {
        if(title == null) return false
        return (/Stall/.exec(title) != null)
      }
    },

    Building: {
      init: function() {
        TE.Utils.log(['Building.init'], 1)

        this.css()
      },

      restRes: function() {
        var res = new Array(4)
          , resTags = $$('#contract .resources')

        if(resTags.length > 0) {
          var villageInfo = TE.Plus.Village.currentVillageInfo()
          for(var i = 0; i < 4; i++) {
            res[i] = parseInt(/>([0-9]+)/.exec(resTags[i].innerHTML)[1]) - parseInt(villageInfo.r[i])
            if(res[i] < 0) {
              res[i] = 0
            } else {
              resTags[i].appendChild(TE.Utils.newElement('div', '' + res[i], 'margin-left: 23px;'))
            }
          }
        }
      },

      overviewResources: function() {
        this.overviewResourcesBubbles = this.getOverviewResourcesBubbles()
        TE.Utils.log(['overviewResources', this.overviewResourcesBubbles], 3)
        this.overviewResourcesAreas   = this.getOverviewResourcesAreas()
        TE.Utils.log(['overviewResources', this.overviewResourcesAreas], 3)

        this.getOverviewResources()

        this.updateOverviewResourcesBubbles()
      },

      getOverviewResourcesBubbles: function() {
        var bubbles = []

        if($$('div.village1').length > 0) {
          bubbles = $$('div.village1 .level')
        } else if($$('div.village2').length > 0) {
          bubbles = $$('div.village2 div#village_map div#levels div')
        }

        return bubbles
      },

      getOverviewResourcesAreas: function() {
        var areas = []

        if($$('div.village1').length > 0) {
          areas = $$('#rx area[href*=build]')
        } else if($$('div.village2').length > 0) {
          areas = $$('#clickareas area[alt!=Bauplatz]')
        }

        return areas
      },

      getOverviewResources: function() {
        var bubbles = this.overviewResourcesBubbles
          , areas   = this.overviewResourcesAreas

        TE.Utils.log(['getOverviewResources', 'areas.length:', areas.length], 2)
        for(var i = 0; i < areas.length; ++i) {
          var area    = areas[i]
            , resTemp = area._extendedTipContent.text.match(/>(\d+)/g)
            , res     = []

          if(resTemp === null) {
            TE.Utils.log(['getOverviewResources', 'not found i: ' + i], 3)
            continue
          }
          TE.Utils.log(['getOverviewResources', 'found i: ' + i, resTemp], 3)

          resTemp.each(function(t) {
            res.push(t.replace(/>/, ''))
          })

          this.setOverviewResources(i, area, res.join(','))
        }
      },

      setOverviewResources: function(i, area, res) {
        var bubbles = this.overviewResourcesBubbles

        if($$('div.village1').length > 0) {
          bubbles[i].setAttribute('data-res', res)
        } else if($$('div.village2').length > 0) {
          var id = area.getAttribute('href').match(/id=(\d+)/)[1]

          bubbles.filter('.aid' + id)[0].setAttribute('data-res', res)
        }
      },

      updateOverviewResourcesBubbles: function() {
        var bubbles = this.overviewResourcesBubbles

        for(var i = 0; i < bubbles.length; ++i) {
          var bubble   = bubbles[i]
            , res      = bubble.getAttribute('data-res')
            , resV     = TE.Plus.Village.currentVillageInfo()['r']
            , canBuild = true

          bubble.removeClass('can-build')
          bubble.removeClass('cant-build')

          if(res === null) { continue }

          res = res.split(',')

          for(var r = 0; r < res.length; ++r) {
            if( parseInt(res[r]) > parseInt(resV[r]) ) { canBuild = false }
          }


          if( canBuild && !bubble.hasClass('underConstruction') ) {
            bubble.addClass('can-build')
          } else if( !bubble.hasClass('underConstruction') ) {
            bubble.addClass('cant-build')
          }
        }
      },

      css: function() {
        TE.Utils.addCssStyle('.can-build', ['background: rgba(172, 231, 140, 0.8) !important',
                                                  'border-radius: 1em !important',
                                                  'border: 1px black solid !important'])
        TE.Utils.addCssStyle('.cant-build', ['background: rgba(243, 108, 108, 0.8) !important',
                                                  'border-radius: 1em !important',
                                                  'border: 1px black solid !important'])
        TE.Utils.addCssStyle('.underConstruction', ['background: rgba(255, 166, 32, 0.8) !important',
                                                  'border-radius: 1em !important',
                                                  'border: 1px black solid !important'])
      }
    },

    ConfigMenu: {
      init: function() {
        TE.Utils.log(['ConfigMenu.init'], 1)

        this.css()

        this.addMenu()
      },

      addMenu: function() {
        var menu = TE.Utils.newElement('div', 0, [['id', 'config_menu']])

        menu.appendChild(TE.Utils.newElement('span', 'Options', [['onclick', '$$("#config_menu .config_content")[0].toggleClass("hidden");'], ['class', 'button']]))
        menu.appendChild(TE.Utils.newElement('span', TE.Utils.version, 'margin-left: 10px;'))
        menu.appendChild(TE.Utils.newElement('div', 0, [['class', 'config_content hidden']]))

        $$('#mid')[0].appendChild(menu)
      },

      addButtonToMenu: function(button) {
        button.addClass('button')
        $$('#config_menu .config_content')[0].appendChild(button)
      },

      css: function() {
        TE.Utils.addCssStyle('#config_menu', ['background: rgba(255, 255, 255, 0.6)',
                                              'border-radius: 10px',
                                              'box-shadow: 1px 1px 3px black',
                                              'position: absolute',
                                              'left: 18px',
                                              'padding: 6px',
                                              'top: 124px',
                                              'width: 140px',
                                              'z-index: 51'])
        TE.Utils.addCssStyle('.config_content', ['margin-top: 5px'])
      }
    },

    SettingsOverview: {
      init: function() {
        TE.Utils.log(['SettingsOverview.init'], 1)

        this.css()
        this.addSettingsTable()
        this.addToggleButton()
      },

      createSettingsTable: function() {
        var table   = TE.Utils.newElement('table', 0, [ ['id', 'settings_overview'], ['class', 'hidden'] ])
          , header  = this.createHeader()
          , content = this.createContent()

        table.appendChild(header)

        for(var i = 0; i < content.length; i++) {
          table.appendChild(content[i])
        }

        return table
      },

      createHeader: function() {
        var headers = [
                        {name: 'Name',    style: 'width:250px;'},
                        {name: 'Value',   style: 'width:250px;'},
                        {name: 'Options', style: 'width:100px;'}
                      ]
          , header  = document.newElement('tr')

        for(var i = 0; i < headers.length; i++) {
          header.appendChild(TE.Utils.newElement('th', headers[i].name, headers[i].style))
        }

        return header
      },

      createContent: function() {
        var settings = TE.Config.PlayerSettings
          , self     = this

        var content = []

        for(settingKey in settings) {
          if(typeOf(settings[settingKey]) === 'string') {
            content.push(this.createRow(settingKey, settings[settingKey], ''))
          }
          else if(typeOf(settings[settingKey]) === 'array') {
            content.push(this.createRow(TE.Utils.newElement('b', settingKey, []), '', ''))

            if(settings[settingKey].length == 0) {
              content.push(this.createRow('', 'leer', ''))
            }

            content = this.createRowsForSetting(content, settings[settingKey])
          }
        }

        return content
      },

      readableWithBr: function(object) {
        var out   = TE.Utils.newElement('div', 0, [])
          , first = true

        for(key in object) {
          first ? first = false : out.appendChild(TE.Utils.newElement('br',0,[]))
          out.appendChild(TE.Utils.newElement('span', key + ': ' + object[key].toString(), []))
        }

        return out
      },

      createRowsForSetting: function(content, setting) {
        var self = this

        setting.each(function(x,i) {
          content.push(self.createRow(i.toString(), self.readableWithBr(x), ''))
        })

        return content
      },

      createRow: function(name, value, options) {
        var row = TE.Utils.newElement('tr', 1, [])

        row.appendChild(TE.Utils.newElement('td', name, []))
        row.appendChild(TE.Utils.newElement('td', value, []))
        row.appendChild(TE.Utils.newElement('td', options, []))

        return row
      },

      addSettingsTable: function() {
        var table = this.createSettingsTable()

        $$('#mid')[0].appendChild(table)
      },

      addToggleButton: function() {
        var toggle = TE.Utils.newElement('div', 'Show/Hide Settings', [['id', 'settings_toggle'], ['onclick', '$$("#settings_overview")[0].toggleClass("hidden");']])

        TE.Plus.ConfigMenu.addButtonToMenu(toggle)
      },

      css: function() {
        TE.Utils.log(['SettingsOverview.css'], 2)

        TE.Utils.addCssStyle('.hidden', 'display:none;')
        TE.Utils.addCssStyle('#settings_overview', ['background: rgba(255, 255, 255, 0.85)',
                                                    'border-spacing: 0',
                                                    'border-radius: 10px',
                                                    'box-shadow: 1px 1px 3px black',
                                                    'margin: 0 195px',
                                                    'padding: 6px',
                                                    'width: 600px'])
        TE.Utils.addCssStyle('#settings_overview tr', 'background: none;')
        TE.Utils.addCssStyle('#settings_overview td, #settings_overview th', ['background: none', 'vertical-align: top'])
        TE.Utils.addCssStyle('#settings_overview tr:nth-child(2n+1)', 'background: rgba(200, 200, 200, 0.4);')
        TE.Utils.addCssStyle('#settings_overview tr:nth-child(1)', 'background: rgba(150, 150, 150, 0.5);')
      }
    }
  }

  TE.Config = {
    storageKey: '',
    storageKeyAddons: '',

    init: function() {
      TE.Utils.log(['Config.init'], 1)

      TE.Config.PlayerSettings.server = location.hostname.match(/^[^.]{3}/)[0]
      TE.Config.PlayerSettings.player = TE.Plus.Player.getPlayer()

      TE.Config.storageKey = TE.Config.PlayerSettings.server + '.' + TE.Config.PlayerSettings.player
      TE.Config.storageKeyAddons = TE.Config.storageKey + '.Addons'

      TE.Config.loadPlayerSettings()
    },

    savePlayerSettings: function() {
      var settings = {}

      for(settingKey in TE.Config.PlayerSettings) {
        if(settingKey.match(/^(server|player|nation)$/) === null) {
          settings[settingKey] = TE.Config.PlayerSettings[settingKey]
        }
      }

      TE.Utils.writeStore(TE.Config.storageKey, settings)
    },

    loadPlayerSettings: function() {
      var settings = TE.Utils.readStored(TE.Config.storageKey)

      TE.Utils.log(['loadPlayerSettings', TE.Config.storageKey, settings], 2)

      if(settings != null) {
        for(settingKey in settings) {
          TE.Config.PlayerSettings[settingKey] = settings[settingKey]
        }
      }
    },

    PlayerSettings: {
      server: '',

      player: '',

      nation: '',

      marketVillages: [],

      resVillages: [],

      rangeVillages: []
    },

    Units: {
      getUnits: function() {

      },

      'Römer': {},

      'Germanen': {},

      'Galliar': {
        'Phalanx': {speed: {x1: 7, x3: 14}, ressis: []},
        'Schwertkämpfer': {speed: {x1: 6, x3: 12}},
        'Späher': {speed: {x1: 17, x3: 34}},
        'Theutates Blitz': {speed: {x1: 9, x3: 38}},
        'Druidenreiter': {speed: {x1: 16, x3: 32}},
        'Haeduaner': {speed: {x1: 13, x3: 26}},
        'Rammholz': {speed: {x1:  4, x3:  8}},
        'Kriegskatapult': {speed: {x1: 3, x3:  6}},
        'Häuptling': {speed: {x1:  5, x3: 10}},
        'Siedler': {speed: {x1: 5, x3: 10}},
        'Händler': {speed: {x1: 24, x3: 72}}
      }
    },

    Builgings: [
      {name: 'Lehmgrube', id: 1}, {name: 'Lehmgrube', id: 2}, {name: 'Eisenmine', id: 3}, {name: 'Getreidefarm', id: 4},
      {name: 'Sägewerk', id: 5}, {name: 'Lehmbrennerei', id: 6}, {name: 'Eisengießerei', id: 7}, {name: 'Getreidemühle', id: 8}, {name: 'Bäckerei', id: 9},
      {name: 'Rohstofflager', id: 10}, {name: 'Kornspeicher', id: 11},
      {name: null, id: 12},
      {name: 'Schmiede', id: 13}, {name: 'Turnierplatz', id: 14},
      {name: 'Hauptgebäude', id: 15},
      {name: 'Versammlungsplatz', id: 16}, {name: 'Marktplatz', id: 17}, {name: 'Botschaft', id: 18},
      {name: 'Kaserne', id: 19}, {name: 'Stall', id: 20}, {name: 'Werkstatt', id: 21},
      {name: 'Akademie', id: 22}, {name: 'Versteck', id: 23},
      {name: 'Rathaus', id: 24}, {name: 'Residenz', id: 25}, {name: 'Palast', id: 26},
      {name: 'Schatzkammer', id: 27},
      {name: 'Handelskontor', id: 28},
      {name: 'Große Kaserne', id: 29}, {name: 'Großer Stall', id: 30},
      {name: 'Stadtmauer', id: 31}, {name: 'Erdwall', id: 32}, {name: 'Palisade', id: 33},
      {name: 'Steinmetz', id: 34}, {name: 'Brauerei', id: 35}, {name: 'Fallensteller', id: 36},
      {name: 'Heldenhof', id: 37},
      {name: 'Großes Rohstofflager', id: 38}, {name: 'Großer Kornspeicher', id: 39},
      {name: 'Weltwunder', id: 40}, {name: 'Pferdetränke', id: 41}
    ]
  }

  TE.Init = function() {
    console.log("Travian+: start..")
    // try {
      if( TE.Utils.init() ) { return }
      TE.Config.init()
      TE.Plus.ConfigMenu.init()
      TE.Plus.Player.init()
      TE.Plus.Village.init()
      TE.Plus.DorfList.init()
      TE.Plus.SettingsOverview.init()
      TE.Plus.Building.init()

      var currentTitle = TE.Utils.currentTitle()

      TE.Plus.Building.overviewResources()

      if(/Stufe/.exec(currentTitle) != null) {
        TE.Plus.Building.restRes()
      }

      if( TE.Plus.Marketplace.is() ) {
        TE.Plus.Marketplace.createMenu(TE.Config.PlayerSettings.marketVillages)
      } else if( TE.Plus.Player.isProfil(currentTitle) ) {
        TE.Plus.Village.analyze()
        TE.Plus.Player.analyze()
      } else if( TE.Plus.Village.isVillagePage() ) {
        TE.Plus.Village.addMarkMarkplace()
      }
      TE.Utils.log("Loaded & Ready.")
    // } catch (e) { TE.Utils.log("main: " + e) }
  }

  TE.Init()
}

var eTS = document.createElement("script")
eTS.setAttribute("type", "text/javascript")
eTS.appendChild( document.createTextNode("window.addEvent('domready', " + T4 + ")") )
document.head.appendChild(eTS)
