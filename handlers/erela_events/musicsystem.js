const {
  MessageEmbed,
  MessageButton,
  MessageActionRow,
  MessageSelectMenu
} = require("discord.js")
const {
  check_if_dj,
  autoplay,
  escapeRegex,
  format,
  duration,
  createBar,
  delay
} = require("../functions");
const config = require(`${process.cwd()}/botconfig/config.json`);
const ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const playermanager = require(`${process.cwd()}/handlers/playermanager`);
//we need to create the music system, somewhere...
module.exports = client => {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton() && !interaction.isSelectMenu()) return;
    var {
      guild,
      message,
      channel,
      member,
      user
    } = interaction;
    if (!guild) guild = client.guilds.cache.get(interaction.guildId);
    if (!guild) return;
    var prefix = client.settings.get(guild.id);
    var data = client.musicsettings.get(guild.id);
    var musicChannelId = data.channel;
    var musicChannelMessage = data.message;
    //if not setupped yet, return
    if (!musicChannelId || musicChannelId.length < 5) return;
    if (!musicChannelMessage || musicChannelMessage.length < 5) return;
    //if the channel doesnt exist, try to get it and the return if still doesnt exist
    if (!channel) channel = guild.channels.cache.get(interaction.channelId);
    if (!channel) return;
    //if not the right channel return
    if (musicChannelId != channel.id) return;
    //if not the right message, return
    if (musicChannelMessage != message.id) return;

    if (!member) member = guild.members.cache.get(user.id);
    if (!member) member = await guild.members.fetch(user.id).catch(() => {});
    if (!member) return;
    //if the member is not connected to a vc, return
    if (!member.voice.channel) return interaction.reply({
      ephemeral: true,
      content: ":x: **Please Connect to a Voice Channel first!**"
    })
    //now its time to start the music system
    if (!member.voice.channel)
      return interaction.reply({
        content: `❌ **Please join a Voice Channel first!**`,
        ephemeral: true
      })

    var player = client.manager.players.get(interaction.guild.id);
    //if not connected to the same voice channel, then make sure to connect to it!
    if (player && member.voice.channel.id !== player.voiceChannel)
      return interaction.reply({
        content: `❌ **Please join __my__ Voice Channel first! <#${player.voiceChannel}>**`,
        ephemeral: true
      })
    let es = client.settings.get(guild.id, "embed")
    let ls = client.settings.get(guild.id, "language")
    if (interaction.isButton()) {
      if (!player || !player.queue || !player.queue.current) {
        return interaction.reply({
          content: "❌ Nothing Playing yet",
          ephemeral: true
        })
      }
      //here i use my check_if_dj function to check if he is a dj if not then it returns true, and it shall stop!
      if (player && interaction.customId != `Lyrics` && check_if_dj(client, member, player.queue.current)) {
        return interaction.reply({
          embeds: [new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setFooter(ee.footertext, ee.footericon)
            .setTitle(`❌ **You are not a DJ and not the Song Requester!**`)
            .setDescription(`**DJ-ROLES:**\n${check_if_dj(client, interaction.member, player.queue.current)}`)
          ],
          ephemeral: true
        });
      }
      switch (interaction.customId) {
        case "Skip": {
          //if ther is nothing more to skip then stop music and leave the Channel
          if (player.queue.size == 0) {
            //if its on autoplay mode, then do autoplay before leaving...
            if (player.get("autoplay")) return autoplay(client, player, "skip");
            interaction.reply({
              embeds: [new MessageEmbed()
                .setColor("#FFD700")
                
                .setDescription(`⏹ **Stopped playing and left the Channel**`)
                .setFooter(`💢 Action by: ${member.user.tag}`, member.user.displayAvatarURL({
                  dynamic: true
                }))
              ]
            })
            await player.destroy()
            //edit the message so that it's right!
            var data = generateQueueEmbed(client, guild.id, true)
            message.edit(data).catch((e) => {
              //console.log(e.stack ? String(e.stack).grey : String(e).grey)
            })
            return
          }
          //skip the track
          await player.stop();
          interaction.reply({
            embeds: [new MessageEmbed()
              .setColor("#FFD700")
              
              .setDescription(`⏭ **Skipped to the next Song!**`)
            ]
          })
          //edit the message so that it's right!
          var data = generateQueueEmbed(client, guild.id)
          message.edit(data).catch((e) => {
            //console.log(e.stack ? String(e.stack).grey : String(e).grey)
          })
        }
        break;
      case "Stop": {
        //Stop the player
        interaction.reply({
          embeds: [new MessageEmbed()
            .setColor("#FFD700")
            
            .setDescription(`⏹ **Stopped playing and left the Channel**`)

          ]
        })
        if (player) {
          await player.destroy();
          //edit the message so that it's right!
          var data = generateQueueEmbed(client, guild.id, true)
          message.edit(data).catch((e) => {
            //console.log(e.stack ? String(e.stack).grey : String(e).grey)
          })
        } else {
          //edit the message so that it's right!
          var data = generateQueueEmbed(client, guild.id, true)
          message.edit(data).catch((e) => {
            //console.log(e.stack ? String(e.stack).grey : String(e).grey)
          })
        }
      }
      break;
      case "Pause": {
        if (!player.playing) {
          player.pause(false);
          interaction.reply({
            embeds: [new MessageEmbed()
              .setColor("#FFD700")
              
              .setDescription(`▶️ **Resumed!**`)
            ]
          })
        } else {
          //pause the player
          player.pause(true);

          interaction.reply({
            embeds: [new MessageEmbed()
              .setColor("#FFD700")
              
              .setDescription(`⏸ **Paused!**`)
            ]
          })
        }
        //edit the message so that it's right!
        var data = generateQueueEmbed(client, guild.id)
        message.edit(data).catch((e) => {
          //console.log(e.stack ? String(e.stack).grey : String(e).grey)
        })
      }
      break;
      case "Autoplay": {
        //pause the player
        player.set(`autoplay`, !player.get(`autoplay`))
        interaction.reply({
          embeds: [new MessageEmbed()
            .setColor("#FFD700")
            
            .setDescription(`${player.get(`autoplay`) ? `✅ **Enabled Autoplay**`: `❌ **Disabled Autoplay**`}`)

          ]
        })
        //edit the message so that it's right!
        var data = generateQueueEmbed(client, guild.id)
        message.edit(data).catch((e) => {
          //console.log(e.stack ? String(e.stack).grey : String(e).grey)
        })
      }
      break;
      case "Shuffle": {
        //set into the player instance an old Queue, before the shuffle...
        player.set(`beforeshuffle`, player.queue.map(track => track));
        //shuffle the Queue
        player.queue.shuffle();
        //Send Success Message
        interaction.reply({
          embeds: [new MessageEmbed()
            .setColor("#FFD700")
            
            .setDescription(`🔀 **Shuffled ${player.queue.length} Songs!**`)

          ]
        })
        //edit the message so that it's right!
        var data = generateQueueEmbed(client, guild.id)
        message.edit(data).catch((e) => {
          //console.log(e.stack ? String(e.stack).grey : String(e).grey)
        })
      }
      break;
      case "Song": {
        //if there is active queue loop, disable it + add embed information
        if (player.queueRepeat) {
          player.setQueueRepeat(false);
        }
        //set track repeat to revers of old track repeat
        player.setTrackRepeat(!player.trackRepeat);
        interaction.reply({
          embeds: [new MessageEmbed()
            .setColor("#FFD700")
            
            .setDescription(`${player.trackRepeat ? `✅ **Enabled Song Loop**`: `❌ **Disabled Song Loop**`}`)

          ]
        })
        //edit the message so that it's right!
        var data = generateQueueEmbed(client, guild.id)
        message.edit(data).catch((e) => {
          //console.log(e.stack ? String(e.stack).grey : String(e).grey)
        })
      }
      break;
      case "Queue": {
        //if there is active queue loop, disable it + add embed information
        if (player.trackRepeat) {
          player.setTrackRepeat(false);
        }
        //set track repeat to revers of old track repeat
        player.setQueueRepeat(!player.queueRepeat);
        interaction.reply({
          embeds: [new MessageEmbed()
            .setColor("#FFD700")
            
            .setDescription(`${player.queueRepeat ? `✅ **Enabled Queue Loop**`: `❌ **Disabled Queue Loop**`}`)

          ]
        })
        //edit the message so that it's right!
        var data = generateQueueEmbed(client, guild.id)
        message.edit(data).catch((e) => {
          //console.log(e.stack ? String(e.stack).grey : String(e).grey)
        })
      }
      break;
      case "Forward": {
        //get the seektime variable of the user input
        var seektime = Number(player.position) + 10 * 1000;
        //if the userinput is smaller then 0, then set the seektime to just the player.position
        if (10 <= 0) seektime = Number(player.position);
        //if the seektime is too big, then set it 1 sec earlier
        if (Number(seektime) >= player.queue.current.duration) seektime = player.queue.current.duration - 1000;
        //seek to the new Seek position
        await player.seek(Number(seektime));
        interaction.reply({
          embeds: [new MessageEmbed()
            .setColor("#FFD700")
            
            .setDescription(`⏩ **Forwarded the song for \`10 Seconds\`!**`)

          ]
        })
        //edit the message so that it's right!
        var data = generateQueueEmbed(client, guild.id)
        message.edit(data).catch((e) => {
          //console.log(e.stack ? String(e.stack).grey : String(e).grey)
        })
      }
      break;
      case "Rewind": {
        var seektime = player.position - 10 * 1000;
        if (seektime >= player.queue.current.duration - player.position || seektime < 0) {
          seektime = 0;
        }
        //seek to the new Seek position
        await player.seek(Number(seektime));
        interaction.reply({
          embeds: [new MessageEmbed()
            .setColor("#FFD700")
            
            .setDescription(`⏪ **Rewinded the song for \`10 Seconds\`!**`)

          ]
        })
        //edit the message so that it's right!
        var data = generateQueueEmbed(client, guild.id)
        message.edit(data).catch((e) => {
          //console.log(e.stack ? String(e.stack).grey : String(e).grey)
        })
      }
      break;
      case "vup": {
        let amount = Number(player.volume) + 10;
        interaction.reply({
          embeds: [new MessageEmbed()
            .setColor("#FFD700")
            
            .setDescription(`🔊 Volume set to ${amount}`)

          ]
        })
        if(amount >= 150) return interaction.reply({ content: `Cannot higher the player volume further more.`});
        await player.setVolume(amount);
        //edit the message so that it's right!
        var data = generateQueueEmbed(client, guild.id)
        message.edit(data).catch((e) => {
          //console.log(e.stack ? String(e.stack).grey : String(e).grey)
        })
      }
      break;
      case "vdown": {
        let amount = Number(player.volume) - 10;
        interaction.reply({
          embeds: [new MessageEmbed()
            .setColor("#FFD700")
            
            .setDescription(`🔊 Volume set to ${amount}`)

          ]
        })
        await player.setVolume(amount);
        //edit the message so that it's right!
        var data = generateQueueEmbed(client, guild.id)
        message.edit(data).catch((e) => {
          //console.log(e.stack ? String(e.stack).grey : String(e).grey)
        })
      }
      break;
      case "Forward": {
        //get the seektime variable of the user input
        var seektime = Number(player.position) + 10 * 1000;
        //if the userinput is smaller then 0, then set the seektime to just the player.position
        if (10 <= 0) seektime = Number(player.position);
        //if the seektime is too big, then set it 1 sec earlier
        if (Number(seektime) >= player.queue.current.duration) seektime = player.queue.current.duration - 1000;
        //seek to the new Seek position
        await player.seek(Number(seektime));
        interaction.reply({
          embeds: [new MessageEmbed()
           .setColor("#FFD700")
            
            .setDescription(`⏩ **Forwarded the song for \`10 Seconds\`!**`)
          ]
        })
        //edit the message so that it's right!
        var data = generateQueueEmbed(client, guild.id)
        message.edit(data).catch((e) => {
          //console.log(e.stack ? String(e.stack).grey : String(e).grey)
        })
      }
      break;
      }
    }
    if (interaction.isSelectMenu()) {
      let link = "https://open.spotify.com/playlist/37i9dQZF1DXc6IFF23C9jj";
      if (interaction.values[0]) {
        //ncs | no copyrighted music
        if (interaction.values[0].toLowerCase().startsWith("n")) link = "https://open.spotify.com/playlist/7sZbq8QGyMnhKPcLJvCUFD";
        //pop
        if (interaction.values[0].toLowerCase().startsWith("p")) link = "https://open.spotify.com/playlist/37i9dQZF1DXc6IFF23C9jj";
        //default
        if (interaction.values[0].toLowerCase().startsWith("d")) link = "https://open.spotify.com/playlist/37i9dQZF1DXc6IFF23C9jj";
        //remixes from Magic Release
        if (interaction.values[0].toLowerCase().startsWith("re")) link = "https://www.youtube.com/watch?v=NX7BqdQ1KeU&list=PLYUn4YaogdahwfEkuu5V14gYtTqODx7R2"
        //rock
        if (interaction.values[0].toLowerCase().startsWith("ro")) link = "https://open.spotify.com/playlist/37i9dQZF1DWXRqgorJj26U";
        //oldgaming
        if (interaction.values[0].toLowerCase().startsWith("o")) link = "https://www.youtube.com/watch?v=iFOAJ12lDDU&list=PLYUn4YaogdahPQPTnBGCrytV97h8ABEav"
        //gaming
        if (interaction.values[0].toLowerCase().startsWith("g")) link = "https://open.spotify.com/playlist/4a54P2VHy30WTi7gix0KW6";
        //Charts
        if (interaction.values[0].toLowerCase().startsWith("cha")) link = "https://www.youtube.com/playlist?list=PLMC9KNkIncKvYin_USF1qoJQnIyMAfRxl"
        //Chill
        if (interaction.values[0].toLowerCase().startsWith("chi")) link = "https://open.spotify.com/playlist/37i9dQZF1DX4WYpdgoIcn6";
        //Jazz
        if (interaction.values[0].toLowerCase().startsWith("j")) link = "https://open.spotify.com/playlist/37i9dQZF1DXbITWG1ZJKYt";
        //blues
        if (interaction.values[0].toLowerCase().startsWith("b")) link = "https://open.spotify.com/playlist/37i9dQZF1DXd9rSDyQguIk";
        //strange-fruits
        if (interaction.values[0].toLowerCase().startsWith("s")) link = "https://open.spotify.com/playlist/6xGLprv9fmlMgeAMpW0x51";
        //magic-release
        if (interaction.values[0].toLowerCase().startsWith("ma")) link = "https://www.youtube.com/watch?v=WvMc5_RbQNc&list=PLYUn4Yaogdagvwe69dczceHTNm0K_ZG3P"
        //metal
        if (interaction.values[0].toLowerCase().startsWith("me")) link = "https://open.spotify.com/playlist/37i9dQZF1DX9qNs32fujYe";
        //heavy metal
        if (interaction.values[0].toLowerCase().startsWith("h")) link = "https://open.spotify.com/playlist/37i9dQZF1DX9qNs32fujYe";
      }
      interaction.reply({
        embeds: [new MessageEmbed()
          .setColor("#70C8FF")
          .setAuthor(`Loading '${interaction.values[0] ? interaction.values[0] : "Default"}' Music Mix`, "https://imgur.com/xutrSuq.gif", link)
          .setDescription(eval(client.la[ls]["cmds"]["music"]["playmusicmix"]["variable1"]))
          .setDescription(eval(client.la[ls]["cmds"]["music"]["playmusicmix"]["variable2"]))
          .addField(eval(client.la[ls]["cmds"]["music"]["playmusicmix"]["variablex_3"]), eval(client.la[ls]["cmds"]["music"]["playmusicmix"]["variable3"]))
          .setFooter(es.footertext, es.footericon)
        ]
      })
      //play the SONG from YOUTUBE
      playermanager(client, {
        guild,
        member,
        author: member.user,
        channel,
      }, Array(link), `song:youtube`, interaction, "songoftheday");
    }

  })
  //this was step 1 now we need to code the REQUEST System...


  client.on("messageCreate", async message => {
    if (!message.guild) return;
    var data = client.musicsettings.get(message.guild.id);
    var musicChannelId = data.channel;
    //if not setupped yet, return
    if (!musicChannelId || musicChannelId.length < 5) return;
    //if not the right channel return
    if (musicChannelId != message.channel.id) return;
    //Delete the message once it got sent into the channel, bot messages after 5 seconds, user messages instantly!
    if (message.author.id === client.user.id) {
      await delay(5000);
      if (!message.deleted) {
        message.delete().catch((e) => {
          console.log(e)
        })
      }
    } else {
      if (!message.deleted) {
        message.delete().catch((e) => {
          console.log(e)
        })
      }
    }
    if (message.author.bot) return; // if the message  author is a bot, return aka ignore the inputs
    var prefix = client.settings.get(message.guild.id, "prefix")
    //get the prefix regex system
    const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`); //the prefix can be a Mention of the Bot / The defined Prefix of the Bot
    var args;
    var cmd;
    if (prefixRegex.test(message.content)) {
      //if there is a attached prefix try executing a cmd!
      const [, matchedPrefix] = message.content.match(prefixRegex); //now define the right prefix either ping or not ping
      args = message.content.slice(matchedPrefix.length).trim().split(/ +/); //create the arguments with sliceing of of the rightprefix length
      cmd = args.shift().toLowerCase(); //creating the cmd argument by shifting the args by 1
      if (cmd || cmd.length === 0) return // message.reply("❌ **Please use a Command Somewhere else!**").then(msg=>{setTimeout(()=>{try{msg.delete().catch(() => {});}catch(e){ }}, 3000)})

      var command = client.commands.get(cmd); //get the command from the collection
      if (!command) command = client.commands.get(client.aliases.get(cmd)); //if the command does not exist, try to get it by his alias
      if (command) //if the command is now valid
      {
        return // message.reply("❌ **Please use a Command Somewhere else!**").then(msg=>{setTimeout(()=>{try{msg.delete().catch(() => {});}catch(e){ }}, 3000)})
      }
    }
    //getting the Voice Channel Data of the Message Member
    const {
      channel
    } = message.member.voice;
    //if not in a Voice Channel return!
    if (!channel) return message.reply("❌ **Please join a Voice Channel first!**").then(msg => {
      setTimeout(() => {
        try {
          msg.delete().catch(() => {});
        } catch (e) {}
      }, 5000)
    })
    //get the lavalink erela.js player information
    const player = client.manager.players.get(message.guild.id);
    //if there is a player and the user is not in the same channel as the Bot return information message
    if (player && channel.id !== player.voiceChannel) return message.reply(`❌ **Please join __my__ Voice Channel first! <#${player.voiceChannel}>**`).then(msg => {
      setTimeout(() => {
        try {
          msg.delete().catch(() => {});
        } catch (e) {}
      }, 3000)
    })


    else {
      return playermanager(client, message, message.content.trim().split(/ +/), "request:song");
    }
  })


}
function generateQueueEmbed(client, guildId, leave, message) {
  let guild = client.guilds.cache.get(guildId)
  if (!guild) return;
  let es = client.settings.get(guild.id, "embed")
  let ls = client.settings.get(guild.id, "language")
  var embeds = [
    new MessageEmbed()
    .setColor("#FFD700")
    .setImage("https://cdn.discordapp.com/attachments/922681442885054565/939360656082231306/Superimposed1644025555840.png"),
    new MessageEmbed()
    .setColor("#FFD700")
    .setImage("https://cdn.discordapp.com/attachments/922681442885054565/939360655675379792/20220205_013906.gif")
    .setDescription("**HOW TO USE THE BOT:**\nType your favorite song title with the artist name or simply by copy-paste the song/video URL on the text box")
    .setFooter(`I support Youtube, Spotify, Soundcloud and direct MP3 Links!`)
  ]
  const player = client.manager.players.get(guild.id);
  if (!leave && player && player.queue && player.queue.current) {
    embeds[1].setImage(`https://img.youtube.com/vi/${player.queue.current.identifier}/mqdefault.jpg?size=4066`)
      .addField(`Duration: `, `\`${format(player.queue.current.duration).split(" | ")[0]}\``, true)
      .addField(`Song By: `, `\`${player.queue.current.author}\``, true)
      .addField(`Queue length: `, `\`${player.queue.length} Songs\``, true)
      .setAuthor(`${player.queue.current.title}`, "https://images-ext-1.discordapp.net/external/DkPCBVBHBDJC8xHHCF2G7-rJXnTwj_qs78udThL8Cy0/%3Fv%3D1/https/cdn.discordapp.com/emojis/859459305152708630.gif", player.queue.current.uri)
      // .setAuthor("Maxx Music")   
    delete embeds[1].description;
    delete embeds[1].title;
    //get the right tracks of the current tracks
    const tracks = player.queue;
    var maxTracks = 5; //tracks / Queue Page
    //get an array of quelist where 10 tracks is one index in the array
    //message.channel.send("https://cdn.discordapp.com/attachments/848263660773834752/933981304003895316/20220121_150746.jpg")
    var songs = tracks.slice(0, maxTracks);
    embeds[0] = new MessageEmbed()
      .setImage("https://cdn.discordapp.com/attachments/922681442885054565/939360656082231306/Superimposed1644025555840.png")
      .setColor("#FFD700")
      .setDescription(String(songs.map((track, index) => `\` ${++index}. \` [${track.title.substr(0, 60).replace(/\[/igu, "\\[").replace(/\]/igu, "\\]")}](${track.uri})`).join(`\n`)).substr(0, 2048));
    if (player.queue.length > 5)
    embeds[0].addField(`\` N. \` ${player.queue.length > maxTracks ? player.queue.length - maxTracks : player.queue.length} other Tracks ...`, `\u200b`)
    embeds[0].addField(`\` 0. \` __Current Track__`, `[${player.queue.current.title.substr(0, 60).replace(/\[/igu, "\\[").replace(/\]/igu, "\\]")}](${player.queue.current.uri}) - \`${player.queue.current.isStream ? `LIVE STREAM` : format(player.queue.current.duration).split(` | `)[0]}\`\nRequested by: <@!${player.queue.current.requester.id}>`)

  }
  // var Emojis = [
  //   "0️⃣",
  //   "1️⃣",
  //   "2️⃣",
  //   "3️⃣",
  //   "4️⃣",
  //   "5️⃣",
  //   "6️⃣",
  //   "7️⃣",
  //   "8️⃣",
  //   "9️⃣",
  //   "🔟",
  //   "🟥",
  //   "🟧",
  //   "🟨",
  //   "🟩",
  //   "🟦",
  //   "🟪",
  //   "🟫",
  // ]
  //now we add the components!
  // var musicmixMenu = new MessageSelectMenu()
  //   .setCustomId("MessageSelectMenu")
  //   .addOptions(["Pop", "Strange-Fruits", "Gaming", "Chill", "Rock", "Jazz", "Blues", "Metal", "Magic-Release", "NCS | No Copyright Music", "Default"].map((t, index) => {
  //     return {
  //       label: t.substr(0, 25),
  //       value: t.substr(0, 25),
  //       description: `Load a Music-Playlist: "${t}"`.substr(0, 50),
  //       emoji: Emojis[index]
  //     }
  //   }))
  var stopbutton = new MessageButton().setStyle('SECONDARY').setCustomId('Stop').setEmoji(`⏹`).setDisabled()
  var skipbutton = new MessageButton().setStyle('SECONDARY').setCustomId('Skip').setEmoji(`⏭`).setDisabled();
  var shufflebutton = new MessageButton().setStyle('SECONDARY').setCustomId('Shuffle').setEmoji('🔀').setDisabled();
  var pausebutton = new MessageButton().setStyle('SECONDARY').setCustomId('Pause').setEmoji('⏸').setDisabled();
  var autoplaybutton = new MessageButton().setStyle('SECONDARY').setCustomId('Autoplay').setEmoji('🎶').setDisabled();
  var songbutton = new MessageButton().setStyle('SECONDARY').setCustomId('Song').setEmoji(`🔂`).setDisabled();
  var queuebutton = new MessageButton().setStyle('SECONDARY').setCustomId('Queue').setEmoji(`🔁`).setDisabled();
  var vdown = new MessageButton().setStyle('SECONDARY').setCustomId('vdown').setEmoji('🔉').setDisabled();
  var vup = new MessageButton().setStyle('SECONDARY').setCustomId('vup').setEmoji('🔊').setDisabled();
  var forwardbutton = new MessageButton().setStyle('SECONDARY').setCustomId('Forward').setEmoji('⏩').setDisabled();
  if (!leave && player && player.queue && player.queue.current) {
    skipbutton = skipbutton.setDisabled(false);
    shufflebutton = shufflebutton.setDisabled(false);
    stopbutton = stopbutton.setDisabled(false);
    songbutton = songbutton.setDisabled(false);
    queuebutton = queuebutton.setDisabled(false);
    vup = vup.setDisabled(false);
    vdown = vdown.setDisabled(false);
    forwardbutton = forwardbutton.setDisabled(false);
    autoplaybutton = autoplaybutton.setDisabled(false)
    pausebutton = pausebutton.setDisabled(false)
    if (player.get("autoplay")) {
      autoplaybutton = autoplaybutton.setStyle('SUCCESS')
    }
    if (!player.playing) {
      pausebutton = pausebutton.setStyle('SUCCESS').setEmoji('▶️')
    }
    if (!player.queueRepeat && !player.trackRepeat) {
      songbutton = songbutton.setStyle('SECONDARY')
      queuebutton = queuebutton.setStyle('SECONDARY')
    }
    if (player.trackRepeat) {
      songbutton = songbutton.setStyle('SUCCESS')
      queuebutton = queuebutton.setStyle('SUCCESS')
    }
    if (player.queueRepeat) {
      songbutton = songbutton.setStyle('SUCCESS')
      queuebutton = queuebutton.setStyle('SUCCESS')
    }
  }
  //now we add the components!
  var components = [
    new MessageActionRow().addComponents([
      skipbutton,
      stopbutton,
      pausebutton,
      autoplaybutton,
      shufflebutton,
    ]),
    new MessageActionRow().addComponents([
      songbutton,
      queuebutton,
      vdown,
      vup,
      forwardbutton,
    ]),
  ]
  return {
    embeds,
    components
  }
}
module.exports.generateQueueEmbed = generateQueueEmbed;
