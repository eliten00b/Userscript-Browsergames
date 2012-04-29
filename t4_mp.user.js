// ==UserScript==
// @name           Travian+ Multiplayer
// @namespace      TravainMP
// @version        0.1
// @description    Enable Multiplayer for Travian 4.0
// @include        http://t*.travian.de/*
// @exclude        http://*.travian.de/login.php
// ==/UserScript==

if(!TravExtension) { TravExtension = {} }

TravExtension.MP = {
  init = function() {},

  getVillageIdParam = function() {
    return /newdid=\d+/.exec($$('a[class=active]')[0].getAttribute('href'))[0]
  }
}
