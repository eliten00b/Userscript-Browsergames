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
    return /newdid=\d+/.exec($$('a[class=active]')[0].getAttribute('href'))[0]
  },

  getAllLinks = function() {
    return $$('[onclick], a:not([href*=newdid],[href^=http]), form')
  }
}
