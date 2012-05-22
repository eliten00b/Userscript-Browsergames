// ==UserScript==
// @name           Travian+ Farm
// @namespace      TravainFarm
// @version        0.1
// @description    Include statistics for farms.
// @include        http://t*.travian.de/*
// @exclude        http://*.travian.de/login.php
// ==/UserScript==

T4 = function() {
  TE.Addons.Farm = {
  }
}

var eTS = document.createElement("script")
eTS.setAttribute("type", "text/javascript")
eTS.appendChild(document.createTextNode("(" + T4 + ")()"))
document.head.appendChild(eTS)
