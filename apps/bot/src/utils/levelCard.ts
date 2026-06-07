import { createCanvas, loadImage } from '@napi-rs/canvas';
import path from 'path';

export async function generateLevelUpCard(
    avatarUrl: string,
    username: string,
    oldLevel: number,
    newLevel: number
): Promise<Buffer> {

    const canvas = createCanvas(750, 250);
    const ctx = canvas.getContext('2d');

    // =========================
    // BACKGROUND
    // =========================
    try {
        const bgPath = path.join(__dirname, '..', '..', 'assets', 'background.png');
        const background = await loadImage(bgPath);

        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        // Overlay escuro cinematográfico ajustado para dar mais contraste
        const gradient = ctx.createLinearGradient(0, 0, 750, 250);
        gradient.addColorStop(0, 'rgba(0,0,0,0.85)');
        gradient.addColorStop(0.5, 'rgba(0,0,0,0.45)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.85)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

    } catch (err) {
        const gradient = ctx.createLinearGradient(0, 0, 750, 250);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(1, '#111827');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // =========================
    // BORDA EXTERNA DO CARD
    // =========================
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 730, 230);

    // =========================
    // AVATAR DO USUÁRIO
    // =========================
    const avatarImg = await loadImage(avatarUrl);

    // Glow de fundo do avatar (Neon Ciano)
    ctx.shadowColor = '#00ffe1';
    ctx.shadowBlur = 25;

    ctx.beginPath();
    ctx.arc(115, 125, 72, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,255,225,0.12)';
    ctx.fill();

    ctx.shadowBlur = 0; // Reseta o blur

    // Recorte circular do Avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(115, 125, 62, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(avatarImg, 53, 63, 124, 124);
    ctx.restore();

    // Borda principal com gradiente ao redor do Avatar
    ctx.beginPath();
    ctx.arc(115, 125, 66, 0, Math.PI * 2);

    const borderGradient = ctx.createLinearGradient(50, 50, 180, 180);
    borderGradient.addColorStop(0, '#00ffe1');
    borderGradient.addColorStop(1, '#0099ff');

    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 5;
    ctx.stroke();

    // Segunda borda fina estética externa do avatar
    ctx.beginPath();
    ctx.arc(115, 125, 74, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // =========================
    // TEXTO: NICKNAME (Aumentado de 38px para 44px)
    // =========================
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 10;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';

    const displayName = username.length > 14 ? username.substring(0, 14) + '...' : username;
    ctx.fillText(displayName, 220, 92);

    // =========================
    // TEXTO SECUNDÁRIO (Aumentado de 20px para 24px e reposicionado)
    // =========================
    ctx.shadowBlur = 4;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '600 24px system-ui, -apple-system, sans-serif';

    ctx.fillText(`Subiu do nível ${oldLevel} para o`, 220, 136);

    // Linha decorativa horizontal divisória (Aumentada a opacidade para destacar mais)
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(220, 154, 320, 2);

    // =========================
    // TEXTO: NÍVEL (Ajustado para 58px com espaçamento perfeito)
    // =========================
    const levelGradient = ctx.createLinearGradient(220, 170, 480, 220);
    levelGradient.addColorStop(0, '#00ffe1');
    levelGradient.addColorStop(1, '#00aaff');

    ctx.fillStyle = levelGradient;

    // Efeito forte de iluminação neon no nível novo
    ctx.shadowColor = '#00ffe1';
    ctx.shadowBlur = 20;

    ctx.font = 'bold 58px system-ui, -apple-system, sans-serif';
    ctx.fillText(`NÍVEL ${newLevel}`, 220, 216);

    // =========================
    // PARTÍCULAS RPG DE AMBIENTAÇÃO
    // =========================
    ctx.shadowBlur = 0; 

    for (let i = 0; i < 20; i++) {
        const x = Math.random() * 750;
        const y = Math.random() * 250;
        const size = Math.random() * 2.5;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fill();
    }

    return canvas.toBuffer('image/png');
}