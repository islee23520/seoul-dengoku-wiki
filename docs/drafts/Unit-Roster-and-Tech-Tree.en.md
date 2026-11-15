---
title: Unit Roster and Tech Tree
title_ko: 병종 로스터와 테크트리
model: cpa/claude-opus-5-5 (agent-authored from .omo/handoff/v4/unit-roster and pd/04-unit-roster; tables generated from roster_data.py by .omo/handoff/v4/wiki-overhaul/_work/arms-tools/build_new_docs.py; 0 completion calls; not from a Gemini model)
section_checkpoint: complete
---

## How to Read This Page

This page turns [The Cost Structure of the Three Factions](/wiki/Cost-Structure/) into units, weapon codes and tiered tech trees. The faction logic (who holds what, who lacks what, and what each must get from the others) is canon. Unit names, combat values, costs, upkeep, weapon codes and the numbers in unlock conditions are proposals for tuning the game, and may change after play-testing.

- There are 48 units: 15 Government, 15 Free Cities, 11 Arc, and 7 shared units derived from roaming machines.
- There are 51 weapons and pieces of equipment.
- The leaders are President Kim Yeongyu (Government), Chair of the Board I Ilseop (Free Cities) and Hierophant Go Ye-jin (Arc).
- Combat values (damage/toughness/pursuit/screen) are starting values on a 0 to 120 scale.

## Design Principles

1. Cost comes not from numbers but from scattered facilities and people. So the key field of a unit is not attack but what it requires (officers, doctors, the Arc key, salvaged machines). Without them a unit is not available at all, or runs in a set degraded mode.
2. The three factions are asymmetric. The Government wins hard and loses people. The Free Cities fight weakly and last long. The Arc does not fight head-on; it switches off other factions' equipment. The Arc's mechanical bodies are hurt less than people, but the Arc has no doctors.
3. The more advanced, the more you need from others. L1 and L2 open with a faction's own facilities. L3 needs one thing from another faction, L4 two, L5 three. So at the strategic layer, trade, recruitment, prisoners and salvage matter as much as battle.
4. Switching on and off is not free. When the Arc uses a shutdown signal, the other side's license trust drops at once, and that side gains a motive to strip out Arc software and go back to manual.
5. The AI is not a common enemy. Roaming machines are not an enemy faction but a hazard and a resource. They can fall on a district like a raid, and once captured they become units. Machines cannot be built, so a lost one has to be caught again.
6. Drones and surveillance come later. At the start (L1) there are no fighting drones; only the Arc's remote-steered insects scout. The Free Cities get fiber-tethered drones at L2, the Arc tamed swarms at L3, and the Government licensed drones at L4.

## Weapon Numbering Rules

A weapon or equipment code is `<faction>-<family><tier>-<serial>`. For example, `G-V4-01` is Government, vehicle, L4, number 1.

- Faction: `G` Government, `F` Free Cities, `A` Arc, `R` roaming-machine derived (shared). The faction actually using it is shown by the unit ID.
- The tier digit equals the unlock tier (L1 to L5). Within a tier, items are told apart by serial number, and a retired or replaced number is never reused.
- Unit IDs are `<faction>-U<two digits>`, counted separately from weapon codes.
- Status suffixes: `/A` when Arc software is inside (meaning there is a backdoor, for example `G-V4-01/A`), `/M` for manual mode, `/R` for salvaged or converted items.

| Family | Meaning |
|---|---|
| `S` | Personal arms (rifles, pistols, bayonets, crossbows) |
| `M` | Squad and heavy weapons (machine guns, mortars) |
| `T` | Anti-tank and anti-machine (recoilless guns, guided missiles) |
| `V` | Vehicles, rail cars, tanks |
| `D` | Unmanned aircraft (drones) |
| `W` | Electronic warfare and software modules (switching on and off) |
| `H` | Medical (aid, surgery, medical robots) |
| `E` | Engineering and siege (cutters, charges, barriers) |
| `B` | Mechanical bodies and worn gear |
| `X` | Salvaged ancient weapons (from roaming machines) |
| `C` | Command and communications (radio, fire control) |

## Roaming Machine Type Numbers

The `M` numbers in salvage requirements refer to roaming machine types. They are a different series from the "source placement" numbers in the ecology compendium entries.

| Type | Machine | Ecology compendium |
|---|---|---|
| M1 | service robot | [G14 · Empty Cart](/wiki/Hostile-Group-G14/) |
| M2 | inspection robot (four-legged) | [G16 · Girder Spider](/wiki/Hostile-Group-G16/) |
| M3 | inspection robot (track and conduit) | [G18 · Fire-Leg Train](/wiki/Hostile-Group-G18/) |
| M4 | care robot | [G15 · Care Wheel](/wiki/Hostile-Group-G15/) |
| M5 | logistics robot crew | [G13 · Pincer Arm](/wiki/Hostile-Group-G13/) |
| M6 | blockade watch net | [G17 · One-Eye Tower](/wiki/Hostile-Group-G17/) |
| M7 | returning unmanned vehicle (six-wheeled UGV) | — |
| M8 | drone swarm | — |
| M9 | field of unexploded warheads and optical fiber | — |
| M10 | remote-steered insects | — |
| M11 | air-defense system (ancient weapon) | — |
| M12 | Lantern Ant | [G25 · Lantern Ant](/wiki/Hostile-Group-G25/) |
| M13 | Iron Dinosaur | [G26 · Iron Dinosaur](/wiki/Hostile-Group-G26/) |
| M14 | armored locomotive (ancient weapon) | — |

