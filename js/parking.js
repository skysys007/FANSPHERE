/**
 * @fileoverview Stadium Parking System
 * Handles OpenFreeMap (MapLibre GL JS) initialization, mock occupancy data generation,
 * and UI rendering for the Fan Sphere parking dashboard.
 * @author FAN SPHERE
 */

/**
 * Configuration constants for the parking system.
 * @constant {Object}
 */
const PARKING_CONFIG = {
    MAP_STYLE: 'https://tiles.openfreemap.org/styles/liberty',
    STADIUM_CENTER_LNG_LAT: [-74.0745, 40.8136],
    DEFAULT_ZOOM: 14,
    FOCUS_ZOOM: 16,
    FLY_SPEED: 1.2,
    ANIMATION_DURATION_MS: 2100,
    LOTS: [
        { id: 'lot-e', name: 'Lot E, East Rutherford, NJ 07073, USA', lat: 40.8162, lng: -74.0772, maxCapacity: 2500, price: '$40' },
        { id: 'prepaid-efg', name: 'Prepaid Parking - Lots E/F/G, 1 MetLife Stadium Dr, East Rutherford, NJ 07073, USA', lat: 40.8168, lng: -74.0745, maxCapacity: 1200, price: 'Prepaid' },
        { id: 'lot-f', name: 'Lot F, East Rutherford, NJ 07073, USA', lat: 40.8175, lng: -74.0745, maxCapacity: 3000, price: '$40' },
        { id: 'lot-g17', name: 'Stadium Lot G-17, East Rutherford, NJ 07073, USA', lat: 40.8160, lng: -74.0715, maxCapacity: 4500, price: '$40' },
        { id: 'lot-h', name: 'Lot H, H, East Rutherford, NJ 07073, USA', lat: 40.8150, lng: -74.0700, maxCapacity: 1500, price: '$40' },
        { id: 'lot-j', name: 'New Meadowlands Flea Market (Lot J), Lot J Metlife Stadium, 102 NJ-120, East Rutherford, NJ 07073, USA', lat: 40.8095, lng: -74.0740, maxCapacity: 1500, price: '$60' },
        { id: 'lot-k', name: 'Lot K, K, 1 American Way Level 2, Court C, East Rutherford, NJ 07073, USA', lat: 40.8090, lng: -74.0725, maxCapacity: 1600, price: '$40' },
        { id: 'lot-l', name: 'Lot L, East Rutherford, NJ 07073, USA', lat: 40.8105, lng: -74.0710, maxCapacity: 800, price: '$120' },
        { id: 'lot-m', name: 'Lot M, East Rutherford, NJ 07073, USA', lat: 40.8125, lng: -74.0790, maxCapacity: 2100, price: '$40' },
        { id: 'lot-p', name: 'Lot P, East Rutherford, NJ 07073, USA', lat: 40.8110, lng: -74.0780, maxCapacity: 1900, price: '$40' },
        { id: 'lot-d', name: 'Lot D, 102 NJ-120, East Rutherford, NJ 07073, USA', lat: 40.8130, lng: -74.0695, maxCapacity: 1800, price: '$40' },
        { id: 'deck-bc', name: 'Parking Deck B/C, East Rutherford, NJ 07073, USA', lat: 40.8145, lng: -74.0685, maxCapacity: 2200, price: '$40' },
        { id: 'ad-deck-d', name: 'American Dream Parking Deck D Gold, 1 American Dream Wy, East Rutherford, NJ 07073, USA', lat: 40.8075, lng: -74.0670, maxCapacity: 3500, price: '$60' },
        { id: 'redds', name: 'Redd\'s Restaurant Parking, 317 Washington Ave, Carlstadt, NJ 07072, USA', lat: 40.8200, lng: -74.0850, maxCapacity: 200, price: '$30' }
    ]
};

/**
 * Manages the stadium parking UI and map integration.
 */
