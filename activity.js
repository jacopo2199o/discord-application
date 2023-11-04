import {
  readFile,
  saveFile,
  splitMessages
} from "./general-utilities.js";

/**
 * @param { import("./community.js").Community } community
 */
const Activity = function (community) {
  this.community = community;
  this.timeout = Object.defineProperty({
    id: undefined,
    msDuration: 4000, // correggere nel tempo reale in millisecondi di un giorno
    msStartTime: 0,
    msRemaining: 0,
    status: "not running"
  }, "millisecondsDuration", {
    writable: false,
    configurable: false
  });
  this.profiles = [];
};

/**
 * @param { import("discord.js").GuildMember } member
 */
Activity.prototype.addProfile = async function (member) {
  if (!this.community.settings) {
    return;
  }

  if (!member.roles.cache.has(this.community.settings.preferences.baseRoleId)) {
    member.roles.add(this.community.settings.preferences.baseRoleId);
  }

  await member.guild.channels.cache.get(this.community.settings.preferences.logRoom)
    .send(`welcome there, ${member.displayName}`);

  if (this.timeout.id) {
    const role = member.guild.roles.cache.get(this.community.settings.preferences.baseRole.id);

    // add new member into activity
    this.profiles.push(
      Object.defineProperties({
        id: member.id,
        name: member.displayName,
        points: this.community.settings.preferences.baseRole.points + this.additionalPoints.thirdClass,
        roleId: role.id,
        roleName: role.name
      }, {
        id: {
          writable: false,
          configurable: false
        },
        name: {
          writable: false,
          configurable: false
        }
      }));
  }
};

/**
 * @param { import("discord.js").Client } client
 */
Activity.prototype.initialize = async function (client) {
  if (!this.community.settings.preferences) {
    return "not ready";
  }

  this.members = await client.guilds.resolve(this.community.id)
    .members.fetch();

  // popola il vettore dei profili attività
  this.profiles = this.members.filter(member => !member.user.bot && member.id !== this.community.adminId)
    .map(member => {
      return Object.defineProperty({
        id: member.id,
        name: member.displayName,
        points: 0,
        roleId: undefined,
        roleName: undefined
      }, "id", {
        writable: false,
        configurable: false
      });
    });

  // imposta i punti iniziali
  this.members.filter(member => !member.user.bot && member.id !== this.community.adminId)
    .forEach(member => {
      const profile = this.profiles.find(profile => profile.id === member.id);
      member.roles.cache.forEach(role => {
        const rank = this.community.settings.ranks.find(rank => rank.id === role.id);
        if (rank && rank.points >= profile.points) {
          profile.points = rank.points;
          profile.roleId = role.id;
          profile.roleName = role.name;
        }
      });
    });

  saveFile({
    msRemaining: this.timeout.msRemaining,
    profiles: this.profiles
  }, this.community.settings.filePaths.activity);
};

/**
 * @param { import("discord.js").Client } client
 */
Activity.prototype.resume = function (client) {
  if (this.timeout.status === "running") {
    return this.timeout.status;
  }

  const activity = readFile(this.community.settings.filePaths.activity);
  this.profiles = activity.profiles;
  this.timeout.msRemaining = activity.msRemaining;
  this.timeout.msStartTime = new Date().getTime();
  this.timeout.status = "running";

  this.timeout.id = setTimeout(() => {
    this.start(client);
    this.timeout.msRemaining = 0;
  }, this.timeout.msRemaining);
};

/**
 * @param { import("discord.js").Channel } logChannel
 * @param { import("discord.js").Role } baseRole
 * @param { Number } startPoints
 */
Activity.prototype.setPreferences = function (logChannel) {
  this.community.settings.preferences = {
    logChannelId: logChannel.id,
  };

  saveFile(this.community.settings.preferences, this.community.settings.filePaths.preferences);

  return "success";
};

/**
 * @param {import("discord.js").Role} role 
 */
