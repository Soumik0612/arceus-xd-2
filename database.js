/**
 * ====================================================================
 *  ⚡ ARCEUS XD — LOCAL STORAGE & DATABASE
 * ====================================================================
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

const DB_PATH = path.join(__dirname, '../database.json');

let dbState = {
  groups: {},
  warns: {},
  notes: {},
  users: {}
};

async function initDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      dbState = JSON.parse(data);
    } else {
      saveDatabase();
    }
  } catch (e) {
    console.error('Database load error:', e);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(dbState, null, 2));
  } catch (e) {
    console.error('Database save error:', e);
  }
}

async function getGroupSettings(groupId) {
  if (!dbState.groups[groupId]) {
    dbState.groups[groupId] = { ...config.GROUP_DEFAULTS };
    saveDatabase();
  }
  return dbState.groups[groupId];
}

async function setGroupSetting(groupId, key, value) {
  const settings = await getGroupSettings(groupId);
  settings[key] = value;
  saveDatabase();
  return settings;
}

async function addWarn(groupId, userNumber) {
  const key = `${groupId}_${userNumber}`;
  dbState.warns[key] = (dbState.warns[key] || 0) + 1;
  saveDatabase();
  return dbState.warns[key];
}

async function getUserWarns(groupId, userNumber) {
  const key = `${groupId}_${userNumber}`;
  return dbState.warns[key] || 0;
}

async function resetWarns(groupId, userNumber) {
  const key = `${groupId}_${userNumber}`;
  delete dbState.warns[key];
  saveDatabase();
}

module.exports = {
  initDatabase,
  getGroupSettings,
  setGroupSetting,
  addWarn,
  getUserWarns,
  resetWarns
};
