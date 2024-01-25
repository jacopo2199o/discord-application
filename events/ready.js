import { ActivityType } from "discord.js";
import fs from "node:fs";
import { customPoints } from "../resources/custom-points.js";
import { loadFile, saveFile } from "../resources/general-utilities.js";

const globalPoints = {};
const reputationPoints = {};
const referrals = {};

/**
 * @param { import("discord.js").Client } client
*/
const ready = async (client) => {
  await Promise.all(
    client.guilds.cache.map(
      async (guild) => {
        const invites = await guild.invites.fetch();
        const members = await guild.members.fetch();

        // global points
        if (fs.existsSync(`./resources/database/points-${guild.id}.json`)) {
          globalPoints[guild.id] = await loadFile(`./resources/database/points-${guild.id}.json`);

          members.forEach((member) => {
            if (globalPoints[guild.id][member.id] === undefined) {
              globalPoints[guild.id][member.id] = customPoints.start;
            }
          });

          for (const id in globalPoints[guild.id]) {
            if (members.get(id) === undefined) {
              delete globalPoints[guild.id][id];
            }
          }

          await saveFile(`./resources/database/points-${guild.id}.json`, globalPoints[guild.id]);
        } else {
          globalPoints[guild.id] = {};

          members.forEach((member) => {
            globalPoints[guild.id][member.id] = customPoints.start;
          });

          await saveFile(`./resources/database/points-${guild.id}.json`, globalPoints[guild.id]);
        }

        // reputation points
        if (fs.existsSync(`./resources/database/reputation-${guild.id}.json`)) {
          reputationPoints[guild.id] = await loadFile(`./resources/database/reputation-${guild.id}.json`);

          members.forEach((member) => {
            if (reputationPoints[guild.id][member.id] === undefined) {
              reputationPoints[guild.id][member.id] = {
                points: 0,
                gaveTo: ""
              };
            }
          });

          for (const id in reputationPoints[guild.id]) {
            if (members.get(id) === undefined) {
              delete reputationPoints[guild.id][id];
            }
          }

          await saveFile(`./resources/database/reputation-${guild.id}.json`, reputationPoints[guild.id]);
        } else {
          reputationPoints[guild.id] = {};

          members.forEach((member) => {
            reputationPoints[guild.id][member.id] = {
              points: 0,
              gaveTo: ""
            };
          });

          await saveFile(`./resources/database/reputation-${guild.id}.json`, reputationPoints[guild.id]);
        }

        invites.forEach((invite) => {
          referrals[invite.code] = invite.uses;
        });

        console.log(`legged in guild ${guild.name}`);
      }
    )
  );

  client.user.setPresence({
    activities: [{
      name: "https://discord.gg/F7UTwWtwTV",
      type: ActivityType.Watching,
    }]
  });

  console.log(`bot ready as ${client.user.username}`);
};

export {
  globalPoints,
  ready,
  referrals,
  reputationPoints
};

