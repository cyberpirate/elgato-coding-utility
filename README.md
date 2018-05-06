# elgato-coding-utility
A simple cross-platform program to use elgato to help me code


## profile file format

json
	[
		{
			"name": "profileName",
			"activateRule": function,
			"keys": [
				{
					"image": "path",
					"color": "R:G:B",
					"startPos": [x, y],
					"ltr": true,
					"utd": true,
					"action": function
				}
			]
		}
	]