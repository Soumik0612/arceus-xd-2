/**
 * ====================================================================
 *  ⚡ ARCEUS XD — GROUP AUTOMATION & EVENT LISTENERS
 * ====================================================================
 */

const config = require('../config');
const { getGroupSettings } = require('./database');

function checkAntiLink(text) {
  const linkRegex = /(https?://(?:www.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9].[^s]{2,}|www.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9].[^s]{2,}|https?://(?:www.|(?!www))[a-zA-Z0-9]+.[^s]{2,}|chat.whatsapp.com/[a-zA-Z0-9]{15,})/gi;
  return linkRegex.test(text);
}

function checkAntiBadword(text, customList = []) {
  const badwords = ['badword1', 'spamlink', ...customList];
  return badwords.some(word => text.toLowerCase().includes(word.toLowerCase()));
}

async function handleGroupParticipantsUpdate(sock, update) {
  const { id: groupId, participants, action } = update;
  const settings = await getGroupSettings(groupId);

  for (const user of participants) {
    const userNum = user.replace(/[^0-9]/g, '');

    // Anti-Foreign Country Code Filter (e.g. Reject non-local numbers if enabled)
    if (action === 'add' && settings.ANTI_FOREIGN) {
      const allowedPrefixes = ['1', '91', '44', '62', '234'];
      const isAllowed = allowedPrefixes.some(p => userNum.startsWith(p));
      if (!isAllowed) {
        await sock.groupParticipantsUpdate(groupId, [user], 'remove');
        await sock.sendMessage(groupId, {
          text: `🚫 *ANTI-FOREIGN TRIGGERED* 🚫\n@${userNum} was removed automatically (Country code not whitelisted).`,
          mentions: [user]
        });
        continue;
      }
    }

    // Welcome Message Event
    if (action === 'add' && settings.WELCOME) {
      let groupMetadata = { subject: 'Group' };
      try {
        groupMetadata = await sock.groupMetadata(groupId);
      } catch (e) {}

      const welcomeText = config.WELCOME_MESSAGE
        .replace(/@user/g, `@${userNum}`)
        .replace(/@group/g, groupMetadata.subject);

      await sock.sendMessage(groupId, {
        text: welcomeText,
        mentions: [user]
      });
    }

    // Goodbye Message Event
    if (action === 'remove' && settings.GOODBYE) {
      let groupMetadata = { subject: 'Group' };
      try {
        groupMetadata = await sock.groupMetadata(groupId);
      } catch (e) {}

      const goodbyeText = config.GOODBYE_MESSAGE
        .replace(/@user/g, `@${userNum}`)
        .replace(/@group/g, groupMetadata.subject);

      await sock.sendMessage(groupId, {
        text: goodbyeText,
        mentions: [user]
      });
    }
  }
}

async function handleCallUpdate(sock, callEvents) {
  for (const call of callEvents) {
    if (call.status === 'offer') {
      await sock.rejectCall(call.id, call.from);
      await sock.sendMessage(call.from, {
        text: config.ANTI_CALL_MSG
      });
    }
  }
}

module.exports = {
  checkAntiLink,
  checkAntiBadword,
  handleGroupParticipantsUpdate,
  handleCallUpdate
};
