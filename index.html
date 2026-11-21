<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <title>MOTFOT - Mapa autobusových fotek</title>
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <!-- MarkerCluster CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />

    <style>
        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
        }
        /* Červená horní hlavička */
        #header {
            height: 60px;
            background-color: #e74c3c;
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1000;
        }
        #header h1 {
            margin: 0;
            font-size: 1.4rem;
            letter-spacing: 1px;
        }
        .controls {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .controls label {
            background-color: #c0392b;
            color: white;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.2s;
        }
        .controls label:hover {
            background-color: #962d22;
        }
        #jsonFile {
            display: none;
        }
        #btn-clear, #btn-auth {
            background-color: #2c3e50;
            color: white;
            border: none;
            padding: 9px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.2s;
        }
        #btn-clear:hover, #btn-auth:hover {
            background-color: #1a252f;
        }
        #btn-auth.logged-in {
            background-color: #27ae60;
        }
        #btn-auth.logged-in:hover {
            background-color: #1e8449;
        }
        #stats {
            font-size: 0.9rem;
            background: rgba(0,0,0,0.2);
            padding: 5px 10px;
            border-radius: 4px;
        }
        /* Tlačítko pro smazání v popupu (výchozí stav skryté) */
        .btn-delete-marker {
            background-color: #e74c3c;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 8px;
            display: none;
        }
        .btn-delete-marker:hover {
            background-color: #c0392b;
        }
        /* Zobrazení tlačítka pouze pokud je uživatel přihlášen */
        body.admin-mode .btn-delete-marker {
            display: inline-block;
        }
        /* Mapa */
        #map {
            width: 100%;
            height: calc(100vh - 60px);
        }
    </style>
