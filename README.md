# elgato-coding-utility
A simple cross-platform program to use elgato to help me code


## profile file format

json
	[
		{
			"name": "profileName",
			"activateRule": function,
			"keys": {
				[0-14]: {
					"image": "path",
					"color": "R:G:B",
					"action": function
				}
			}
		}
	]