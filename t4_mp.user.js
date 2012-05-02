// ==UserScript==
// @name           Travian+ Multiplayer
// @namespace      TravainMP
// @version        0.1
// @description    Enable Multiplayer for Travian 4.0
// @include        http://t*.travian.de/*
// @exclude        http://*.travian.de/login.php
// ==/UserScript==

if(typeof TravExtension == 'undefined') { TravExtension = {} }
TravExtension.MP = function() {
  var init = function() {
  },

  getVillageIdParam = function() {
    var activeVillageElement = $$('a[class=active]')[0]

    if(typeof activeVillageElement == 'undefined') {
      return false
    }

    return /newdid=\d+/.exec(activeVillageElement.getAttribute('href'))[0]
  },

  getAllLinks = function() {
    var selectors = [
      '[onclick*=window.location.href]',
      'form',
      'a[href]:not([href*=newdid],[href^=http],[onclick])',
      'a[onclick*=window.location.href]',
      'area[href]:not([href*=newdid],[href^=http])',
      'button[href]:not([href*=newdid],[href^=http])'
    ]

    return $$(selectors.toString())
  }
}