## Government Units

The Government holds the officer corps, tanks and heavy weapons, depots, large university hospital buildings and the original seed stock. It lacks medical technicians (Free Cities) and weapon software (Arc). It can give only first aid, so its wounded return rate is 0.3 (proposed value). Its mark is an ochre armband.

| ID | Unit | Tier | Class | Damage/toughness/pursuit/screen | Weapons and equipment | Requires | Software (backdoor) | Cost | Upkeep | Role |
|---|---|---|---|---|---|---|---|---|---|---|
| G-U01 | service rifle squad | L1 | `rifle` | 28/12/0/0 | `G-S1-01`, `G-S1-02` | — | none (0) | 6 people, ammunition | food 6, ammo 30/person | Backbone of frontal firepower. Accurate under officer command |
| G-U02 | patrol shield squad | L1 | `guard` | 14/30/0/10 | `G-S1-03`, `G-S1-02` | — | none (0) | 8 people | food 8 | Keeps order in front of the shutters and blocks firing lines |
| G-U03 | officer command team | L1 | `command` | 8/12/0/6 | `G-S1-01`, `G-C4-01` | — | none (0) | 3 people (officers) | food 3, battery 2 | Combined command: removes order delay for friendly units in the same zone and opens combined fire for heavy weapons and tanks. Government only |
| G-U04 | first-aid team | L1 | `medic` | 4/10/0/0 | `G-H1-01` | — | none (0) | 3 people, medicine | food 3, medicine 1 | First aid only. It holds on to the lightly wounded, but the badly wounded do not come back (wounded return 0.3) |
| G-U05 | squad support gun team | L2 | `heavy` | 60/10/0/0 | `G-M2-01` | — | none (0) | 4 people, much ammunition | food 4, ammo 200/gun | Suppressive fire that wears down enemy squad morale |
| G-U06 | mortar section | L2 | `heavy` | 55/8/0/0 | `G-M2-02` | officer | none (0) | 5 people, shells | food 5, shells | Indirect fire. Accurate only when an officer command team is on the same field |
| G-U07 | breaching engineers | L2 | `engineer` | 10/14/0/0 | `G-E2-01` | — | none (0) | 4 people, explosives | food 4, hydraulics 2 | Breaches shutters and blast doors; explosives |
| G-U08 | rail motorcar | L2 | `rail` | 10/0/0/0 | `G-V2-02` | — | none (0) | hardware, battery | battery 10 | Moves along underground track; carries a squad of 10 |
| G-U09 | restored armored carrier | L3 | `vehicle` | 30/60/10/0 | `G-V3-01`, `G-M2-01` | — | none (0) | depot, fuel | fuel 12, maintenance | Surface mobility; carries 8 |
| G-U10 | anti-machine recoilless team | L3 | `antiarmor` | 70/8/0/0 | `G-T3-01` | — | none (0) | 3 people, shells | food 3, shells | Kills armor and large machines |
| G-U11 | restored main battle tank | L4 | `vehicle` | 110/120/10/0 | `G-V4-01`, `G-C4-01` | officer, Arc key (manual and degraded without) | licensed (2) | depot, fuel (large), officer | fuel 20, maintenance, license | The strongest frontal force. Without an Arc license (fire-control terminal) it aims by hand at -40% hit; with the license, the Arc can switch it off |
| G-U12 | self-propelled battery | L4 | `artillery` | 95/50/0/0 | `G-V4-02`, `G-C4-01` | officer, Arc key (manual and degraded without) | licensed (2) | depot, shells, officer | fuel 16, shells, license | Long-range bombardment. Wide dispersion without firing-data software |
| G-U13 | air-defense battery | L4 | `emplacement` | 90/80/0/0 | `G-X4-01` | Arc key, salvaged M11 | Arc-held (3) | restoration works, Arc contract | power, license | Stops drones and flying machines. A joint weapon of Government hardware and Arc software; the shutdown device stays in Arc hands |
| G-U14 | surveillance drone team | L4 | `drone` | 6/8/0/20 | `G-D4-01`, `G-C4-01` | Arc key | licensed (2) | depot, battery, license | battery 8, license | Wide reconnaissance (recon grade +1 to +2). Flight control needs the Arc key, and the Arc sees what it sees |
| G-U15 | remote-commanded UGV troop | L5 | `machine` | 80/140/0/0 | `G-X5-01`, `G-C4-01` | officer, Arc key, salvaged M7 | Arc-held (3) | salvaged machine, fuel, officer, license | fuel 14, maintenance, license | The Government's L5 for sparing people: since its wounded do not come back, it sends machines first. Needs salvaged M7, an officer and the Arc key |

