// ==UserScript==
// @name           Travian+ Oasesspy
// @namespace      TravainOasesspy
// @version        0.5
// @description    Spy all oases and check for animals.
// @include        http://t*.travian.de/karte.php*
// ==/UserScript==

T4 = function() {
  TE.Addons.Oasesspy = {
    oases:         {},
    oasesKeys:     [],
    currentOaseId: 0,
    areaOffset:    [0,0],
    offsetId:      0,
    storageKey:    TE.Config.storageKeyAddons + '.Oasesspy',

    init: function() {
      TE.Utils.log('Oasesspy start...')

      var oases = TE.Utils.readStored(this.storageKey)
      if(typeOf(oases) === 'object') {
        this.oases = oases
      }

      this.addButtons()
      this.prepareTable()
    },

    addButtons: function() {
      var button1 = TE.Utils.newElement('div', 'Suche Oasen', [['id', 'addon_os_search'], ['onclick', 'TE.Addons.Oasesspy.searchOases();']])
        , button2 = TE.Utils.newElement('div', 'Spähe Oasen', [['id', 'addon_os_spy'], ['onclick', 'TE.Addons.Oasesspy.spyOases();']])

      TE.Plus.ConfigMenu.addButtonToMenu(button1)
      TE.Plus.ConfigMenu.addButtonToMenu(button2)
    },

    prepareTable: function() {

    },

    searchOases: function() {
      var x    = parseInt(TE.Plus.Village.currentVillage().x)
        , y    = parseInt(TE.Plus.Village.currentVillage().y)

      x += (TE.Addons.Oasesspy.areaOffset[0] * 30) + 1
      y += (TE.Addons.Oasesspy.areaOffset[1] * 30) + 1

      var data = {
            data: {
              cmd: 'mapPositionData',
              data: {
                x: x,
                y: y,
                zoomLevel: 3
              }
            },
            onSuccess: TE.Addons.Oasesspy.handleSearchSuccess,
            url: 'ajax.php'
          }

      TE.Utils.log('Start getting data for oases... Offset ID: ' + TE.Addons.Oasesspy.offsetId)
      TE.Utils.log(['Oasesspy.searchOases send', data], 2)
      Travian.ajax(data)
    },

    spyOases: function() {
      for(var key in this.oases) {
        this.oasesKeys.push(key)
      }

      if(this.oasesKeys.length > 0) {
        this.currentOaseId = 0
        this.sendSpyRequest(this.oases[this.oasesKeys[0]])
      } else {
        TE.Utils.log('Erst nach Oasen suchen.')
      }
    },

    sendSpyRequest: function(oase) {
      var data = {
            data: {
              cmd: 'viewTileDetails',
              x: oase.x,
              y: oase.y
            },
            onSuccess: TE.Addons.Oasesspy.handleSpySuccess,
            url: 'ajax.php'
          }

      TE.Utils.log('Teste Oase {current} von {max}.'
          .replace('{current}', TE.Addons.Oasesspy.currentOaseId + 1)
          .replace('{max}', TE.Addons.Oasesspy.oasesKeys.length)
      )
      Travian.ajax(data)
    },

    handleSearchSuccess: function(data) {
      var tiles    = data.tiles
        , oases    = {}
        , delOases = []

      for(var i = 0; i < tiles.length; ++i) {
        var tile = tiles[i]

        if(typeof tile.c !== 'undefined') {
          if(tile.c.match('{k.fo}') !== null) {
            tile.typ = []
            if(tile.t.match('{a.r1}') !== null) { tile.typ.push('Holz') }
            if(tile.t.match('{a.r2}') !== null) { tile.typ.push('Lehm') }
            if(tile.t.match('{a.r3}') !== null) { tile.typ.push('Eisen') }
            if(tile.t.match('{a.r4}') !== null) { tile.typ.push('Getreide') }

            delete tile.t

            oases[tile.x + '|' + tile.y] = tile
          }
          else if(tile.c.match('{k.bt}') !== null) {
            delOases.push(tile.x + '|' + tile.y)
          }
        }
      }

      var merge = function() {
        var merged = {}

        for(var i = 0; i < arguments.length; ++i) {
          for(key in arguments[i]) {
            merged[key] = arguments[i][key]
          }
        }

        return merged
      }

      TE.Addons.Oasesspy.oases = merge(TE.Addons.Oasesspy.oases, oases)
      for(var i = 0; i < delOases.length; ++i) {
        var delOase = delOases[i]

        delete TE.Addons.Oasesspy.oases[delOase]
      }

      TE.Utils.writeStore(TE.Addons.Oasesspy.storageKey, TE.Addons.Oasesspy.oases)
      TE.Addons.Oasesspy.updateNewArea()

      TE.Utils.log('All oases successful get.')
    },

    updateNewArea: function() {
      var offsets = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]]

      TE.Addons.Oasesspy.areaOffset = offsets[TE.Addons.Oasesspy.offsetId]

      TE.Addons.Oasesspy.offsetId++
      if(TE.Addons.Oasesspy.offsetId >= offsets.length) {
        TE.Addons.Oasesspy.offsetId = 0
      }
    },

    handleSpySuccess: function(data) {
      var html     = data.html
        , strStart = '<table cellpadding="1" cellspacing="1" id="troop_info" class="transparent">'
        , posStart = html.indexOf(strStart) + strStart.length
        , strEnd   = '</table>'
        , posEnd   = html.indexOf(strEnd, posStart)
        , html     = html.substr(posStart, posEnd - posStart)
        , rows     = html.split('</tr>')
        , animals  = []
        , key      = TE.Addons.Oasesspy.oasesKeys[TE.Addons.Oasesspy.currentOaseId]

      for(var i = 0; i < rows.length; ++i) {
        var row     = rows[i]
          , animal  = {}

        if(row.match('<td>keine</td>') !== null) {
          break
        }
        else if(row.match('class="ico"') !== null) {
          animal.name = row.match(/title="([^"]+)"/)[1]
          animal.count = row.split('</td>')[1].match(/\d+/)[0]
          animals.push(animal)
        }
      }

      TE.Addons.Oasesspy.oases[key].animals = animals

      TE.Addons.Oasesspy.currentOaseId++
      key = TE.Addons.Oasesspy.oasesKeys[TE.Addons.Oasesspy.currentOaseId]

      if(TE.Addons.Oasesspy.currentOaseId < TE.Addons.Oasesspy.oasesKeys.length) {
        setTimeout(TE.Addons.Oasesspy.sendSpyRequest, 500, TE.Addons.Oasesspy.oases[key])
      } else {
        TE.Addons.Oasesspy.currentOaseId = 0
      }
    },

    searchAnimal: function(name) {
      for(var key in TE.Addons.Oasesspy.oases) {
        var oase = TE.Addons.Oasesspy.oases[key]

        if(oase.animals.length > 0) {
          var animals = []

          for(var j = 0; j < oase.animals.length; ++j) {
            var animal = oase.animals[j]

            animals.push(animal.name + '({c})'.replace('{c}', animal.count))
          }
          animals = animals.join(' - ')

          if(animals.match(name) !== null) {
            console.log(animals, 'in ', 'x: ', oase.x, '| y: ', oase.y)
          }
        }
      }
    },

    oasesArea: function() {
      var minX = null
        , minY = null
        , maxX = null
        , maxY = null

      for(var key in this.oases) {
        var oase = this.oases[key]

        if(minX === null || minX > oase.x) { minX = oase.x }
        if(minY === null || minY > oase.y) { minY = oase.y }
        if(maxX === null || maxX < oase.x) { maxX = oase.x }
        if(maxY === null || maxY < oase.y) { maxY = oase.y }
      }

      console.log(minX, minY, maxX, maxY)
    }
  }

  TE.Addons.Oasesspy.init()
}

var eTS = document.createElement("script")
eTS.setAttribute("type", "text/javascript")
eTS.appendChild( document.createTextNode("window.addEvent('domready', " + T4 + ")") )
document.head.appendChild(eTS)
