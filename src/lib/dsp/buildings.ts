import type { Building } from "./types";

export const buildings: Building[] = [
  {id:0,type:-1,name:"伊卡洛斯",gridIndex:-1,iconName:"伊卡洛斯",workEnergyPerTick:1333.3333333333333,speed:10000,space:0},
  {id:1,type:-1,name:"行星基地",gridIndex:-1,iconName:"行星基地",workEnergyPerTick:0,speed:10000,space:0},
  {id:2105,type:5,name:"轨道采集器",gridIndex:2214,iconName:"orbital-collector",workEnergyPerTick:500000,speed:8,space:0},
  {id:2206,type:5,name:"蓄电器",gridIndex:2110,iconName:"accumulator",workEnergyPerTick:0,speed:1,space:4},
  {id:2207,type:5,name:"蓄电器（满）",gridIndex:2111,iconName:"accumulator-full",workEnergyPerTick:0,speed:1,space:4},
  {id:2208,type:6,name:"射线接收站",gridIndex:2112,iconName:"ray-receiver",workEnergyPerTick:0,speed:1,space:54.82},
  {id:2209,type:5,name:"能量枢纽",gridIndex:2109,iconName:"energy-exchanger",workEnergyPerTick:0,speed:1,space:64},
  {id:2301,type:6,name:"采矿机",gridIndex:2305,iconName:"mining-drill",workEnergyPerTick:7000,speed:0.5,space:15},
  {id:2302,type:6,name:"电弧熔炉",gridIndex:2401,iconName:"smelter",workEnergyPerTick:6000,speed:1,space:5.76},
  {id:2303,type:6,name:"制造台 Mk.I",gridIndex:2404,iconName:"assembler-1",workEnergyPerTick:4500,speed:0.75,space:10.24},
  {id:2304,type:6,name:"制造台 Mk.II",gridIndex:2405,iconName:"assembler-2",workEnergyPerTick:9000,speed:1,space:10.24},
  {id:2305,type:6,name:"制造台 Mk.III",gridIndex:2406,iconName:"assembler-3",workEnergyPerTick:18000,speed:1.5,space:10.24},
  {id:2306,type:6,name:"抽水站",gridIndex:2307,iconName:"water-pump",workEnergyPerTick:5000,speed:0.8333333333333334,space:12},
  {id:2307,type:6,name:"原油萃取站",gridIndex:2308,iconName:"oil-extractor",workEnergyPerTick:14000,speed:1,space:50},
  {id:2308,type:6,name:"原油精炼厂",gridIndex:2309,iconName:"oil-refinery",workEnergyPerTick:16000,speed:1,space:18},
  {id:2309,type:6,name:"化工厂",gridIndex:2311,iconName:"chemical-plant",workEnergyPerTick:12000,speed:1,space:23.76},
  {id:2310,type:6,name:"微型粒子对撞机",gridIndex:2313,iconName:"hadron-collider",workEnergyPerTick:200000,speed:1,space:45.12},
  {id:2314,type:6,name:"分馏塔",gridIndex:2310,iconName:"fractionator",workEnergyPerTick:12000,speed:1,space:12.96},
  {id:2315,type:6,name:"位面熔炉",gridIndex:2402,iconName:"smelter-2",workEnergyPerTick:24000,speed:2,space:5.76},
  {id:2316,type:6,name:"大型采矿机",gridIndex:2306,iconName:"mining-drill-mk2",workEnergyPerTick:49000,speed:1,space:25},
  {id:2317,type:6,name:"量子化工厂",gridIndex:2312,iconName:"chemical-plant-2",workEnergyPerTick:36000,speed:2,space:23.76},
  {id:2318,type:6,name:"重组式制造台",gridIndex:2407,iconName:"assembler-4",workEnergyPerTick:45000,speed:3,space:10.24},
  {id:2319,type:6,name:"负熵熔炉",gridIndex:2403,iconName:"smelter-3",workEnergyPerTick:48000,speed:3,space:5.76},
  {id:2901,type:6,name:"矩阵研究站",gridIndex:2408,iconName:"lab",workEnergyPerTick:8000,speed:1,space:20.25},
  {id:2902,type:6,name:"自演化研究站",gridIndex:2409,iconName:"lab-2",workEnergyPerTick:32000,speed:3,space:20.25}
];

export const buildingsById = new Map<number, Building>(
  buildings.map((b) => [b.id, b])
);