## Free City Units

The Free Cities hold doctors and neural-link medicine, people and food, and the Capital Defense Command (CDC) equipment left on their ground. Thanks to conscript basic training, anyone can handle and maintain a rifle. They lack officers (Government), medical-robot software (Arc) and the original seed stock (Government). With doctors, their wounded return rate is 0.85 (proposed value). Their mark is a faded navy armband.

| ID | Unit | Tier | Class | Damage/toughness/pursuit/screen | Weapons and equipment | Requires | Software (backdoor) | Cost | Upkeep | Role |
|---|---|---|---|---|---|---|---|---|---|---|
| F-U01 | conscript rifle company | L1 | `rifle` | 24/12/0/0 | `F-S1-01` | — | none (0) | 8 people, food | food 8, ammo 25/person | Everyone has had basic military training, so they are many. They maintain their own weapons |
| F-U02 | militia bayonet band | L1 | `line` | 26/18/10/0 | `F-S1-02` | — | none (0) | 8 people | food 8 | Keeps fighting when ammunition runs out. Close combat |
| F-U03 | doctor-led aid team | L1 | `medic` | 4/10/0/0 | `F-H1-01` | — | none (0) | 3 people (1 doctor), medicine | food 3, medicine 2 | A doctor goes with the team. Wounded return 0.85; keeps up the morale of friendly units in the same zone |
| F-U04 | maintenance engineers | L1 | `engineer` | 10/14/0/0 | `F-E1-01` | — | none (0) | 4 people, materials | food 4 | Weapon maintenance, barricades, upkeep of Capital Defense Command equipment |
| F-U05 | fixed machine-gun crew | L2 | `heavy` | 65/18/0/0 | `F-M2-01` | — | none (0) | 3 people, ammunition | food 3, ammo 200 | Run at squad level, so no officer is needed. The core of ticket-gate defense |
| F-U06 | tethered scout drone team | L2 | `drone` | 4/8/0/16 | `F-D2-01` | salvaged M9 | none (0) | recovered fiber (M9), battery | battery 4 | Wire-guided by optical fiber, so the Arc cannot switch it off. Limited range |
| F-U07 | e-bike scouts | L2 | `mounted` | 24/12/30/24 | `F-V2-03`, `F-S1-01` | — | none (0) | electric motorbike, battery | battery 6, food 4 | Fast scouting and raids. Battery is the bottleneck |
| F-U08 | rail handcar | L1 | `rail` | 0/0/0/0 | `F-V1-02` | — | none (0) | materials | none | Quiet track transport; carries 6 |
| F-U09 | workshop mortar crew | L3 | `heavy` | 45/8/0/0 | `F-M3-02` | officer (manual and degraded without) | none (0) | 4 people, shells | food 4, shells | Fires by experience without an officer: wide dispersion (-30% hit). Normal once an officer is won over |
| F-U10 | capital-defense armored vehicle | L3 | `vehicle` | 30/60/10/0 | `F-V3-01` | officer (manual and degraded without) | none (0) | CDC equipment, fuel | fuel 12 | The hardware is there. Without an officer: order delay x2 and no combined fire |
| F-U11 | neural-link pilot | L3 | `special` | 12/10/0/10 | `F-H3-02`, `F-B3-01` | doctor | none (0) | doctor, surgery, 2 people | food 2, medical 1 | A surgically linked pilot steers captured machines by thought (raises the ceiling of machine-derived units) |
| F-U12 | capital-defense tank | L4 | `vehicle` | 100/120/10/0 | `F-V4-01` | officer | none (0) | CDC equipment, fuel (large), officer | fuel 20 | Without an officer it serves only as an immobile fixed battery. Maneuver warfare opens once an officer is won over or captured |
| F-U13 | surgical-robot field hospital | L4 | `medic` | 0/30/0/0 | `F-H4-03` | doctor, Arc key | licensed (3) | doctor, medical robot, license | power, medical 3, license | Wounded return 0.95; even the badly wounded come back. Needs Arc software, so the Arc can switch it off |
| F-U14 | workbench drop-drone team | L3 | `drone` | 30/6/0/10 | `F-D3-02` | — | none (0) | parts, explosives, battery | battery 6 | Hand-steered by radio, drops small charges. Radio leaves it open to Arc and Government jamming |
| F-U15 | neural-direct quadruped troop | L5 | `machine` | 40/50/20/10 | `R-X2-01`, `F-B3-01` | doctor, salvaged M2, Arc key (manual and degraded without) | licensed (1) | salvage (M2), pilot, maintenance | battery 8, medical 1 | A surgically linked pilot drives a captured inspection robot by thought: strongest on stairs and in tunnels. Slow to respond without the Arc key |

