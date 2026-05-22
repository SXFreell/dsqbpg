/**
 * Low-level binary I/O for DSP blueprint format.
 * Uses DataView with little-endian byte order throughout (matching .NET BinaryWriter/BinaryReader).
 */

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8');

class BufferIO {
  view: DataView;
  pos: number = 0;

  constructor(view: DataView) {
    this.view = view;
  }

  getView(length: number): DataView {
    const r = new DataView(this.view.buffer, this.view.byteOffset + this.pos, length);
    this.pos += length;
    return r;
  }
}

export class BufferReader extends BufferIO {
  getUint8(): number {
    const v = this.view.getUint8(this.pos);
    this.pos += 1;
    return v;
  }

  getInt8(): number {
    const v = this.view.getInt8(this.pos);
    this.pos += 1;
    return v;
  }

  getInt16(): number {
    const v = this.view.getInt16(this.pos, true);
    this.pos += 2;
    return v;
  }

  getInt32(): number {
    const v = this.view.getInt32(this.pos, true);
    this.pos += 4;
    return v;
  }

  getUint32(): number {
    const v = this.view.getUint32(this.pos, true);
    this.pos += 4;
    return v;
  }

  getFloat32(): number {
    const v = this.view.getFloat32(this.pos, true);
    this.pos += 4;
    return v;
  }

  /** Read a .NET 7-bit encoded length-prefixed UTF-8 string */
  getString(): string {
    // Read string byte length (.NET 7-bit encoded int)
    let len = 0;
    let shift = 0;
    for (;;) {
      const b = this.getUint8();
      len |= (b & 0x7F) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7;
      if (shift > 35) throw new Error('Bad 7-bit encoded int');
    }
    if (len === 0) return '';
    // Read string content bytes and decode as UTF-8
    const v = this.getView(len);
    const bytes = new Uint8Array(v.buffer, v.byteOffset, len);
    return textDecoder.decode(bytes);
  }
}

export class BufferWriter extends BufferIO {
  setUint8(value: number): void {
    this.view.setUint8(this.pos, value);
    this.pos += 1;
  }

  setInt8(value: number): void {
    this.view.setInt8(this.pos, value);
    this.pos += 1;
  }

  setInt16(value: number): void {
    this.view.setInt16(this.pos, value, true);
    this.pos += 2;
  }

  setInt32(value: number): void {
    this.view.setInt32(this.pos, value, true);
    this.pos += 4;
  }

  setUint32(value: number): void {
    this.view.setUint32(this.pos, value, true);
    this.pos += 4;
  }

  setFloat32(value: number): void {
    this.view.setFloat32(this.pos, value, true);
    this.pos += 4;
  }

  setBytes(bytes: Uint8Array): void {
    new Uint8Array(this.view.buffer, this.view.byteOffset + this.pos, bytes.length).set(bytes);
    this.pos += bytes.length;
  }

  /** Write a .NET 7-bit encoded length-prefixed UTF-8 string */
  setString(value: string): void {
    const bytes = textEncoder.encode(value);
    // Write string byte count prefix (.NET 7-bit encoded int)
    let len = bytes.length;
    let v = len >>> 0;
    while (v >= 0x80) {
      this.setUint8((v & 0x7F) | 0x80);
      v >>>= 7;
    }
    this.setUint8(v & 0x7F);
    // Write string content
    this.setBytes(bytes);
  }
}
