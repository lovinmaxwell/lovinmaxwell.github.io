export const storyChapters = [
  { id: 'top', label: 'Enter', at: 0, color: '#0b0b0c' },
  { id: 'about', label: 'About', at: 1.4, color: '#0b0b0c' },
  { id: 'experience', label: 'Journey', at: 2.8, color: '#0b0b0c' },
  { id: 'systems', label: 'Systems', at: 6.4, color: '#0b0b0c' },
  { id: 'stack', label: 'Stack', at: 7.8, color: '#0b0b0c' },
  { id: 'contact', label: 'Doha', at: 10.6, color: '#0b0b0c' },
] as const;

export const storyDuration = 11.6;
export const galleryTimings = {
  journey: { start: 3.05, end: 5.55 },
};
// The Skill Tree lights its columns as the Stack chapter scrolls: 0 at start, 1 at end. Every tool is lit by 0.85.
export const stackReveal = { start: 8.05, end: 10.2 };