## Arc Units

The Arc holds a monopoly on ancient data-center software, command-input mechanical bodies and a few packs of tamed old machines. It has no material base such as factories, heavy weapons or hospitals, and no thought-control surgery (Free City doctors). Its wounded return rate is 0.5 (proposed value). Its mark is a pale grey sash with a thin teal stripe.

| ID | Unit | Tier | Class | Damage/toughness/pursuit/screen | Weapons and equipment | Requires | Software (backdoor) | Cost | Upkeep | Role |
|---|---|---|---|---|---|---|---|---|---|---|
| A-U01 | guard riflemen | L1 | `rifle` | 22/10/0/0 | `A-S1-01` | — | none (0) | 4 people | food 4, ammo 20/person | Few in number. Self-defense of stronghold entrances only. Manned by the Eastern Command, the Arc's hereditary rifle guard |
| A-U02 | mechanical-body devotees | L1 | `line` | 30/34/0/0 | `A-B1-01` | — | none (0) | 5 people, mechanical body | food 3, battery 3 | Strong and cold-hardy. Command-input, so slow to react (order delay x1.5) |
| A-U03 | insect scouts | L1 | `skirm` | 0/6/0/24 | `A-X1-01` | — | none (0) | 2 people | battery 1 | Scouts with remote-steered insects (recon grade +1). No combat power |
| A-U04 | net capture team | L1 | `antidrone` | 6/10/0/12 | `A-S1-02` | — | none (0) | 3 people, nets | food 3 | Brings drones down and takes them alive as material for taming |
| A-U05 | electronic warfare cell | L2 | `ew` | 0/8/0/0 | `A-W2-01`, `A-W2-02` | — | Arc-held (0) | 3 people, access range | battery 4 | Switches off other factions' equipment that carries Arc software (tank fire control, drones, medical robots, air defense). Each use lowers the other side's trust and raises its motive to strip the software out |
| A-U06 | tamed drone swarm | L3 | `drone` | 35/6/0/20 | `A-X3-01` | salvaged M8 | Arc-held (0) | salvage (M8), control module | power 6 | Old swarms captured and fitted with control modules. Cannot be replenished; they dwindle with use |
| A-U07 | woken logistics robots | L3 | `machine` | 15/40/0/0 | `A-X3-02` | salvaged M5 | Arc-held (0) | salvage (M5) | power 4 | Workers and moving barriers. The Arc cannot repair them, so they keep dwindling |
| A-U08 | woken sentry post | L3 | `emplacement` | 50/60/0/10 | `A-X3-03` | salvaged M6 | Arc-held (0) | salvage (M6) | power 3 | Switches the blockade watch net back on. It can fire at anyone passing (risk of losing control) |
| A-U09 | shutdown keyholders | L4 | `command` | 0/8/0/0 | `A-W3-03`, `A-W2-01` | — | Arc-held (0) | 2 people | power 2 | Holds the shutdown and joint keys of ancient weapons. The unit that makes license contracts with other factions |
| A-U10 | woken UGV | L4 | `machine` | 70/120/0/0 | `A-X4-04` | salvaged M7, Government depot (for repair) | Arc-held (0) | salvage (M7) | power 8 | The Arc can wake it but not repair it. Repair needs a Government depot contract |
| A-U11 | neural-direct mechanical elite | L5 | `special` | 50/45/10/0 | `A-B5-02` | doctor | Arc-held (0) | Free City doctor, mechanical body | battery 4, medical 1 | Mechanical bodies moved by thought. Needs surgery by a Free City doctor (won over, captured or contracted) |

## Units Derived from Roaming Machines

These are units made from old machines roaming the city, captured, salvaged and tamed. No faction can complete them alone: they need capture (people), repair (hardware), signal check (Arc) and thought control (Free City doctors). They cannot be replenished and dwindle with use. They wear the sash of the faction that fields them.

