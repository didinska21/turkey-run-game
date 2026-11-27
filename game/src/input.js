const KEY_ACTIONS = {
  Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', ArrowDown: 'slide', KeyS: 'slide',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Escape: 'pause', KeyP: 'pause', KeyM: 'mute', KeyR: 'restart',
};

export function createInput(canvas, unlockAudio) {
  const held = new Set();
  const pressed = new Set();
  const taps = [];
  const pointer = { x: -1, y: -1 };
  const position = event => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) * 1280 / rect.width;
    pointer.y = (event.clientY - rect.top) * 720 / rect.height;
  };
  addEventListener('keydown', event => {
    const action = KEY_ACTIONS[event.code];
    if (!action || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    unlockAudio();
    if (!event.repeat) pressed.add(action);
    held.add(action);
  });
  addEventListener('keyup', event => {
    const action = KEY_ACTIONS[event.code];
    if (action) { held.delete(action); event.preventDefault(); }
  });
  addEventListener('blur', () => { held.clear(); pressed.clear(); });
  canvas.addEventListener('pointermove', position);
  canvas.addEventListener('pointerleave', () => { pointer.x = -1; pointer.y = -1; });
  canvas.addEventListener('pointerdown', event => {
    event.preventDefault();
    unlockAudio();
    canvas.focus();
    position(event);
    taps.push({ ...pointer });
  });
  document.querySelectorAll('[data-control]').forEach(button => {
    const action = button.dataset.control;
    button.addEventListener('pointerdown', event => {
      event.preventDefault(); event.stopPropagation();
      button.setPointerCapture(event.pointerId);
      unlockAudio(); held.add(action); pressed.add(action);
    });
    const release = () => held.delete(action);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  });
  return {
    pointer,
    read() {
      const frame = {
        jump: pressed.has('jump'), slide: held.has('slide'),
        slidePressed: pressed.has('slide'), steer: Number(held.has('right')) - Number(held.has('left')),
        pause: pressed.has('pause'), mute: pressed.has('mute'), restart: pressed.has('restart'),
        taps: taps.splice(0),
      };
      pressed.clear();
      return frame;
    },
    clear() { pressed.clear(); held.clear(); taps.length = 0; },
  };
}
