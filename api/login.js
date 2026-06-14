import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    }),
    databaseURL: "https://foxyz-mobile-default-rtdb.firebaseio.com/"
  });
}

const db = admin.database();

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: "Método não permitido. Usa POST." });
  }

  const { jogadorId, nickname } = request.body;

  if (!jogadorId) {
    return response.status(400).json({ error: "O campo jogadorId é obrigatório." });
  }

  try {
    const userRef = db.ref(`usuarios/${jogadorId}`);
    const invRef = db.ref(`inventarios/${jogadorId}`);

    const userSnapshot = await userRef.once('value');
    const userData = userSnapshot.val();

    if (!userData) {
      const novoJogador = {
        nickname: nickname || `Player_${jogadorId.substring(0, 5)}`,
        nivel: 1,
        ouro: 1000,
        diamantes: 0,
        status: "No Lobby"
      };

      const itensIniciais = {
        skins_armas: {
          "M4A1_Original": true
        }
      };

      await userRef.set(novoJogador);
      await invRef.set(itensIniciais);

      return response.status(201).json({
        status: "registrado",
        message: "Novo jogador criado!",
        perfil: novoJogador,
        inventario: itensIniciais
      });
    }

    const invSnapshot = await invRef.once('value');
    const invData = invSnapshot.val();

    return response.status(200).json({
      status: "logado",
      message: "Login efetuado!",
      perfil: userData,
      inventario: invData || {}
    });

  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
  
