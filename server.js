const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.static(path.join(__dirname, 'public')));

// Yerel IP adresini tespit et
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const LOCAL_IP = getLocalIp();

// Sunucu bilgisi endpoint'i (Arayüzde IP adresini göstermek için)
app.get('/api/info', (req, res) => {
  res.json({ localIp: LOCAL_IP, port: PORT });
});

// Zengin Türkçe kelime havuzu
const WORDS = [
  'Kedi', 'Uçak', 'Piyano', 'Dondurma', 'Gitar', 
  'Ağaç', 'Gemi', 'Pizza', 'Gözlük', 'Roket',
  'Balık', 'Güneş', 'Köpek', 'Telefon', 'Şapka',
  'Ayakkabı', 'Kahve', 'Kalem', 'Çanta', 'Saat',
  'Bisiklet', 'Ev', 'Kamera', 'Kitap', 'Kelebek',
  'Mantı', 'Kardan Adam', 'Yıldız', 'Tavşan', 'Futbol',
  'Denizaltı', 'Helikopter', 'Pasta', 'Karpuz', 'Sandalye',
  'Timsah', 'Mikrofon', 'Panda', 'Kalp', 'Gökkuşağı'
];

function getRandomWords(count) {
  const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// 4 haneli rastgele oda kodu üret
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/*
  rooms[code] = {
    code: string,
    hostId: string,
    totalRounds: number,
    drawTime: number,
    currentRound: number,
    status: 'lobby' | 'drawing' | 'guessing' | 'reveal' | 'finished',
    players: [ { id, name, score } ],
    roundData: [
      {
        drawerId: string,
        drawerName: string,
        word: string,
        drawing: string | null,
        guesserId: string,
        guesserName: string,
        guess: string | null,
        isCorrect: boolean | null
      }
    ],
    timer: NodeJS.Timeout | null,
    timeLeft: number
  }
*/
const rooms = {};

function getRoomOfSocket(socket) {
  for (const code in rooms) {
    if (rooms[code].players.some(p => p.id === socket.id)) {
      return rooms[code];
    }
  }
  return null;
}

function clearRoomTimer(room) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
}

// Oda durumu güncellemesini odaya yay
function broadcastRoomUpdate(room) {
  io.to(room.code).emit('roomUpdate', {
    code: room.code,
    hostId: room.hostId,
    totalRounds: room.totalRounds,
    drawTime: room.drawTime,
    currentRound: room.currentRound,
    status: room.status,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isHost: p.id === room.hostId
    }))
  });
}

// Çizim aşamasını başlat
function startDrawingPhase(room) {
  room.status = 'drawing';
  clearRoomTimer(room);

  const n = room.players.length;
  // Oyuncuları rastgele sırala (Ring Swap için)
  const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5);
  const words = getRandomWords(n);

  room.roundData = [];

  for (let i = 0; i < n; i++) {
    const drawer = shuffledPlayers[i];
    // Dairesel döngü: drawer i, guesser i+1 % n
    const guesser = shuffledPlayers[(i + 1) % n];

    room.roundData.push({
      drawerId: drawer.id,
      drawerName: drawer.name,
      word: words[i],
      drawing: null,
      guesserId: guesser.id,
      guesserName: guesser.name,
      guess: null,
      isCorrect: null
    });

    // Her çizere kendi kelimesini ve bilgilerini gönder
    io.to(drawer.id).emit('drawingStart', {
      round: room.currentRound,
      totalRounds: room.totalRounds,
      word: words[i],
      duration: room.drawTime,
      partnerName: guesser.name
    });
  }

  broadcastRoomUpdate(room);

  // Geri sayım
  room.timeLeft = room.drawTime;
  io.to(room.code).emit('timerTick', room.timeLeft);

  room.timer = setInterval(() => {
    room.timeLeft--;
    io.to(room.code).emit('timerTick', room.timeLeft);

    if (room.timeLeft <= 0) {
      clearRoomTimer(room);
      // Süre bitti: İstemcilerden mevcut çizimleri talep et
      io.to(room.code).emit('requestDrawings');
    }
  }, 1000);
}

