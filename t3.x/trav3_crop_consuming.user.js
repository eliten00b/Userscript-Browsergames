// ==UserScript==
// @name           T3 crop consuming
// @namespace      Travain
// @include        http://www.travian.org/*
// @version        1.0
// ==/UserScript==

var CC = function() {
  var CropConsuming = function() {
    var currentVillage = $$('#vlist tr td.hl')[0].getSiblings('.link')[0].getChildren()[0].getChildren()[0].text
      , cropConsuming  = $$('#resWrap table td').getLast().innerHTML.match(/(\d+)\/(\d+)/)
      , consuming      = parseInt(cropConsuming[2]) - parseInt(cropConsuming[1])
      , sumElement     = new Element('td')
      , sum            = 0

    this.villages  = villageNames()
    this.cropInfos = load()

    if(this.cropInfos[currentVillage] === undefined) {
      this.cropInfos[currentVillage] = {}
    }
    this.cropInfos[currentVillage].consuming = consuming

    save(this.cropInfos)

    for(village in this.cropInfos) {
      sum += this.cropInfos[village].consuming
    }

    $$('#vlist thead td')[0].set('colspan', 2)
    sumElement.innerHTML = sum
    $$('#vlist thead tr')[0].grab(sumElement)
  }

  // private
  var load = function() {
    var cropInfos = localStorage.getItem('CropConsuming')

    return cropInfos === null ? {} : JSON.decode(cropInfos)
  }

  var save = function(cropInfos) {
    localStorage.setItem('CropConsuming', JSON.stringify(cropInfos))
  }

  var deleteOld = function() {

  }

  var villageNames = function() {
    var names = []
      , villages = $$('#vlist tbody tr a')

    for(var i = 0, j = villages.length; i < j; ++i) {
      names.push(villages[i].innerHTML)
    }

    return names
  }

  CropConsuming()
  window.CropConsuming = CropConsuming
}

var script = document.createElement("script")
script.setAttribute("type", "text/javascript")
script.appendChild( document.createTextNode("window.addEvent('domready', " + CC + ")") )
document.head.appendChild(script)
