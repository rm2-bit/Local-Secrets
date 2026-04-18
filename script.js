// Global State Variables
let myMap = null;
let mapMarkers = [];
let secretsData = []; 
let currentFilter = 'all'; 

let uploadMap = null;
let uploadMarker = null;
let secretToDeleteId = null;

// --------------------------------------------------
// 0. TOAST NOTIFICATION SYSTEM
// --------------------------------------------------
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return; 
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '✅';
    if(type === 'error') icon = '❌';
    if(type === 'info') icon = 'ℹ️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// --------------------------------------------------
// 1. DATA FETCHING (Talks to Backend)
// --------------------------------------------------
async function fetchSecrets() {
    try {
        const response = await fetch('http://localhost:5000/api/secrets');
        secretsData = await response.json();
        
        if (myMap !== null) {
            renderMarkers(currentFilter);
        }
    } catch (error) {
        console.error("Error fetching data from server:", error);
        showToast("Backend server not connected. Ensure server is running.", "error");
    }
}

fetchSecrets();

// --------------------------------------------------
// 2. MAIN MAP LOGIC (Mystery Zones)
// --------------------------------------------------
function initMap() {
    if (myMap !== null) return; 
    
    myMap = L.map('map-container').setView([26.54, 88.70], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(myMap);

    renderMarkers(currentFilter);
}

function renderMarkers(filterCategory) {
    if (myMap === null) return;

    mapMarkers.forEach(marker => myMap.removeLayer(marker));
    mapMarkers = [];

    const filtered = filterCategory === 'all' 
        ? secretsData 
        : secretsData.filter(item => item.category === filterCategory);

    filtered.forEach(item => {
        let zoneColor = '#00ffcc'; 
        if(item.category === 'food') zoneColor = '#ff9900'; 
        if(item.category === 'music') zoneColor = '#cc33ff'; 
        if(item.category === 'places') zoneColor = '#ff4d4d'; 

        const mysteryZone = L.circle([item.lat, item.lng], {
            color: zoneColor,
            fillColor: zoneColor,
            fillOpacity: 0.2,
            radius: 400 
        }).addTo(myMap);

        const imageUrl = item.image || `https://picsum.photos/seed/${item.title.length}/400/200`;

        const popupHTML = `
            <div class="popup-content" style="width: 250px;">
                <img src="${imageUrl}" alt="Teaser" style="width: 100%; height: 140px; object-fit: cover; border-radius: 6px; margin-bottom: 10px;">
                
                <h3 style="color:${zoneColor}; font-size: 18px; margin: 0 0 5px 0;">${item.icon || ''} ${item.title}</h3>
                <p style="font-size: 13px; color: #444; font-style: italic; margin-bottom: 10px;">"${item.desc}"</p>
                
                <div style="background: #f5f5f5; padding: 10px; border-radius: 6px; margin-bottom: 12px; border: 1px solid #e0e0e0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <p style="margin: 0; font-size: 12px; color: black;"><strong>Status:</strong> 🔒 Locked</p>
                        <button onclick="openMysteryTutorial()" style="background: white; border: 1px solid #ccc; color: #444; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: 0.2s;" onmouseover="this.style.borderColor='#00ffcc'; this.style.color='#00b38f'; this.style.transform='scale(1.05)'" onmouseout="this.style.borderColor='#ccc'; this.style.color='#444'; this.style.transform='scale(1)'">
                            ❓ What is this?
                        </button>
                    </div>
                    <p style="margin: 0; font-size: 11px; color: #666;">Somewhere in this 400m zone.</p>
                </div>
                
                <p style="font-size: 13px; margin-bottom: 8px; color: black;"><strong>To Unlock:</strong> ${item.request}</p>
                
                <div style="display: flex; gap: 8px; align-items: center; margin-top: 10px;">
                    <button class="popup-btn" style="flex: 1; background:${zoneColor}; color:black; border: none; padding: 8px; border-radius: 4px; font-weight: bold; cursor: pointer; transition: 0.2s;" onmouseover="this.style.filter='brightness(1.2)'" onmouseout="this.style.filter='none'" onclick="openBarterModal('${item.title.replace(/'/g, "\\'")}', '${item.request.replace(/'/g, "\\'")}')">
                        Offer Barter
                    </button>
                    
                    <button onclick="openDeleteModal(${item.id})" title="Delete my secret" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; font-size: 14px; cursor: pointer; padding: 7px 10px; border-radius: 4px; transition: 0.2s;" onmouseover="this.style.background='rgba(255,77,77,0.2)'; this.style.borderColor='#ff4d4d'" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.borderColor='rgba(255,255,255,0.2)'">
                        🗑️
                    </button>

                    <button onclick="reportSecret()" title="Report this secret" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; font-size: 14px; cursor: pointer; padding: 7px 10px; border-radius: 4px; transition: 0.2s;" onmouseover="this.style.background='rgba(255,77,77,0.2)'; this.style.borderColor='#ff4d4d'" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.borderColor='rgba(255,255,255,0.2)'">
                        🚩
                    </button>
                </div>
            </div>
        `;

        mysteryZone.bindPopup(popupHTML);
        mapMarkers.push(mysteryZone); 
    });
}

// --------------------------------------------------
// 3. UPLOAD MINI-MAP LOGIC
// --------------------------------------------------
function initUploadMap() {
    if (uploadMap !== null) return; 
    
    uploadMap = L.map('upload-map').setView([26.54, 88.70], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(uploadMap);

    uploadMap.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        document.getElementById('upload-lat').value = lat;
        document.getElementById('upload-lng').value = lng;

        if (uploadMarker) uploadMap.removeLayer(uploadMarker);
        uploadMarker = L.marker([lat, lng]).addTo(uploadMap);
    });
}

