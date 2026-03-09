export const minsToHuman = (m: number): string => {
  const h   = Math.floor(m / 60);
  const rem = m % 60;
  return h > 0 ? `${h}h ${rem > 0 ? `${rem}m` : ''}`.trim() : `${rem}m`;
};