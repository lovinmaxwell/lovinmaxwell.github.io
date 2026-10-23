export const storyChapters = [
  { id: 'top', label: 'Enter', at: 0, color: '#07090d' },
  { id: 'about', label: 'About', at: 1.4, color: '#07090d' },
  { id: 'experience', label: 'Journey', at: 2.8, color: '#07090d' },
  { id: 'systems', label: 'Systems', at: 6.4, color: '#07090d' },
  { id: 'stack', label: 'Stack', at: 7.8, color: '#07090d' },
  { id: 'contact', label: 'Doha', at: 10.6, color: '#07090d' },
] as const;

export const storyDuration = 11.6;
export const galleryTimings = {
  journey: { start: 3.05, end: 5.55 },
};
// The Stack window steps through the four capabilities, then the full index. Each value is the centre of a step.
export const stackSteps = [7.95, 8.35, 8.75, 9.15, 9.6];
