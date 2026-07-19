#!/usr/bin/env python3
"""Generate mock_halftime_rush.json with strict uniqueness and realism constraints."""
import json, random

random.seed(42)

def unique_float(used, lo, hi, decimals=1):
    """Generate a unique float not in `used` within [lo, hi]."""
    for _ in range(500):
        v = round(random.uniform(lo, hi), decimals)
        if v not in used:
            used.add(v)
            return v
    raise ValueError(f"Cannot find unique value in [{lo},{hi}]")

def seating_congestion(occ_pct, used):
    """Congestion = (Occupancy * 0.05) + random(0.1, 1.5), clamped 1.1-4.9, unique."""
    for _ in range(500):
        base = occ_pct * 0.05
        noise = random.uniform(0.1, 1.5)
        v = round(base + noise, 1)
        v = max(1.1, min(4.9, v))
        if v not in used:
            used.add(v)
            return v
    raise ValueError("Cannot find unique seating congestion")

# Zone templates per frame
frames_cfg = [
    {
        "timestamp": "T+00:00", "phase": "halftime_start",
        "gates":      {"occ": [(40,46),(36,41),(33,38),(28,33),(25,30)], "cong_base": (8,22), "spd": (1.0,1.5), "inflow": (100,350), "outflow": (30,90)},
        "concourses": {"occ": [(52,58),(45,51),(37,43)], "cong_base": (12,25), "spd": (0.8,1.2), "inflow": (200,430), "outflow": (150,200)},
        "amenities":  {"occ": [(57,63),(52,58),(47,53)], "cong_base": (18,32), "spd": (0.6,0.9), "inflow": (280,540), "outflow": (100,210)},
        "seating":    {"occ": [(90,96),(91,97),(88,94)], "spd": (0.03,0.06), "inflow": (5,15), "outflow": (150,210)},
    },
    {
        "timestamp": "T+02:00", "phase": "halftime_surge",
        "gates":      {"occ": [(75,82),(69,76),(62,69),(55,62),(49,56)], "cong_base": (22,58), "spd": (0.3,0.9), "inflow": (280,700), "outflow": (70,190)},
        "concourses": {"occ": [(79,85),(72,79),(69,75)], "cong_base": (45,68), "spd": (0.25,0.5), "inflow": (480,770), "outflow": (240,320)},
        "amenities":  {"occ": [(85,91),(79,85),(82,88)], "cong_base": (62,80), "spd": (0.1,0.22), "inflow": (580,870), "outflow": (140,230)},
        "seating":    {"occ": [(55,62),(52,59),(57,64)], "spd": (0.03,0.06), "inflow": (8,20), "outflow": (340,430)},
    },
    {
        "timestamp": "T+04:30", "phase": "halftime_peak",
        "gates":      {"occ": [(90,97),(85,92),(77,84),(67,74),(59,66)], "cong_base": (30,94), "spd": (0.04,0.7), "inflow": (330,970), "outflow": (100,170)},
        "concourses": {"occ": [(92,98),(82,89),(88,95)], "cong_base": (70,96), "spd": (0.03,0.18), "inflow": (750,940), "outflow": (160,340)},
        "amenities":  {"occ": [(95,99),(91,96),(93,98)], "cong_base": (88,98), "spd": (0.01,0.08), "inflow": (870,990), "outflow": (50,110)},
        "seating":    {"occ": [(32,39),(29,36),(35,42)], "spd": (0.03,0.06), "inflow": (3,10), "outflow": (12,28)},
    },
    {
        "timestamp": "T+07:00", "phase": "halftime_plateau",
        "gates":      {"occ": [(82,89),(75,82),(69,76),(57,64),(52,59)], "cong_base": (25,78), "spd": (0.12,0.85), "inflow": (280,720), "outflow": (230,300)},
        "concourses": {"occ": [(85,92),(77,84),(79,87)], "cong_base": (58,82), "spd": (0.08,0.3), "inflow": (530,700), "outflow": (330,400)},
        "amenities":  {"occ": [(93,98),(87,93),(85,91)], "cong_base": (75,96), "spd": (0.02,0.14), "inflow": (380,470), "outflow": (170,260)},
        "seating":    {"occ": [(35,42),(32,39),(37,44)], "spd": (0.03,0.06), "inflow": (12,28), "outflow": (6,15)},
    },
    {
        "timestamp": "T+10:00", "phase": "halftime_return",
        "gates":      {"occ": [(57,64),(52,59),(47,54),(42,49),(37,44)], "cong_base": (13,35), "spd": (0.6,1.15), "inflow": (110,270), "outflow": (370,500)},
        "concourses": {"occ": [(89,96),(75,82),(85,92)], "cong_base": (52,92), "spd": (0.05,0.38), "inflow": (680,870), "outflow": (400,520)},
        "amenities":  {"occ": [(72,79),(67,74),(62,69)], "cong_base": (38,55), "spd": (0.35,0.55), "inflow": (170,220), "outflow": (460,540)},
        "seating":    {"occ": [(69,76),(65,72),(67,74)], "spd": (0.03,0.06), "inflow": (340,400), "outflow": (12,24)},
    },
    {
        "timestamp": "T+13:30", "phase": "halftime_end",
        "gates":      {"occ": [(27,34),(22,29),(19,26),(17,24),(14,21)], "cong_base": (3,12), "spd": (1.2,1.55), "inflow": (30,90), "outflow": (25,65)},
        "concourses": {"occ": [(52,59),(45,52),(47,55)], "cong_base": (15,24), "spd": (0.8,1.05), "inflow": (230,320), "outflow": (310,370)},
        "amenities":  {"occ": [(37,44),(34,41),(32,39)], "cong_base": (8,17), "spd": (0.9,1.15), "inflow": (60,100), "outflow": (300,370)},
        "seating":    {"occ": [(87,94),(89,96),(85,92)], "spd": (0.03,0.06), "inflow": (170,260), "outflow": (4,12)},
    },
]

