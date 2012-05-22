// ==UserScript==
// @name           Travian+ Multiplayer
// @namespace      TravainMP
// @version        0.2
// @description    Enable Multiplayer for Travian 4.0
// @include        http://t*.travian.de/*
// @exclude        http://*.travian.de/login.php
// ==/UserScript==

T4 = function() {
  TE.Addons.MP = {
    init: function() {
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
        } else if(element.tagName == 'FORM') {
          var action = element.getAttribute('action')

          action = this.newHref(action, idParam)
          element.setAttribute('action', action)
        } else if(/window\.location\.href/.exec(element.getAttribute('onclick'))) {
          var onclick = element.getAttribute('onclick')
            , result  = /(.+= ')(.+\.php.+)(';)/.exec(onclick)

          onclick = this.newHref(result[2], idParam)
          onclick = result[1] + onclick + result[3]
          element.setAttribute('onclick', onclick)
        } else {
          missings.push(i)
        }
      }

      /* display all not changed links */
      for(var i = 0; i < missings.length; i++) {
        var id = missings[i]
        console.log('missing', elements[id])
      }
    },

    getVillageIdParam: function() {
      var activeVillageElement = $$('a[class=active]')[0]

      if(typeof activeVillageElement == 'undefined') {
        return false
      }

      return /newdid=\d+/.exec(activeVillageElement.getAttribute('href'))[0]
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
    }
  }

  TE.Addons.MP.init()
}

var eTS = document.createElement("script")
eTS.setAttribute("type", "text/javascript")
eTS.appendChild(document.createTextNode("(" + T4 + ")()"))
document.head.appendChild(eTS)