// --------------------------------------------------
// 4. NAVIGATION & ROUTING
// --------------------------------------------------
// ... (Include State Variables and Map Logic)

function switchPage(pageId) {
    // 1. Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });
    
    // 2. Remove active state from nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const target = document.getElementById(pageId);
    
    // 3. THE FIX: Force the layout to reset to a centered column
    target.style.display = 'flex';
    target.style.flexDirection = 'column';
    target.style.justifyContent = 'flex-start'; // Starts content from top
    target.scrollTop = 0; // Force scroll to top so title isn't cut off
    
    if (pageId === 'home') {
        document.getElementById('nav-home').classList.add('active');
        // Re-trigger the entrance animations
        target.style.animation = 'none';
        target.offsetHeight; 
        target.style.animation = null; 
    } else if (pageId === 'map') {
        setTimeout(() => {
            initMap();
            myMap.invalidateSize();
        }, 100);
        document.getElementById('nav-map').classList.add('active');
    } else if (pageId === 'upload') {
        setTimeout(() => {
            initUploadMap();
            uploadMap.invalidateSize();
        }, 100);
        document.querySelector('.btn-upload').classList.add('active');
    }
}

// ... (Include all other functions for Barter, Deletion, and Mystery Tutorial)

function openMap(category) {
    filterMap(category); 
    switchPage('map');   
}

function filterMap(category) {
    currentFilter = category; 
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(category)) {
            btn.classList.add('active');
        }
    });
    renderMarkers(category);
}

// --------------------------------------------------
// 5. SUBMIT UPLOAD TO BACKEND
// --------------------------------------------------
async function handleUpload(e) {
    e.preventDefault();
    const formInputs = e.target.elements;
    
    const exactLat = parseFloat(document.getElementById('upload-lat').value);
    const exactLng = parseFloat(document.getElementById('upload-lng').value);

    if (!exactLat || !exactLng) {
        showToast("Please click on the map to set a location!", "error");
        return; 
    }

    const newSecret = {
        category: formInputs[0].value,
        title: formInputs[1].value,
        desc: formInputs[2].value,
        request: formInputs[3].value,
        lat: exactLat,
        lng: exactLng
    };

    try {
        await fetch('http://localhost:5000/api/secrets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSecret)
        });

        showToast("Secret Published successfully to the network!", "success");
        await fetchSecrets(); 
        switchPage('home');
        e.target.reset();

        if (uploadMarker) {
            uploadMap.removeLayer(uploadMarker);
            uploadMarker = null;
        }
    } catch (error) {
        console.error("Upload failed:", error);
    }
}

// --------------------------------------------------
// 6. GEOLOCATION API
// --------------------------------------------------
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                myMap.flyTo([position.coords.latitude, position.coords.longitude], 14, { duration: 1.5 });
                L.circleMarker([position.coords.latitude, position.coords.longitude], {
                    color: '#ffffff', fillColor: '#00ffcc', fillOpacity: 1, radius: 8
                }).addTo(myMap).bindPopup("You are here!").openPopup();
            },
            (error) => showToast("Please enable location permissions.", "error")
        );
    } else {
        showToast("Geolocation is not supported.", "error");
    }
}

