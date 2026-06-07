export class XpCalculator {
    /**
     * Retorna a quantidade de XP necessária estritamente para avançar ao próximo nível.
     * Fórmula exponencial calibrada para durar uma temporada de 30 dias.
     */
    static xpForNextLevel(currentLevel: number): number {
        if (currentLevel < 0) return 100;
        return Math.floor(100 * Math.pow(currentLevel + 1, 1.8));
    }

    /**
     * Calcula o nível alcançado com base no total de XP acumulado de forma iterativa.
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