class StadiumParkingManager {
    constructor() {
        /** @type {maplibregl.Map|null} */
        this.map = null;
        /** @type {Array<Object>} */
        this.markers = [];
        /** @type {Array<Object>} */
        this.data = [];
        
        this.isMapLoaded = false;
        this.isMapLoading = false;
        
        this._bindEvents();
        this._generateMockData();
        this._renderSidebar();
    }

    /**
     * Binds DOM events for the parking UI.
     * @private
     */
    _bindEvents() {
        const btnParking = document.getElementById('btn-parking');
        const btnCloseParking = document.getElementById('btn-close-parking');
        const parkingPanel = document.getElementById('parking-panel');
        const parkingList = document.getElementById('parking-list');
        
        if (btnParking && parkingPanel) {
            btnParking.addEventListener('click', () => {
                parkingPanel.classList.remove('hidden');
                this._loadMapLibreAPI();
            });
        }
        
        if (btnCloseParking && parkingPanel) {
            btnCloseParking.addEventListener('click', () => {
                parkingPanel.classList.add('hidden');
            });
        }

        // Event delegation for sidebar clicks to avoid inline HTML handlers
        if (parkingList) {
            parkingList.addEventListener('click', (e) => {
                const card = e.target.closest('.parking-card');
                if (card) {
                    const lotId = card.getAttribute('data-lot-id');
                    if (lotId) this.focusLot(lotId);
                }
            });
        }
    }

    /**
     * Generates mock occupancy data based on static capacities.
     * @private
     */
    _generateMockData() {
        this.data = PARKING_CONFIG.LOTS.map(lot => {
            const occPercent = 0.4 + (Math.random() * 0.58); // 40% to 98%
            const occupied = Math.floor(lot.maxCapacity * occPercent);
            const available = lot.maxCapacity - occupied;
            
            let status = 'Comfortable';
            let statusColor = 'text-emerald-400';
            let barColor = 'bg-emerald-500';
            let pinColor = '#10b981'; // Emerald
            
            if (occPercent > 0.9) {
                status = 'Full';
                statusColor = 'text-red-400';
                barColor = 'bg-red-500';
                pinColor = '#ef4444'; // Red
            } else if (occPercent > 0.75) {
                status = 'Busy';
                statusColor = 'text-amber-400';
                barColor = 'bg-amber-500';
                pinColor = '#fbbf24'; // Amber
            }
            
            return {
                ...lot,
                occupied,
                available,
                occPercent: occPercent * 100,
                status,
                statusColor,
                barColor,
                pinColor
            };
        });
    }

    /**
     * Renders the sidebar list using the current mock data.
     * @private
     */
    _renderSidebar() {
        const listEl = document.getElementById('parking-list');
        if (!listEl) return;
        
        const html = this.data.map(lot => this._createSidebarCardHTML(lot)).join('');
        listEl.innerHTML = html;
    }