| ID | Unit | Tier | Class | Damage/toughness/pursuit/screen | Weapons and equipment | Requires | Software (backdoor) | Cost | Upkeep | Role |
|---|---|---|---|---|---|---|---|---|---|---|
| R-U01 | cargo service robot | L1 | `support` | 0/20/0/0 | `R-X1-07` | salvaged M1 | none (0) | capture | power 1 | Carries supplies (+1 supply day). Low risk; anyone can capture it |
| R-U02 | stabilized quadruped | L2 | `mounted` | 30/40/10/10 | `R-X2-01` | salvaged M2, Arc key (manual and degraded without) | licensed (1) | salvage (M2), maintenance, Arc check | battery 8 | Capture (people) + repair (hardware) + signal check (Arc). Riders use commands; a neural pilot rates higher |
| R-U03 | converted UGV | L3 | `machine` | 60/110/0/0 | `R-X3-02` | salvaged M7, Arc key (manual and degraded without) | licensed (2) | salvage (M7), fuel | fuel 8 | Salvage + repair + Arc key. How complete it is differs by faction |
| R-U04 | searchlight insect-drones | L3 | `drone` | 10/4/0/24 | `R-X3-03` | salvaged M12, Arc key (manual and degraded without) | licensed (0) | salvage (M12) | power 3 | Searches in the dark. Its light raises the risk that being seen brings them in (exposure +2) |
| R-U05 | hydraulic siege machine | L4 | `siege` | 0/90/0/0 | `R-X4-04` | salvaged M13 | none (0) | salvage (M13), hydraulics | hydraulics 8 | Smashes shutters and blast doors (heavy barrier damage). Hydraulic maintenance by the Government and the Free Cities |
| R-U06 | woken air-defense | L4 | `emplacement` | 85/80/0/0 | `R-X4-05` | salvaged M11, Arc key, Government depot | Arc-held (3) | salvage (M11), contract | power, license | Government hardware + Arc software + shutdown device (Arc). No one can use it alone |
| R-U07 | revived armored locomotive | L5 | `rail` | 60/200/0/0 | `R-X5-06` | salvaged M14, Government depot, Arc key | Arc-held (3) | salvage (M14), technicians, Arc key | fuel 20 | The only war machine on the rails. Restoration (Government or Free City technicians) + waking (Arc) |

## Weapons and Equipment

### Government

| Code | Name | Unlock | Note |
|---|---|---|---|
| `G-C4-01` | fire-control terminal (Arc-licensed) | L4 | Normalizes precision-weapon accuracy. Backdoor risk 2 |
| `G-D4-01` | restored military surveillance drone | L4 | Airframe from Government depots; flight control needs the Arc key |
| `G-E2-01` | hydraulic cutter and charges | L2 | Breaches shutters and blast doors |
| `G-H1-01` | first-aid kit | L1 | There are hospitals but no doctors, so first aid only |
| `G-M2-01` | squad machine gun | L2 | Suppressive fire; heavy ammunition use |
| `G-M2-02` | 81 mm mortar | L2 | Indirect fire. Needs officer fire direction |
| `G-S1-01` | service rifle (K2-pattern, restored) | L1 | Parts made at the depots; compatible ammunition is self-supplied |
| `G-S1-02` | bayonet and baton | L1 | Close-combat profile when ammunition is 0 |
| `G-S1-03` | riot shield | L1 | Patrol shield squad |
| `G-T3-01` | recoilless rifle | L3 | Anti-armor and anti-machine |
| `G-V2-02` | rail motorcar | L2 | Underground track mobility; battery |
| `G-V3-01` | restored tracked APC | L3 | Fuel, lubricant and track maintenance |
| `G-V4-01` | restored main battle tank | L4 | Without an Arc license the fire-control computer is replaced by hand aiming |
| `G-V4-02` | self-propelled artillery | L4 | Firing-data software needs an Arc license |
| `G-X4-01` | restored air-defense battery | L4 | A joint weapon: Government hardware and Arc software |
| `G-X5-01` | remote-commanded unmanned ground vehicle | L5 | Salvaged returning UGV (M7) + remote command by an officer + Arc key |

### Free Cities

| Code | Name | Unlock | Note |
|---|---|---|---|
| `F-B3-01` | neural control helmet | L3 | A surgically linked pilot steers machines by thought |
| `F-D2-01` | fiber-optic tethered scout drone | L2 | Built in-house from fiber (M9) recovered in fields of unexploded warheads |
| `F-D3-02` | workbench drop drone | L3 | Hand-steered by radio; small charges |
| `F-D5-03` | drone swarm wing | L5 | Swarm control needs Arc software |
| `F-E1-01` | maintenance tools and barricade stock | L1 | Weapon maintenance, barriers |
| `F-H1-01` | medical bag and surgical kit | L1 | A doctor goes along: high wounded return |
| `F-H3-02` | neural-link surgery | L3 | Trains pilots. Risk of paralysis on failure |
| `F-H4-03` | surgical robot | L4 | Needs Arc software. Backdoor risk 3 |
| `F-M2-01` | stock machine gun (fixed) | L2 | Squad-level use needs no officer |
| `F-M3-02` | workshop mortar | L3 | Aimed mostly by experience; lower accuracy without an officer |
| `F-S1-01` | capital-defense stock rifle | L1 | Anyone can handle it thanks to conscript basic training |
| `F-S1-02` | work tools and empty-rifle bayonet | L1 | Militia close combat |
| `F-V1-02` | rail handcar | L1 | Low-noise track transport |
| `F-V2-03` | electric motorbike | L2 | Battery bottleneck |
| `F-V3-01` | capital-defense armored vehicle | L3 | Command penalty without an officer (order delay, no combined fire) |
| `F-V4-01` | capital-defense tank | L4 | Only a fixed battery unless an officer is won over or captured |

### Arc

