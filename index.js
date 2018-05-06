const path = require('path');
var fs = require('fs');
const StreamDeck = require('elgato-stream-deck');

// Automatically discovers connected Stream Decks, and attaches to the first one.
// Throws if there are no connected stream decks.
// You also have the option of providing the devicePath yourself as the first argument to the constructor.
// For example: const myStreamDeck = new StreamDeck('\\\\?\\hid#vid_05f3&pid_0405&mi_00#7&56cf813&0&0000#{4d1e55b2-f16f-11cf-88cb-001111000030}')
// Device paths can be obtained via node-hid: https://github.com/node-hid/node-hid
const myStreamDeck = new StreamDeck();

profileDir = path.join(getUserHome(), ".elgato_profile");
profilePath = path.join(profileDir, "profile.js");

profiles = []
keys = {}
profileActivationEnabled = true;
activeProfiles = []

myStreamDeck.on('error', error => {
	console.error(error);
});

myStreamDeck.on('up', keyIndex => {
	if(keyIndex in keys) {
		keys[keyIndex]["action"]();
	}
});

function clamp(n, min, max) {
	return n < min ? min : n > max ? max : n;
}

function getUserHome() {
	return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function arrayEquals(arr1, arr2) {
	return JSON.stringify(arr1)===JSON.stringify(arr2);
}

function indexToXY(index) {
	var x = index % 5;
	var y = Math.floor(index / 5);
	return [2 - x, 1 - y]
}

function xyToIndex(x, y) {
	x = -x;
	y = -y;
	return (y+1) * 5 + (x+2);
}

function getNext(pos, ltr, utd) {

	if(pos == -1) {
		return xyToIndex(
			ltr ? -2 : 2,
			utd ? 1 : -1
		)
	}

	if(typeof(pos) === "number") pos = indexToXY(pos);

	pos[0] += ltr ? +1 : -1;

	if(pos[0] < -2 || 2 < pos[0]) {
		pos[0] = ltr ? -2 : 2;
		pos[1] += utd ? -1 : +1;
	}

	if(pos[1] < -1 || 1 < pos[1]) {
		return -1;
	}

	return xyToIndex(pos[0], pos[1]);
}

function appendKeys(newKeys) {

	for (var i = 0; i < newKeys.length; i++) {

		var ltr = "ltr" in newKeys[i] ? newKeys[i]["ltr"] : true;
		var utd = "utd" in newKeys[i] ? newKeys[i]["utd"] : true;
		var startPos = "startPos" in newKeys[i] ? newKeys[i]["startPos"] : indexToXY(getNext(-1, ltr, utd));

		startPos = xyToIndex(startPos[0], startPos[1]);

		while(startPos in keys) {
			startPos = getNext(startPos, ltr, utd);
			if(startPos == -1) break;
		}

		if(startPos == -1) {
			console.warn("no room for key");
			continue;
		}

		keys[startPos] = newKeys[i];

		if("image" in keys[startPos]) {
			myStreamDeck.fillImageFromFile(startPos, path.join(profileDir, keys[startPos]["image"]));
		}

		else if("color" in keys[startPos]) {
			cParts = keys[startPos]["color"].split(":");
			if(cParts.length == 3) {
				cParts[0] = clamp(parseInt(cParts[0]), 0, 255);
				cParts[1] = clamp(parseInt(cParts[1]), 0, 255);
				cParts[2] = clamp(parseInt(cParts[2]), 0, 255);
				myStreamDeck.fillColor(startPos, cParts[0], cParts[1], cParts[2]);
			}
		}
	}
}

function applyKeys(newKeys) {
	myStreamDeck.clearAllKeys();

	keys = {}

	appendKeys(newKeys);
}

function updateProfile() {
	if(!profileActivationEnabled) return;

	var oldActiveProfiles = activeProfiles;
	activeProfiles = [];
	var profileKeys = [];

	for(var i = 0; i < profiles.length; i++) {
		var active = profiles[i]["activateRule"]();
		if(active) {
			activeProfiles.push(profiles[i]["name"]);
			profileKeys.push(profiles[i]["keys"]);
		}
	}

	if(!arrayEquals(oldActiveProfiles, activeProfiles)) {

		applyKeys([]);

		for(var i = 0; i < profileKeys.length; i++) {
			appendKeys(profileKeys[i]);
		}
	}
}
setInterval(updateProfile, 1000);

function activateProfile(newProfiles) {
	profiles = profiles.concat(newProfiles);
}

if (!fs.existsSync(profilePath)) {
	console.log("~/.elgato_profile/profile.js not found")
	process.exit()
}

fs.readFile(profilePath, "utf-8", function(err, data) {
	if(err) throw err;
	eval(data);
})
