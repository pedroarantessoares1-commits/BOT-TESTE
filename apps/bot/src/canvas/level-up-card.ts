import { createCanvas, loadImage } from '@napi-rs/canvas';

export async function generateLevelUpCard(
  avatarUrl: string,
  username: string,
  oldLevel: number,
  newLevel: number
): Promise<Buffer> {
  const canvas = createCanvas(800, 250);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 800, 250);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 250);

  // Load avatar
  const avatar = await loadImage(avatarUrl);
  
  // Avatar clipping (circular)
  ctx.save();
  ctx.beginPath();
  ctx.arc(125, 125, 80, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatar, 45, 45, 160, 160);
  ctx.restore();

  // Gold ring border
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(125, 125, 82, 0, Math.PI * 2);
  ctx.stroke();

  // Text Username
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(username, 240, 90);

  // Text Level
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText(`Nível ${oldLevel} → ${newLevel}`, 240, 155);

  // Subtitle
  ctx.fillStyle = '#a0a0a0';
  ctx.font = '20px sans-serif';
  ctx.fillText('🎉 Subiu de nível!', 240, 200);

  return canvas.toBuffer('image/png');
}
