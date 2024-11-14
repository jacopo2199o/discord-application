import {
  EmbedBuilder
} from "discord.js";
import {
  reputationPoints
} from "../../events/ready.js";
import {
  customPoints,
  getCalculatedPoints
} from "../../resources/custom-points.js";
import {
  getCustomRole
} from "../../resources/custom-roles.js";
import http from "node:http";

/**
 * @param {import("discord.js").Interaction} interaction
 */
async function takeProvince(
  interaction
) {
  await interaction.deferReply();
  const maker = interaction.member;
  const role = getCustomRole(
    maker
  );
  const points = getCalculatedPoints(
    customPoints.interactionCreate,
    reputationPoints[interaction.guildId][maker.id].points
  );
  const request = http.request(
    {
      host: "localhost",
      port: "3000",
      path: "/set_province?id=0",
      method: "POST",
    },
    function (
      response
    ) {
      let data = "";
      response.on(
        "data",
        function (
          chunk
        ) {
          data += chunk;
        }
      ).on(
        "end",
        async function () {
          if (
            response.statusCode == 200
          ) {
            let message_description = "";
            if (
              data == "tried"
            ) {
              message_description = `🗺️⚔️ ${role} *${maker}* tried to conquer a province`;
            } else if (
              data == "occupied"
            ) {
              message_description = `🗺️🛖 ${role} *${maker}* occupied a province`;
            } else if (
              data == "reinforced"
            ) {
              message_description = `🗺️🛡️ ${role} *${maker}* reinforced a province`;
            } else if (
              data == "conquered"
            ) {
              message_description = `🗺️🔥 ${role} *${maker}* conquered a province`;
            }
            const message = new EmbedBuilder().setDescription(
              message_description
            ).setFooter(
              {
                text: `${points} ⭐ to ${maker.displayName}`,
                iconURL: `${maker.displayAvatarURL()}`
              }
            ).setColor(
              role.color
            ).setTimestamp();
            await interaction.editReply(
              {
                embeds: [
                  message
                ]
              }
            );
          } else {
            await interaction.editReply(
              data
            );
          }
        }
      );
    }
  ).on(
    "error",
    async function (
      error
    ) {
      await interaction.editReply(
        "connection error, try again later"
      );
      console.error(
        error.message
      );
    }
  );
  request.write(
    JSON.stringify(
      {
        player_id: maker.id,
        province_name: interaction.options.getString(
          "province-name"
        ),
        action_points: interaction.options.getNumber(
          "action-points"
        )
      }
    )
  );
  request.end();
}

export {
  takeProvince
};