Activity.prototype.setRank = function (role, points) {
  if (!this.community.settings.preferences) {
    return "preferences missing";
  }

  if (this.community.settings.ranks.find(rank => rank.points === points)) {
    return "equal points";
  }

  if (this.community.settings.ranks.find(rank => rank.id === role.id)) {
    return "equal role";
  }

  if (this.timeout.status === "running") {
    return this.timeout.status;
  }

  this.community.settings.ranks.push({
    id: role.id,
    points: points
  });

  this.community.settings.ranks.sort((a, b) => b.points - a.points);

  saveFile(this.community.settings.ranks, this.community.settings.filePaths.ranks);
};

/**
 * @param { import("discord.js").Client } client
 */
Activity.prototype.start = async function (client) {
  let messages = [];

  // imposta la data di avvio e attiva il timer
  if (this.timeout.status === "not running") {
    this.timeout.msStartTime = new Date().getTime();
    this.timeout.status = "running";
    this.timeout.id = setTimeout(() => this.start(client), this.timeout.msDuration);
    return this.timeout.status;
  }

  this.timeout.msStartTime = new Date().getTime();

  this.profiles.forEach((profile) => {
    //const member = this.community.guild.members.cache.find(member => member.id === profile.id);
    const rank = ((ranks, roleId) => {
      const index = ranks.findIndex(rank => rank.id === roleId);
      return Object.freeze({
        next: this.community.settings.ranks[index - 1],
        actual: this.community.settings.ranks[index],
        previous: this.community.settings.ranks[index + 1],
      });
    })(this.community.settings.ranks, profile.roleId);

    // sottrai punti
    if (profile.points > 0) {
      profile.points -= 1;
    }

    // aggiorna i ruoli
    if (rank.previous
      && rank.actual
      && profile.points <= rank.previous.points
    ) {
      // member.roles.remove(actualRole.id);
      // member.roles.add(previousRole.id);
      profile.roleId = rank.previous.id;
      profile.roleName = client.guilds.resolve(this.community.id)
        .roles.cache.get(rank.previous.id)
        .name;

      messages.push(`<@${profile.id}> downgraded to <@&${rank.previous.id}>\n`);
    } else if (rank.next
      && rank.actual
      && profile.points >= rank.next.points
    ) {
      // member.roles.remove(actualRole.id);
      // member.roles.add(nextRole.id);
      profile.roleId = rank.next.id;
      profile.roleName = client.guilds.resolve(this.community.id)
        .roles.cache.get(rank.previous.id)
        .name;

      messages.push(`<@${profile.id}> promoted to <@&${rank.previous.id}>\n`);
    }
  });

  if (messages.length) {
    let parts = splitMessages(messages, 2000);

    for (let part of parts) {
      await client.channels.cache.get(this.community.settings.preferences.logChannelId)
        .send({
          content: part,
          flags: [4096]
        });
    }

    messages = [];
    parts = [];
  }

  saveFile({
    msRemaining: this.timeout.msRemaining,
    profiles: this.profiles
  }, this.community.settings.filePaths.activity);

  this.timeout.id = setTimeout(() => this.start(client), this.timeout.msDuration);
};

Activity.prototype.stop = async function () {
  if (this.timeout.status === "not running") {
    return this.timeout.status;
  }
  this.timeout.msRemaining = new Date().getTime() - this.timeout.msStartTime;
  this.timeout.msStartTime = null;
  this.timeout.status = "not running";
  this.timeout.id = clearTimeout(this.timeout.id);

  saveFile({
    msRemaining: this.timeout.msRemaining,
    profiles: this.profiles
  }, this.community.settings.filePaths.activity);
};

/**
 * @param { import("discord.js").Interaction } interaction
 * @param { import("discord.js").GuildMember } member
 * @param { Number } amount
 */
Activity.prototype.takePoint = function (member, amount) {
  if (this.timeout.status === "not running") {
    return this.timeout.status;
  }

  const profile = this.profiles.find(profile => profile.id === member.id);

  if (!profile && member.id === this.community.adminId) {
    return "administrator";
  }

  profile.points += amount;

  saveFile({
    msRemaining: this.timeout.msRemaining,
    profiles: this.profiles
  }, this.community.settings.filePaths.activity);
};

export { Activity };