var {
  MessageEmbed,
  MessageActionRow,
  MessageSelectMenu,
} = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const fs = require('fs');
var {
  isValidURL
} = require(`${process.cwd()}/handlers/functions`);
const moment = require("moment")
module.exports = {
  name: "changestatus",
  category: "👑 Owner",
  type: "bot",
  aliases: ["botstatus", "status"],
  cooldown: 5,
  usage: "changestatus  -->  Follow the Steps",
  description: "Changes the Status of the BOT",
  run: async (client, message, args, cmduser, text, prefix, player, es, ls) => {
    if (!config.ownerIDS.some(r => r.includes(message.author.id)))
      return message.channel.send({
        embeds: [new MessageEmbed()
          .setColor(es.wrongcolor).setFooter(es.footertext, es.footericon)
          .setTitle(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable1"]))
          .setDescription(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable2"]))
        ]
      });
    first_layer()
    async function first_layer() {
      let menuoptions = [{
          value: "Status Text",
          description: `Change the Display Text of the Status`,
          emoji: "📝"
        },
        {
          value: "Status Type",
          description: `Change the Status-Type to: Playing/Listening/...`,
          emoji: "🔰"
        },
        {
          value: "Status URL",
          description: `If Status-State = Streaming, change the Twitch URL`,
          emoji: "🔗"
        },
        {
          value: "Status State",
          description: `Change the Status-State to: Online/Idle/Dnd/Streaming`,
          emoji: "🔖"
        },
        {
          value: "Cancel",
          description: `Cancel and stop the Change-Status-Setup!`,
          emoji: "⛔"
        }
      ]
      //define the selection
      let Selection = new MessageSelectMenu()
        .setCustomId('MenuSelection')
        .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
        .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
        .setPlaceholder('Click me to change the Status')
        .addOptions(
          menuoptions.map(option => {
            let Obj = {
              label: option.label ? option.label.substr(0, 50) : option.value.substr(0, 50),
              value: option.value.substr(0, 50),
              description: option.description.substr(0, 50),
            }
            if (option.emoji) Obj.emoji = option.emoji;
            return Obj;
          }))

      //define the embed
      let MenuEmbed = new MessageEmbed()
        .setColor(es.color)
        .setAuthor('Change Status', 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/au-kddi/190/purple-heart_1f49c.png', 'https://discord.gg/milrato')
        .setDescription(`***Select what you need in the \`Selection\` down below***`)
      //send the menu msg
      let menumsg = await message.reply({
        embeds: [MenuEmbed],
        components: [new MessageActionRow().addComponents(Selection)]
      })
      //Create the collector
      const collector = menumsg.createMessageComponentCollector({
        filter: i => i.isSelectMenu() && i.message.author.id == client.user.id && i.user,
        time: 90000
      })
      //Menu Collections
      collector.on('collect', menu => {
        if (menu.user.id === cmduser.id) {
          collector.stop();
          if (menu.values[0] == "Cancel") return menu.reply(`❌ Cancelled the Process`)
          menu.deferUpdate();
          handle_the_picks(menu.values[0])
        } else menu.reply({
          content: `❌ You are not allowed to do that! Only: <@${cmduser.id}>`,
          ephemeral: true
        });
      });
      //Once the Collections ended edit the menu message
      collector.on('end', collected => {
        menumsg.edit({
          embeds: [menumsg.embeds[0].setDescription(`~~${menumsg.embeds[0].description}~~`)],
          components: [],
          content: `${collected && collected.first() && collected.first().values ? `👍 **Selected: \`${collected ? collected.first().values[0] : "Nothing"}\`**` : "❌ **NOTHING SELECTED - CANCELLED**" }`
        })
      });
    }

    async function handle_the_picks(optionhandletype) {
      switch (optionhandletype) {
        case "Status Text": {
          var tempmsg = await message.reply({
            embeds: [new MessageEmbed()
              .setTitle(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable7"]))
              .setColor(es.color)
              .setDescription(`Example: \`${prefix}help | ${client.user.username.split(" ")[0]} | by: milrato.dev\`
      
              *Enter the text now!*`).setFooter(es.footertext, es.footericon)
              .addField("KEYWORDS which get replaced:", `\`{guildcount}\` .. Shows all guilds
              \`{prefix}\` .. Shows the default Prefix
              \`{membercount}\` .. Shows all Members
              \`{created}\` .. Shows when the Bot was Created
              
              \`{createdtime}\` .. Shows when Time when was Created
              \`{name}\` .. Shows Bot Name
              \`{tag}\` ... Shows Bot Name#1234
              \`{commands}\` .. Shows all Commands
              \`{usedcommands}\` .. Shows Amount of Used Commands
              \`{songsplayed}\` .. Shows Amount of Played Songs`)
            ]
          })
          await tempmsg.channel.awaitMessages({
              filter: m => m.author.id == cmduser.id,
              max: 1,
              time: 90000,
              errors: ["time"]
            })
            .then(async collected => {
              var msg = collected.first().content;
              let status = config
              let newStatusText = msg
                .replace("{prefix}", config.prefix)
                .replace("{guildcount}", client.guilds.cache.size)
                .replace("{membercount}", client.guilds.cache.reduce((a, b) => a + b.memberCount, 0))
                .replace("{created}", moment(client.user.createdTimestamp).format("DD/MM/YYYY"))
                .replace("{createdime}", moment(client.user.createdTimestamp).format("HH:mm:ss"))
                .replace("{name}", client.user.username)
                .replace("{tag}", client.user.tag)
                .replace("{commands}", client.commands.size)
                .replace("{usedcommands}", client.stats.get("global", "commands"))
                .replace("{songsplayed}", client.stats.get("global", "songs"))
              newStatusText = String(newStatusText).substr(0, 128);
              status.status.text = String(msg).substr(0, 128);
              client.user.setActivity(newStatusText, {
                type: config.status.type,
                url: config.status.url
              })
              fs.writeFile(`./botconfig/config.json`, JSON.stringify(status, null, 3), (e) => {
                if (e) {
                  console.log(e.stack ? String(e.stack).dim : String(e).dim);
                  return message.channel.send({
                    embeds: [new MessageEmbed()
                      .setFooter(es.footertext, es.footericon)
                      .setColor(es.wrongcolor)
                      .setTitle(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable8"]))
                      .setDescription(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable9"]))
                    ]
                  })
                }
                return message.channel.send({
                  embeds: [new MessageEmbed()
                    .setFooter(es.footertext, es.footericon)
                    .setColor(es.color)
                    .setTitle(`Successfully set the New Status Text to:\n> \`${newStatusText}\``)
                  ]
                })
              });
            }).catch(e => {
              console.log(e)
              return message.reply({
                embeds: [new MessageEmbed()
                  .setTitle(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable11"]))
                  .setColor(es.wrongcolor)
                  .setDescription(`\`\`\`${String(e.message ? e.message : e).substr(0, 2000)}\`\`\``.substr(0, 2000))
                  .setFooter(es.footertext, es.footericon)
                ]
              });
            })
        }
        break;
      case "Status Type": {
        second_layer()
        async function second_layer() {
          let menuoptions = [{
              value: "PLAYING",
              description: `e.g: Playing ${config.status.text}`
            },
            {
              value: "WATCHING",
              description: `e.g: Watching ${config.status.text}`
            },
            {
              value: "STREAMING",
              description: `e.g: Streaming ${config.status.text}`
            },
            {
              value: "LISTENING",
              description: `e.g: Listening to ${config.status.text}`
            },
            {
              value: "COMPETING",
              description: `e.g: Competing ${config.status.text}`
            },
            {
              value: "Cancel",
              description: `Cancel and stop the Change-Status-Setup!`,
              emoji: "⛔"
            }
          ]
          //define the selection
          let Selection = new MessageSelectMenu()
            .setCustomId('MenuSelection')
            .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
            .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
            .setPlaceholder('Click me to change the Status')
            .addOptions(
              menuoptions.map(option => {
                let Obj = {
                  label: option.label ? option.label.substr(0, 50) : option.value.substr(0, 50),
                  value: option.value.substr(0, 50),
                  description: option.description.substr(0, 50),
                }
                if (option.emoji) Obj.emoji = option.emoji;
                return Obj;
              }))

          //define the embed
          let MenuEmbed = new MessageEmbed()
            .setColor(es.color)
            .setAuthor('Change Status', 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/au-kddi/190/purple-heart_1f49c.png', 'https://discord.gg/milrato')
            .setDescription(`***Select what you need in the \`Selection\` down below***`)
          //send the menu msg
          let menumsg = await message.reply({
            embeds: [MenuEmbed],
            components: [new MessageActionRow().addComponents(Selection)]
          })
          //Create the collector
          const collector = menumsg.createMessageComponentCollector({
            filter: i => i.isSelectMenu() && i.message.author.id == client.user.id && i.user,
            time: 90000
          })
          //Menu Collections
          collector.on('collect', menu => {
            if (menu.user.id === cmduser.id) {
              collector.stop();
              if (menu.values[0] == "Cancel") return menu.reply(`❌ Cancelled the Process`)
              menu.deferUpdate();
              let temptype = menu.values[0]
              let status = config
              status.status.type = temptype;
              client.user.setActivity(config.status.text, {
                type: temptype,
                url: config.status.url
              })
              fs.writeFile(`./botconfig/config.json`, JSON.stringify(status, null, 3), (e) => {
                if (e) {
                  console.log(e.stack ? String(e.stack).dim : String(e).dim);
                  return message.channel.send({
                    embeds: [new MessageEmbed()
                      .setFooter(es.footertext, es.footericon)
                      .setColor(es.wrongcolor)
                      .setTitle(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable14"]))
                      .setDescription(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable15"]))
                    ]
                  })
                }
                return message.channel.send({
                  embeds: [new MessageEmbed()
                    .setFooter(es.footertext, es.footericon)
                    .setColor(es.color)
                    .setTitle(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable16"]))
                  ]
                })
              });
            } else menu.reply({
              content: `❌ You are not allowed to do that! Only: <@${cmduser.id}>`,
              ephemeral: true
            });
          });
          //Once the Collections ended edit the menu message
          collector.on('end', collected => {
            menumsg.edit({
              embeds: [menumsg.embeds[0].setDescription(`~~${menumsg.embeds[0].description}~~`)],
              components: [],
              content: `${collected && collected.first() && collected.first().values ? `👍 **Selected: \`${collected ? collected.first().values[0] : "Nothing"}\`**` : "❌ **NOTHING SELECTED - CANCELLED**" }`
            })
          });
        }
      }
      break;
      case "Status URL": {
        tempmsg = await message.reply({
          embeds: [new MessageEmbed()
            .setTitle(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable22"]))
            .setColor(es.color)
            .setDescription(`
            Example: \`https://twitch.tv/#\` --> must be a twitch link
    
            *Enter the text now!*`).setFooter(es.footertext, es.footericon)
          ]
        })
        await tempmsg.channel.awaitMessages({
            filter: m => m.author.id == cmduser.id,
            max: 1,
            time: 90000,
            errors: ["time"]
          })
          .then(async collected => {
            var msg = collected.first().content;
            if (!isValidURL(msg))
              return message.channel.send({
                embeds: [new MessageEmbed()
                  .setFooter(es.footertext, es.footericon)
                  .setColor(es.wrongcolor)
                  .setTitle(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable23"]))
                ]
              })
            if (!msg.includes("twitch"))
              return message.channel.send({
                embeds: [new MessageEmbed()
                  .setFooter(es.footertext, es.footericon)
                  .setColor(es.wrongcolor)
                  .setTitle(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable24"]))
                ]
              })
            let status = config
            status.status.url = msg;
            client.user.setActivity(config.status.text, {
              type: config.status.type,
              url: msg
            })
            fs.writeFile(`./botconfig/config.json`, JSON.stringify(status, null, 3), (e) => {
              if (e) {
                console.log(e.stack ? String(e.stack).dim : String(e).dim);
                return message.channel.send({
                  embeds: [new MessageEmbed()
                    .setFooter(es.footertext, es.footericon)
                    .setColor(es.wrongcolor)
                    .setTitle(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable25"]))
                    .setDescription(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable26"]))
                  ]
                })
              }
              return message.channel.send({
                embeds: [new MessageEmbed()
                  .setFooter(es.footertext, es.footericon)
                  .setColor(es.color)
                  .setTitle(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable27"]))
                ]
              })
            });
          }).catch(e => {
            console.log(e)
            return message.reply({
              embeds: [new MessageEmbed()
                .setTitle(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable28"]))
                .setColor(es.wrongcolor)
                .setDescription(`\`\`\`${String(e.message ? e.message : e).substr(0, 2000)}\`\`\``.substr(0, 2000))
                .setFooter(es.footertext, es.footericon)
              ]
            });
          })
      }
      break;
      case "Status State": {
        second_layer()
        async function second_layer() {
          let menuoptions = [{
              value: "online",
              description: `Showing myself as ONLINE`,
              emoji: "🟢"
            },
            {
              value: "idle",
              description: `Showing myself as IDLE`,
              emoji: "🟡"
            },
            {
              value: "dnd",
              description: `Showing myself as DND`,
              emoji: "🔴"
            },
            {
              value: "Cancel",
              description: `Cancel and stop the Change-Status-Setup!`,
              emoji: "⛔"
            }
          ]
          //define the selection
          let Selection = new MessageSelectMenu()
            .setCustomId('MenuSelection')
            .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
            .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
            .setPlaceholder('Click me to change the Status')
            .addOptions(
              menuoptions.map(option => {
                let Obj = {
                  label: option.label ? option.label.substr(0, 50) : option.value.substr(0, 50),
                  value: option.value.substr(0, 50),
                  description: option.description.substr(0, 50),
                }
                if (option.emoji) Obj.emoji = option.emoji;
                return Obj;
              }))

          //define the embed
          let MenuEmbed = new MessageEmbed()
            .setColor(es.color)
            .setAuthor('Change Status', 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/au-kddi/190/purple-heart_1f49c.png', 'https://discord.gg/milrato')
            .setDescription(`***Select what you need in the \`Selection\` down below***`)
          //send the menu msg
          let menumsg = await message.reply({
            embeds: [MenuEmbed],
            components: [new MessageActionRow().addComponents(Selection)]
          })
          //Create the collector
          const collector = menumsg.createMessageComponentCollector({
            filter: i => i.isSelectMenu() && i.message.author.id == client.user.id && i.user,
            time: 90000
          })
          //Menu Collections
          collector.on('collect', menu => {
            if (menu.user.id === cmduser.id) {
              collector.stop();
              if (menu.values[0] == "Cancel") return menu.reply(`❌ Cancelled the Process`)
              menu.deferUpdate();
              let temptype = menu.values[0]
              client.user.setStatus(temptype)
              return message.channel.send({
                embeds: [new MessageEmbed()
                  .setFooter(es.footertext, es.footericon)
                  .setColor(es.color)
                  .setTitle(eval(client.la[ls]["cmds"]["owner"]["changestatus"]["variable20"]))
                ]
              })
            } else menu.reply({
              content: `❌ You are not allowed to do that! Only: <@${cmduser.id}>`,
              ephemeral: true
            });
          });
          //Once the Collections ended edit the menu message
          collector.on('end', collected => {
            menumsg.edit({
              embeds: [menumsg.embeds[0].setDescription(`~~${menumsg.embeds[0].description}~~`)],
              components: [],
              content: `${collected && collected.first() && collected.first().values ? `👍 **Selected: \`${collected ? collected.first().values[0] : "Nothing"}\`**` : "❌ **NOTHING SELECTED - CANCELLED**" }`
            })
          });
        }
      }
      break;

      }
    }
  },
};
