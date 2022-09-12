const MidiLab = {
  core: MidiLabCore,
  ui: {
    Keyboard: class {
      static keyA = [
        'KeyQ', 'Digit2', 'KeyW', 'Digit3', 'KeyE', 'KeyR', 'Digit5', 'KeyT', 'Digit6', 'KeyY', 'Digit7', 'KeyU',
        'KeyI', 'Digit9', 'KeyO', 'Digit0', 'KeyP', 'BracketLeft', 'Equal', 'BracketRight', 'Backspace', 'Backslash'
      ];
      static keyB = [
        'KeyZ', 'KeyS', 'KeyX', 'KeyD', 'KeyC', 'KeyV', 'KeyG', 'KeyB', 'KeyH', 'KeyN', 'KeyJ', 'KeyM',
        'Comma', 'KeyL', 'Period', 'Semicolon', 'Slash'
      ];
      constructor(container) {
        const keyboard = Ele('div', 'keyboard');
        keyboard.append(Ele('div', 'key-w'), Ele('div', 'key-b'), Ele('div', 'key-w'));
        for (let i = 0; i < 7; i++) {
          for (let i = 0; i < 2; i++) {
            keyboard.append(Ele('div', 'key-w'), Ele('div', 'key-b'))
          }
          keyboard.append(Ele('div', 'key-w'));
          for (let i = 0; i < 3; i++) {
            keyboard.append(Ele('div', 'key-w'), Ele('div', 'key-b'))
          }
          keyboard.append(Ele('div', 'key-w'));
        }
        keyboard.append(Ele('div', 'key-w'));
        container.append(keyboard);
        this.container = container;
        this.key = keyboard.children;
        for (let i = 0; i < this.key.length; i++) {
          this.key[i].keyboard = this;
          this.key[i].key = i + 21;
          this.key[i].onmousedown = function() {
            this.aC('on', 't-mouse');
            this.keyboard.play(this.key);
          };
        }
        window.addEventListener('mouseup', () => {
          for (const key of c$('t-mouse', keyboard)) {
            key.rC('on', 't-mouse');
            key.keyboard.release(key.key);
          }
        });
        this.keyCode = {};
        this.keyOn = {};
        this.setKeyboardRoot();
        window.addEventListener('keydown', e => {
          if (e.repeat) return;
          if (/F[1-8]$/.test(e.code)) {
            e.preventDefault();
            const v = e.code[1] * 16 - 1;
            for (const inst of this.instrument) inst.xFade(v);
          } else {
            const note = this.keyCode[e.code];
            if (note && !this.keyOn[e.code]) {
              this.down(note).aC('t-keyboard');
              this.play(note);
              this.keyOn[e.code] = true;
            }
          }
        });
        window.addEventListener('keyup', e => {
          const note = this.keyCode[e.code];
          if (note) {
            this.up(note).rC('t-keyboard');
            this.release(note);
            this.keyOn[e.code] = false;
          }
        });
        window.addEventListener('blur', () => {
          for (const key of Array.from(c$('t-mouse', keyboard))) {
            key.rC('on', 't-mouse');
            key.keyboard.release(key.key);
          }
          for (const key of Array.from(c$('t-keyboard', keyboard))) {
            key.rC('on', 't-keyboard');
            key.keyboard.release(key.key);
          }
          for (let key in this.keyOn) this.keyOn[key] = false;
        });
        this.instrument = new Set();
      }

      setKeyboardRoot(rootA = 72, rootB = 60) {
        MidiLab.ui.Keyboard.keyA.forEach((key, i) => this.keyCode[key] = i + rootA);
        MidiLab.ui.Keyboard.keyB.forEach((key, i) => this.keyCode[key] = i + rootB);
      }

      down(note) {
        const key = this.key[note - 21];
        if (key) key.aC('on');
        return key;
      }
      up(note) {
        const key = this.key[note - 21];
        if (key) key.rC('on');
        return key;
      }
      play(note) {
        for (const inst of this.instrument) {
          inst.playNote(note);
        }
        if (this.flow) {
          const o = this.flow.on[note];
          if (o) {
            o.on = false;
            o.style.height = o.h + 'px';
            o.y -= 3000 - o.h;
          }
          this.flow.on[note] = this.flowNote(note, true);
        }
      }
      release(note) {
        for (const inst of this.instrument) {
          inst.releaseNote(note);
        }
        if (this.flow) {
          const o = this.flow.on[note];
          if (o) {
            o.on = false;
            o.style.height = o.h + 'px';
            o.y -= 3000 - o.h;
            this.flow.on[note] = null;
          }
        }
      }

      addInstrument(inst) {
        this.instrument.add(inst);
        inst.group.forEach(group => {
          for (let key of this.key) {
            if (group.map[key.key]) key.aC('actv');
          }
        });
      }
      removeInstrument(inst) {
        this.instrument.delete(inst);
        for (let key of this.key) key.rC('actv');
        for (const inst of this.instrument) {
          inst.group.forEach(group => {
            for (let key of this.key) {
              if (group.map[key.key]) key.aC('actv');
            }
          });
        }
      }

      createFlow() {
        if (!this.flow) {
          this.flow = Ele('div', 'flow');
          this.flow.style.inset = '0 0 73px 0';
          this.container.append(this.flow);
          this.flow.x = [];
          this.flow.w = [];
          this.flow.spd = 1;
          this.flow.u = [];
          this.flow.d = [];
          this.flow.on = [];
          let x = 0;
          for (let i = 0; i < this.key.length; i++) {
            const black = this.key[i].hC('key-b');
            if (black) {
              let d = 3;
              switch ((i - 4) % 12) {
                case 0: d = 3.5; break;
                case 2: d = 2.5; break;
                case 5: d = 4; break;
                case 9: d = 2; break;
              }
              this.flow.x.push(x - d);
            } else {
              this.flow.x.push(x + 2);
              x += 12;
            }
            this.flow.w.push(black ? 7 : 9);
          }
          requestAnimationFrame(() => this.updateFlow());
        }
        return this.flow;
      }
      flowNote(note, on = false) {
        const o = Ele('div', 'note');
        o.style.left = this.flow.x[note - 21] + 'px';
        o.style.width = this.flow.w[note - 21] + 'px';
        o.on = on;
        if (on) {
          o.style.bottom = 0;
          o.style.height = '3000px';
          o.h = 0;
          o.y = 3000;
          this.flow.u.push(o);
        } else {
          this.flow.d.push(o);
        }
        this.flow.append(o);
        return o;
      }
      updateFlow() {
        const up = this.flow.u;
        const down = this.flow.d;
        for (let i = up.length; i--;) {
          const o = up[i];
          if (o.on) o.h += this.flow.spd;
          o.y -= this.flow.spd;
          o.style.transform = 'translateY(' + o.y + 'px)';
          if (o.y < 72 - this.container.h) {
            o.remove();
            up.splice(i, 1);
          }
        }
        requestAnimationFrame(() => this.updateFlow());
      }
    }
  }
};