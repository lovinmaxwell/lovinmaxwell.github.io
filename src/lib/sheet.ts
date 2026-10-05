/**
 * Phone behaviour for a `.sheet` dialog: pull the handle down (or tap it) to close,
 * and keep the sheet above the on-screen keyboard.
 */
export function bindSheet(dialog: HTMLDialogElement) {
  const panel = dialog.querySelector<HTMLElement>('.sheet-panel');
  const handle = dialog.querySelector<HTMLElement>('.sheet-handle');

  if (panel && handle) {
    let startY = 0;
    let dy = 0;
    let dragging = false;

    handle.addEventListener('pointerdown', (e) => {
      dragging = true;
      startY = e.clientY;
      dy = 0;
      handle.setPointerCapture(e.pointerId);
      panel.style.transition = 'none';
    });
    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      dy = Math.max(0, e.clientY - startY);
      panel.style.transform = `translateY(${dy}px)`;
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      panel.style.transition = '';
      panel.style.transform = '';
      // A tap counts too: barely moved means the handle was pressed like a button.
      if (dy > 72 || dy < 6) dialog.close();
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', () => {
      dy = 36;
      end();
    });
    // Keyboard and switch users activate the handle as a plain close button.
    handle.addEventListener('click', (e) => e.detail === 0 && dialog.close());
  }

  const viewport = window.visualViewport;
  if (viewport) {
    const fit = () => dialog.style.setProperty('--vvh', `${viewport.height}px`);
    viewport.addEventListener('resize', fit);
    fit();
  }
}
