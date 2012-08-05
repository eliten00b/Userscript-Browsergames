// ==UserScript==
// @name           trav Baldurs Gate
// @namespace      Travain
// @include        http://www.travian.org/build.php?*
// @version        1.0
// ==/UserScript==

var dname              = "Baldurs Gate"
	, h1Elements         = document.getElementsByTagName("h1")
	, i
	, isMarktplatz
	, ausdruckMarktplatz = /Marktplatz.*/

for(i = 0;i<h1Elements.length;++i) {
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

	lieferMenu.appendChild(document.createElement("a"))
	lieferMenu.lastChild.setAttribute("href", "#")
	lieferMenu.lastChild.setAttribute("onclick", "return false;")
	lieferMenu.lastChild.setAttribute("onmouseup", "sendRessis('"+dname+"')")
	lieferMenu.lastChild.appendChild(document.createTextNode("Nach "+dname))

	document.getElementById("build").insertBefore(lieferMenu, menu)

	lieferScript.setAttribute("language", "JavaScript")
	lieferScript.appendChild(document.createTextNode("<!--\n"+
"function sendRessis(dorf)"+
"{\n"+
	"var ressi1 = document.getElementById(\"l4\");\n"+
	"var ressi2 = document.getElementById(\"l3\");\n"+
	"var ressi3 = document.getElementById(\"l2\");\n"+
	"var ressi4 = document.getElementById(\"l1\");\n"+

	"lager = new Array();\n"+
	"var ausdruckRessis = /([0-9]*)\\/[0-9]*/;\n"+

	"lager[0] = parseInt(ausdruckRessis.exec(ressi1.innerHTML)[1]);\n"+
	"lager[1] = parseInt(ausdruckRessis.exec(ressi2.innerHTML)[1]);\n"+
	"lager[2] = parseInt(ausdruckRessis.exec(ressi3.innerHTML)[1]);\n"+
	"lager[3] = parseInt(ausdruckRessis.exec(ressi4.innerHTML)[1]);\n"+

	"document.getElementsByName(\"dname\")[0].value=dorf;\n"+

	"if((lager[0] + lager[1] + lager[2] + lager[3]) <= (haendler * carry)) {\n"+

			"document.getElementById(\"r1\").value=lager[0];\n"+
			"document.getElementById(\"r2\").value=lager[1];\n"+
			"document.getElementById(\"r3\").value=lager[2];\n"+
			"document.getElementById(\"r4\").value=lager[3];\n"+
			"document.getElementsByName(\"x2\")[0].childNodes[3].removeAttribute(\"selected\");\n"+
			"document.getElementsByName(\"x2\")[0].childNodes[5].removeAttribute(\"selected\");\n"+
			"document.getElementsByName(\"x2\")[0].childNodes[1].setAttribute(\"selected\", \"selected\");\n"+

	"} else if((lager[0] + lager[1] + lager[2] + lager[3])/2 <= (haendler * carry)) {\n"+

			"document.getElementById(\"r1\").value=Math.ceil(lager[0]/2);\n"+
			"document.getElementById(\"r2\").value=Math.ceil(lager[1]/2);\n"+
			"document.getElementById(\"r3\").value=Math.ceil(lager[2]/2);\n"+
			"document.getElementById(\"r4\").value=Math.ceil(lager[3]/2);\n"+
			"document.getElementsByName(\"x2\")[0].childNodes[1].removeAttribute(\"selected\");\n"+
			"document.getElementsByName(\"x2\")[0].childNodes[5].removeAttribute(\"selected\");\n"+
			"document.getElementsByName(\"x2\")[0].childNodes[3].setAttribute(\"selected\", \"selected\");\n"+

	"} else if((lager[0] + lager[1] + lager[2] + lager[3])/3 <= (haendler * carry)) {\n"+

			"document.getElementById(\"r1\").value=Math.ceil(lager[0]/3);\n"+
			"document.getElementById(\"r2\").value=Math.ceil(lager[1]/3);\n"+
			"document.getElementById(\"r3\").value=Math.ceil(lager[2]/3);\n"+
			"document.getElementById(\"r4\").value=Math.ceil(lager[3]/3);\n"+
			"document.getElementsByName(\"x2\")[0].childNodes[1].removeAttribute(\"selected\");\n"+
			"document.getElementsByName(\"x2\")[0].childNodes[3].removeAttribute(\"selected\");\n"+
			"document.getElementsByName(\"x2\")[0].childNodes[5].setAttribute(\"selected\", \"selected\");\n"+
/*	"} else if((lager[0] + lager[1] + lager[2])/2 <= (haendler * carry)) {\n"+

			"document.getElementById(\"r1\").value=Math.ceil(lager[0]/2);\n"+
			"document.getElementById(\"r2\").value=Math.ceil(lager[1]/2);\n"+
			"document.getElementById(\"r3\").value=Math.ceil(lager[2]/2);\n"+
			"document.getElementsByName(\"x2\")[0].childNodes[1].removeAttribute(\"selected\");\n"+
			"document.getElementsByName(\"x2\")[0].childNodes[5].removeAttribute(\"selected\");\n"+
			"document.getElementsByName(\"x2\")[0].childNodes[3].setAttribute(\"selected\", \"selected\");\n"+
	"} else if((lager[0] + lager[1] + lager[2])/3 <= (haendler * carry)) {\n"+

			"document.getElementById(\"r1\").value=Math.ceil(lager[0]/3);\n"+
			"document.getElementById(\"r2\").value=Math.ceil(lager[1]/3);\n"+
			"document.getElementById(\"r3\").value=Math.ceil(lager[2]/3);\n"+
			"document.getElementsByName(\"x2\")[0].childNodes[1].removeAttribute(\"selected\");\n"+
			"document.getElementsByName(\"x2\")[0].childNodes[5].removeAttribute(\"selected\");\n"+
			"document.getElementsByName(\"x2\")[0].childNodes[3].setAttribute(\"selected\", \"selected\");\n"+
*/	"} else {"+
		"var ressisgesammt = lager[0] + lager[1] + lager[2] + lager[3];\n"+
		"ressisfaktor = new Array();\n"+
		"ressisfaktor[0] = ressisgesammt/lager[0];\n"+
		"ressisfaktor[1] = ressisgesammt/lager[1];\n"+
		"ressisfaktor[2] = ressisgesammt/lager[2];\n"+
		"ressisfaktor[3] = ressisgesammt/lager[3];\n"+
		"document.getElementById(\"r1\").value=Math.ceil((haendler * carry)/ressisfaktor[0])-1;\n"+
		"document.getElementById(\"r2\").value=Math.ceil((haendler * carry)/ressisfaktor[1])-1;\n"+
		"document.getElementById(\"r3\").value=Math.ceil((haendler * carry)/ressisfaktor[2])-1;\n"+
		"document.getElementById(\"r4\").value=Math.ceil((haendler * carry)/ressisfaktor[3])-1;\n"+
		"document.getElementsByName(\"x2\")[0].childNodes[1].removeAttribute(\"selected\");\n"+
		"document.getElementsByName(\"x2\")[0].childNodes[3].removeAttribute(\"selected\");\n"+
		"document.getElementsByName(\"x2\")[0].childNodes[5].setAttribute(\"selected\", \"selected\");\n"+
	"}"+

"}\n"+
"//--> "))

	document.getElementById("build").insertBefore(lieferScript, menu)
}