| Code | Name | Unlock | Note |
|---|---|---|---|
| `A-B1-01` | mechanical body (command-input) | L1 | Order-delay penalty. Strength and cold resistance |
| `A-B5-02` | neural-direct mechanical body | L5 | Needs surgery by a Free City doctor |
| `A-S1-01` | guard rifle | L1 | Few. Self-defense level |
| `A-S1-02` | net launcher | L1 | Captures drones as material for taming |
| `A-W2-01` | shutdown signal emitter | L2 | Switches off others' equipment that carries Arc software. Each use lowers trust |
| `A-W2-02` | control module | L2 | Implanted into old machines to turn them toward the Arc |
| `A-W3-03` | joint key terminal | L3 | The physical key that lends a license to others (replaces the old "protocol card" idea) |
| `A-X1-01` | remote-steered insects | L1 | Micro reconnaissance |
| `A-X3-01` | tamed drone swarm | L3 | Cannot be replenished; dwindles with use |
| `A-X3-02` | woken logistics robot crew | L3 | Workers and barriers. Cannot be repaired |
| `A-X3-03` | woken unmanned sentry post | L3 | Restarts the blockade watch net |
| `A-X4-04` | woken returning UGV | L4 | Repair needs Government hardware |

### Roaming-Machine Derived

| Code | Name | Unlock | Note |
|---|---|---|---|
| `R-X1-07` | cargo service robot | L1 | Service robot (M1) |
| `R-X2-01` | stabilized quadruped machine | L2 | Capture of an inspection robot (M2) + repair + signal check |
| `R-X3-02` | converted unmanned ground vehicle | L3 | Returning UGV (M7) |
| `R-X3-03` | searchlight insect-drones | L3 | Lantern Ant (M12) |
| `R-X4-04` | hydraulic siege heavy machine | L4 | Iron Dinosaur (M13) |
| `R-X4-05` | woken air-defense battery | L4 | Air-defense system (M11), a joint weapon |
| `R-X5-06` | revived armored locomotive | L5 | Armored locomotive (M14). Hardware restoration by Government or Free City technicians |

## Tech Trees

The higher the tier, the more a faction needs from outside itself (officers, doctors, Arc software, salvaged roaming machines). Each faction's L4 is a fork: accept what others hold and bear its price (backdoors, leaks), or hold out in manual or degraded mode.

### Government

| Tier | Name | Opens | Unlock condition | Weapon codes | Units |
|---|---|---|---|---|---|
| L1 | Service army | Service rifles, shields, officer command, first aid, depots | Start | `G-S1-01`, `G-S1-03`, `G-H1-01` | G-U01, G-U02, G-U03, G-U04 |
| L2 | Firepower restored | Machine guns, mortars, breaching engineers, rail motorcar | Depots running + an officer command team | `G-M2-01`, `G-M2-02`, `G-E2-01`, `G-V2-02` | G-U05, G-U06, G-U07, G-U08 |
| L3 | Mobility restored | Armored carriers, anti-machine recoilless guns | 120 days of fuel stock + one large machine destroyed | `G-V3-01`, `G-T3-01` | G-U09, G-U10 |
| L4 | Advanced weapons (license fork) | Tanks, self-propelled guns, air defense, surveillance drones | Arc license contract (fire-control terminal) or manual mode (-40% hit, no drones or air defense). Air defense also needs a restored air-defense system (M11) | `G-V4-01`, `G-V4-02`, `G-C4-01`, `G-X4-01`, `G-D4-01` | G-U11, G-U12, G-U13, G-U14 |
| L5 | War that spares people | Remote-commanded unmanned vehicles | Salvaged returning UGV (M7) + officer + Arc key. Or win over Free City doctors to improve wounded return (medical fork) | `G-X5-01` | G-U15 |

### Free Cities

| Tier | Name | Opens | Unlock condition | Weapon codes | Units |
|---|---|---|---|---|---|
| L1 | City of conscripts | Conscript rifles, militia, doctor-led aid, maintenance, rail handcar | Start | `F-S1-01`, `F-S1-02`, `F-H1-01`, `F-E1-01`, `F-V1-02` | F-U01, F-U02, F-U03, F-U04, F-U08 |
| L2 | Opening the CDC stores | Fixed machine guns, tethered drones, electric motorbikes | Secure a Capital Defense Command equipment store + recovered fiber (M9) | `F-M2-01`, `F-D2-01`, `F-V2-03` | F-U05, F-U06, F-U07 |
| L3 | Arms without officers | Workshop mortars, armored vehicles, drop drones, neural-link surgery | Run under the no-officer penalty. Neural surgery needs 2 doctors + a successful trial | `F-M3-02`, `F-V3-01`, `F-D3-02`, `F-H3-02`, `F-B3-01` | F-U09, F-U10, F-U11, F-U14 |
| L4 | Officers and software (two forks) | CDC tanks, surgical-robot field hospital | Tank maneuver needs an officer won over, captured or defected (from the Government). The surgical robot needs an Arc license (backdoor risk 3) | `F-V4-01`, `F-H4-03` | F-U12, F-U13 |
| L5 | Machines moved by thought | Neural-direct quadruped troop, drone swarm | Capture of an inspection robot (M2) + surgically linked pilot. Swarm control needs Arc software | `F-D5-03`, `R-X2-01` | F-U15 |

