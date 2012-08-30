// ==UserScript==
// @name           T3 crop consuming
// @namespace      Travain
// @include        http://www.travian.org/*
// @version        1.1
// ==/UserScript==

var CC = function() {
  var CropConsuming = function() {
    this.villages  = villageNames()
    this.cropInfos = load()
    this.sum       = 0

    setCropInfo.call( this, currentVillage(), getConsuming() )

    for(village in this.cropInfos) {
      if( this.villages.contains(village) ) {
        this.sum += this.cropInfos[village].consuming
      } else {
        delete this.cropInfos[village]
      }
    }

    save.call(this)

    displaySum.call(this)
  }

  // private
  var load = function() {
    var cropInfos = localStorage.getItem('CropConsuming')

    return cropInfos === null ? {} : JSON.decode(cropInfos)
  }

  var save = function() {
    localStorage.setItem('CropConsuming', JSON.stringify(this.cropInfos))
  }

  var currentVillage = function() {
    return $$('#vlist tr td.hl')[0].getSiblings('.link')[0].getChildren()[0].getChildren()[0].text
  }

  var getConsuming = function() {
    var cropConsuming = $$('#resWrap table td').getLast().innerHTML.match(/(\d+)\/(\d+)/)

    return parseInt(cropConsuming[2]) - parseInt(cropConsuming[1])
  }

  var villageNames = function() {
    var names = []
      , villages = $$('#vlist tbody tr a')

    for(var i = 0, j = villages.length; i < j; ++i) {
      names.push(villages[i].innerHTML)
    }

    return names
  }

  var displaySum = function() {
    var sumElement = new Element('td')

    sumElement.innerHTML = this.sum
    sumElement.set('style', 'text-align: right;')
    $$('#vlist thead td')[0].set('colspan', 2)
    $$('#vlist thead tr')[0].grab(sumElement)
  }

  var setCropInfo = function(village, consuming) {
    if(this.cropInfos[village] === undefined) {
      this.cropInfos[village] = {}
    }
    this.cropInfos[village].consuming = consuming
  }

  window.cropConsuming = new CropConsuming()
}

var script = document.createElement("script")
script.setAttribute("type", "text/javascript")
script.appendChild( document.createTextNode("window.addEvent('domready', " + CC + ")") )
document.head.appendChild(script)
