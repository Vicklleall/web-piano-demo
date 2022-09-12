const MidiLab = {
  ctx: new AudioContext()
};

MidiLab.res = {
  buffer: [],     // 储存音频缓冲
  output: [],     // 储存输出通道
  instrument: [], // 储存乐器
  // 音频资源加载函数
  async load(url) {
    const response = await fetch(url);
    const audioData = await response.arrayBuffer();
    const decodedData = await MidiLab.ctx.decodeAudioData(audioData);
    this.buffer.push(decodedData);
    return decodedData;
  }
};

MidiLab.BaseNode = class {
  constructor(inputNode, outputNode) {
    this.inputNode = inputNode;
    this.outputNode = outputNode || inputNode;
  }
  connect(node) {
    if (node) this.outputNode.connect(node.inputNode);
  }
  disconnect(node) {
    if (node) this.outputNode.disconnect(node.inputNode);
  }
};

MidiLab.output = new MidiLab.BaseNode(
  MidiLab.ctx.createGain(), MidiLab.ctx.destination
);
MidiLab.output.inputNode.connect(MidiLab.output.outputNode);


MidiLab.Output = class extends MidiLab.BaseNode {
  constructor() {
    super(MidiLab.ctx.createGain());
    this.connect(MidiLab.output);
    MidiLab.res.output.push(this);
  }
};


MidiLab.Instrument = class extends MidiLab.BaseNode {
  constructor(outputId = 0) {
    super(MidiLab.ctx.createGain());
    this.setOutput(outputId);
    this.group = [];
    MidiLab.res.instrument.push(this);
  }
  setOutput(outputId) {
    const output = MidiLab.res.output[outputId];
    this.disconnect(this.output);
    this.connect(output);
    this.output = output;
  }
  createGroup() {
    const group = new MidiLab.Instrument.Group();
    group.connect(this);
    this.group.push(group);
    return group;
  }
  
  playNote(note, time = 0, duration = 0) {
    time += MidiLab.ctx.currentTime;
    for (const group of this.group) {
      if (group.enabled) group.playNote(note, time, duration);
    }
  }
  releaseNote(note, time = 0) {
    time += MidiLab.ctx.currentTime;
    for (const group of this.group) {
      const src = group.on[note]
      if (src) {
        group.releaseNote(src, time);
        group.on[note] = null;
      }
    }
  }
};

MidiLab.Instrument.Zone = class {
  constructor(src, root, start = 0, duration = 0) {
    this.src = src;
    this.root = root;
    this.start = start;
    this.duration = duration || src.duration;
  }
};

MidiLab.Instrument.Group = class extends MidiLab.BaseNode {
  constructor() {
    super(MidiLab.ctx.createGain());
    this.map = [];  // 音符映射表
    this.on = [];   // 记录正在播放的音符
    this.release = 0.2;  // 音符释放淡出时长
    this.enabled = true; // 当前组是否启用
  }
  
  addZone(zone, from, to) {
    for (let i = from; i <= to; i++) this.map[i] = zone;
  }
  
  playNote(note, time = 0, duration = 0) {
    const zone = this.map[note];
    const src = MidiLab.ctx.createBufferSource();
    const envelope = MidiLab.ctx.createGain();
    src.buffer = zone.src;
    src.envelope = envelope;
    src.connect(envelope);
    envelope.connect(this.inputNode);
    
    const tune = note - zone.root;
    if (tune) src.playbackRate.value = 2 ** (tune / 12);
    
    if (!time) time = MidiLab.ctx.currentTime;
    src.start(time, zone.start, zone.duration);
    if (duration) {
      this.releaseNote(src, time + duration);
    } else {
      this.on[note] = src;
    }
  }
  releaseNote(src, time = 0) {
    if (!time) time = MidiLab.ctx.currentTime;
    src.envelope.gain.setTargetAtTime(0, time, this.release / 4);
    src.stop(time + this.release);
  }
};


MidiLab.note = key => {
  const k = key.slice(0, -1),
        n = Number(key.slice(-1));
  let i = {A: 0, B: 2, C: 3, D: 5, E: 7, F: 8, G: 10}[k.slice(-1)];
  if (k[0] === 'b') {
    i--;
  } else if (k[0] === '#') {
    i++;
  }
  return n * 12 + i + 9;
}