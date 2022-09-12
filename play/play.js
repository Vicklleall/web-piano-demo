doc.body.style.zoom = 1;
const layout = Ele('div', 0, 'layout');
doc.body.append(layout);

const keyboard = new MidiLab.ui.Keyboard(layout);
keyboard.createFlow();

window.onresize = () => {
  layout.style.zoom = window.innerWidth / 625;
  layout.h = layout.clientHeight;
};
window.onresize();

MidiLab.core.init().then(() => {
  const Piano = new MidiLab.core.Instrument();
  ['Piano-pp', 'Piano-p', 'Piano-f', 'Piano-ff'].forEach((src, i) => {
    MidiLab.core.res.loadBuffer(src, 'samples/' + src + '.ogg');
    const group = Piano.createGroup();
    group.setDyn(32 * i - 1, 32 * i + 31, 32 * i + 63);
    const L = MidiLab.core.utils.note('bB1'), R = MidiLab.core.utils.note('bB8');
    let start = 0, duration = 1;
    for (let i = 0, note = R; note >= L; i++, note -= 3) {
      switch (i) {
        case 4: duration = 2; break;
        case 8: duration = 4; break;
        case 12: duration = 5; break;
        case 18: duration = 8; break;
        case 22: duration = 10; break;
      }
      const zone = new MidiLab.core.Instrument.Zone(src, note, 0, start, duration);
      group.addZone(zone, note - 1, note + 1 + !i);
      start += duration;
    }
  });
  keyboard.addInstrument(Piano);
  Piano.dyn = 95;
});