function locateUploader(e) {
    e.preventDefault(); 
    if (navigator.geolocation) {
        const btn = e.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ Locating...";

        navigator.geolocation.getCurrentPosition(
            (position) => {
                uploadMap.flyTo([position.coords.latitude, position.coords.longitude], 16, { duration: 1.5 });
                btn.innerHTML = "📍 Found You!";
                setTimeout(() => btn.innerHTML = originalText, 3000);
            },
            (error) => {
                showToast("Please enable location permissions.", "error");
                btn.innerHTML = originalText;
            }
        );
    } else {
        showToast("Geolocation is not supported.", "error");
    }
}

// --------------------------------------------------
// 7. BARTER SYSTEM LOGIC
// --------------------------------------------------
function openBarterModal(title, request) {
    document.getElementById('barter-target-title').innerText = title;
    document.getElementById('barter-request-text').innerText = request;
    document.getElementById('barter-offer-input').value = ''; 
    document.getElementById('barter-modal').style.display = 'flex';
}

function closeBarterModal() {
    document.getElementById('barter-modal').style.display = 'none';
}

function submitBarter() {
    const offerText = document.getElementById('barter-offer-input').value;
    if(offerText.trim() === "") {
        showToast("Please type an offer before sending!", "error");
        return;
    }
    closeBarterModal();
    showToast("🤝 Offer sent to the local! Waiting for approval.", "success");
    myMap.closePopup(); 
}

// --------------------------------------------------
// 8. DELETION & MODERATION
// --------------------------------------------------
function openDeleteModal(secretId) {
    secretToDeleteId = secretId;
    document.getElementById('delete-reason-select').value = '';
    document.getElementById('delete-reason-details').value = '';
    document.getElementById('delete-modal').style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    secretToDeleteId = null;
}

async function submitDeleteRequest() {
    const reason = document.getElementById('delete-reason-select').value;
    if (!reason) {
        showToast("Please select a reason for removal.", "error");
        return;
    }

    secretsData = secretsData.filter(item => item.id !== secretToDeleteId);
    closeDeleteModal();
    myMap.closePopup();
    renderMarkers(currentFilter);
    
    if (reason === 'owner' || reason === 'mistake') {
        showToast("🗑️ Location removed successfully.", "success");
    } else {
        showToast("🛡️ Removal request sent to moderation.", "info");
    }
}

function reportSecret() {
    const reason = prompt("Help us keep LocalSecrets safe.\nWhy are you reporting this location? (e.g., Fake, Unsafe, Spam)");
    if (!reason) return; 
    showToast("🚩 Report received. Our moderation team is reviewing this.", "info");
    myMap.closePopup();
}

// --------------------------------------------------
// 9. UX TUTORIAL LOGIC
// --------------------------------------------------
function openMysteryTutorial() {
    document.getElementById('mystery-modal').style.display = 'flex';
    toggleUXDemo('exact');
}