### Arc

| Tier | Name | Opens | Unlock condition | Weapon codes | Units |
|---|---|---|---|---|---|
| L1 | Minimal self-defense | Guard rifles, command-input mechanical bodies, insect scouts, net capture | Start | `A-S1-01`, `A-B1-01`, `A-X1-01`, `A-S1-02` | A-U01, A-U02, A-U03, A-U04 |
| L2 | The hand that switches | Shutdown signal emitter, control module | Data-center access. Works only where Arc software is inside the other side's equipment | `A-W2-01`, `A-W2-02` | A-U05 |
| L3 | Taming old machines | Tamed drone swarm, logistics robots, sentry posts | Net capture and salvage (M8, M5, M6) + control-module implant. Cannot be replenished | `A-X3-01`, `A-X3-02`, `A-X3-03`, `A-W3-03` | A-U06, A-U07, A-U08 |
| L4 | License diplomacy | Shutdown keyholders, woken unmanned vehicle | Joint-key contracts put Arc software into Government and Free City equipment. Repairing the vehicle needs a Government depot contract | `A-X4-04` | A-U09, A-U10 |
| L5 | The body that thinks | Neural-direct mechanical elite | A Free City doctor won over, captured or contracted (surgery) | `A-B5-02` | A-U11 |

### Roaming-Machine Derived

| Tier | Name | Opens | Unlock condition | Weapon codes | Units |
|---|---|---|---|---|---|
| L1 | Picking up | Service robot | Capture only | `R-X1-07` | R-U01 |
| L2 | Stabilizing | Stabilized quadruped | Capture (people) + repair (hardware) + signal check (Arc) | `R-X2-01` | R-U02 |
| L3 | Conversion | Unmanned ground vehicle, searchlight drones | Salvage + repair + Arc key | `R-X3-02`, `R-X3-03` | R-U03, R-U04 |
| L4 | Large machines | Hydraulic siege machine, woken air defense | Hydraulic and power maintenance + joint key | `R-X4-04`, `R-X4-05` | R-U05, R-U06 |
| L5 | War machine | Revived armored locomotive | Skills of all three factions (restoration, repair, waking) | `R-X5-06` | R-U07 |

## Cross-Faction Dependencies

