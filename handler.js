/**
 * ====================================================================
 *  ⚡ ARCEUS XD — MESSAGE & COMMAND HANDLER
 *  Processes incoming WhatsApp messages, parses prefixes & triggers
 * ====================================================================
 */

const chalk = require('chalk');
const config = require('./config');
const { getGroupSettings, getUserWarns, addWarn, resetWarns } = require('./lib/database');
const { checkAntiLink, checkAntiBadword } = require('./lib/groupAutomation');

// Load modular command files
const generalCommands = require('./commands/general');
const aiCommands = require('./commands/ai');
const adminCommands = require('./commands/admin');
const ownerCommands = require('./commands/owner');
const mediaCommands = require('./commands/media');
const sportCommands = require('./commands/sport');
const funCommands = require('./commands/fun');
const utilCommands = require('./commands/util');
const animeCommands = require('./commands/anime');
const makerCommands = require('./commands/maker');
const designCommands = require('./commands/design');
const toolsCommands = require('./commands/tools');

// Master map of all registered commands
const COMMAND_REGISTRY = new Map();

function registerModule(mod) {
  if (!mod || !mod.commands) return;
  for (const [name, cmdObj] of Object.entries(mod.commands)) {
    COMMAND_REGISTRY.set(name.toLowerCase(), cmdObj);
    if (cmdObj.aliases && Array.isArray(cmdObj.aliases)) {
      cmdObj.aliases.forEach(alias => COMMAND_REGISTRY.set(alias.toLowerCase(), cmdObj));
    }
  }
}

// Register all command packs
[
  generalCommands, aiCommands, adminCommands, ownerCommands,
  mediaCommands, sportCommands, funCommands, utilCommands,
  animeCommands, makerCommands, designCommands, toolsCommands
].forEach(registerModule);

console.log(chalk.cyan(`[✓] Registered ${COMMAND_REGISTRY.size} active command handlers in Arceus XD.`));

