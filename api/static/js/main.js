// main.js
document.addEventListener("DOMContentLoaded", async () => {

  console.log("Inicjalizacja aplikacji...");

  // Przechowywanie stanu aplikacji
  const appState = {
    devices: [],
    rooms: [],
    panels: {},
    currentRoom: "all",
    currentFilter: "all",
  };

  window.appState = appState;

  console.log("window.appState zainicjalizowany:", window.appState);

    // Inicjalizacja klientów
  const apiClient = new APIClient();
  const mqttClient = new MQTTClient();

  // Udostępnij mqttClient globalnie, by komponenty mogły z niego korzystać
  window.mqttClient = mqttClient;

  // Referencje do elementów DOM
  const dashboard = document.getElementById("dashboard");
  const roomsList = document.getElementById("rooms-list");
  const mqttStatusDot = document.getElementById("mqtt-status");
  const statusText = document.getElementById("status-text");
  const notification = document.getElementById("notification");
  const currentRoomHeader = document.getElementById("current-room-header");

  // Funkcja do wyświetlania powiadomień
  function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.classList.toggle("error", isError);
    notification.classList.add("show");

    setTimeout(() => {
      notification.classList.remove("show");
    }, 3000);
  }

  // Funkcja sprawdzająca status API i MQTT
  async function checkStatus() {
    try {
      const status = await apiClient.checkStatus();

      if (status.status === "ok") {
        const mqttConnected = status.mqtt_connected;
        console.log("Status MQTT z API:", mqttConnected);

        if (mqttConnected) {
          mqttStatusDot.classList.remove("status-disconnected");
          mqttStatusDot.classList.add("status-connected");
          statusText.textContent = "Połączono z systemem";

          // Jeśli MQTT jest dostępne, ale jeszcze nie połączone, połącz
          // if (!mqttClient.isConnected) {
          //   mqttClient.connect();
          // }
            // Oznacz wszystkie urządzenia jako online
          Object.values(appState.panels).forEach(panel => {
          panel.updateConnectionStatus(true);
          });




        } else {
          mqttStatusDot.classList.remove("status-connected");
          mqttStatusDot.classList.add("status-disconnected");
          statusText.textContent = "Problem z połączeniem MQTT";
          showNotification(
            "Problem z połączeniem MQTT. Sprawdź konfigurację serwera.",
            true
          );
        }
      } else {
        mqttStatusDot.classList.remove("status-connected");
        mqttStatusDot.classList.add("status-disconnected");
        statusText.textContent = "Problem z API";
        showNotification("Problem z API. Sprawdź logi serwera.", true);
      }
    } catch (error) {
      console.error("Błąd podczas sprawdzania statusu:", error);
      mqttStatusDot.classList.remove("status-connected");
      mqttStatusDot.classList.add("status-disconnected");
      statusText.textContent = "Brak połączenia z API";
      showNotification(
        "Brak połączenia z API. Sprawdź czy serwer jest uruchomiony.",
        true
      );
    }
  }



  // Funkcja ładująca konfigurację urządzeń
  async function loadDevices() {
    try {
      appState.devices = await apiClient.getDevices();
      console.log("Załadowano urządzenia:", appState.devices);
      createPanels();
    } catch (error) {
      console.error("Błąd podczas ładowania urządzeń:", error);
      showNotification(
        "Nie można załadować urządzeń. Sprawdź połączenie z serwerem.",
        true
      );
    }
  }

  // Funkcja ładująca konfigurację pomieszczeń
  async function loadRooms() {
    try {
      appState.rooms = await apiClient.getRooms();
      console.log("Załadowano pomieszczenia:", appState.rooms);
      createRoomsList();
    } catch (error) {
      console.error("Błąd podczas ładowania pomieszczeń:", error);
      showNotification(
        "Nie można załadować pomieszczeń. Sprawdź połączenie z serwerem.",
        true
      );
    }
  }

  // Funkcja tworząca listę pomieszczeń w nawigacji
  function createRoomsList() {
    roomsList.innerHTML =
      '<li><a href="#" data-room="all" class="active">Wszystkie pomieszczenia</a></li>';

    appState.rooms.forEach((room) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#";
      a.dataset.room = room.id;
      a.textContent = room.name;

      li.appendChild(a);
      roomsList.appendChild(li);
    });

    // Dodaj obsługę kliknięcia na pomieszczenie
    roomsList.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        e.preventDefault();

        // Usuń klasę active ze wszystkich linków
        roomsList
          .querySelectorAll("a")
          .forEach((link) => link.classList.remove("active"));

        // Dodaj klasę active do klikniętego linku
        e.target.classList.add("active");

        // Aktualizuj bieżące pomieszczenie
        appState.currentRoom = e.target.dataset.room;

        // Aktualizuj nagłówek
        if (appState.currentRoom === "all") {
          currentRoomHeader.innerHTML = "<h2>Wszystkie urządzenia</h2>";
        } else {
          const room = appState.rooms.find(
            (r) => r.id === appState.currentRoom
          );
          if (room) {
            currentRoomHeader.innerHTML = `<h2>${room.name}</h2>`;
          }
        }

        // Filtruj panele
        filterPanels();
      }
    });
  }

  // Funkcja tworząca panele urządzeń
  function createPanels() {
    // Wyczyść dashboard
    dashboard.innerHTML = "";
    appState.panels = {};

    // Stwórz panel dla każdego urządzenia
    appState.devices.forEach((device) => {
      const panel = PanelFactory.createPanel(device);

      if (panel) {
        const panelElement = panel.createPanel();
        dashboard.appendChild(panelElement);

        // Zapisz referencję do panelu
        appState.panels[device.id] = panel;

        // Subskrybuj tematy MQTT dla tego urządzenia
        if (mqttClient.isConnected) {
          subscribeToDeviceTopics(device);
        }
      }
    });
  }

  // Funkcja filtrująca panele na podstawie wybranego pomieszczenia i typu
  function filterPanels() {
    const room = appState.currentRoom;
    const filter = appState.currentFilter;

    Object.values(appState.panels).forEach((panel) => {
      const panelElement = panel.element;

      // Sprawdź, czy panel pasuje do filtrów
      const roomMatch = room === "all" || panel.room === room;
      const typeMatch = filter === "all" || panel.type === filter;

      // Pokaż lub ukryj panel
      if (roomMatch && typeMatch) {
        panelElement.style.display = "";
      } else {
        panelElement.style.display = "none";
      }
    });
  }

  // Funkcja subskrybująca tematy MQTT dla urządzenia
  function subscribeToDeviceTopics(device) {
    // Podstawowe tematy
    const statusTopic = `${device.topic}/status`;
    mqttClient.subscribe(statusTopic, (message) => {
      const panel = appState.panels[device.id];
      if (panel) {
        panel.updateConnectionStatus(true);
        panel.updateContent(message);
      }
    });

    // Tematy wartości, jeśli są zdefiniowane
    if (device.valueTopics) {
      Object.keys(device.valueTopics).forEach((valueName) => {
        const valueTopic = `${device.topic}/${device.valueTopics[valueName]}`;
        mqttClient.subscribe(valueTopic, (message, topic) => {
          const panel = appState.panels[device.id];
          if (panel) {
            panel.updateConnectionStatus(true);
            panel.updateContent(message, topic);
          }
        });
      });
    }
  }

  // Obsługa zdarzeń MQTT
  window.addEventListener("mqtt-connected", () => {
    console.log("Połączono z MQTT");
    mqttStatusDot.classList.add("status-connected");
    mqttStatusDot.classList.remove("status-disconnected");
    statusText.textContent = "Połączono z systemem";

    // Subskrybuj tematy dla wszystkich urządzeń
    appState.devices.forEach(subscribeToDeviceTopics);
  });

  window.addEventListener("mqtt-disconnected", () => {
    console.log("Rozłączono z MQTT");
    mqttStatusDot.classList.remove("status-connected");
    mqttStatusDot.classList.add("status-disconnected");
    statusText.textContent = "Rozłączono z systemem";

    // Oznacz wszystkie urządzenia jako offline
    Object.values(appState.panels).forEach((panel) => {
      panel.updateConnectionStatus(false);
    });
  });

  window.addEventListener("mqtt-error", (e) => {
    console.error("Błąd MQTT:", e.detail);
    showNotification(`Błąd MQTT: ${e.detail}`, true);
  });

  // Obsługa filtrowania po typie urządzenia
  document.querySelector(".device-types").addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      e.preventDefault();

      // Usuń klasę active ze wszystkich linków
      document
        .querySelectorAll(".device-types a")
        .forEach((link) => link.classList.remove("active"));

      // Dodaj klasę active do klikniętego linku
      e.target.classList.add("active");

      // Aktualizuj bieżący filtr
      appState.currentFilter = e.target.dataset.filter;

      // Filtruj panele
      filterPanels();
    }
  });

  // Inicjalizacja
  async function initialize() {
    // Sprawdź status
    await checkStatus();

    // Załaduj konfigurację
    await Promise.all([loadRooms(), loadDevices()]);

    // Sprawdzaj status co 30 sekund
    setInterval(checkStatus, 30000);
  }

  // Uruchom inicjalizację
  initialize();
});
