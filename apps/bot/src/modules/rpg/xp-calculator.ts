export class XpCalculator {
  /**
   * Retorna XP necessário para alcançar um nível.
   * Fórmula: 5 * (level^2) + 50 * level + 100
   */
  static xpForNextLevel(level: number): number {
    return 5 * Math.pow(level, 2) + 50 * level + 100;
  }

  /**
   * Calcula o nível dado um total de XP (recursivo inverso).
   * O level começa do 0.
   */
  static levelFromXp(totalXp: number): number {
    let level = 0;
    let xpNeeded = this.xpForNextLevel(level);
    let remainingXp = totalXp;

    while (remainingXp >= xpNeeded) {
      remainingXp -= xpNeeded;
      level++;
      xpNeeded = this.xpForNextLevel(level);
    }

    return level;
  }

  /**
   * Retorna XP aleatório entre min e max (inclusivo)
   */
  static randomXp(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Retorna a quantidade de coins com base no XP (60% a 80% do XP ganho)
   */
  static coinsFromXp(xp: number): number {
    const percentage = Math.random() * (0.8 - 0.6) + 0.6;
    return Math.max(1, Math.floor(xp * percentage));
  }
}
