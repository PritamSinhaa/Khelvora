export const skillLevels = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

export const sportSeeds = [
  ["football", "Football", 11],
  ["cricket", "Cricket", 11],
  ["basketball", "Basketball", 5],
  ["badminton", "Badminton", 2],
  ["tennis", "Tennis", 2],
  ["volleyball", "Volleyball", 6],
  ["table-tennis", "Table Tennis", 2],
  ["hockey", "Hockey", 11],
  ["kabaddi", "Kabaddi", 7],
].map(([slug, name, defaultTeamSize]) => ({
  slug,
  name,
  defaultTeamSize,
}));