function toggleUXDemo(mode) {
    const pin = document.getElementById('demo-exact-pin');
    const zone = document.getElementById('demo-mystery-zone');
    const bg = document.getElementById('demo-toggle-bg');
    const text = document.getElementById('demo-text');
    const buttons = bg.parentElement.querySelectorAll('button');

    if (mode === 'exact') {
        pin.style.opa// Global State Variables
let myMap = null;
let mapMarkers = [];
let secretsData = []; 
let currentFilter = 'all'; 

let uploadMap = null;
let uploadMarker = null;
let secretToDeleteId = null;

// --------------------------------------------------
// 0. TOAST NOTIFICATION SYSTEM
// --------------------------------------------------
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return; 
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '✅';
    if(type === 'error') icon = '❌';
    if(type === 'info') icon = 'ℹ️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// --------------------------------------------------
// 1. DATA FETCHING (Talks to Backend)
// --------------------------------------------------
async function fetchSecrets() {
    try {
        const response = await fetch('http://localhost:5000/api/secrets');
        secretsData = await response.json();
        
        if (myMap !== null) {
            renderMarkers(currentFilter);
        }
    } catch (error) {
        console.error("Error fetching data from server:", error);
        showToast("Backend server not connected. Ensure server is running.", "error");
    }
}

fetchSecrets();

// --------------------------------------------------
// 2. MAIN MAP LOGIC (Mystery Zones)
// --------------------------------------------------
function initMap() {
    if (myMap !== null) return; 
    
    myMap = L.map('map-container').setView([26.54, 88.70], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(myMap);

    renderMarkers(currentFilter);
}

function renderMarkers(filterCategory) {
    if (myMap === null) return;

    mapMarkers.forEach(marker => myMap.removeLayer(marker));
    mapMarkers = [];

    const filtered = filterCategory === 'all' 
        ? secretsData 
        : secretsData.filter(item => item.category === filterCategory);

    filtered.forEach(item => {
        let zoneColor = '#00ffcc'; 
        if(item.category === 'food') zoneColor = '#ff9900'; 
        if(item.category === 'music') zoneColor = '#cc33ff'; 
        if(item.category === 'places') zoneColor = '#ff4d4d'; 

        const mysteryZone = L.circle([item.lat, item.lng], {
            color: zoneColor,
            fillColor: zoneColor,
            fillOpacity: 0.2,
            radius: 400 
        }).addTo(myMap);

        const imageUrl = item.image || `https://picsum.photos/seed/${item.title.length}/400/200`;

        const popupHTML = `
            <div class="popup-content" style="width: 250px;">
                <img src="${imageUrl}" alt="Teaser" style="width: 100%; height: 140px; object-fit: cover; border-radius: 6px; margin-bottom: 10px;">
                
                <h3 style="color:${zoneColor}; font-size: 18px; margin: 0 0 5px 0;">${item.icon || ''} ${item.title}</h3>
                <p style="font-size: 13px; color: #444; font-style: italic; margin-bottom: 10px;">"${item.desc}"</p>
                
                <div style="background: #f5f5f5; padding: 10px; border-radius: 6px; margin-bottom: 12px; border: 1px solid #e0e0e0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <p style="margin: 0; font-size: 12px; color: black;"><strong>Status:</strong> 🔒 Locked</p>
                        <button onclick="openMysteryTutorial()" style="background: white; border: 1px solid #ccc; color: #444; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: 0.2s;" onmouseover="this.style.borderColor='#00ffcc'; this.style.color='#00b38f'; this.style.transform='scale(1.05)'" onmouseout="this.style.borderColor='#ccc'; this.style.color='#444'; this.style.transform='scale(1)'">
                            ❓ What is this?
                        </button>
                    </div>
                    <p style="margin: 0; font-size: 11px; color: #666;">Somewhere in this 400m zone.</p>
                </div>
                
                <p style="font-size: 13px; margin-bottom: 8px; color: black;"><strong>To Unlock:</strong> ${item.request}</p>
                
                <div style="display: flex; gap: 8px; align-items: center; margin-top: 10px;">
                    <button class="popup-btn" style="flex: 1; background:${zoneColor}; color:black; border: none; padding: 8px; border-radius: 4px; font-weight: bold; cursor: pointer; transition: 0.2s;" onmouseover="this.style.filter='brightness(1.2)'" onmouseout="this.style.filter='none'" onclick="openBarterModal('${item.title.replace(/'/g, "\\'")}', '${item.request.replace(/'/g, "\\'")}')">
                        Offer Barter
                    </button>
                    
                    <button onclick="openDeleteModal(${item.id})" title="Delete my secret" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; font-size: 14px; cursor: pointer; padding: 7px 10px; border-radius: 4px; transition: 0.2s;" onmouseover="this.style.background='rgba(255,77,77,0.2)'; this.style.borderColor='#ff4d4d'" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.borderColor='rgba(255,255,255,0.2)'">
                        🗑️
                    </button>

                    <button onclick="reportSecret()" title="Report this secret" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; font-size: 14px; cursor: pointer; padding: 7px 10px; border-radius: 4px; transition: 0.2s;" onmouseover="this.style.background='rgba(255,77,77,0.2)'; this.style.borderColor='#ff4d4d'" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.borderColor='rgba(255,255,255,0.2)'">
                        🚩
                    </button>
                </div>
            </div>
        `;

        mysteryZone.bindPopup(popupHTML);
        mapMarkers.push(mysteryZone); 
    });
}

// --------------------------------------------------
// 3. UPLOAD MINI-MAP LOGIC
// --------------------------------------------------
function initUploadMap() {
    if (uploadMap !== null) return; 
    
    uploadMap = L.map('upload-map').setView([26.54, 88.70], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(uploadMap);

    uploadMap.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        document.getElementById('upload-lat').value = lat;
        document.getElementById('upload-lng').value = lng;

        if (uploadMarker) uploadMap.removeLayer(uploadMarker);
        uploadMarker = L.marker([lat, lng]).addTo(uploadMap);
    });
}

// --------------------------------------------------
// 4. NAVIGATION & ROUTING
// --------------------------------------------------
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const target = document.getElementById(pageId);
    target.style.display = 'flex';
    target.style.flexDirection = 'column'; 
    
    if (pageId === 'map') {
        setTimeout(() => {
            initMap();
            myMap.invalidateSize();
        }, 100);
        document.getElementById('nav-map').classList.add('active');
    } else if (pageId === 'upload') {
        setTimeout(() => {
            initUploadMap();
            uploadMap.invalidateSize();
        }, 100);
        document.querySelector('.btn-upload').classList.add('active'); 
    } else {
        if(pageId === 'home') {
            document.getElementById('nav-home').classList.add('active');
            target.style.animation = 'none';
            target.offsetHeight; 
            target.style.animation = null; 
        }
    }
}

function openMap(category) {
    filterMap(category); 
    switchPage('map');   
}

function filterMap(category) {
    currentFilter = category; 
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(category)) {
            btn.classList.add('active');
        }
    });
    renderMarkers(category);
}