| Unlock source | Giver to receiver | What it opens | How it is obtained | Risk |
|---|---|---|---|---|
| Officers | Government to Free Cities | Free City L4 tank maneuver; lifts the mortar and armored-vehicle penalties | Recruitment, defection, capture | A captured officer's loyalty is tested; a defector becomes a target of Government reprisal |
| Doctors (surgery, neural link) | Free Cities to Government and Arc | Higher Government wounded return (L5 medical fork); Arc L5 neural-direct elite | Contract, recruitment, capture | When doctors leave, the Free Cities' staying power weakens |
| Arc software license | Arc to Government and Free Cities | Government L4 fire control, drones, air defense; Free City L4 medical robots and L5 drone swarms | Joint-key contract | Backdoor: the Arc can switch it on and off. Using it lowers trust and raises the motive to strip it out |
| Government hardware and depots | Government to Arc | Arc L4 unmanned-vehicle repair; the joint air-defense weapon | Maintenance contract | The Government sees the inside of the Arc's machines |
| Original seed stock | Government to Free Cities | The food ceiling (the Free Cities' weapons are people and food) | Trade, seizure | Not a unit unlock but a ceiling on upkeep |
| Salvaged roaming machines | The map to anyone | All roaming-machine units, Arc L3 and L4, Government L5, Free City L5 | Capture (people), repair (hardware), signal check (Arc), thought control (doctors) | Cannot be replenished; an Arc signal may remain inside |

## Degraded Modes

A unit that lacks its requirements runs as follows (values proposed).

| Situation | Effect |
|---|---|
| No officer | Order delay x2, no combined fire, mortar hit -30%. A Free City tank becomes an immobile fixed battery |
| No Arc key | Precision weapons are aimed by hand at -40% hit. Drones and air defense cannot run |
| Command-input mechanical body | Order delay x1.5 |

## Counters and Upkeep

There is no rock-paper-scissors loop. The top of the ladder (artillery, air defense, tanks) is broken not by counters but by dependency: it stops when it loses its officer, runs out of fuel, or the Arc switches it off. Electronic warfare (`ew`) and siege (`siege`) are effects rather than counters, so they are left out of the loop check. Weight 1.0 means strong, 0.5 weak.

| Attacking class | Target | Weight |
|---|---|---|
| `rifle` | `line` | 1.0 |
| `rifle` | `skirm` | 0.5 |
| `guard` | `rifle` | 1.0 |
| `heavy` | `guard` | 1.0 |
| `heavy` | `line` | 0.5 |
| `mounted` | `heavy` | 1.0 |
| `mounted` | `skirm` | 1.0 |
| `antiarmor` | `vehicle` | 1.0 |
| `antiarmor` | `machine` | 1.0 |
| `vehicle` | `mounted` | 1.0 |
| `vehicle` | `heavy` | 0.5 |
| `artillery` | `emplacement` | 1.0 |
| `artillery` | `antiarmor` | 0.5 |
| `drone` | `heavy` | 1.0 |
| `drone` | `antiarmor` | 0.5 |
| `antidrone` | `drone` | 1.0 |
| `emplacement` | `drone` | 1.0 |
| `ew` | licensed or Arc-held equipment | 1.0 |
| `machine` | `guard` | 1.0 |
| `siege` | barriers (shutters) | 1.0 |

| Resource | Government | Free Cities | Arc |
|---|---|---|---|
| Food | Stable thanks to the original seed stock | Uses the most (people are the weapon). Capped without seed | Little (few people) |
| Ammunition and fuel | Self-supplied from depots. Tanks eat fuel | Draws down CDC stockpiles | Almost none |
| Medicine and medical care | First-aid kits only | Doctors turn medicine into people | Mechanical bodies are maintained with power |
| License | Needed for every L4 precision weapon | Medical robots, drone swarms | Lends it out (leverage) |
| Salvaged machines | Shrink with use | Shrink with use | Shrink with use (most dependent) |

## Mapping to the Game's Battle Rules

Where an existing battle-rule field fits, it is used; where there is a gap, a new field is proposed. All values are proposals.

| v4 concept | Existing field | Proposed value | Status |
|---|---|---|---|
| Wounded return by faction | `casualties.soft_to_hard_main` (now 0.3, shared) | Government 0.7, Free Cities 0.15, Arc 0.5; -0.1 to -0.2 with a medical unit | Field exists, no faction branch |
| Replenishment rate | `campaign_feedback.reinforce_monthly` (levy 0.03, standing 0.1) | Free Cities 0.05 (conscription), Government 0.1 (standing), Arc 0.02 | Field exists |
| Food and supply | `advantage.supply` (0/-10/-25), supply days | Free Cities without seed: supply-day cap -30% | Field exists |
| Officer command | `commander_martial_term`, `order` term | Without an officer, `order` -10 and no combined heavy-weapon fire | No combined-fire field |
| Weapon accuracy | `sim.ranged.hit_base` 0.16, `damage` 35 | Per-weapon `hit_base`; manual mode x0.6 | No per-weapon rows |
| Shutters | `war_types.siege.shutter_level` (Government 3, Arc 1, Free Cities 0) | Hydraulic siege machines and breaching engineers lower the level | Field exists |
| Backdoor shutdown | None | Units with backdoor risk 3 face a shutdown check when an Arc EW cell is in range; each use is `license.trust` -1 | New field |
| License trust | None | 0 to 3 per faction pair, rising and falling with contracts and use | New field |
| Drone reconnaissance | None | Recon grade +1 to +2 (fog-clearing radius) | New field |
| Salvaged machine stock | None | `salvage_stock[M#]`, replenishment 0 | New field |
| Medicine | None | `upkeep.med`; when short, the medical bonus is 0 | New field |

Check: in the existing example where the Government wins 154 to 141 over the Free Cities, the new return rates turn the same 40 soft casualties into 28 hard for the Government and 6 hard for the Free Cities. The Government wins the battle, but a month later the Free Cities have more troops left.

## Undecided and Proposed

- Why doctors are only in the Free Cities and officers only in the Government: undecided. Once the scenario device is set, the odds and costs of recruitment, defection and capture will be retuned. For now all three means stay open.
- Wounded return rates (Government 0.3, Free Cities 0.85, Arc 0.5) and all combat values, costs and upkeep are proposed values.
- Reach of the Arc shutdown signal: this page limits it to equipment carrying Arc software and tamed machines (proposal).
- Whether a Free City tank without an officer is a fixed battery, or mobile with order delay x3: still a proposal.
- Treating the four-legged mount as a shared (R-series) unit: a proposal.
- The neural-direct mechanical elite (A-U11) is a body moved by a person's thought, not a machine that thinks for itself.
- The searchlight insect-drones and the hydraulic siege machine come from the Lantern Ant and the Iron Dinosaur in the ecology compendium. Whether the game's display names use those names is not decided.
- The original seed stock is used only as a food ceiling, not as a unit unlock (proposal).

## Related Pages

- [The Cost Structure of the Three Factions](/wiki/Cost-Structure/)
- [The Arms and Technology of This Era](/wiki/Era-Arms-and-Tech-Level/)
- [Lost Technology](/wiki/Lost-Technology-Lineage/)
- [People and Machines](/wiki/People-and-Machines/)
- [Ecology and variant bestiary](/wiki/Hostile-Ecology-Index/)
- [The Three Factions of Seoul](/wiki/Sixteen-States/)