// Tahmin aşamasını başlat
function startGuessingPhase(room) {
  room.status = 'guessing';
  clearRoomTimer(room);
  broadcastRoomUpdate(room);

  // Her tahminciye karşılık gelen çizimi gönder
  room.roundData.forEach(item => {
    // Çizim yoksa boş beyaz bir placeholder gönder
    const drawingUrl = item.drawing || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAANSURBVBhXY/j///8/AAn7A/0FQ0gAAAAASUVORK5CYII=';

    io.to(item.guesserId).emit('guessingStart', {
      round: room.currentRound,
      totalRounds: room.totalRounds,
      drawing: drawingUrl,
      artistName: item.drawerName,
      duration: 20
    });
  });

  room.timeLeft = 20;
  io.to(room.code).emit('timerTick', room.timeLeft);

  room.timer = setInterval(() => {
    room.timeLeft--;
    io.to(room.code).emit('timerTick', room.timeLeft);

    if (room.timeLeft <= 0) {
      clearRoomTimer(room);
      // Süre bittiğinde doğrudan sonuçları sergileme aşamasına geç
      startRevealPhase(room);
    }
  }, 1000);
}

// Gartic Phone mantığı: Sonuçları sergileme ve puanlama aşaması
function startRevealPhase(room) {
  room.status = 'reveal';
  clearRoomTimer(room);

  // Puan hesaplaması ve doğruluk kontrolü
  room.roundData.forEach(item => {
    const cleanGuess = (item.guess || '').trim().toLocaleLowerCase('tr');
    const cleanTarget = (item.word || '').trim().toLocaleLowerCase('tr');

    const isCorrect = cleanGuess.length > 0 && cleanGuess === cleanTarget;
    item.isCorrect = isCorrect;

    if (isCorrect) {
      // Doğru tahmin eden +100 puan
      const guesser = room.players.find(p => p.id === item.guesserId);
      if (guesser) guesser.score += 100;

      // Çizimi anlaşılan çizer +50 puan
      const drawer = room.players.find(p => p.id === item.drawerId);
      if (drawer) drawer.score += 50;
    }
  });

  // Sonuçları odaya gönder
  io.to(room.code).emit('revealStart', {
    round: room.currentRound,
    totalRounds: room.totalRounds,
    results: room.roundData.map(item => ({
      drawerName: item.drawerName,
      word: item.word,
      drawing: item.drawing,
      guesserName: item.guesserName,
      guess: item.guess || '(Tahmin yapılmadı)',
      isCorrect: item.isCorrect
    })),
    leaderboard: [...room.players].sort((a, b) => b.score - a.score)
  });

  broadcastRoomUpdate(room);

  // 10 saniye boyunca sergile, ardından sonraki tura veya oyun sonuna geç
  room.timeLeft = 10;
  io.to(room.code).emit('timerTick', room.timeLeft);

  room.timer = setInterval(() => {
    room.timeLeft--;
    io.to(room.code).emit('timerTick', room.timeLeft);

    if (room.timeLeft <= 0) {
      clearRoomTimer(room);
      proceedToNextStep(room);
    }
  }, 1000);
}

function proceedToNextStep(room) {
  if (room.currentRound < room.totalRounds) {
    room.currentRound++;
    startDrawingPhase(room);
  } else {
    // Oyun bitti, genel sıralamayı göster
    room.status = 'finished';
    const podium = [...room.players].sort((a, b) => b.score - a.score);
    io.to(room.code).emit('gameOver', {
      podium
    });
    broadcastRoomUpdate(room);
  }
}