// --------------------------------------------------
// 5. SUBMIT UPLOAD TO BACKEND
// --------------------------------------------------
async function handleUpload(e) {
    e.preventDefault();
    const formInputs = e.target.elements;
    
    const exactLat = parseFloat(document.getElementById('upload-lat').value);
    const exactLng = parseFloat(document.getElementById('upload-lng').value);

    if (!exactLat || !exactLng) {
        showToast("Please click on the map to set a location!", "error");
        return; 
    }

    const newSecret = {
        category: formInputs[0].value,
        title: formInputs[1].value,
        desc: formInputs[2].value,
        request: formInputs[3].value,
        lat: exactLat,
        lng: exactLng
    };

    try {
        await fetch('http://localhost:5000/api/secrets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSecret)
        });

        showToast("Secret Published successfully to the network!", "success");
        await fetchSecrets(); 
        switchPage('home');
        e.target.reset();

        if (uploadMarker) {
            uploadMap.removeLayer(uploadMarker);
            uploadMarker = null;
        }
    } catch (error) {
        console.error("Upload failed:", error);
    }
}

// --------------------------------------------------
// 6. GEOLOCATION API
// --------------------------------------------------
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                myMap.flyTo([position.coords.latitude, position.coords.longitude], 14, { duration: 1.5 });
                L.circleMarker([position.coords.latitude, position.coords.longitude], {
                    color: '#ffffff', fillColor: '#00ffcc', fillOpacity: 1, radius: 8
                }).addTo(myMap).bindPopup("You are here!").openPopup();
            },
            (error) => showToast("Please enable location permissions.", "error")
        );
    } else {
        showToast("Geolocation is not supported.", "error");
    }
}

function locateUploader(e) {
    e.preventDefault(); 
    if (navigator.geolocation) {
        const btn = e.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ Locating...";

        navigator.geolocation.getCurrentPosition(
            (position) => {
                uploadMap.flyTo([position.coords.latitude, position.coords.longitude], 16, { duration: 1.5 });
                btn.innerHTML = "📍 Found You!";
                setTimeout(() => btn.innerHTML = originalText, 3000);
            },
            (error) => {
                showToast("Please enable location permissions.", "error");
                btn.innerHTML = originalText;
            }
        );
    } else {
        showToast("Geolocation is not supported.", "error");
    }
}

// --------------------------------------------------
// 7. BARTER SYSTEM LOGIC
// --------------------------------------------------
function openBarterModal(title, request) {
    document.getElementById('barter-target-title').innerText = title;
    document.getElementById('barter-request-text').innerText = request;
    document.getElementById('barter-offer-input').value = ''; 
    document.getElementById('barter-modal').style.display = 'flex';
}

function closeBarterModal() {
    document.getElementById('barter-modal').style.display = 'none';
}

function submitBarter() {
    const offerText = document.getElementById('barter-offer-input').value;
    if(offerText.trim() === "") {
        showToast("Please type an offer before sending!", "error");
        return;
    }
    closeBarterModal();
    showToast("🤝 Offer sent to the local! Waiting for approval.", "success");
    myMap.closePopup(); 
}

// --------------------------------------------------
// 8. DELETION & MODERATION
// --------------------------------------------------
function openDeleteModal(secretId) {
    secretToDeleteId = secretId;
    document.getElementById('delete-reason-select').value = '';
    document.getElementById('delete-reason-details').value = '';
    document.getElementById('delete-modal').style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    secretToDeleteId = null;
}

