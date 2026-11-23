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

// Zengin ve eğlenceli Türkçe kelime havuzu (150+ Çizilebilir Kelime)
const WORDS = [
  // Hayvanlar
  'Kedi', 'Köpek', 'Balık', 'Panda', 'Timsah', 'Tavşan', 'Fil', 'Zürafa', 'Maymun', 'Aslan',
  'Kaplumbağa', 'Penguen', 'Kelebek', 'Yunus', 'Arı', 'Karga', 'Ahtapot', 'Kanguru', 'Dinozor', 'Bukalemun',
  'Kirpi', 'Köstebek', 'Yarasa', 'Flamingo', 'Salyangoz', 'At', 'İnek', 'Horoz', 'Kurt', 'Sincap',
  
  // Nesneler & Eşyalar
  'Uçak', 'Piyano', 'Gitar', 'Gözlük', 'Roket', 'Telefon', 'Şapka', 'Ayakkabı', 'Saat', 'Bisiklet',
  'Kamera', 'Kitap', 'Sandalye', 'Mikrofon', 'Helikopter', 'Denizaltı', 'Lamba', 'Televizyon', 'Çekiç', 'Makas',
  'Şemsiye', 'Süpürge', 'Ayna', 'Yastık', 'Bavul', 'Kulaklık', 'Paten', 'Kaykay', 'Teleskop', 'Mıknatıs',
  'Pusula', 'Tarak', 'Diş Fırçası', 'El Feneri', 'Davul', 'Trompet', 'Bumerang', 'Mum', 'Anahtar', 'Kilit',
  
  // Yiyecekler & İçecekler
  'Dondurma', 'Pizza', 'Kahve', 'Mantı', 'Pasta', 'Karpuz', 'Muz', 'Elma', 'Çilek', 'Burger',
  'Patates Kızartması', 'Limon', 'Sosisli', 'Pancake', 'Donut', 'Avokado', 'Çikolata', 'Mısır', 'Havuç', 'Simit',
  'Lahmacun', 'Çaydanlık', 'Kola', 'Kek', 'Kruvason', 'Suşi', 'Ananas', 'Kiraz', 'Tavuk Döner', 'Köfte',
  
  // Doğa, Mekanlar & Çevre
  'Ağaç', 'Gemi', 'Güneş', 'Ev', 'Kardan Adam', 'Yıldız', 'Gökkuşağı', 'Kalp', 'Volkan', 'Şelale',
  'Çöl', 'Ada', 'Dağ', 'Ay', 'Bulut', 'Şimşek', 'Kale', 'Piramit', 'Köprü', 'Çadır',
  'Deniz Feneri', 'Rüzgar Gülü', 'Mağara', 'Iglo', 'Uzay İstasyonu', 'Kamp Ateşi', 'Göl', 'Orman', 'Çiçek', 'Mantar',
  
  // Karakterler, Meslekler & Eğlenceli Durumlar
  'Uzaylı', 'Zombi', 'Korsan', 'Hayalet', 'Sihirbaz', 'Robot', 'Süper Kahraman', 'Ninja', 'Aşçı', 'Doktor',
  'İtfaiyeci', 'Astronot', 'Dedektif', 'Kral', 'Palyaço', 'Vampir', 'Deniz Kızı', 'Mumya', 'Piyango', 'Kupa'
];

// Mod 1: Resmi Tamamla için 15 Hazır Vektörel Şablon
const TEMPLATES = [
  { id: 'butterfly', name: 'Kelebek' },
  { id: 'cat', name: 'Kedi Yüzü' },
  { id: 'house', name: 'Ev' },
  { id: 'guitar', name: 'Gitar' },
  { id: 'rocket', name: 'Roket' },
  { id: 'heart', name: 'Kalp' },
  { id: 'tree', name: 'Ağaç' },
  { id: 'skull', name: 'Kafatası' },
  { id: 'flower', name: 'Çiçek' },
  { id: 'car', name: 'Spor Araba' },
  { id: 'sun', name: 'Güneş' },
  { id: 'cup', name: 'Kupa Bardak' },
  { id: 'robot', name: 'Robot' },
  { id: 'fish', name: 'Balık' },
  { id: 'glasses', name: 'Gözlük' }
];

