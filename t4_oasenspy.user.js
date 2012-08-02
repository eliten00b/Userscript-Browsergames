// ==UserScript==
// @name           Travian+ Oasesspy
// @namespace      TravainOasesspy
// @version        0.2
// @description    Spy all oases and check for animals.
// @include        http://t*.travian.de/karte.php*
// ==/UserScript==

T4 = function() {
  TE.Addons.Oasesspy = {
    oases: [],

    init: function() {
      TE.Utils.log('Oasesspy start...')

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
      var data = {
            data: {
              cmd: 'mapPositionData',
              data: {
                x: TE.Plus.Village.currentVillage().x,
                y: TE.Plus.Village.currentVillage().y,
                zoomLevel: 3
              }
            },
            onSuccess: TE.Addons.Oasesspy.handleSearchSuccess,
            url: '/ajax.php?cmd=mapPositionData'
          }

      TE.Utils.log('Start getting data for oases...')
      TE.Utils.log(['Oasesspy.searchOases send', data], 2)
      Travian.ajax(data)
    },

    spyOases: function() {
      var data = {
            data: {
              cmd: 'viewTileDetails',
              data: {
                x: 0,
                y: 0
              }
            },
            onSuccess: TE.Addons.Oasesspy.handleSuccess,
            url: '/ajax.php?cmd=viewTileDetails'
          }

    },

    handleSearchSuccess: function(data) {
      console.log(data, data.tiles)
      var tiles = data.tiles
        , tile

      for(var i = 0; i < tiles.length; ++i) {
        var tile = tiles[i]

        if(typeof tile.c !== 'undefined') {
          if(tile.c.match(/\{k\.fo\}/) !== null) {

          } else {
            delete tiles[i]
          }
        } else {
          delete tiles[i]
        }
      }

      tiles.erase(undefined)
      TE.Utils.log('All oases successful get.')
      TE.Addons.Oasesspy.oases = tiles
    },

    handleSpySuccess: function(data) {
      var html = data.html
    }
  }

  TE.Addons.Oasesspy.init()
}

var eTS = document.createElement("script")
eTS.setAttribute("type", "text/javascript")
eTS.appendChild( document.createTextNode("window.addEvent('domready', " + T4 + ")") )
document.head.appendChild(eTS)
