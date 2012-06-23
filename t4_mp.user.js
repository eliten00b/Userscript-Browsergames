// ==UserScript==
// @name           Travian+ Multiplayer
// @namespace      TravainMP
// @version        1.1
// @description    Enable Multiplayer for Travian 4.0
// @include        http://t*.travian.de/*
// @exclude        http://*.travian.de/login.php
// ==/UserScript==

/*****   Updates  ***
 * preview
 *
 * 1.1
 * - add log messages
 *
 * 1.0
 * - add toggle button
 **/

T4 = function() {
  TE.Addons.MP = {
    init: function() {
      var mpMode     = this.isMpModeOn()
        , buttonText = mpMode ? 'Turn MP off' : 'Turn MP on'
        , button     = TE.Utils.newElement('div', buttonText, [['id', 'addon_mp'], ['onclick', 'TE.Addons.MP.toggle();']])

      TE.Plus.ConfigMenu.addButtonToMenu(button)
      if(this.isMpModeOn()) {
        this.addParamToUrls()
      }
    },

    addParamToUrls: function() {
      var elements = this.getAllLinks()
        , idParam  = this.getVillageIdParam()
        , missings = []

      /* skip tool if there no idParam */
      if(!idParam) {
        return
      }

      for(var i = 0; i < elements.length; i++) {
        var element = elements[i]

        if(/\.php|^\?/.exec(element.getAttribute('href'))) {
          var href = element.getAttribute('href')

          href = this.newHref(href, idParam)
          element.setAttribute('href', href)
          element.setAttribute('data-mp', 'href')
        } else if(element.tagName == 'FORM') {
          var action = element.getAttribute('action')

          action = this.newHref(action, idParam)
          element.setAttribute('action', action)
          element.setAttribute('data-mp', 'action')
        } else if(/window\.location\.href/.exec(element.getAttribute('onclick'))) {
          var onclick = element.getAttribute('onclick')
            , result  = /(.+= ')(.+\.php.+)(';)/.exec(onclick)

          onclick = this.newHref(result[2], idParam)
          onclick = result[1] + onclick + result[3]
          element.setAttribute('onclick', onclick)
          element.setAttribute('data-mp', 'onclick')
        } else {
          missings.push(i)
        }
      }

      /* display all not changed links */
      for(var i = 0; i < missings.length; i++) {
        var id = missings[i]
        console.log('missing', elements[id])
      }

      TE.Utils.log('Addon MP is running.')
    },

    removeParamFromUrls: function() {
      var elements = $$('[data-mp]')

      for (var i = 0; i < elements.length; i++) {
        var element = elements[i]
          , attr    = element.getAttribute('data-mp')
          , url     = element.getAttribute(attr)

        url = url.replace(/[\?&]newdid=[\d]+/, '')
        element.setAttribute(attr, url)
      }

      TE.Utils.log('Addon MP is now turned off.')
    },

    getVillageIdParam: function() {
      var activeVillageElement = $$('a[class=active]')[0]

      if(typeof activeVillageElement == 'undefined') {
        return false
      }

      var idParam = /newdid=\d+/.exec(activeVillageElement.getAttribute('href'))[0]

      TE.Utils.log(['Addon MP', 'getVillageIdParam', idParam], 2)

      return idParam
    },

    getAllLinks: function() {
      var selectors = [
        '[onclick*=window.location.href]',
        'form',
        'a[href]:not([href*=newdid],[href^=http],[onclick])',
        'a[onclick*=window.location.href]',
        'area[href]:not([href*=newdid],[href^=http])',
        'button[href]:not([href*=newdid],[href^=http])'
      ]

      return $$(selectors.toString())
    },

    newHref: function(href, idParam) {
      if(/\?/.exec(href)) {
        href += '&' + idParam
      } else {
        href += '?' + idParam
      }

      return href
    },

    isMpModeOn: function() {
      var playerName = TE.Config.PlayerSettings.player
        , storeKey   = 'mpButtonOn.' + playerName
        , on         = TE.Utils.readStored(storeKey, false) // empty is null

      return on === null ? false : on == 'false' ? false : true
    },

    setMpMode: function(status) {
      var playerName = TE.Config.PlayerSettings.player
        , storeKey   = 'mpButtonOn.' + playerName

      TE.Utils.writeStore(storeKey, status, false)
    },

    toggle: function() {
      var mpMode     = !this.isMpModeOn()
        , buttonText = mpMode ? 'Turn MP off' : 'Turn MP on'

      $$('#addon_mp')[0].innerHTML = buttonText
      this.setMpMode(mpMode)
      if(mpMode) {
        this.addParamToUrls()
      } else {
        this.removeParamFromUrls()
      }
    }
  }

  TE.Addons.MP.init()
}

var eTS = document.createElement("script")
eTS.setAttribute("type", "text/javascript")
eTS.appendChild(document.createTextNode("(" + T4 + ")()"))
document.head.appendChild(eTS)
