// ==UserScript==
// @name           Travian+ Cropfinder Exporter
// @namespace      TravainFarm
// @version        1.0
// @description    Export data from cropfinder to csv format.
// @include        http://t*.travian.de/*
// @exclude        http://*.travian.de/login.php
// ==/UserScript==

/*****   TODO  ***
 * - custom map size
 * - more export formats
 * - export to textarea
 * - generate button
 * - logs
 **/

T4 = function() {
  TE.Addons.Cropfinder = {
    fieldObjects: {},
    fullMapSize: { minX: null, minY: null, maxX: null, maxY: null },
    mapSize: null,

    init: function() {
      this.loadData()

      if(this.is()) {
        this.readFields()
      }
    },

    is: function() {
      return $$('#content.cropfinder').length != 0
    },

    readFields: function() {
      var fields = $$('#croplist tbody tr')

      for(var f = 0; f < fields.length; ++f) {
        var field       = fields[f]
          , children    = field.children
          , fieldObject = {}
          , temp        = null

        temp = /x=(-?[\d]+)&amp;y=(-?[\d]+)/.exec(children[1].innerHTML)
        fieldObject.x = parseInt(temp[1])
        fieldObject.y = parseInt(temp[2])

        temp = /(9|15)er/.exec(children[2].innerHTML)
        fieldObject.typ = parseInt(temp[1])

        temp = /\+(\d+)%/.exec(children[3].innerHTML)
        fieldObject.boni = parseInt(temp[1])

        /* map for all fields
         * define min/max for x/y for ur own map size
         **/
        if(!this.fullMapSize.minX || fieldObject.x < this.fullMapSize.minX) { this.fullMapSize.minX = fieldObject.x }
        if(!this.fullMapSize.minY || fieldObject.y < this.fullMapSize.minY) { this.fullMapSize.minY = fieldObject.y }
        if(!this.fullMapSize.maxX || fieldObject.x > this.fullMapSize.maxX) { this.fullMapSize.maxX = fieldObject.x }
        if(!this.fullMapSize.maxY || fieldObject.y > this.fullMapSize.maxY) { this.fullMapSize.maxY = fieldObject.y }

        this.fieldObjects[fieldObject.x + "_" + fieldObject.y] = fieldObject
      }

      TE.Utils.writeStore('fieldObjects', this.fieldObjects)
      TE.Utils.writeStore('fullMapSize', this.fullMapSize)
    },

    loadData: function() {
      this.fieldObjects = TE.Utils.readStored('fieldObjects') || this.fieldObjects
      this.fullMapSize  = TE.Utils.readStored('fullMapSize') || this.fullMapSize
    },

    cleanData: function() {
      TE.Utils.cleanStore('fieldObjects')
      TE.Utils.cleanStore('fullMapSize')

      this.fieldObjects = {}
      this.fullMapSize = { minX: null, minY: null, maxX: null, maxY: null }
    },

    generateCsv: function() {
      var mapSize = this.mapSize || this.fullMapSize
        , csv     = ''

      for(var y = mapSize.maxY; y >= mapSize.minY; --y) {
        var line = []

        for(var x = mapSize.minX; x <= mapSize.maxX; ++x) {
          var key = x + "_" + y

          if(this.fieldObjects[key]) {
            line.push('' + this.fieldObjects[key].boni)
          } else {
            line.push('')
          }
        }

        csv += line.join(',') + "\n"
      }

      console.log("x:" + mapSize.minX, "y: " + mapSize.maxY)
      console.log(csv)
    }
  }

  TE.Addons.Cropfinder.init()
}

var eTS = document.createElement("script")
eTS.setAttribute("type", "text/javascript")
eTS.appendChild(document.createTextNode("(" + T4 + ")()"))
document.head.appendChild(eTS)