gate_names = ["FANSPHERE Gate", "AMEX Gate", "Verizon Gate", "HCLTech Gate", "Moody's Gate"]
concourse_names = ["Concourse 101", "Concourse 201", "Transit Hub 140"]
amenity_names = ["Food Court 115", "Food Court 132", "Restroom Area 110"]
seating_names = ["Section 102", "Section 105", "Section 118"]

def status_for(occ, cong, ztype):
    if ztype == "seating":
        return "COMFORTABLE"
    if occ > 88 and cong > 85:
        return "CRITICAL"
    if occ > 65 or cong > 40:
        return "MODERATE"
    return "COMFORTABLE"

def speed_for_occ(occ, spd_range):
    """Inverse correlation: higher occ → lower speed within range."""
    lo, hi = spd_range
    t = max(0, min(1, (occ - 20) / 80))  # normalize occ 20-100 → 0-1
    return round(hi - t * (hi - lo), 2)

output = []

for fc in frames_cfg:
    zones = []
    used_occ = {"gate": set(), "concourse": set(), "amenity": set(), "seating": set()}
    used_cong = {"gate": set(), "concourse": set(), "amenity": set(), "seating": set()}

    # Gates
    gc = fc["gates"]
    for i, name in enumerate(gate_names):
        occ = unique_float(used_occ["gate"], *gc["occ"][i])
        cong = unique_float(used_cong["gate"], *gc["cong_base"])
        spd = speed_for_occ(occ, gc["spd"])
        infl = round(random.uniform(*gc["inflow"]), 1)
        outfl = round(random.uniform(*gc["outflow"]), 1)
        st = status_for(occ, cong, "gate")
        zones.append({"zone_name": name, "type": "gate",
                       "occupancy_pct": occ, "congestion_pct": cong,
                       "speed_ms": spd, "inflow_m": infl, "outflow_m": outfl, "status": st})

    # Concourses
    cc = fc["concourses"]
    for i, name in enumerate(concourse_names):
        occ = unique_float(used_occ["concourse"], *cc["occ"][i])
        cong = unique_float(used_cong["concourse"], *cc["cong_base"])
        spd = speed_for_occ(occ, cc["spd"])
        infl = round(random.uniform(*cc["inflow"]), 1)
        outfl = round(random.uniform(*cc["outflow"]), 1)
        st = status_for(occ, cong, "concourse")
        zones.append({"zone_name": name, "type": "concourse",
                       "occupancy_pct": occ, "congestion_pct": cong,
                       "speed_ms": spd, "inflow_m": infl, "outflow_m": outfl, "status": st})

    # Amenities
    ac = fc["amenities"]
    for i, name in enumerate(amenity_names):
        occ = unique_float(used_occ["amenity"], *ac["occ"][i])
        cong = unique_float(used_cong["amenity"], *ac["cong_base"])
        spd = speed_for_occ(occ, ac["spd"])
        infl = round(random.uniform(*ac["inflow"]), 1)
        outfl = round(random.uniform(*ac["outflow"]), 1)
        st = status_for(occ, cong, "amenity")
        zones.append({"zone_name": name, "type": "amenity",
                       "occupancy_pct": occ, "congestion_pct": cong,
                       "speed_ms": spd, "inflow_m": infl, "outflow_m": outfl, "status": st})

    # Seating — special congestion formula
    sc = fc["seating"]
    for i, name in enumerate(seating_names):
        occ = unique_float(used_occ["seating"], *sc["occ"][i])
        cong = seating_congestion(occ, used_cong["seating"])
        spd = round(random.uniform(*sc["spd"]), 2)
        infl = round(random.uniform(*sc["inflow"]), 1)
        outfl = round(random.uniform(*sc["outflow"]), 1)
        zones.append({"zone_name": name, "type": "seating",
                       "occupancy_pct": occ, "congestion_pct": cong,
                       "speed_ms": spd, "inflow_m": infl, "outflow_m": outfl, "status": "COMFORTABLE"})

    output.append({"timestamp": fc["timestamp"], "phase": fc["phase"], "zones": zones})

# Validate
for frame in output:
    by_type = {}
    for z in frame["zones"]:
        by_type.setdefault(z["type"], []).append(z)
    for ztype, zlist in by_type.items():
        occs = [z["occupancy_pct"] for z in zlist]
        congs = [z["congestion_pct"] for z in zlist]
        assert len(occs) == len(set(occs)), f"Duplicate occ in {ztype} @ {frame['timestamp']}: {occs}"
        assert len(congs) == len(set(congs)), f"Duplicate cong in {ztype} @ {frame['timestamp']}: {congs}"
        if ztype == "seating":
            for z in zlist:
                assert 1.1 <= z["congestion_pct"] <= 4.9, f"Seating cong out of range: {z}"

with open("mock_halftime_rush.json", "w") as f:
    json.dump(output, f, indent=2)

print("OK — generated 6 frames, all uniqueness constraints passed.")
for frame in output:
    crits = [z["zone_name"] for z in frame["zones"] if z["status"] == "CRITICAL"]
    print(f"  {frame['timestamp']} ({frame['phase']}): {len(crits)} CRITICAL zones {crits if crits else ''}")
