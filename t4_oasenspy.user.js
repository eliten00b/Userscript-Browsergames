// ==UserScript==
// @name           Travian+ Oasesspy
// @namespace      TravainOasesspy
// @version        0.1
// @description    Spy all oases and check for animals.
// @include        http://t*.travian.de/karte.php*
// ==/UserScript==

T4 = function() {
  TE.Addons.Oasesspy = {
    init: function() {
      TE.Utils.log('Oasesspy.init')

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

    },

    spyOases: function() {

    }
  }

  TE.Addons.Oasesspy.init()
}

var eTS = document.createElement("script")
eTS.setAttribute("type", "text/javascript")
eTS.appendChild( document.createTextNode("window.addEvent('domready', " + T4 + ")") )
document.head.appendChild(eTS)