async function submitDeleteRequest() {
    const reason = document.getElementById('delete-reason-select').value;
    if (!reason) {
        showToast("Please select a reason for removal.", "error");
        return;
    }

    secretsData = secretsData.filter(item => item.id !== secretToDeleteId);
    closeDeleteModal();
    myMap.closePopup();
    renderMarkers(currentFilter);
    
    if (reason === 'owner' || reason === 'mistake') {
        showToast("🗑️ Location removed successfully.", "success");
    } else {
        showToast("🛡️ Removal request sent to moderation.", "info");
    }
}

function reportSecret() {
    const reason = prompt("Help us keep LocalSecrets safe.\nWhy are you reporting this location? (e.g., Fake, Unsafe, Spam)");
    if (!reason) return; 
    showToast("🚩 Report received. Our moderation team is reviewing this.", "info");
    myMap.closePopup();
}

// --------------------------------------------------
// 9. UX TUTORIAL LOGIC
// --------------------------------------------------
function openMysteryTutorial() {
    document.getElementById('mystery-modal').style.display = 'flex';
    toggleUXDemo('exact');
}

function toggleUXDemo(mode) {
    const pin = document.getElementById('demo-exact-pin');
    const zone = document.getElementById('demo-mystery-zone');
    const bg = document.getElementById('demo-toggle-bg');
    const text = document.getElementById('demo-text');
    const buttons = bg.parentElement.querySelectorAll('button');

    if (mode === 'exact') {
        pin.style.opacity = '1';
        pin.style.transform = 'scale(1)';
        zone.style.opacity = '0';
        zone.style.transform = 'scale(0)';
        bg.style.transform = 'translateX(0)';
        buttons[0].style.color = 'black';
        buttons[1].style.color = 'white';
        text.style.color = '#ff4d4d';
        text.innerHTML = "<strong>Vulnerable:</strong> Anyone can extract exact coordinates and swarm the local environment.";
    } else {
        pin.style.opacity = '0.2';
        pin.style.transform = 'scale(0.5)';
        const randomX = (Math.random() * 60) - 30; 
        const randomY = (Math.random() * 60) - 30;
        zone.style.transform = `translate(${randomX}px, ${randomY}px) scale(1)`;
        zone.style.opacity = '1';
        bg.style.transform = 'translateX(100%)';
        buttons[0].style.color = 'white';
        buttons[1].style.color = 'black';
        text.style.color = '#00ffcc';
        text.innerHTML = "<strong>Protected:</strong> The location is hidden within a 400m radius. You must trade skills to unlock it!";
    }
}city = '1';
        pin.style.transform = 'scale(1)';
        zone.style.opacity = '0';
        zone.style.transform = 'scale(0)';
        bg.style.transform = 'translateX(0)';
        buttons[0].style.color = 'black';
        buttons[1].style.color = 'white';
        text.style.color = '#ff4d4d';
        text.innerHTML = "<strong>Vulnerable:</strong> Anyone can extract exact coordinates and swarm the local environment.";
    } else {
        pin.style.opacity = '0.2';
        pin.style.transform = 'scale(0.5)';
        const randomX = (Math.random() * 60) - 30; 
        const randomY = (Math.random() * 60) - 30;
        zone.style.transform = `translate(${randomX}px, ${randomY}px) scale(1)`;
        zone.style.opacity = '1';
        bg.style.transform = 'translateX(100%)';
        buttons[0].style.color = 'white';
        buttons[1].style.color = 'black';
        text.style.color = '#00ffcc';
        text.innerHTML = "<strong>Protected:</strong> The location is hidden within a 400m radius. You must trade skills to unlock it!";
    }
}
// This ensures the home page layout is applied immediately on load
window.onload = () => switchPage('home');
// --------------------------------------------------
// 10. LIVE SEARCH FILTERING
// --------------------------------------------------
function handleSearch(query) {
    const searchTerm = query.toLowerCase().trim();
    if (filtered.length === 0 && searchTerm !== "") {
        showToast("No secrets found matching that search.", "info");
    }
    
    // Clear the map markers first
    mapMarkers.forEach(marker => myMap.removeLayer(marker));
    mapMarkers = [];

    // Filter by both Category AND Search Term
    const filtered = secretsData.filter(item => {
        const matchesCategory = (currentFilter === 'all' || item.category === currentFilter);
        const matchesSearch = item.title.toLowerCase().includes(searchTerm) || 
                              item.desc.toLowerCase().includes(searchTerm) ||
                              item.request.toLowerCase().includes(searchTerm);
        
        return matchesCategory && matchesSearch;
    });

    // Reuse your existing render function logic but only for the searched items
    renderCustomMarkers(filtered);
}

