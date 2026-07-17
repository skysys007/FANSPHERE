import json

d = json.load(open('mock_halftime_rush.json'))
print(f"Frames: {len(d)}")
c = t = 0
for f in d:
    for z in f['zones']:
        t += 1
        if z['status'] == 'CRITICAL':
            c += 1
        if z['occupancy_pct'] > 85:
            ok = z['speed_ms'] < 0.15 and z['congestion_pct'] > 70
            sym = 'OK' if ok else 'FAIL'
            print(f"  {sym} {f['timestamp']} {z['zone_name']} occ={z['occupancy_pct']}% spd={z['speed_ms']} cong={z['congestion_pct']}%")
print(f"Total zone updates: {t}, Critical: {c}, Ratio: 1 in {round(t/c) if c else 'N/A'}")
