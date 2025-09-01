export const Physics = {
  gravity: 0.6, // Гравитация как в оригинале
  jumpVelocity: -15, // Сила прыжка как в оригинале
  groundY: 200, // Возвращаем оригинальную высоту земли
  maxPointsPerRun: 30000,
  baseSpeed: 4,
  maxSpeed: 13,
  accelerationPerMs: 0.00005, // Замедляем ускорение в 4 раза
};

export function rectsIntersect(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

