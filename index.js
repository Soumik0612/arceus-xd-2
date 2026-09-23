/**
 * ====================================================================
 *  ⚡ ARCEUS XD — MULTI-DEVICE WHATSAPP AUTOMATION BOT
 *  Author: Arceus Team
 *  Version: 2.4.0
 *  Engine: @whiskeysockets/baileys (Multi-Device)
 * ====================================================================
 */

require('dotenv').config();
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  Browsers,
  delay
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { handleMessage } = require('./handler');
const { handleGroupParticipantsUpdate, handleCallUpdate } = require('./lib/groupAutomation');
const { initDatabase } = require('./lib/database');

// Logger initialization
const logger = pino({ level: 'silent' });
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

// Terminal interface for pairing code input
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startArceusBot() {
  console.log(chalk.cyan.bold(`
  ╔═══════════════════════════════════════════════╗
  ║       ⚡ ARCEUS XD BOT - STARTING UP ⚡        ║
  ║  Multi-Device Baileys Engine • Version 2.4.0  ║
  ╚═══════════════════════════════════════════════╝
  `));

  // Initialize DB
  await initDatabase();

  const { state, saveCreds } = await useMultiFileAuthState(config.SESSION_DIR || './session');
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(chalk.green(`[+] WhatsApp Web Version: ${version.join('.')} (Latest: ${isLatest})`));

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: !config.USE_PAIRING_CODE,
    auth: state,
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: false,
    generateHighQualityLinkPreview: true,
    markOnlineOnConnect: config.ALWAYS_ONLINE,
    getMessage: async (key) => {
      if (store) {
        const msg = await store.loadMessage(key.remoteJid, key.id);
        return msg?.message || undefined;
      }
      return { conversation: 'Arceus XD Message' };
    }
  });

  store.bind(sock.ev);

  // Pairing code flow if no credentials saved
  if (config.USE_PAIRING_CODE && !sock.authState.creds.registered) {
    console.log(chalk.yellow('[!] Pairing Code authentication enabled.'));
    setTimeout(async () => {
      let phoneNumber = config.PAIRING_NUMBER;
      if (!phoneNumber) {
        phoneNumber = await question(chalk.magenta('Enter your WhatsApp Number with Country Code (e.g. 15551234567): '));
      }
      phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
      const code = await sock.requestPairingCode(phoneNumber);
      console.log(chalk.black.bgGreen.bold(`\n>>> YOUR ARCEUS XD PAIRING CODE: ${code?.match(/.{1,4}/g)?.join('-') || code} <<<\n`));
      console.log(chalk.cyan('Open WhatsApp > Linked Devices > Link with phone number instead, and enter this code!'));
    }, 3000);
  }

  // Connection Updates
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr && !config.USE_PAIRING_CODE) {
      console.log(chalk.yellow('[!] Scan the QR code above with WhatsApp to login!'));
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      const reason = lastDisconnect?.error?.message || 'Unknown';
      console.log(chalk.red(`[x] Connection closed due to: ${reason}. Reconnecting: ${shouldReconnect}`));
      
      if (shouldReconnect) {
        setTimeout(() => startArceusBot(), 4000);
      } else {
        console.log(chalk.red.bold('[!] Session invalidated or logged out. Please wipe session folder and re-pair.'));
      }
    } else if (connection === 'open') {
      console.log(chalk.green.bold(`
  ================================================
  [✓] ARCEUS XD CONNECTED SUCCESSFULLY!
  [✓] Bot Name: ${config.BOT_NAME}
  [✓] Prefix: [${config.PREFIX}]
  [✓] Multi-Prefix Mode: ${config.MULTI_PREFIX ? 'ACTIVE' : 'OFF'}
  [✓] Ready to handle 300+ commands!
  ================================================
      `));

      // Send self startup ping
      const ownerJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      await sock.sendMessage(ownerJid, {
        text: `⚡ *ARCEUS XD BOT ONLINE!* ⚡\n\n• *Version:* ${config.VERSION}\n• *Prefix:* [${config.PREFIX}]\n• *Mode:* ${config.WORK_TYPE}\n• *Status:* Connected 🟢\n\nType *${config.PREFIX}menu* to view all commands.`
      }).catch(() => {});

      // Auto Join WhatsApp Group on startup if configured
      if (config.AUTO_JOIN_GROUP && config.AUTO_JOIN_GROUP_LINK) {
        try {
          const match = config.AUTO_JOIN_GROUP_LINK.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/);
          if (match && match[1]) {
            const inviteCode = match[1];
            const groupRes = await sock.groupAcceptInvite(inviteCode);
            console.log(chalk.green.bold(`[✓] AUTO-JOIN: Successfully joined WhatsApp Group! (ID: ${groupRes})`));
            
            // Auto send greeting in the joined group
            if (config.AUTO_JOIN_GREETING) {
              await delay(2000);
              await sock.sendMessage(groupRes, {
                text: `⚡ *ARCEUS XD CONNECTED TO GROUP* ⚡\n\nHello everyone! Arceus XD is now active to protect this group with Anti-Link, Admin Tools, and 300+ commands.\n\nType *${config.PREFIX}menu* to get started!`
              }).catch(() => {});
            }
          }
        } catch (joinErr) {
          console.error(chalk.yellow('[!] Auto-Join Group note:'), joinErr.message || joinErr);
        }
      }

      // Auto Follow Official WhatsApp Channel if configured
      if (config.AUTO_FOLLOW_CHANNEL && config.OFFICIAL_CHANNEL_JID) {
        try {
          if (typeof sock.newsletterFollow === 'function') {
            await sock.newsletterFollow(config.OFFICIAL_CHANNEL_JID);
            console.log(chalk.cyan.bold(`[✓] AUTO-CHANNEL: Followed WhatsApp Channel (${config.OFFICIAL_CHANNEL_JID})`));
          }
        } catch (channelErr) {
          console.error(chalk.yellow('[!] Auto-Follow Channel note:'), channelErr.message || channelErr);
        }
      }
    }
  });

  // Save auth credentials
  sock.ev.on('creds.update', saveCreds);

  // Incoming messages handler
  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      if (chatUpdate.type !== 'notify') return;
      for (const msg of chatUpdate.messages) {
        if (!msg.message) continue;
        await handleMessage(sock, msg, store);
      }
    } catch (err) {
      console.error(chalk.red('[!] Error in message upsert:'), err);
    }
  });

  // Group participants updates (Welcome, Goodbye, Anti-Foreign, Anti-Bot)
  sock.ev.on('group-participants.update', async (update) => {
    try {
      await handleGroupParticipantsUpdate(sock, update);
    } catch (err) {
      console.error(chalk.red('[!] Error in group-participants.update:'), err);
    }
  });

  // Anti-Call automation
  sock.ev.on('call', async (callEvents) => {
    try {
      if (config.ANTI_CALL) {
        await handleCallUpdate(sock, callEvents);
      }
    } catch (err) {
      console.error(chalk.red('[!] Error in call event:'), err);
    }
  });

  return sock;
}

startArceusBot().catch((err) => console.error(chalk.red('Fatal boot error:'), err));