function getRandomWords(count) {
  const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getRandomTemplate() {
  return TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
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
    gameMode: 'classic' | 'complete' | 'coop',
    currentRound: number,
    status: 'lobby' | 'drawing' | 'guessing' | 'reveal' | 'complete_drawing' | 'complete_voting' | 'complete_reveal' | 'coop_phase1' | 'coop_phase2' | 'coop_reveal' | 'finished',
    players: [ { id, name, score } ],
    roundData: [],
    completeData: {
      template: { id, name },
      drawings: [ { id, playerId, drawing, votes: { voterId: score } } ]
    },
    coopData: {
      teams: [
        {
          teamId: string,
          word: string,
          playerA: { id, name },
          playerB: { id, name },
          playerC: { id, name } | null, // Tek sayıda oyuncu varsa joker
          drawingA: string | null,
          drawingFinal: string | null
        }
      ]
    },
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
    gameMode: room.gameMode || 'classic',
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

// ========================================================
// 1. KLASİK MOD AKIŞI (Classic Rush)
// ========================================================

function startClassicDrawingPhase(room) {
  room.status = 'drawing';
  clearRoomTimer(room);

  const n = room.players.length;
  const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5);
  const words = getRandomWords(n);

  room.roundData = [];

  for (let i = 0; i < n; i++) {
    const drawer = shuffledPlayers[i];
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

    io.to(drawer.id).emit('drawingStart', {
      mode: 'classic',
      round: room.currentRound,
      totalRounds: room.totalRounds,
      word: words[i],
      duration: room.drawTime,
      partnerName: guesser.name
    });
  }

  broadcastRoomUpdate(room);

  room.timeLeft = room.drawTime;
  io.to(room.code).emit('timerTick', room.timeLeft);

  room.timer = setInterval(() => {
    room.timeLeft--;
    io.to(room.code).emit('timerTick', room.timeLeft);

    if (room.timeLeft <= 0) {
      clearRoomTimer(room);
      io.to(room.code).emit('requestDrawings');
    }
  }, 1000);
}

function startClassicGuessingPhase(room) {
  room.status = 'guessing';
  clearRoomTimer(room);
  broadcastRoomUpdate(room);

  room.roundData.forEach(item => {
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
      startClassicRevealPhase(room);
    }
  }, 1000);
}

