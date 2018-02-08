const request = require('request');
const Discord = require("discord.js");
const client = new Discord.Client();

if (!process.env.heroku) {
  const config = require('./config/private');
}

const apiKey = (process.env.wowapikey || config.wowapikey);
const Helpers = (function() {
  var capitalizeFirstLetter = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  return {
    capitalizeFirstLetter: capitalizeFirstLetter
  }
})();

const Commands = (function() {

  _classes = {};
  _races = {};

  var _loadClasses = function() {
    request('https://eu.api.battle.net/wow/data/character/classes?locale=en_GB&apikey=' + apiKey, function(error, response, body) {
      _classes = JSON.parse(body);
    });
  }

  var _loadRaces = function() {
    request('https://eu.api.battle.net/wow/data/character/races?locale=en_GB&apikey=' + apiKey, function(error, response, body) {
      _races = JSON.parse(body);
    });
  }

  var _lookupClass = function(classId) {
    for (let i = 0; i < _classes.classes.length; i++) {
      if (_classes.classes[i].id === classId) {
        return _classes.classes[i].name;
      }
    }
  }

  var _lookupRace = function(raceId) {
    for (let i = 0; i < _races.races.length; i++) {
      if (_races.races[i].id === raceId) {
        return {
          race: _races.races[i].name,
          faction: Helpers.capitalizeFirstLetter(_races.races[i].side)
        }
      }
    }
  }

  var _makeEmbed = function() {}

  var _executeCommand = function(msg, command) {
    if (command.match("^!lookupCharacter")) {
      let charInfo = command.substring(16);
      charInfo = charInfo.toLowerCase();
      if (charInfo !== "") {

        msg.channel.sendMessage("For now I r stupid bot and only look for Draenor - EU");
        msg.channel.sendMessage("looking up " + charInfo);

        console.log("charName", charInfo);

        var url = 'https://eu.api.battle.net/wow/character/draenor/' + charInfo + '?fields=progression&locale=en_GB&apikey=' + apiKey;
        url = encodeURI(url);


        request(url, function(error, response, body) {
          console.log('statusCode:', response && response.statusCode);
          if (response.statusCode === 200) {
            character = JSON.parse(body);

            var embedMsg = new Discord.RichEmbed();
            for (key in character) {
              console.log(key);
              if (key !== "lastModified" && key !== "calcClass" && key !== "totalHonorableKills" && key !== "faction" && key !== "achievementPoints") {
                switch (key) {
                  case "thumbnail":
                    var url = "https://render-eu.worldofwarcraft.com/character/" + character[key];
                    embedMsg.setThumbnail(url);
                    break;

                  case "class":
                    var className = _lookupClass(character[key]);
                    embedMsg.addField(Helpers.capitalizeFirstLetter(key), className);
                    break;

                  case "race":
                    var raceInfo = _lookupRace(character[key]);
                    embedMsg.addField(Helpers.capitalizeFirstLetter(key), raceInfo.race);
                    embedMsg.addField("faction", raceInfo.faction);
                    break;

                  case "gender":
                    var gender = (character[key] ? "female" : "male");
                    embedMsg.addField(Helpers.capitalizeFirstLetter(key), Helpers.capitalizeFirstLetter(gender));
                    break;

                  case "progression":
                    for (let i = 0; i < character[key].raids.length; i++) {
                      if (character[key].raids[i].id === 8638) {
                        for (let x = 0; x < character[key].raids[i].bosses.length; x++) {
                          if (character[key].raids[i].bosses[x].id === 124828) {
                            var heroicKills = character[key].raids[i].bosses[x].heroicKills;
                            var normalKills = character[key].raids[i].bosses[x].normalKills;
                            var mythicKills = character[key].raids[i].bosses[x].mythicKills;
                            embedMsg.addField("Argus HC Kills", "normal: " + normalKills + " | heroic: " + heroicKills + " | mythic: " + mythicKills);
                          }
                        }
                      }
                    }
                    break;

                  default:
                    embedMsg.addField(Helpers.capitalizeFirstLetter(key), character[key]);
                    break;
                }

              }
            }
            embedMsg.setColor(000);
            msg.channel.sendMessage(embedMsg);
          } else {
            msg.channel.sendMessage("Something went wrong :eggplant:");
          }
        });

      } else {
        msg.channel.sendMessage("no character. retord");
      }

      return;
    }

    if (command.match("^!ioLookup")) {
      let charInfo = command.substring(9).toLowerCase();
      var questionRegex = /(\?.*)/i;
      let regexInfo = questionRegex.exec(charInfo);

      if (regexInfo !== null) {
        let characterName = charInfo.substring(0, regexInfo.index);
        let realm = regexInfo[0].substring(1);
        console.log(characterName);
        console.log(realm);
        msg.channel.sendMessage(`looking up character: ${characterName} in realm: ${realm}`);
        https: //raider.io/api/v1/characters/profile?region=eu&realm=sunstrider&name=bababa
          var url = `https://raider.io/api/v1/characters/profile?region=eu&realm=${realm}&name=${characterName}&fields=mythic_plus_scores,raid_progression`;
        url = encodeURI(url);


        request(url, function(error, response, body) {
          if (response.statusCode === 200) {
            let character = JSON.parse(body);
            var embedMsg = new Discord.RichEmbed();
            console.log(character);
            for (key in character) {
              console.log(key);
              if (key !== "honorable_kills" && key !== "active_spec_name" && key !== "active_spec_role" && key !== "region" && key !== "achievement_points" && key !== "faction") {
                switch (key) {
                  case "thumbnail_url":
                    var url = character[key];
                    embedMsg.setThumbnail(url);
                    break;

                  case "profile_url":
                    embedMsg.setURL(character[key]);
                    break;

                  case "mythic_plus_scores":
                    var allscore = character[key]["all"];
                    embedMsg.addField("M+ Score", allscore);
                    break;

                  case "raid_progression":
                    console.log("PROG");
                    var antorusProg = character[key]['antorus-the-burning-throne']['summary'];
                    console.log(antorusProg);
                    embedMsg.addField("Antorus", antorusProg);
                    break;

                  default:
                    embedMsg.addField(Helpers.capitalizeFirstLetter(key), character[key]);
                    break;
                }

              }
            }

            embedMsg.setColor(000);
            msg.channel.sendMessage(embedMsg);
          }
        });
      } else {
        msg.channel.sendMessage("Seperate character and realm with a ? -- Example: bababa?sunstrider");
      }

      return;
    }

    switch (command) {
      case "!memelord":
        msg.channel.sendMessage("Baba best memelord");
        break;

      default:
        msg.channel.sendMessage("Not a known command :sadface:");

        break;
    }
  }

  var getMsg = function(msg) {
    _executeCommand(msg, msg.content);
  }

  var _init = function() {
    _loadClasses();
    _loadRaces();
  }

  _init();

  return {
    getMsg: getMsg
  }

})();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  // check if it starts with "!" --> makes it so it shows a command
  if (msg.content.match("^!")) {
    Commands.getMsg(msg);
  }
});

client.login(process.env.discordtoken || config.discordtoken);
