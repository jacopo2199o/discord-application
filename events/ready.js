import fs from "fs";
import { customPoints } from "../resources/custom-points.js";
import { ActivityType } from "discord.js";

let globalPoints = {};
const reputationPoints = {};
const referrals = {};

/**
 * @param { import("discord.js").Client } client
*/
const ready = async (client) => {
  client.user.setPresence({
    activities: [{
      name: "https://discord.gg/F7UTwWtwTV",
      type: ActivityType.Watching,
    }]
  });

  client.guilds.cache.forEach(async (guild) => {
    const guildMembers = await guild.members.fetch();

    let p = {};

    if (fs.existsSync(`./resources/database/points-${guild.id}.json`)) {
      globalPoints[guild.id] = JSON.parse(fs.readFileSync(`./resources/database/points-${guild.id}.json`));
    } else {
      guildMembers.forEach((guildMember) => {
        if (!guildMember.user.bot) {
          p[guildMember.id] = {
            g: customPoints.start,
            pp: customPoints.start,
            rp: {points: 0, gaveTo: undefined}
          };
        }
      });

      globalPoints[guild.id] = p;

      fs.writeFileSync(`./resources/database/points-${guild.id}.json`, JSON.stringify(globalPoints[guild.id]));
    }
  });

  client.guilds.cache.forEach(async (guild) => {
    const guildInvites = await guild.invites.fetch();
    const guildMembers = await guild.members.fetch();

    guildMembers.forEach((guildMember) => {
      if (!guildMember.user.bot) {
        reputationPoints[guildMember.id] = {
          points: 0,
          gaveTo: undefined
        };
      }
    });

    guildInvites.forEach((guildInvite) => {
      referrals[guildInvite.code] = guildInvite.uses;
    });
  });

  console.log(`bot logged in as ${client.user.username}`);
};

export {
  //promotionPoints,
  globalPoints,
  reputationPoints,
  referrals,
  ready
};