</head>
<body>

    <!-- Červená horní hlavička -->
    <div id="header">
        <h1>🚌 MOTFOT</h1>
        <div class="controls">
            <span id="stats">Načteno fotek: 0</span>
            <button id="btn-auth">🔒 Přihlásit</button>
            <label for="jsonFile">📁 Nahrát JSON</label>
            <input type="file" id="jsonFile" accept=".json" multiple>
            <button id="btn-clear">🗑️ Vymazat mapu</button>
        </div>
    </div>

    <!-- Div pro mapu -->
    <div id="map"></div>

    <!-- Leaflet JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <!-- MarkerCluster JS -->
    <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>

    <script>
        // Heslo pro přihlášení
        const ADMIN_PASSWORD = "sMaz4321";
        let isLoggedIn = false;

        // 1. Inicializace mapy (střed ČR, zoom 7)
        const map = L.map('map').setView([49.8175, 15.4730], 7);

        // 2. Mapové podklady (ESRI jako hlavní, OSM jako záložní)
        const esriLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom'
        });

        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        });

        // Nastavení ESRI jako výchozí vrstvy
        esriLayer.addTo(map);

        // Přidání přepínače vrstev do pravého horního rohu
        const baseMaps = {
            "ESRI Street Map": esriLayer,
            "OpenStreetMap": osmLayer
        };
        L.control.layers(baseMaps).addTo(map);

        // 3. Shlukování bodů (Cluster Group)
        const markersLayer = L.markerClusterGroup({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false
        });
        map.addLayer(markersLayer);

        const loadedKeys = new Set();
        const allBounds = [];

        // Správa přihlášení a odhlášení
        const btnAuth = document.getElementById('btn-auth');
        btnAuth.addEventListener('click', function() {
            if (!isLoggedIn) {
                const enteredPassword = prompt("Zadejte heslo pro správu bodů:");
                if (enteredPassword === null) return;

                if (enteredPassword === ADMIN_PASSWORD) {
                    isLoggedIn = true;
                    document.body.classList.add('admin-mode');
                    btnAuth.innerText = "🔓 Odhlásit";
                    btnAuth.classList.add('logged-in');
                } else {
                    alert("Nesprávné heslo!");
                }
            } else {
                isLoggedIn = false;
                document.body.classList.remove('admin-mode');
                btnAuth.innerText = "🔒 Přihlásit";
                btnAuth.classList.remove('logged-in');
            }
        });

        // 4. Funkce pro zpracování a vykreslení JSON dat
        function processData(rawData) {
            let data = rawData;
            if (!Array.isArray(rawData)) {
                const possibleArray = Object.values(rawData).find(val => Array.isArray(val));
                if (possibleArray) {
                    data = possibleArray;
                } else {
                    alert("Chyba: Nahraný JSON soubor nemá správnou strukturu (musí obsahovat pole prvků).");
                    return;
                }
            }

            let addedCount = 0;
            const newMarkers = [];

            data.forEach(item => {
                if (item.lat && item.lon && !isNaN(item.lat) && !isNaN(item.lon)) {
                    const uniqueKey = item.linkUrl || `${item.lat}_${item.lon}_${item.vozidlo}`;
                    if (loadedKeys.has(uniqueKey)) return;
                    loadedKeys.add(uniqueKey);

                    let autor = item.autor;
                    if (!autor || autor.toLowerCase() === "neznámý" || autor.trim() === "") {
                        autor = "S-A";
                    }

                    // Vytvoříme DOM element pro popup obsah, aby šlo bezpečně navázat událost tlačítka
                    const container = document.createElement('div');
                    
                    let htmlContent = `<b>${item.vozidlo || 'Vozidlo'}</b><br>`;
                    htmlContent += `Autor: ${autor}<br>`;
                    if (item.fotoUrl) htmlContent += `<br><img src="${item.fotoUrl}" width="200" style="border-radius: 4px; display: block;"><br>`;
                    if (item.linkUrl) htmlContent += `<a href="${item.linkUrl}" target="_blank">Otevřít detail fotky ↗</a><br>`;
                    
                    htmlContent += `<button class="btn-delete-marker">🗑️ Smazat bod</button>`;
                    container.innerHTML = htmlContent;

                    // Ošetření kliknutí na mazací tlačítko uvnitř popupu
                    const deleteBtn = container.querySelector('.btn-delete-marker');
                    deleteBtn.addEventListener('click', function() {
                        if (!isLoggedIn) {
                            alert("Pro smazání bodu se musíte nejprve přihlásit.");
                            return;
                        }

                        markersLayer.removeLayer(marker);
                        loadedKeys.delete(uniqueKey);
                        document.getElementById('stats').innerText = `Načteno fotek: ${loadedKeys.size}`;
                        map.closePopup();
                    });

                    const marker = L.marker([parseFloat(item.lat), parseFloat(item.lon)]).bindPopup(container);
                    marker.uniqueKey = uniqueKey;
                    
                    newMarkers.push(marker);
                    allBounds.push([parseFloat(item.lat), parseFloat(item.lon)]);
                    addedCount++;
                }
            });

            if (newMarkers.length > 0) {
                markersLayer.addLayers(newMarkers);
                map.fitBounds(allBounds, { padding: [50, 50] });
            }

            document.getElementById('stats').innerText = `Načteno fotek: ${loadedKeys.size}`;
        }

        // 5. Nahrávání souborů přes input
        document.getElementById('jsonFile').addEventListener('change', function(e) {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = function(event) {
                    try {
                        const json = JSON.parse(event.target.result);
                        processData(json);
                    } catch (err) {
                        alert(`Chyba při parsování JSON souboru ${file.name}: ${err.message}`);
                        console.error(err);
                    }
                };
                reader.readAsText(file);
            });

            e.target.value = '';
        });

        // 6. Tlačítko pro vymazání celé mapy
        document.getElementById('btn-clear').addEventListener('click', function() {
            markersLayer.clearLayers();
            loadedKeys.clear();
            allBounds.length = 0;
            document.getElementById('stats').innerText = 'Načteno fotek: 0';
            map.setView([49.8175, 15.4730], 7);
        });
    </script>
</body>
</html>
