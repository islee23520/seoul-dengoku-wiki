# Station Strongholds and Five Expansion Stages (Provisional)

Every number and name in this document is **provisional**. Nothing here is canon until the owner approves it. Historical fortification names (the barbican, Vauban, Pavlov's House and so on) are design lenses only; they are not used in the wiki articles or on the stronghold pages.

- Generator: `tools/station-floorplan/generator/` (`perimeter.py`, `compose.py`; stage arithmetic in `stages.py` and terrain reading in `terrain_read.py` in the working folder)
- Public data: `data/sql/130-strongholds.sql` (written by `export_site.py` from the 307 station sheets)
- Public pages: [Station Strongholds](/wiki/strongholds/)

## 1. Why the circular perimeter was dropped

The first generator drew a circle of 110-200 m radius around each station. A circle encloses the most area per metre of wall only when a new wall is built on empty flat ground. A city is different.

- Existing building faces, walls, railway embankments and levees are wall material already standing.
- What has to be held is not the whole perimeter but the gaps between them (the Aurelian Walls: the sum of the gaps).
- Fewer than 1% of Korean walled towns were square forts on flat ground; the Seoul city wall followed the ridges.
- The perimeter is set by the number of people who can hold it. The Bekan ditch needed 26-32 people per 100 m; the Anglo-Saxon Burghal Hidage rule was 4 people per 5 m.

## 2. Principles taken from the research

1. **Let the terrain draw the line.** Join ridges, rivers and embankments, and close only the gaps.
2. **Water and air must be inside.** Namhansanseong had some 80 wells; the Japanese fort at Ulsan had none and could not hold. Air intakes and water tanks stay inside the line.
3. **The weakest gate decides the fort.** Unused gates are closed; gates in use get a double door (an airlock, after the Korean ongseong barbican).
4. **People live below ground.** The surface line is a lure and an alarm; people live underground (Ruapekapeka). A metro station already works this way.
5. **Headcount sets the perimeter.** A ring nobody can man collapses (Constantinople 1453, Mosul).
6. **The fort comes after the village.** Stages rise under population pressure and shocks.
7. **Section responsibility.** The Seoul city wall was split into 97 sections named after the Thousand Character Classic, each assigned to a group. Every section of the line has a family or crew responsible for it.
8. **What is seen is attacked.** Watchtowers are high but dark. A frozen river becomes a road in winter, so it needs an ice watch.

## 3. Reading the terrain (measured per station)

`terrain_read.py` measures a 300 m radius around each station: elevation (S-Map 3D building base and roof heights, a 1 m DEM), the 1:1000 digital topographic map (rivers, rail land, cuts and fills, levees, walls, road surfaces, building floors and use), the S-Map indoor models (underground floor area and depth), entrances and underpasses.

| Type | Test | How the line uses the ground |
|---|---|---|
| Ridge | Relief of 20 m or more, or a share of steep slope | Follows the ridge; the highest building is the watchtower and the slope is the cleared strip |
| Riverside | River surface within 250 m | The river is the moat on one side, the embankment is the wall, bridges and sewer outlets are gates; ice watch in winter |
| Rail embankment | Rail land and cuts or fills | The embankment is the wall; underpasses and the space under rail bridges are gates |
| High-rise block | Share of buildings of 10+ floors, coverage | Building faces are the wall; lower windows are blocked and rooftops are watchtowers |
| Apartment estate | Estate area and estate walls | The estate wall is the inner wall and the main gate is the gate |
| Alley warren | Share of small low-rise buildings | A few alley mouths stay open; the rest are blocked into a maze of dead ends |
| Flat ground | Low coverage and wide roads | Banks and ditches have to be built; wide roads are kept as a field of fire |

The top two tags of each station add terrain sentences to stages 3-5. Across the 307 stations: alley warren 108, apartment estate 105, high-rise block 35, ridge 30, rail embankment 12, riverside 11, flat ground 6.

## 4. Drawing the surface line (stage 4)

1. **Core:** only the entrances in use and the air intakes. Hidden entrances are deliberately left outside.
2. **Blocks:** real city blocks, i.e. the topographic map minus road surfaces, rail land and rivers. Blocks over 2,000 m² are split on a 60 m grid.
3. **Growth:** blocks are added in order of "value added ÷ extra watch cost". Growth stops at the watch budget (mobilisable people minus the underground posts), an area cap set by population, or a 280 m radius. The line must stay one piece.
4. **Classification:** the line is sampled every 2 m. Building faces and walls weigh 0.5, natural barriers (river, railway, levee, embankment, bridge) 0.25, gaps to fill and street barricades 1.0.
5. **Buffer:** a 40 m strip outside the line is kept clear.
6. **Watchtowers:** `ceil(weighted length ÷ 200)`, placed on the buildings with the highest measured roofs inside the line.
7. **Arc:** no surface line. Stage 4 is a deep-level seal.

## 5. The five stages

| Stage | Name | Floor / air / water per person | Reserves (food, water) | Duration |
|---|---|---|---|---|
| 1 | Entrance Post | 1.5 m² / 3 m³/h / 5 L | 14 days, 3 days | A few hours to 3 days |
| 2 | Concourse Stronghold | 3.5 / 6 / 7.5 | 60, 7 | 2 weeks to 3 months |
| 3 | Station Precinct Defence | 5.5 / 12 / 15 | 120, 14 | 6 months to 3 years |
| 4 | Surface Perimeter Line (Arc: Deep-Level Seal) | 8 / 25 / 20 | 180, 30 | 3 to 10 years |
| 5 | Inter-Station Defence Network | 10 / 25 / 25 | 365, 60 | 10 to 30 years |

```
capacity          = min(floor / floor per person, air supply / air per person, water / water per person)
overcrowd limit   = total floor / 3.5 m2
air supply        = vents x 4 m2 x 1 m/s x 3600   [estimated shaft area and draught]
standing watch    = shift factor (Government 4.5, Free City and Arc 4) x posts + patrols of sealed entrances
emergency watch   = 4 x (used and hidden entrances + tunnel cut points) + arms factor x weighted surface line + 0.02 x population
mobilisable       = 0.20 (Government) / 0.27 (Free City) / 0.30 (Arc) x population
```

- Floor: the station's measured underground floor (S-Map). From stage 4, basements of buildings inside the line (basement floors x footprint x 0.7); in stage 5, 300 m x 9 m of tunnel toward each neighbour [estimated].
- When the emergency watch exceeds the mobilisable force, the stage is "not defensible".
- Starting stage in 2126: stage 3 by default; large interchanges start at 4 when stage 4 is defensible; surface, elevated and terminal stations start at 2; under 40 people start at 1. Across the 307 stations: stage 3 250, stage 2 50, stage 4 7.
- Growth and decline: stages rise with shocks and population pressure. Losing 30% of the population or running out of reserves drops one stage, abandoning the outermost ring first. A ring that was abandoned costs half the work to rebuild.

## 6. Faction differences

| | Government | Free City | Arc |
|---|---|---|---|
| Raising a stage | District orders and corvée labour, one standard plan | Each guild builds its own section with its own money | The steward's order |
| Stage 4 | Wide buffer; people outside the register live in the strip | Narrow perimeter, apartment strongholds, surface workshops and greenhouses | Deep-level seal, camouflaged surface entrances |
| Stage 5 | Radial, spreading from the large interchanges; deep stations as shelters | A mesh of equal stations | One mass joining the deep lines |
| Weakness | People outside the register are abandoned | Weak stations are holes in the mesh | Short of air and water; tuberculosis risk |

## 7. Open owner questions

1. **How common are guns in 2126 (arms factor)?** Currently Government 0.2, Free City 0.3, Arc 0.4. At 0.8 (mostly melee weapons) most ordinary stations cannot hold stage 4.
2. **Heating surface facilities.** A taboo, or only a cost?
3. **Living in the running tunnels (stage 5 floor).** Allowing it raises capacity by 20-40%.
4. **The five stage names.** The Korean names need a dictionary check and the English names need confirmation.

## 8. Evidence grades

- Most figures in the four research notes (East Asia; Europe, Middle East and Africa; the Americas, Oceania and modern cities; growth stages and capacity) are excerpt grade. They must be checked against the original sources before any number moves into the world text.
- Per-station inputs are measured. The air shaft area and draught, tunnel width and length, and the usable share of basements are estimates.