io.on('connection', (socket) => {
  // 1. Oda Oluşturma
  socket.on('createRoom', ({ name, rounds, drawTime }) => {
    const cleanName = (name || '').trim() || `Oyuncu_${socket.id.slice(0, 4)}`;
    let code = generateRoomCode();
    while (rooms[code]) {
      code = generateRoomCode();
    }

    const room = {
      code,
      hostId: socket.id,
      totalRounds: parseInt(rounds) || 3,
      drawTime: parseInt(drawTime) || 15,
      currentRound: 1,
      status: 'lobby',
      players: [{ id: socket.id, name: cleanName, score: 0 }],
      roundData: [],
      timer: null,
      timeLeft: 0
    };

    rooms[code] = room;
    socket.join(code);
    socket.emit('roomCreated', { code, isHost: true });
    broadcastRoomUpdate(room);
  });

  // 2. Odaya Katılma
  socket.on('joinRoom', ({ name, code }) => {
    const roomCode = (code || '').trim().toUpperCase();
    const room = rooms[roomCode];

    if (!room) {
      socket.emit('gameError', 'Oda bulunamadı! Lütfen kodu kontrol edin.');
      return;
    }

    if (room.status !== 'lobby') {
      socket.emit('gameError', 'Bu odada oyun çoktan başlamış!');
      return;
    }

    if (room.players.length >= 12) {
      socket.emit('gameError', 'Oda dolu (Maksimum 12 oyuncu)!');
      return;
    }

    const cleanName = (name || '').trim() || `Oyuncu_${socket.id.slice(0, 4)}`;
    room.players.push({ id: socket.id, name: cleanName, score: 0 });

    socket.join(roomCode);
    socket.emit('roomJoined', { code: roomCode, isHost: false });
    broadcastRoomUpdate(room);
  });

  // 3. Ayarları Güncelleme (Sadece Host)
  socket.on('updateRoomSettings', ({ rounds, drawTime }) => {
    const room = getRoomOfSocket(socket);
    if (!room || room.hostId !== socket.id || room.status !== 'lobby') return;

    room.totalRounds = parseInt(rounds) || 3;
    room.drawTime = parseInt(drawTime) || 15;
    broadcastRoomUpdate(room);
  });

  // 4. Oyunu Başlatma (Sadece Host)
  socket.on('startGame', () => {
    const room = getRoomOfSocket(socket);
    if (!room || room.hostId !== socket.id) return;

    if (room.players.length < 2) {
      socket.emit('gameError', 'Oyunu başlatmak için en az 2 oyuncu gereklidir!');
      return;
    }

    // Puanları sıfırla ve 1. turdan başla
    room.players.forEach(p => p.score = 0);
    room.currentRound = 1;
    startDrawingPhase(room);
  });

  // 5. Çizimi Gönderme
  socket.on('submitDrawing', (dataUrl) => {
    const room = getRoomOfSocket(socket);
    if (!room || room.status !== 'drawing') return;

    const item = room.roundData.find(d => d.drawerId === socket.id);
    if (item) {
      item.drawing = dataUrl;
    }

    // Herkes çizimini teslim ettiyse beklemeden tahmin aşamasına geç
    const allSubmitted = room.roundData.every(d => d.drawing !== null);
    if (allSubmitted) {
      clearRoomTimer(room);
      startGuessingPhase(room);
    }
  });

  // 6. Tahmini Gönderme (Gartic Phone mantığı: Hemen doğru/yanlış demez)
  socket.on('submitGuess', (guess) => {
    const room = getRoomOfSocket(socket);
    if (!room || room.status !== 'guessing') return;

    const item = room.roundData.find(d => d.guesserId === socket.id);
    if (item && item.guess === null) {
      item.guess = (guess || '').trim();
      socket.emit('guessReceived', { message: 'Tahminin kaydedildi! Diğer oyuncular bekleniyor...' });
    }

    // Herkes tahmin yaptıysa beklemeden sergi aşamasına geç
    const allGuessed = room.roundData.every(d => d.guess !== null);
    if (allGuessed) {
      clearRoomTimer(room);
      startRevealPhase(room);
    }
  });

  // 7. Tekrar Lobiye Dönüş
  socket.on('returnToLobby', () => {
    const room = getRoomOfSocket(socket);
    if (!room || room.hostId !== socket.id) return;

    clearRoomTimer(room);
    room.status = 'lobby';
    room.currentRound = 1;
    room.players.forEach(p => p.score = 0);
    broadcastRoomUpdate(room);
  });

  // 8. Bağlantı Kopması
  socket.on('disconnect', () => {
    const room = getRoomOfSocket(socket);
    if (!room) return;

    const leavingPlayer = room.players.find(p => p.id === socket.id);
    room.players = room.players.filter(p => p.id !== socket.id);

    if (room.players.length === 0) {
      // Odada kimse kalmadıysa odayı sil
      clearRoomTimer(room);
      delete rooms[room.code];
      return;
    }

    // Eğer ayrılan kişi host idiyse yeni bir host ata
    if (room.hostId === socket.id) {
      room.hostId = room.players[0].id;
    }

    io.to(room.code).emit('playerLeft', {
      name: leavingPlayer ? leavingPlayer.name : 'Bir oyuncu',
      remainingCount: room.players.length
    });

    // Eğer oyun sırasında oyuncu sayısı 2'nin altına düşerse lobiye geri döndür
    if (room.status !== 'lobby' && room.players.length < 2) {
      clearRoomTimer(room);
      room.status = 'lobby';
      io.to(room.code).emit('gameError', 'Oyuncu sayısı 2\'nin altına düştüğü için oyun lobiye döndürüldü.');
    }

    broadcastRoomUpdate(room);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================================`);
  console.log(`⚡ Rush Draw Swap Sunucusu Aktif!`);
  console.log(`📡 Yerel Bilgisayar: http://localhost:${PORT}`);
  console.log(`🏠 Aynı Ağdaki Arkadaşların: http://${LOCAL_IP}:${PORT}`);
  console.log(`=================================================`);
});