function startClassicRevealPhase(room) {
  room.status = 'reveal';
  clearRoomTimer(room);

  room.roundData.forEach(item => {
    const cleanGuess = (item.guess || '').trim().toLocaleLowerCase('tr');
    const cleanTarget = (item.word || '').trim().toLocaleLowerCase('tr');

    const isCorrect = cleanGuess.length > 0 && cleanGuess === cleanTarget;
    item.isCorrect = isCorrect;

    if (isCorrect) {
      const guesser = room.players.find(p => p.id === item.guesserId);
      if (guesser) guesser.score += 100;

      const drawer = room.players.find(p => p.id === item.drawerId);
      if (drawer) drawer.score += 50;
    }
  });

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

// ========================================================
// 2. MOD 1: RESMİ TAMAMLA (Half-to-Half & Kör Puanlama)
// ========================================================

function startCompleteDrawingPhase(room) {
  room.status = 'complete_drawing';
  clearRoomTimer(room);

  const selectedTemplate = getRandomTemplate();
  room.completeData = {
    template: selectedTemplate,
    drawings: []
  };

  io.to(room.code).emit('completeDrawingStart', {
    round: room.currentRound,
    totalRounds: room.totalRounds,
    template: selectedTemplate,
    duration: room.drawTime
  });

  broadcastRoomUpdate(room);

  room.timeLeft = room.drawTime;
  io.to(room.code).emit('timerTick', room.timeLeft);

  room.timer = setInterval(() => {
    room.timeLeft--;
    io.to(room.code).emit('timerTick', room.timeLeft);

    if (room.timeLeft <= 0) {
      clearRoomTimer(room);
      io.to(room.code).emit('requestDrawings');
    }
  }, 1000);
}

function startCompleteVotingPhase(room) {
  room.status = 'complete_voting';
  clearRoomTimer(room);
  broadcastRoomUpdate(room);

  // Eksik kalan oyuncular varsa boş çizim ata
  room.players.forEach(p => {
    if (!room.completeData.drawings.some(d => d.playerId === p.id)) {
      room.completeData.drawings.push({
        id: 'drawing_' + p.id.slice(0, 5),
        playerId: p.id,
        playerName: p.name,
        drawing: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAANSURBVBhXY/j///8/AAn7A/0FQ0gAAAAASUVORK5CYII=',
        votes: {}
      });
    }
  });

  // Çizimleri rastgele karıştır ve kör başlıklar ata (Anonim Eser #1, #2)
  const shuffledDrawings = [...room.completeData.drawings].sort(() => Math.random() - 0.5);
  room.completeData.drawings = shuffledDrawings;

  const publicDrawings = shuffledDrawings.map((d, index) => ({
    id: d.id,
    anonTitle: `Anonim Çizim #${index + 1}`,
    drawing: d.drawing,
    authorId: d.playerId // İstemcide sadece "kendi çizimi mi?" kontrolü için
  }));

  io.to(room.code).emit('completeVotingStart', {
    round: room.currentRound,
    totalRounds: room.totalRounds,
    templateName: room.completeData.template.name,
    drawings: publicDrawings,
    duration: 25
  });

  room.timeLeft = 25;
  io.to(room.code).emit('timerTick', room.timeLeft);

  room.timer = setInterval(() => {
    room.timeLeft--;
    io.to(room.code).emit('timerTick', room.timeLeft);

    if (room.timeLeft <= 0) {
      clearRoomTimer(room);
      startCompleteRevealPhase(room);
    }
  }, 1000);
}

function startCompleteRevealPhase(room) {
  room.status = 'complete_reveal';
  clearRoomTimer(room);

  // Puanları hesapla: Her çizime verilen oyların toplamı / ortalaması
  const results = room.completeData.drawings.map((item, index) => {
    const voteScores = Object.values(item.votes || {});
    let avg = 0;
    let earnedPoints = 0;
    if (voteScores.length > 0) {
      const sum = voteScores.reduce((a, b) => a + b, 0);
      avg = Math.round((sum / voteScores.length) * 10) / 10;
      earnedPoints = Math.round(avg * 30); // Örn: 4.5 yıldız = 135 puan
    } else {
      earnedPoints = 50; // Katılım teselli puanı
    }

    const player = room.players.find(p => p.id === item.playerId);
    if (player) {
      player.score += earnedPoints;
    }

    return {
      anonTitle: `Anonim Çizim #${index + 1}`,
      authorName: item.playerName || (player ? player.name : 'Bilinmeyen'),
      drawing: item.drawing,
      averageScore: avg,
      totalVotes: voteScores.length,
      earnedPoints
    };
  });

  // En yüksek puana göre sırala
  results.sort((a, b) => b.averageScore - a.averageScore);

  io.to(room.code).emit('completeRevealStart', {
    round: room.currentRound,
    totalRounds: room.totalRounds,
    templateName: room.completeData.template.name,
    results,
    leaderboard: [...room.players].sort((a, b) => b.score - a.score)
  });

  broadcastRoomUpdate(room);

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

// ========================================================
// 3. MOD 2: EŞLİ YARIM ÇİZİM (Co-op Split)
// ========================================================

function startCoopPhase1(room) {
  room.status = 'coop_phase1';
  clearRoomTimer(room);

  // 2'şerli takımlara ayır
  const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5);
  const teams = [];
  const teamWords = getRandomWords(Math.ceil(shuffledPlayers.length / 2));

  let wordIdx = 0;
  for (let i = 0; i < shuffledPlayers.length; i += 2) {
    const pA = shuffledPlayers[i];
    const pB = shuffledPlayers[i + 1] || null;

    if (pB) {
      teams.push({
        teamId: 'team_' + i,
        word: teamWords[wordIdx++],
        playerA: { id: pA.id, name: pA.name },
        playerB: { id: pB.id, name: pB.name },
        playerC: null,
        drawingA: null,
        drawingFinal: null
      });
    } else {
      // Tek sayıda oyuncu varsa son takıma 3. kişi (joker / destek) olarak ekle
      if (teams.length > 0) {
        teams[teams.length - 1].playerC = { id: pA.id, name: pA.name };
      } else {
        // Tek kişi kaldıysa yalnız oynar
        teams.push({
          teamId: 'team_solo',
          word: teamWords[0] || 'Gemi',
          playerA: { id: pA.id, name: pA.name },
          playerB: { id: pA.id, name: pA.name },
          playerC: null,
          drawingA: null,
          drawingFinal: null
        });
      }
    }
  }

  room.coopData = { teams };

  // Her oyuncuya rolünü bildir
  teams.forEach(team => {
    // Oyuncu A: Sol yarıyı çizer
    io.to(team.playerA.id).emit('coopPhase1Start', {
      round: room.currentRound,
      totalRounds: room.totalRounds,
      word: team.word,
      role: 'drawer',
      side: 'left',
      partnerName: team.playerB ? team.playerB.name : 'Tek',
      duration: room.drawTime
    });

    // Oyuncu B: Bekler
    if (team.playerB && team.playerB.id !== team.playerA.id) {
      io.to(team.playerB.id).emit('coopPhase1Start', {
        round: room.currentRound,
        totalRounds: room.totalRounds,
        word: team.word,
        role: 'waiter',
        partnerName: team.playerA.name,
        duration: room.drawTime
      });
    }

    // Varsa 3. oyuncu da bekler
    if (team.playerC) {
      io.to(team.playerC.id).emit('coopPhase1Start', {
        round: room.currentRound,
        totalRounds: room.totalRounds,
        word: team.word,
        role: 'waiter',
        partnerName: team.playerA.name,
        duration: room.drawTime
      });
    }
  });

  broadcastRoomUpdate(room);

  room.timeLeft = room.drawTime;
  io.to(room.code).emit('timerTick', room.timeLeft);

  room.timer = setInterval(() => {
    room.timeLeft--;
    io.to(room.code).emit('timerTick', room.timeLeft);

    if (room.timeLeft <= 0) {
      clearRoomTimer(room);
      io.to(room.code).emit('requestDrawings');
    }
  }, 1000);
}

function startCoopPhase2(room) {
  room.status = 'coop_phase2';
  clearRoomTimer(room);
  broadcastRoomUpdate(room);

  room.coopData.teams.forEach(team => {
    const leftDrawing = team.drawingA || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAANSURBVBhXY/j///8/AAn7A/0FQ0gAAAAASUVORK5CYII=';

    // Oyuncu B: Sağ yarıyı çizer (Sol yarı kilitli şablon gibi gelir)
    if (team.playerB) {
      io.to(team.playerB.id).emit('coopPhase2Start', {
        round: room.currentRound,
        totalRounds: room.totalRounds,
        word: team.word,
        role: 'drawer',
        side: 'right',
        leftDrawing: leftDrawing,
        partnerName: team.playerA.name,
        duration: room.drawTime
      });
    }

    // Oyuncu A: Bekler
    io.to(team.playerA.id).emit('coopPhase2Start', {
      round: room.currentRound,
      totalRounds: room.totalRounds,
      word: team.word,
      role: 'waiter',
      leftDrawing: leftDrawing,
      partnerName: team.playerB ? team.playerB.name : 'Partnerin',
      duration: room.drawTime
    });

    if (team.playerC) {
      io.to(team.playerC.id).emit('coopPhase2Start', {
        round: room.currentRound,
        totalRounds: room.totalRounds,
        word: team.word,
        role: 'waiter',
        leftDrawing: leftDrawing,
        partnerName: team.playerB ? team.playerB.name : 'Partnerin',
        duration: room.drawTime
      });
    }
  });

  room.timeLeft = room.drawTime;
  io.to(room.code).emit('timerTick', room.timeLeft);

  room.timer = setInterval(() => {
    room.timeLeft--;
    io.to(room.code).emit('timerTick', room.timeLeft);

    if (room.timeLeft <= 0) {
      clearRoomTimer(room);
      io.to(room.code).emit('requestDrawings');
    }
  }, 1000);
}

function startCoopRevealPhase(room) {
  room.status = 'coop_reveal';
  clearRoomTimer(room);

  // Her takımın tamamlanan eserine puan ekle (+100 puan her iki eşe)
  room.coopData.teams.forEach(team => {
    const pA = room.players.find(p => p.id === team.playerA.id);
    const pB = room.players.find(p => p.id === (team.playerB ? team.playerB.id : ''));
    const pC = team.playerC ? room.players.find(p => p.id === team.playerC.id) : null;

    if (pA) pA.score += 100;
    if (pB && pB.id !== (pA ? pA.id : '')) pB.score += 100;
    if (pC) pC.score += 100;
  });

  const results = room.coopData.teams.map(team => ({
    teamTitle: `${team.playerA.name} & ${team.playerB ? team.playerB.name : ''}${team.playerC ? ' & ' + team.playerC.name : ''} Ortak Eseri`,
    word: team.word,
    finalDrawing: team.drawingFinal || team.drawingA || ''
  }));

  io.to(room.code).emit('coopRevealStart', {
    round: room.currentRound,
    totalRounds: room.totalRounds,
    results,
    leaderboard: [...room.players].sort((a, b) => b.score - a.score)
  });

  broadcastRoomUpdate(room);

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

// ========================================================
// ANA OYUN AKIŞI YÖNETİCİSİ
// ========================================================

function startRound(room) {
  const mode = room.gameMode || 'classic';
  if (mode === 'complete') {
    startCompleteDrawingPhase(room);
  } else if (mode === 'coop') {
    startCoopPhase1(room);
  } else {
    startClassicDrawingPhase(room);
  }
}

function proceedToNextStep(room) {
  if (room.currentRound < room.totalRounds) {
    room.currentRound++;
    startRound(room);
  } else {
    room.status = 'finished';
    const podium = [...room.players].sort((a, b) => b.score - a.score);
    io.to(room.code).emit('gameOver', { podium });
    broadcastRoomUpdate(room);
  }
}

// ========================================================
// SOCKET.IO EVENTLERİ
// ========================================================

io.on('connection', (socket) => {
  // 1. Oda Oluşturma
  socket.on('createRoom', ({ name, rounds, drawTime, gameMode }) => {
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
      gameMode: gameMode || 'classic',
      currentRound: 1,
      status: 'lobby',
      players: [{ id: socket.id, name: cleanName, score: 0 }],
      roundData: [],
      completeData: null,
      coopData: null,
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
  socket.on('updateRoomSettings', ({ rounds, drawTime, gameMode }) => {
    const room = getRoomOfSocket(socket);
    if (!room || room.hostId !== socket.id || room.status !== 'lobby') return;

    room.totalRounds = parseInt(rounds) || 3;
    room.drawTime = parseInt(drawTime) || 15;
    if (gameMode) room.gameMode = gameMode;
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

    room.players.forEach(p => p.score = 0);
    room.currentRound = 1;
    startRound(room);
  });

  // 5. Çizimi Gönderme (Tüm modlar için evrensel işleyici)
  socket.on('submitDrawing', (dataUrl) => {
    const room = getRoomOfSocket(socket);
    if (!room) return;

    // Mod 1: Klasik Rush
    if (room.status === 'drawing') {
      const item = room.roundData.find(d => d.drawerId === socket.id);
      if (item) item.drawing = dataUrl;

      const allSubmitted = room.roundData.every(d => d.drawing !== null);
      if (allSubmitted) {
        clearRoomTimer(room);
        startClassicGuessingPhase(room);
      }
    }
    // Mod 2: Resmi Tamamla (Complete)
    else if (room.status === 'complete_drawing') {
      if (!room.completeData) return;
      const player = room.players.find(p => p.id === socket.id);
      const existing = room.completeData.drawings.find(d => d.playerId === socket.id);

      if (!existing) {
        room.completeData.drawings.push({
          id: 'drawing_' + socket.id.slice(0, 5),
          playerId: socket.id,
          playerName: player ? player.name : 'Oyuncu',
          drawing: dataUrl,
          votes: {}
        });
      } else {
        existing.drawing = dataUrl;
      }

      if (room.completeData.drawings.length >= room.players.length) {
        clearRoomTimer(room);
        startCompleteVotingPhase(room);
      }
    }
    // Mod 3: Co-op Aşama 1 (Oyuncu A sol yarıyı gönderir)
    else if (room.status === 'coop_phase1') {
      if (!room.coopData) return;
      const team = room.coopData.teams.find(t => t.playerA.id === socket.id);
      if (team) {
        team.drawingA = dataUrl;
      }

      const allTeamsPhase1Done = room.coopData.teams.every(t => t.drawingA !== null);
      if (allTeamsPhase1Done) {
        clearRoomTimer(room);
        startCoopPhase2(room);
      }
    }
    // Mod 3: Co-op Aşama 2 (Oyuncu B final resmi gönderir)
    else if (room.status === 'coop_phase2') {
      if (!room.coopData) return;
      const team = room.coopData.teams.find(t => (t.playerB && t.playerB.id === socket.id) || t.playerA.id === socket.id);
      if (team) {
        team.drawingFinal = dataUrl;
      }

      const allTeamsPhase2Done = room.coopData.teams.every(t => t.drawingFinal !== null);
      if (allTeamsPhase2Done) {
        clearRoomTimer(room);
        startCoopRevealPhase(room);
      }
    }
  });

  // 6. Tahmin Gönderme (Klasik Mod)
  socket.on('submitGuess', (guess) => {
    const room = getRoomOfSocket(socket);
    if (!room || room.status !== 'guessing') return;

    const item = room.roundData.find(d => d.guesserId === socket.id);
    if (item && item.guess === null) {
      item.guess = (guess || '').trim();
      socket.emit('guessReceived', { message: 'Tahminin kaydedildi! Diğer oyuncular bekleniyor...' });
    }

    const allGuessed = room.roundData.every(d => d.guess !== null);
    if (allGuessed) {
      clearRoomTimer(room);
      startClassicRevealPhase(room);
    }
  });

  // 7. Kör Oy Gönderme (Resmi Tamamla Modu)
  socket.on('submitCompleteVote', ({ drawingId, score }) => {
    const room = getRoomOfSocket(socket);
    if (!room || room.status !== 'complete_voting' || !room.completeData) return;

    const targetDrawing = room.completeData.drawings.find(d => d.id === drawingId);
    if (targetDrawing && targetDrawing.playerId !== socket.id) {
      const sanitizedScore = Math.min(5, Math.max(1, parseInt(score) || 3));
      targetDrawing.votes[socket.id] = sanitizedScore;
      socket.emit('voteRecorded', { drawingId, score: sanitizedScore });
    }

    // Herkes kendine ait olmayan tüm çizimleri oyladı mı?
    const totalRequiredVotes = room.players.length * (room.players.length - 1);
    let currentTotalVotes = 0;
    room.completeData.drawings.forEach(d => {
      currentTotalVotes += Object.keys(d.votes).length;
    });

    if (totalRequiredVotes > 0 && currentTotalVotes >= totalRequiredVotes) {
      clearRoomTimer(room);
      startCompleteRevealPhase(room);
    }
  });

  // 8. Resim Sergisini / Oylamayı Hemen Atla (Skip)
  socket.on('skipReveal', () => {
    const room = getRoomOfSocket(socket);
    if (!room) return;

    if (room.status === 'reveal' || room.status === 'complete_reveal' || room.status === 'coop_reveal') {
      clearRoomTimer(room);
      proceedToNextStep(room);
    } else if (room.status === 'complete_voting') {
      clearRoomTimer(room);
      startCompleteRevealPhase(room);
    }
  });

  // 9. Lobiye Dönüş
  socket.on('returnToLobby', () => {
    const room = getRoomOfSocket(socket);
    if (!room) return;

    clearRoomTimer(room);
    room.status = 'lobby';
    room.currentRound = 1;
    room.players.forEach(p => p.score = 0);
    room.roundData = [];
    room.completeData = null;
    room.coopData = null;
    broadcastRoomUpdate(room);
    io.to(room.code).emit('lobbyReturned');
  });

  // 10. İstenmeyen Kişiyi Odadan Atma (Kick) - Sadece Host
  socket.on('kickPlayer', (targetPlayerId) => {
    const room = getRoomOfSocket(socket);
    if (!room || room.hostId !== socket.id) return;
    if (targetPlayerId === socket.id) return;

    const kickedPlayer = room.players.find(p => p.id === targetPlayerId);
    if (!kickedPlayer) return;

    room.players = room.players.filter(p => p.id !== targetPlayerId);

    const targetSocket = io.sockets.sockets.get(targetPlayerId);
    if (targetSocket) {
      targetSocket.leave(room.code);
      targetSocket.emit('kickedFromRoom', 'Oda kurucusu tarafından odadan çıkarıldınız.');
    }

    io.to(room.code).emit('playerLeft', {
      name: kickedPlayer.name,
      remainingCount: room.players.length
    });

    broadcastRoomUpdate(room);
  });

  // 11. Bağlantı Kopması
  socket.on('disconnect', () => {
    const room = getRoomOfSocket(socket);
    if (!room) return;

    const leavingPlayer = room.players.find(p => p.id === socket.id);
    room.players = room.players.filter(p => p.id !== socket.id);

    if (room.players.length === 0) {
      clearRoomTimer(room);
      delete rooms[room.code];
      return;
    }

    if (room.hostId === socket.id) {
      room.hostId = room.players[0].id;
    }

    io.to(room.code).emit('playerLeft', {
      name: leavingPlayer ? leavingPlayer.name : 'Bir oyuncu',
      remainingCount: room.players.length
    });

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
