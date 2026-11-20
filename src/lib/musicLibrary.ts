/**
 * Thư viện nhạc có sẵn: nhạc nền do ứng dụng TỰ TỔNG HỢP bằng Web Audio (không dùng bản ghi của ai),
 * nên không vướng bản quyền. Tạo khi người dùng chọn, trả về File WAV để đi chung luồng upload.
 */

export type LibraryTrack = {
  id: string;
  name: string;
  description: string;
  /** hợp âm (nốt MIDI) lặp theo thứ tự, mỗi hợp âm `beats` phách */
  chords: number[][];
  bpm: number;
  wave: OscillatorType;
  arpeggio: boolean;
};

export const MUSIC_LIBRARY: LibraryTrack[] = [
  {
    id: "lib-nhe-nhang",
    name: "Nhẹ nhàng (piano chuông)",
    description: "Arpeggio chậm, ấm áp — hợp mọi mẫu",
    chords: [
      [57, 60, 64],
      [53, 57, 60],
      [48, 52, 55],
      [55, 59, 62],
    ],
    bpm: 66,
    wave: "triangle",
    arpeggio: true,
  },
  {
    id: "lib-trang-trong",
    name: "Trang trọng (pad dây)",
    description: "Hợp âm dài, êm — hợp lễ dạm ngõ, vu quy",
    chords: [
      [50, 57, 62, 65],
      [46, 53, 58, 62],
      [48, 55, 60, 64],
      [45, 52, 57, 61],
    ],
    bpm: 54,
    wave: "sawtooth",
    arpeggio: false,
  },
  {
    // Thang âm ngũ cung (Do-Rê-Fa-Sol-La) gợi chất dân ca; KHÔNG phải bản thu quan họ thật
    id: "lib-ngu-cung",
    name: "Ngũ cung (gợi chất dân ca)",
    description: "Nốt ngũ cung thong thả, hợp mẫu Quan Họ Kinh Bắc",
    chords: [
      [57, 62, 64],
      [55, 60, 62],
      [50, 57, 60],
      [57, 62, 67],
    ],
    bpm: 60,
    wave: "triangle",
    arpeggio: true,
  },
  {
    id: "lib-vui-tuoi",
    name: "Vui tươi (chuông nhịp nhanh)",
    description: "Giai điệu sáng, nhịp nhanh — hợp tiệc, Tết",
    chords: [
      [60, 64, 67],
      [67, 71, 74],
      [57, 60, 64],
      [53, 57, 60],
    ],
    bpm: 96,
    wave: "sine",
    arpeggio: true,
  },
];

const SAMPLE_RATE = 32000;
const BEATS_PER_CHORD = 4;
const LOOPS = 3; // 3 vòng cấp tiến ≈ 40–70s

const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

async function synth(track: LibraryTrack): Promise<AudioBuffer> {
  const beat = 60 / track.bpm;
  const total = track.chords.length * BEATS_PER_CHORD * beat * LOOPS;
  const ctx = new OfflineAudioContext(1, Math.ceil(total * SAMPLE_RATE), SAMPLE_RATE);

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, 0);
  master.gain.linearRampToValueAtTime(0.5, 2);
  master.gain.setValueAtTime(0.5, total - 3);
  master.gain.linearRampToValueAtTime(0, total);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = track.wave === "sawtooth" ? 1400 : 3200;
  master.connect(lp);
  lp.connect(ctx.destination);

  const note = (m: number, start: number, dur: number, peak: number, attack: number) => {
    const o = ctx.createOscillator();
    o.type = track.wave;
    o.frequency.value = midiHz(m);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(peak, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g);
    g.connect(master);
    o.start(start);
    o.stop(start + dur + 0.05);
  };

  let t = 0;
  for (let l = 0; l < LOOPS; l++) {
    for (const chord of track.chords) {
      const len = BEATS_PER_CHORD * beat;
      // bè trầm
      note(chord[0] - 12, t, len * 1.05, 0.22, 0.05);
      if (track.arpeggio) {
        const steps = BEATS_PER_CHORD * 2;
        for (let i = 0; i < steps; i++) {
          const m = chord[i % chord.length] + (i % 6 === 5 ? 12 : 0);
          note(m + 12, t + (i * len) / steps, beat * 2.2, 0.16, 0.01);
        }
      } else {
        for (const m of chord) note(m, t, len * 1.1, 0.1, len * 0.35);
      }
      t += len;
    }
  }
  return ctx.startRendering();
}

function toWav(buf: AudioBuffer): Blob {
  const data = buf.getChannelData(0);
  const out = new DataView(new ArrayBuffer(44 + data.length * 2));
  const w = (o: number, s: string) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF");
  out.setUint32(4, 36 + data.length * 2, true);
  w(8, "WAVEfmt ");
  out.setUint32(16, 16, true);
  out.setUint16(20, 1, true);
  out.setUint16(22, 1, true);
  out.setUint32(24, buf.sampleRate, true);
  out.setUint32(28, buf.sampleRate * 2, true);
  out.setUint16(32, 2, true);
  out.setUint16(34, 16, true);
  w(36, "data");
  out.setUint32(40, data.length * 2, true);
  for (let i = 0; i < data.length; i++) {
    out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, data[i])) * 0x7fff, true);
  }
  return new Blob([out], { type: "audio/wav" });
}

export async function buildLibraryTrack(track: LibraryTrack): Promise<File> {
  const wav = toWav(await synth(track));
  return new File([wav], `${track.name}.wav`, { type: "audio/wav" });
}