async function handleMessage(sock, msg, store) {
  const from = msg.key.remoteJid;
  const isGroup = from.endsWith('@g.us');
  const sender = isGroup ? (msg.key.participant || msg.participant) : from;
  const senderNumber = sender.replace(/[^0-9]/g, '');
  const botNumber = sock.user.id.split(':')[0].replace(/[^0-9]/g, '');
  const isBot = msg.key.fromMe;

  // Extract text body
  const type = Object.keys(msg.message)[0];
  const body = type === 'conversation' ? msg.message.conversation
    : type === 'extendedTextMessage' ? msg.message.extendedTextMessage.text
    : type === 'imageMessage' ? msg.message.imageMessage.caption
    : type === 'videoMessage' ? msg.message.videoMessage.caption
    : '';

  if (!body) return;

  // Auto read & auto typing simulation
  if (config.AUTO_READ) {
    await sock.readMessages([msg.key]);
  }
  if (config.AUTO_TYPING) {
    await sock.sendPresenceUpdate('composing', from);
  }

  // Group metadata & role resolution
  let groupMetadata = null;
  let groupAdmins = [];
  let isGroupAdmin = false;
  let isBotGroupAdmin = false;

  if (isGroup) {
    try {
      groupMetadata = await sock.groupMetadata(from);
      groupAdmins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
      isGroupAdmin = groupAdmins.includes(sender);
      isBotGroupAdmin = groupAdmins.includes(sock.user.id.split(':')[0] + '@s.whatsapp.net');
    } catch (e) {
      // Failed to fetch group metadata
    }
  }

  const isOwner = senderNumber === config.OWNER_NUMBER || config.SUDO_USERS.includes(senderNumber);
  const isSudo = isOwner || config.SUDO_USERS.includes(senderNumber);

  // Group Automated Defenses (Anti-Link, Anti-Badword, Anti-Spam)
  if (isGroup && !isGroupAdmin && !isOwner) {
    const groupSettings = await getGroupSettings(from);
    
    // Anti-Link check
    if (groupSettings.ANTI_LINK && checkAntiLink(body)) {
      if (isBotGroupAdmin) {
        await sock.sendMessage(from, { delete: msg.key });
        const warns = await addWarn(from, senderNumber);
        await sock.sendMessage(from, {
          text: `⚠️ *ANTI-LINK DETECTED* ⚠️\n@${senderNumber}, sending links is not allowed!\n*Warnings:* [${warns}/${groupSettings.MAX_WARNS}]`,
          mentions: [sender]
        });
        if (warns >= groupSettings.MAX_WARNS) {
          await sock.groupParticipantsUpdate(from, [sender], 'remove');
          await resetWarns(from, senderNumber);
          await sock.sendMessage(from, { text: `🚫 @${senderNumber} was removed for exceeding maximum warnings.`, mentions: [sender] });
        }
      }
      return;
    }
  }

  // Prefix Parsing
  let usedPrefix = null;
  if (config.MULTI_PREFIX) {
    for (const p of config.ACCEPTED_PREFIXES) {
      if (body.startsWith(p)) {
        usedPrefix = p;
        break;
      }
    }
  } else if (body.startsWith(config.PREFIX)) {
    usedPrefix = config.PREFIX;
  }

  // Non-command handling (e.g. Chatbot AI trigger if enabled)
  if (!usedPrefix) {
    return;
  }

  // Extract command name and arguments
  const args = body.slice(usedPrefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const text = args.join(' ');

  const command = COMMAND_REGISTRY.get(commandName);
  if (!command) return;

  // Work Mode Protection
  if (config.WORK_TYPE === 'private' && !isOwner && !isSudo) {
    return;
  }

  // Permission Checks
  if (command.ownerOnly && !isOwner) {
    return sock.sendMessage(from, { text: '❌ *Access Denied:* This command is restricted to the Bot Owner.' }, { quoted: msg });
  }

  if (command.sudoOnly && !isSudo) {
    return sock.sendMessage(from, { text: '❌ *Access Denied:* This command is restricted to Sudo & Owner users.' }, { quoted: msg });
  }

  if (command.adminOnly && isGroup && !isGroupAdmin && !isOwner) {
    return sock.sendMessage(from, { text: '❌ *Admin Required:* This command is only for Group Admins.' }, { quoted: msg });
  }

  if (command.botAdminRequired && isGroup && !isBotGroupAdmin) {
    return sock.sendMessage(from, { text: '❌ *Bot Admin Required:* Please promote Arceus XD to Admin to execute this action.' }, { quoted: msg });
  }

  if (command.groupOnly && !isGroup) {
    return sock.sendMessage(from, { text: '❌ *Group Only:* This command can only be used in a WhatsApp Group.' }, { quoted: msg });
  }

  // Auto React on Command Trigger
  if (config.AUTO_REACT) {
    await sock.sendMessage(from, { react: { text: command.reaction || '⚡', key: msg.key } }).catch(() => {});
  }

  // Execute Command
  try {
    const context = {
      sock,
      msg,
      from,
      sender,
      senderNumber,
      isGroup,
      groupMetadata,
      groupAdmins,
      isGroupAdmin,
      isBotGroupAdmin,
      isOwner,
      isSudo,
      args,
      text,
      prefix: usedPrefix,
      commandName,
      store,
      reply: (content) => {
        if (typeof content === 'string') {
          return sock.sendMessage(from, { text: content }, { quoted: msg });
        }
        return sock.sendMessage(from, content, { quoted: msg });
      }
    };

    console.log(chalk.yellow(`[CMD] Executing .${commandName} from @${senderNumber} in ${isGroup ? 'Group' : 'DM'}`));
    await command.execute(context);
  } catch (error) {
    console.error(chalk.red(`[!] Error executing .${commandName}:`), error);
    await sock.sendMessage(from, {
      text: `⚠️ *Arceus XD Command Error:*\n` + ```${error.message || error}```
    }, { quoted: msg });
  }
}

module.exports = { handleMessage, COMMAND_REGISTRY };
