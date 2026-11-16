/** Stable colour per column position (the dot next to each column name). */
const COLORS = ['#49C4E5', '#8471F2', '#67E2AE', '#F1948A', '#E5A449', '#2A3FDB', '#C36E6E', '#58C463', '#B65FC7', '#E2C467'];

export const columnColor = (index: number): string => COLORS[index % COLORS.length]!;
