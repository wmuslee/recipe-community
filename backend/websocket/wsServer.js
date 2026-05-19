const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// реализация WebSocket сервера для поддержки онлайн-статуса и комментариев в реальном времени на странице рецепта
const rooms = new Map();

function initWS(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    ws._user = null;
    ws._room = null;

    ws.on('message', async (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }

      switch (msg.type) {
        case 'AUTH': {
          try {
            const decoded = jwt.verify(msg.token, process.env.JWT_SECRET || 'fallback_secret');
            const user = await User.findById(decoded.id).select('username avatar');
            ws._user = user ? { _id: user._id.toString(), username: user.username, avatar: user.avatar || '' } : null;
          } catch { ws._user = null; }
          ws.send(JSON.stringify({ type: 'AUTH_OK', user: ws._user }));
          break;
        }

        case 'JOIN_RECIPE': {
          // Leave previous room
          if (ws._room && rooms.has(ws._room)) {
            rooms.get(ws._room).delete(ws);
            broadcastOnline(ws._room);
          }
          ws._room = msg.recipeId;
          if (!rooms.has(msg.recipeId)) rooms.set(msg.recipeId, new Set());
          rooms.get(msg.recipeId).add(ws);
          broadcastOnline(msg.recipeId);
          break;
        }

        case 'LEAVE_RECIPE': {
          if (ws._room && rooms.has(ws._room)) {
            rooms.get(ws._room).delete(ws);
            broadcastOnline(ws._room);
            ws._room = null;
          }
          break;
        }

        case 'NEW_COMMENT': {
          if (ws._room) {
            broadcastRoom(ws._room, { type: 'COMMENT_ADDED', comment: msg.comment });
          }
          break;
        }

        case 'DELETE_COMMENT': {
          if (ws._room) {
            broadcastRoom(ws._room, { type: 'COMMENT_DELETED', commentId: msg.commentId });
          }
          break;
        }

        case 'PING':
          if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'PONG' }));
          break;
      }
    });

    ws.on('close', () => {
      if (ws._room && rooms.has(ws._room)) {
        rooms.get(ws._room).delete(ws);
        broadcastOnline(ws._room);
      }
    });

    ws.on('error', () => {});
  });

  console.log('✅ WebSocket server initialized on /ws');
  return wss;
}

function broadcastRoom(recipeId, payload) {
  if (!rooms.has(recipeId)) return;
  const msg = JSON.stringify(payload);
  for (const client of rooms.get(recipeId)) {
    if (client.readyState === 1) client.send(msg);
  }
}

function broadcastOnline(recipeId) {
  if (!rooms.has(recipeId)) return;
  const clients = rooms.get(recipeId);
  const users = [];
  for (const c of clients) {
    if (c.readyState === 1 && c._user) users.push(c._user);
  }
  // Deduplicate by _id
  const unique = users.filter((u, i, s) => i === s.findIndex((x) => x._id === u._id));
  broadcastRoom(recipeId, { type: 'ONLINE_USERS', users: unique, count: clients.size });
}

module.exports = { initWS, broadcastRoom };