// We create a tiny helper so we don't repeat the loop code
function renderCustomMarkers(dataArray) {
    dataArray.forEach(item => {
        // ... (Copy the exact 'L.circle' and 'popupHTML' logic from your renderMarkers function here)
        // This ensures searched items look exactly like normal items
    });
}
// Start with some hardcoded demo data so the map isn't empty on GitHub!
secretsData = [
// Add these to your secretsData array in script.js
{
    id: 103,
    category: 'food',
    title: 'Midnight Thukpa Corner',
    desc: 'Only opens after 9 PM. Best spicy broth in town.',
    request: 'Suggest 3 classic rock playlists',
    lat: 26.72,
    lng: 88.42,
    icon: '🍜'
},
{
    id: 104,
    category: 'places',
    title: 'Secret Pine Forest Trail',
    desc: 'A misty trail near Darjeeling road that tourists skip.',
    request: 'Show me how to edit a cinematic reel',
    lat: 26.85,
    lng: 88.38,
    icon: '📍'
},
{
    id: 105,
    category: 'music',
    title: 'Acoustic Jam Basement',
    desc: 'A private hobby room where locals jam every Sunday.',
    request: 'Teach me the C-Major scale on guitar',
    lat: 26.54,
    lng: 88.72,
    icon: '🎵'
},
{
    id: 106,
    category: 'traditions',
    title: 'Handloom Weaving Workshop',
    desc: 'Watch traditional patterns being made by hand.',
    request: 'Help me set up a professional LinkedIn profile',
    lat: 26.51,
    lng: 88.75,
    icon: '🎭'
},
{
    id: 107,
    category: 'food',
    title: 'Old Town Tea Stall',
    desc: 'Famous for "Malai Toast" and local tea stories.',
    request: 'Translate a short poem into English',
    lat: 26.55,
    lng: 88.69,
    icon: '☕'
},
{
    id: 108,
    category: 'places',
    title: 'Abandoned Railway Bridge',
    desc: 'Perfect for moody photography and sunset views.',
    request: 'Explain how the Stock Market works simply',
    lat: 26.58,
    lng: 88.65,
    icon: '📍'
},
{
    id: 109,
    category: 'food',
    title: 'Secret Bakery Outlet',
    desc: 'They sell the fresh morning leftovers at 50% off.',
    request: 'Recommend 5 must-read Sci-Fi books',
    lat: 26.71,
    lng: 88.44,
    icon: '🥐'
},
{
    id: 110,
    category: 'music',
    title: 'Folk Baul Singer Home',
    desc: 'An elderly artist willing to share the history of Baul music.',
    request: 'Show me how to install Kali Linux on a VM',
    lat: 26.48,
    lng: 88.78,
    icon: '🎵'
},
{
    id: 111,
    category: 'places',
    title: 'The Banyan Tree Library',
    desc: 'An unofficial outdoor book exchange spot.',
    request: 'Help me write a professional email to a client',
    lat: 26.53,
    lng: 88.71,
    icon: '📖'
},
{
    id: 112,
    category: 'traditions',
    title: 'Local Pottery Village',
    desc: 'Get your hands dirty and learn the basic wheel spinning.',
    request: 'Explain the basics of Artificial Intelligence',
    lat: 26.60,
    lng: 88.80,
    icon: '🏺'
},
{
    id: 113, category: 'food', title: 'The Attic Library Cafe',
    desc: 'A hidden upstairs cafe where you can read and drink organic tea.',
    request: 'Share your top 3 productivity tips', lat: 26.73, lng: 88.40, icon: '☕'
},
{
    id: 114, category: 'food', title: 'Grandma’s Pitha Stall',
    desc: 'Traditional rice cakes available only during winter mornings.',
    request: 'Explain how to solve a 3x3 Rubik’s cube', lat: 26.54, lng: 88.68, icon: '🥟'
},
{
    id: 115, category: 'food', title: 'Secret Burger Joint',
    desc: 'Located in a residential garage, famous for handmade patties.',
    request: 'Recommend a good budget laptop for coding', lat: 26.71, lng: 88.45, icon: '🍔'
},
{
    id: 116, category: 'food', title: 'Riverside Picnic Kitchen',
    desc: 'They cook local river fish in traditional clay pots.',
    request: 'Show me how to make a basic Python calculator', lat: 26.49, lng: 88.74, icon: '🐟'
},
{
    id: 117, category: 'food', title: 'Organic Orange Orchard Juice',
    desc: 'Fresh juice served inside a private family-owned grove.',
    request: 'Give me a list of the best AI tools for students', lat: 26.88, lng: 88.35, icon: '🍊'
},
{
    id: 118, category: 'places', title: 'The Old Suspension Bridge',
    desc: 'A shaky but beautiful bridge over a clear mountain stream.',
    request: 'Explain the difference between RAM and Storage', lat: 26.82, lng: 88.44, icon: '🌉'
},
{
    id: 119, category: 'places', title: 'Star-Gazing Meadow',
    desc: 'Zero light pollution. Best place for night photography.',
    request: 'Tell me 3 interesting facts about space', lat: 26.95, lng: 88.30, icon: '✨'
},
{
    id: 120, category: 'places', title: 'Secret Teesta Backwaters',
    desc: 'Calm water spot perfect for bird watching and meditation.',
    request: 'Show me how to format a professional CV', lat: 26.65, lng: 88.55, icon: '🛶'
},
{
    id: 121, category: 'places', title: 'Abandoned Tea Factory',
    desc: 'Creepy but cool industrial ruin for urban explorers.',
    request: 'Teach me how to use Basic Linux commands', lat: 26.78, lng: 88.42, icon: '🏭'
},
{
    id: 122, category: 'places', title: 'The Hidden Waterfall',
    desc: 'Needs a 20-minute hike, but the water is crystal clear.',
    request: 'Suggest 5 bodyweight exercises for home', lat: 26.91, lng: 88.32, icon: '🌊'
},
{
    id: 123, category: 'places', title: 'Rooftop Garden View',
    desc: 'A private rooftop that looks over the entire Siliguri skyline.',
    request: 'Help me write a professional cover letter', lat: 26.72, lng: 88.43, icon: '🏙️'
},
{
    id: 124, category: 'music', title: 'Vinyl Record Collector’s Den',
    desc: 'A house with 2000+ old Bengali and English records.',
    request: 'Explain how a record player works', lat: 26.53, lng: 88.70, icon: '📻'
},
{
    id: 125, category: 'music', title: 'Drummer’s Soundproof Shed',
    desc: 'A local metal drummer lets people practice for free.',
    request: 'Show me how to speed up my Windows PC', lat: 26.70, lng: 88.41, icon: '🥁'
},
{
    id: 126, category: 'music', title: 'Flute Maker’s Veranda',
    desc: 'Watch an artist carve bamboo flutes by hand.',
    request: 'Share a list of 5 best free movie websites', lat: 26.56, lng: 88.76, icon: '🎶'
},
{
    id: 127, category: 'music', title: 'Hip-Hop Cypher Spot',
    desc: 'Under the flyover where local rappers meet at Friday nights.',
    request: 'Teach me some basic beatboxing sounds', lat: 26.74, lng: 88.39, icon: '🎤'
},
{
    id: 128, category: 'music', title: 'Traditional Dotara School',
    desc: 'Small evening classes for folk string instruments.',
    request: 'Suggest 3 ways to grow a YouTube channel', lat: 26.51, lng: 88.73, icon: '🎸'
},
{
    id: 129, category: 'traditions', title: 'Bamboo Craft Workshop',
    desc: 'Local family making baskets and furniture for generations.',
    request: 'Help me set up a Google Sheets budget', lat: 26.60, lng: 88.85, icon: '🎋'
},
{
    id: 130, category: 'traditions', title: 'Community Seed Bank',
    desc: 'A collection of rare local vegetable seeds you can’t buy.',
    request: 'Explain the benefits of organic farming', lat: 26.45, lng: 88.70, icon: '🌱'
},
{
    id: 131, category: 'traditions', title: 'Temple Bell Casting',
    desc: 'A workshop that still uses the lost-wax casting method.',
    request: 'Show me how to make a basic website using HTML', lat: 26.52, lng: 88.72, icon: '🔔'
},
{
    id: 132, category: 'traditions', title: 'Ayurvedic Herb Garden',
    desc: 'An elderly healer who identifies medicinal forest plants.',
    request: 'Explain how to do a basic meditation session', lat: 26.84, lng: 88.37, icon: '🌿'
}
    
];