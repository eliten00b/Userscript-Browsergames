// ==UserScript==
// @name           trav Baldurs Gate
// @namespace      Travain
// @include        http://www.travian.org/build.php?*
// @version        1.2
// ==/UserScript==

var dname              = "Baldurs Gate"
	, h1Elements         = document.getElementsByTagName("h1")
	, i
	, isMarktplatz
	, ausdruckMarktplatz = /Marktplatz.*/

for(i = 0;i<h1Elements.length; ++i) {
	isMarktplatz = ausdruckMarktplatz.exec(h1Elements[i].firstChild.data)
	if(isMarktplatz != null) {
		i = h1Elements.length
	}
}

var spanElements        = document.getElementsByTagName("span")
	, isMarktplatz0
	, ausdruckMarktplatz0 = /Dorf:.*/

for(i = 0; i < spanElements.length; ++i) {
	isMarktplatz0 = ausdruckMarktplatz0.exec(spanElements[i].firstChild.data)
	if(isMarktplatz0 != null) {
		i=spanElements.length
	}
}

if(isMarktplatz != null && isMarktplatz0 != null) {
	var menu = document.getElementById("textmenu")
		, menu = menu.nextSibling
		, lieferMenu = document.createElement("div")
		, lieferScript = document.createElement("script")

	lieferMenu.appendChild( document.createElement("a") )
	lieferMenu.lastChild.setAttribute("href", "#")
	lieferMenu.lastChild.setAttribute("onclick", "return false;")
	lieferMenu.lastChild.setAttribute("onmouseup", "sendRessis('" + dname + "', 0)")
	lieferMenu.lastChild.appendChild( document.createTextNode("Nach: " + dname) )

	document.getElementById("build").insertBefore(lieferMenu, menu)

	lieferScript.setAttribute("language", "JavaScript")

	var sendRessis = function(dorf, r) {
    var x2only         = document.getElementById('x2') === null
      , ressis         = [document.getElementById("l4"), document.getElementById("l3"),
      						        document.getElementById("l2"), document.getElementById("l1")]
      , ressisSend     = [document.getElementById("r1"), document.getElementById("r2"),
      						        document.getElementById("r3"), document.getElementById("r4")]
      , lager          = new Array()
      , ausdruckRessis = /([0-9]*)\/[0-9]*/

    ressis.each(function(res, i) {
      lager[i] = parseInt(res.innerHTML.match(ausdruckRessis)[1])
    })

    if(dorf instanceof Array) {
      document.getElementsByName("x")[0].value=dorf[0]
      document.getElementsByName("y")[0].value=dorf[1]
      document.getElementsByName("dname")[0].value=''
    } else {
      document.getElementsByName("dname")[0].value=dorf
      document.getElementsByName("x")[0].value=''
      document.getElementsByName("y")[0].value=''
    }

    if(r == 1) {
      lager[3] = 0
    } else if(r == 2) {
      lager[0] = 0
      lager[1] = 0
      lager[2] = 0
    }

    var ressisgesammt = lager[0] + lager[1] + lager[2] + lager[3]
    if(ressisgesammt <= (haendler * carry)) {
      ressisSend.each(function(res, i) {
        res.value = lager[i]
      })

      if(!x2only) {
        document.getElementsByName("x2")[0].selectedIndex = 0
      }
    } else {
      var ressisfaktor = new Array()
        , ressisSenden = new Array()

      for(var i = 0; i < 4; i++) {
        ressisfaktor[i] = (lager[i] === 0 ? 0 : ressisgesammt / lager[i])
      }

      for(var i = 0; i < 4; i++) {
        ressisSenden[i] = (ressisfaktor[i] === 0 ? 0 : Math.ceil( (haendler * carry) / ressisfaktor[i] ) - 1)
      }

      ressisSend.each(function(res, i) {
        res.value = ressisSenden[i]
      })

      if(!x2only) {
        if((lager[0] + lager[1] + lager[2] + lager[3]) <= (haendler * carry * 2)) {
          document.getElementsByName("x2")[0].selectedIndex = 1
        } else {
          document.getElementsByName("x2")[0].selectedIndex = 2
        }
      } else {
        document.getElementsByName("x2")[0].checked = true
      }
    }
  }

	lieferScript.appendChild(document.createTextNode("<!--\nsendRessis = " + sendRessis.toString() + "\n--> "))
	document.getElementById("build").insertBefore(lieferScript, menu)
}