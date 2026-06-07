import { createCanvas, loadImage } from '@napi-rs/canvas';

export async function generateProfileCard(userData: {
  avatarUrl: string;
  username: string;
  level: number;
  totalXp: number;
  seasonXp: number;
  coins: number;
  rank: number;
  achievements: number;
}): Promise<Buffer> {
  const canvas = createCanvas(900, 400);
  const ctx = canvas.getContext('2d');

  // Background
  const grad = ctx.createLinearGradient(0, 0, 900, 400);
  grad.addColorStop(0, '#111');
  grad.addColorStop(1, '#222');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 900, 400);

  // Avatar
  const avatar = await loadImage(userData.avatarUrl);
  ctx.save();
  ctx.beginPath();
  ctx.arc(150, 150, 100, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatar, 50, 50, 200, 200);
  ctx.restore();

  ctx.strokeStyle = '#5865F2';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(150, 150, 102, 0, Math.PI * 2);
  ctx.stroke();

  // Texto
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText(userData.username, 280, 100);

  ctx.fillStyle = '#aaa';
  ctx.font = '25px sans-serif';
  ctx.fillText(`Rank #${userData.rank}  •  Level ${userData.level}`, 280, 140);

  // Barras e stats
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`💰 Coins: ${userData.coins}`, 280, 200);
  ctx.fillStyle = '#00FF00';
  ctx.fillText(`🌟 Season XP: ${userData.seasonXp}`, 280, 240);
  ctx.fillStyle = '#00BFFF';
  ctx.fillText(`🏆 Conquistas: ${userData.achievements}`, 280, 280);

  return canvas.toBuffer('image/png');
}
