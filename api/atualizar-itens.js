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

  const { jogadorId, adicionarOuro, adicionarDiamantes, novaSkin } = request.body;

  if (!jogadorId) {
    return response.status(400).json({ error: "O campo jogadorId é necessário." });
  }

  try {
    const userRef = db.ref(`usuarios/${jogadorId}`);
    const invRef = db.ref(`inventarios/${jogadorId}/skins_armas`);

    if (adicionarOuro || adicionarDiamantes) {
      await userRef.transaction((atual) => {
        if (atual) {
          if (adicionarOuro) atual.ouro = (atual.ouro || 0) + adicionarOuro;
          if (adicionarDiamantes) atual.diamantes = (atual.diamantes || 0) + adicionarDiamantes;
        }
        return atual;
      });
    }

    if (novaSkin) {
      await invRef.child(novaSkin).set(true);
    }

    return response.status(200).json({
      status: "sucesso",
      message: "Inventário atualizado!"
    });

  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
