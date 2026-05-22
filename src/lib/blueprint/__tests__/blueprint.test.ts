import { describe, it, expect } from "bun:test";
import { encode, decode } from "../codec";
import type { BlueprintData, PlacedBuilding, BlueprintArea, Vec2i } from "../types";
import { md5Digest } from "../hash";

function makeVec3(x: number, y: number, z: number) {
  return { x, y, z };
}

function makeVec2i(x: number, y: number): Vec2i {
  return { x, y };
}

function makeEmptyBlueprint(): BlueprintData {
  return {
    header: {
      layout: 1,
      icons: [0, 0, 0, 0, 0],
      time: new Date("2026-05-21T00:00:00Z"),
      gameVersion: "0.10.34.28281",
      shortDesc: "Test Blueprint",
      author: "Test Author",
      customVersion: "v1.0",
      externalFields: "",
      desc: "A test blueprint for unit testing",
    },
    version: 2,
    cursorOffset: makeVec2i(0, 0),
    cursorTargetArea: 0,
    dragBoxSize: makeVec2i(10, 10),
    primaryAreaIdx: 0,
    areas: [],
    buildings: [],
    patch: 0,
    reformData: null,
  };
}

describe("Blueprint codec", () => {
  describe("md5Digest", () => {
    it("computes known MD5 hash (DSP variant)", () => {
      // The reference DSP blueprint editor uses a non-standard MD5 variant.
      // This test verifies our port matches that variant exactly.
      const hash = md5Digest(new ArrayBuffer(0));
      expect(hash).toBe("84d1ce3bd68f49ab26eb0f96416617cf");
    });

    it("computes 'hello' MD5 (DSP variant)", () => {
      const enc = new TextEncoder();
      const hash = md5Digest(enc.encode("hello").buffer);
      expect(hash).toBe("74ebe9b3b72d3cc4d99d17ec70bdfef8");
    });
  });

  describe("round-trip", () => {
    it("empty blueprint (no buildings, no areas)", () => {
      const bp = makeEmptyBlueprint();
      const encoded = encode(bp);
      const decoded = decode(encoded);

      expect(decoded.header.layout).toBe(bp.header.layout);
      expect(decoded.header.icons).toEqual(bp.header.icons);
      expect(decoded.header.time.getTime()).toBe(bp.header.time.getTime());
      expect(decoded.header.gameVersion).toBe(bp.header.gameVersion);
      expect(decoded.header.shortDesc).toBe(bp.header.shortDesc);
      expect(decoded.header.author).toBe(bp.header.author);
      expect(decoded.header.customVersion).toBe(bp.header.customVersion);
      expect(decoded.header.externalFields).toBe(bp.header.externalFields);
      expect(decoded.header.desc).toBe(bp.header.desc);

      expect(decoded.version).toBe(bp.version);
      expect(decoded.cursorOffset).toEqual(bp.cursorOffset);
      expect(decoded.cursorTargetArea).toBe(bp.cursorTargetArea);
      expect(decoded.dragBoxSize).toEqual(bp.dragBoxSize);
      expect(decoded.primaryAreaIdx).toBe(bp.primaryAreaIdx);
      expect(decoded.areas).toEqual([]);
      expect(decoded.buildings).toEqual([]);
      expect(decoded.patch).toBe(bp.patch);
      expect(decoded.reformData).toBeNull();
    });

    it("single building (assembler Mk.I)", () => {
      const bp = makeEmptyBlueprint();
      const building: PlacedBuilding = {
        index: 0,
        itemId: 2303, // Assembler Mk.I
        modelIndex: 0,
        areaIndex: 0,
        localOffset: [
          makeVec3(1.5, 2.5, 3.5),
          makeVec3(1.5, 2.5, 3.5),
        ],
        yaw: [0, 0],
        tilt: 0,
        pitch: 0,
        tilt2: 0,
        pitch2: 0,
        outputObjIdx: -1,
        inputObjIdx: -1,
        outputToSlot: 0,
        inputFromSlot: 0,
        outputFromSlot: 0,
        inputToSlot: 0,
        outputOffset: 0,
        inputOffset: 0,
        recipeId: 1,
        filterId: 0,
        parameters: null,
        content: "",
      };
      bp.buildings.push(building);

      const encoded = encode(bp);
      const decoded = decode(encoded);

      expect(decoded.buildings.length).toBe(1);
      const db = decoded.buildings[0]!;

      expect(db.index).toBe(building.index);
      expect(db.itemId).toBe(building.itemId);
      expect(db.modelIndex).toBe(building.modelIndex);
      expect(db.areaIndex).toBe(building.areaIndex);
      expect(db.localOffset[0].x).toBeCloseTo(building.localOffset[0].x, 4);
      expect(db.localOffset[0].y).toBeCloseTo(building.localOffset[0].y, 4);
      expect(db.localOffset[0].z).toBeCloseTo(building.localOffset[0].z, 4);
      expect(db.yaw[0]).toBeCloseTo(building.yaw[0], 4);
      expect(db.tilt).toBeCloseTo(building.tilt, 4);
      expect(db.pitch).toBeCloseTo(building.pitch, 4);
      expect(db.outputObjIdx).toBe(building.outputObjIdx);
      expect(db.inputObjIdx).toBe(building.inputObjIdx);
      expect(db.outputToSlot).toBe(building.outputToSlot);
      expect(db.inputFromSlot).toBe(building.inputFromSlot);
      expect(db.outputFromSlot).toBe(building.outputFromSlot);
      expect(db.inputToSlot).toBe(building.inputToSlot);
      expect(db.outputOffset).toBe(building.outputOffset);
      expect(db.inputOffset).toBe(building.inputOffset);
      expect(db.recipeId).toBe(building.recipeId);
      expect(db.filterId).toBe(building.filterId);
      expect(db.parameters).toBeNull();
      expect(db.content).toBe("");
    });

    it("building with parameters", () => {
      const bp = makeEmptyBlueprint();
      const building: PlacedBuilding = {
        index: 0,
        itemId: 2101, // Storage Mk.I
        modelIndex: 0,
        areaIndex: 0,
        localOffset: [
          makeVec3(0, 0, 0),
          makeVec3(0, 0, 0),
        ],
        yaw: [0, 0],
        tilt: 0,
        pitch: 0,
        tilt2: 0,
        pitch2: 0,
        outputObjIdx: -1,
        inputObjIdx: -1,
        outputToSlot: 0,
        inputFromSlot: 0,
        outputFromSlot: 0,
        inputToSlot: 0,
        outputOffset: 0,
        inputOffset: 0,
        recipeId: 0,
        filterId: 0,
        parameters: [1, 2, 3, 4, 5],
        content: "",
      };
      bp.buildings.push(building);

      const encoded = encode(bp);
      const decoded = decode(encoded);

      expect(decoded.buildings.length).toBe(1);
      expect(decoded.buildings[0]!.parameters).toEqual([1, 2, 3, 4, 5]);
    });

    it("belt building", () => {
      const bp = makeEmptyBlueprint();
      const building: PlacedBuilding = {
        index: 0,
        itemId: 2001, // Conveyor Belt Mk.I
        modelIndex: 0,
        areaIndex: 0,
        localOffset: [
          makeVec3(0, 0, 0),
          makeVec3(0, 0, 0),
        ],
        yaw: [0.5, 0.5],
        tilt: 0.1,
        pitch: 0,
        tilt2: 0.1,
        pitch2: 0,
        outputObjIdx: 1,
        inputObjIdx: -1,
        outputToSlot: 0,
        inputFromSlot: 0,
        outputFromSlot: 0,
        inputToSlot: 0,
        outputOffset: 0,
        inputOffset: 0,
        recipeId: 0,
        filterId: 0,
        parameters: null,
        content: "",
      };
      bp.buildings.push(building);

      const encoded = encode(bp);
      const decoded = decode(encoded);

      expect(decoded.buildings.length).toBe(1);
      const db = decoded.buildings[0]!;
      expect(db.itemId).toBe(2001);
      expect(db.tilt).toBeCloseTo(0.1, 4);
      expect(db.tilt2).toBeCloseTo(0.1, 4);
    });

    it("sorter building", () => {
      const bp = makeEmptyBlueprint();
      const building: PlacedBuilding = {
        index: 0,
        itemId: 2011, // Sorter Mk.I
        modelIndex: 0,
        areaIndex: 0,
        localOffset: [
          makeVec3(0, 0, 0),
          makeVec3(1, 2, 3),
        ],
        yaw: [0.25, 0.75],
        tilt: 0.5,
        pitch: 0.3,
        tilt2: 0.5,
        pitch2: 0.3,
        outputObjIdx: 1,
        inputObjIdx: -1,
        outputToSlot: 0,
        inputFromSlot: 0,
        outputFromSlot: 0,
        inputToSlot: 0,
        outputOffset: 0,
        inputOffset: 0,
        recipeId: 0,
        filterId: 0,
        parameters: null,
        content: "",
      };
      bp.buildings.push(building);

      const encoded = encode(bp);
      const decoded = decode(encoded);

      expect(decoded.buildings.length).toBe(1);
      const db = decoded.buildings[0]!;
      expect(db.itemId).toBe(2011);
      expect(db.localOffset[1].x).toBeCloseTo(1, 4);
      expect(db.localOffset[1].y).toBeCloseTo(2, 4);
      expect(db.localOffset[1].z).toBeCloseTo(3, 4);
      expect(db.tilt).toBeCloseTo(0.5, 4);
      expect(db.pitch).toBeCloseTo(0.3, 4);
    });

    it("building with content text", () => {
      const bp = makeEmptyBlueprint();
      const building: PlacedBuilding = {
        index: 0,
        itemId: 2303,
        modelIndex: 0,
        areaIndex: 0,
        localOffset: [
          makeVec3(0, 0, 0),
          makeVec3(0, 0, 0),
        ],
        yaw: [0, 0],
        tilt: 0,
        pitch: 0,
        tilt2: 0,
        pitch2: 0,
        outputObjIdx: -1,
        inputObjIdx: -1,
        outputToSlot: 0,
        inputFromSlot: 0,
        outputFromSlot: 0,
        inputToSlot: 0,
        outputOffset: 0,
        inputOffset: 0,
        recipeId: 0,
        filterId: 0,
        parameters: null,
        content: "Hello, DSP! 中文测试 🎮",
      };
      bp.buildings.push(building);

      const encoded = encode(bp);
      const decoded = decode(encoded);

      expect(decoded.buildings.length).toBe(1);
      expect(decoded.buildings[0]!.content).toBe("Hello, DSP! 中文测试 🎮");
    });

    it("areas round-trip", () => {
      const bp = makeEmptyBlueprint();
      const area: BlueprintArea = {
        index: 0,
        parentIndex: -1,
        tropicAnchor: 0,
        areaSegments: 200,
        anchorLocalOffset: makeVec2i(0, 0),
        size: makeVec2i(100, 100),
      };
      bp.areas.push(area);

      const encoded = encode(bp);
      const decoded = decode(encoded);

      expect(decoded.areas.length).toBe(1);
      expect(decoded.areas[0]).toEqual(area);
    });

    it("multiple buildings round-trip", () => {
      const bp = makeEmptyBlueprint();
      for (let i = 0; i < 10; i++) {
        const building: PlacedBuilding = {
          index: i,
          itemId: 2303,
          modelIndex: i,
          areaIndex: 0,
          localOffset: [
            makeVec3(i * 2, 0, 0),
            makeVec3(i * 2, 0, 0),
          ],
          yaw: [0, 0],
          tilt: 0,
          pitch: 0,
          tilt2: 0,
          pitch2: 0,
          outputObjIdx: i + 1,
          inputObjIdx: i - 1,
          outputToSlot: 1,
          inputFromSlot: 2,
          outputFromSlot: 3,
          inputToSlot: 4,
          outputOffset: 0,
          inputOffset: 0,
          recipeId: i % 10,
          filterId: 0,
          parameters: [i, i * 2, i * 3],
          content: `Building #${i}`,
        };
        bp.buildings.push(building);
      }

      const encoded = encode(bp);
      const decoded = decode(encoded);

      expect(decoded.buildings.length).toBe(10);
      for (let i = 0; i < 10; i++) {
        const db = decoded.buildings[i]!;
        expect(db.index).toBe(i);
        expect(db.recipeId).toBe(i % 10);
        expect(db.parameters).toEqual([i, i * 2, i * 3]);
        expect(db.content).toBe(`Building #${i}`);
      }
    });

    it("encodes to valid BLUEPRINT: string", () => {
      const bp = makeEmptyBlueprint();
      const encoded = encode(bp);
      expect(encoded.startsWith("BLUEPRINT:")).toBe(true);
      expect(encoded.length).toBeGreaterThan(100);
      // Should not throw
      const decoded = decode(encoded);
      expect(decoded.version).toBe(2);
    });
  });

  describe("MD5 integrity", () => {
    it("detects tampered blueprint string", () => {
      const bp = makeEmptyBlueprint();
      const encoded = encode(bp);

      // Insert a character in the middle
      const tampered = encoded.slice(0, 50) + "X" + encoded.slice(50);
      expect(() => decode(tampered)).toThrow("Checksum mismatch");
    });

    it("detects corrupted binary data", () => {
      const bp = makeEmptyBlueprint();
      const bp2 = makeEmptyBlueprint();
      bp2.cursorOffset = makeVec2i(99, 99);
      const encoded1 = encode(bp);
      const encoded2 = encode(bp2);

      // The MD5 should differ
      const p2_1 = encoded1.length - 33;
      const hash1 = encoded1.substring(p2_1 + 1);
      const p2_2 = encoded2.length - 33;
      const hash2 = encoded2.substring(p2_2 + 1);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("version 1 compatibility", () => {
    it("version 1 round-trip (no reform data)", () => {
      const bp = makeEmptyBlueprint();
      bp.version = 1;
      bp.patch = 0;
      bp.reformData = null;

      const encoded = encode(bp);
      const decoded = decode(encoded);

      expect(decoded.version).toBe(1);
      expect(decoded.reformData).toBeNull();
    });
  });

  describe("reform data round-trip", () => {
    it("with reform data", () => {
      const bp = makeEmptyBlueprint();
      bp.version = 2;
      bp.reformData = {
        rects: [
          { x: 0, y: 0, w: 10, h: 10, type: 1, color: 5, areaIndex: 0 },
          { x: 10, y: 0, w: 5, h: 5, type: 2, color: 3, areaIndex: 0 },
        ],
        customReformColorMask: 0,
        customReformColors: [0x12345678, 0xabcdef01],
      };

      const encoded = encode(bp);
      const decoded = decode(encoded);

      expect(decoded.reformData).not.toBeNull();
      expect(decoded.reformData!.rects.length).toBe(2);
      expect(decoded.reformData!.rects[0]!.x).toBe(0);
      expect(decoded.reformData!.rects[0]!.y).toBe(0);
      expect(decoded.reformData!.rects[0]!.w).toBe(10);
      expect(decoded.reformData!.rects[0]!.h).toBe(10);
      expect(decoded.reformData!.rects[0]!.type).toBe(1);
      expect(decoded.reformData!.rects[0]!.color).toBe(5);
      expect(decoded.reformData!.rects[1]!.type).toBe(2);
      expect(decoded.reformData!.customReformColorMask).toBe(0);
      expect(decoded.reformData!.customReformColors).toEqual([0x12345678, 0xabcdef01]);
    });
  });

  describe("float precision", () => {
    it("preserves float values to 4 decimal places", () => {
      const bp = makeEmptyBlueprint();
      const building: PlacedBuilding = {
        index: 0,
        itemId: 2303,
        modelIndex: 0,
        areaIndex: 0,
        localOffset: [
          makeVec3(1.2345678, 2.3456789, 3.4567891),
          makeVec3(1.2345678, 2.3456789, 3.4567891),
        ],
        yaw: [0.12345678, 0.12345678],
        tilt: 0,
        pitch: 0,
        tilt2: 0,
        pitch2: 0,
        outputObjIdx: -1,
        inputObjIdx: -1,
        outputToSlot: 0,
        inputFromSlot: 0,
        outputFromSlot: 0,
        inputToSlot: 0,
        outputOffset: 0,
        inputOffset: 0,
        recipeId: 0,
        filterId: 0,
        parameters: null,
        content: "",
      };
      bp.buildings.push(building);

      const encoded = encode(bp);
      const decoded = decode(encoded);

      const pos = decoded.buildings[0]!.localOffset[0];
      // Should match to 4 decimal places
      expect(pos.x).toBeCloseTo(1.2346, 4);
      expect(pos.y).toBeCloseTo(2.3457, 4);
      expect(pos.z).toBeCloseTo(3.4568, 4);
    });
  });
});