    /**
     * Escapes HTML entities to prevent DOM-based XSS vulnerabilities.
     * @param {string} str - The string to escape.
     * @returns {string} The escaped string.
     * @private
     */
    _escapeHTML(str) {
        if (typeof str !== 'string') return String(str);
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    /**
     * Pure function to generate HTML for a sidebar lot card.
     * @param {Object} lot - The parking lot data object.
     * @returns {string} HTML string for the card.
     * @private
     */
    _createSidebarCardHTML(lot) {
        const safeName = this._escapeHTML(lot.name);
        const safePrice = this._escapeHTML(lot.price);
        const safeStatus = this._escapeHTML(lot.status);
        const safeId = this._escapeHTML(lot.id);
        
        return `
            <div class="parking-card p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors" data-lot-id="${safeId}">
                <div class="flex justify-between items-start mb-2">
                    <div class="font-bold text-slate-200 text-sm leading-tight pr-2">${safeName}</div>
                    <div class="text-[10px] font-black uppercase tracking-wider ${lot.statusColor} bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700/50 whitespace-nowrap">${safeStatus}</div>
                </div>
                
                <div class="flex justify-between items-end mb-2 mt-3">
                    <div class="text-xs text-slate-400">Price: <span class="text-sky-400 font-mono">${safePrice}</span></div>
                    <div class="text-xs text-slate-400 font-mono"><span class="text-white">${lot.available}</span> / ${lot.maxCapacity} open</div>
                </div>
                
                <div class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div class="${lot.barColor} h-full transition-all duration-1000" style="width: ${lot.occPercent}%"></div>
                </div>
                
                <a href="https://www.google.com/maps/dir/?api=1&destination=${lot.lat},${lot.lng}" target="_blank" class="mt-3 w-full py-1.5 rounded bg-sky-500/20 text-sky-400 text-xs font-bold text-center block hover:bg-sky-500/30 transition-colors border border-sky-500/30">
                    Get Directions
                </a>
            </div>
        `;
    }

    /**
     * Pure function to generate HTML for a MapLibre popup.
     * @param {Object} lot - The parking lot data object.
     * @returns {string} HTML string for the popup.
     * @private
     */
    _createMarkerPopupHTML(lot) {
        const safeName = this._escapeHTML(lot.name);
        const safeStatus = this._escapeHTML(lot.status);
        
        return `
            <div class="text-slate-900 p-1">
                <strong class="block mb-1 text-sm font-black leading-tight">${safeName}</strong>
                <div class="text-xs mb-0.5 mt-2">Status: <b>${safeStatus}</b></div>
                <div class="text-xs">Available: <b>${lot.available}</b> / ${lot.maxCapacity}</div>
            </div>
        `;
    }

    /**
     * Dynamically loads the MapLibre GL JS script if not already loaded.
     * @private
     */
    _loadMapLibreAPI() {
        if (this.isMapLoaded || this.isMapLoading) return;
        this.isMapLoading = true;
        
        const script = document.createElement('script');
        script.src = "https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js";
        script.async = true;
        
        script.onload = () => {
            this.isMapLoaded = true;
            this.isMapLoading = false;
            this._initMap();
        };
        
        document.head.appendChild(script);
    }

    /**
     * Initializes the MapLibre map and drops markers.
     * @private
     */
    _initMap() {
        const mapDiv = document.getElementById('parking-map');
        if (!mapDiv || typeof maplibregl === 'undefined') return;
        
        mapDiv.innerHTML = ''; // Clear loading text
        
        this.map = new maplibregl.Map({
            container: 'parking-map',
            style: PARKING_CONFIG.MAP_STYLE,
            center: PARKING_CONFIG.STADIUM_CENTER_LNG_LAT,
            zoom: PARKING_CONFIG.DEFAULT_ZOOM,
            attributionControl: false
        });
        
        this.data.forEach(lot => {
            const el = document.createElement('div');
            el.className = 'w-6 h-6 rounded flex items-center justify-center font-black text-[12px] text-white border border-white/50 shadow-lg cursor-pointer transition-transform hover:scale-110';
            el.style.backgroundColor = lot.pinColor;
            el.innerHTML = 'P';
            
            const popup = new maplibregl.Popup({ offset: 15, closeButton: false })
                .setHTML(this._createMarkerPopupHTML(lot));
            
            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([lot.lng, lot.lat])
                .setPopup(popup)
                .addTo(this.map);
                
            this.markers.push({ id: lot.id, marker, el });
        });
    }

    /**
     * Flies the map to a specific parking lot and triggers a CSS bounce animation on its marker.
     * @param {string} id - The ID of the parking lot to focus.
     */
    focusLot(id) {
        if (!this.map) return;
        
        const lot = this.data.find(l => l.id === id);
        if (!lot) return;
        
        this.map.flyTo({ 
            center: [lot.lng, lot.lat], 
            zoom: PARKING_CONFIG.FOCUS_ZOOM,
            speed: PARKING_CONFIG.FLY_SPEED
        });
        
        const markerObj = this.markers.find(m => m.id === lot.id);
        if (markerObj && markerObj.el) {
            markerObj.el.classList.add('animate-bounce');
            setTimeout(() => markerObj.el.classList.remove('animate-bounce'), PARKING_CONFIG.ANIMATION_DURATION_MS);
        }
    }
}

// Initialize the system on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.parkingManager = new StadiumParkingManager();
});
