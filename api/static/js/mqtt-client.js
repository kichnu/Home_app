
// mqtt-client.js - Uproszczona wersja działająca przez API

class MQTTClient {
  constructor() {
    this.isConnected = false;
    this.subscriptions = {};
    console.log("Inicjalizacja uproszczonego klienta MQTT (przez API)");
  }

  connect() {
    console.log("Symulacja połączenia MQTT (używamy API)");
    // Sprawdź status API zamiast próbować łączyć MQTT
    fetch("/api/status")
      .then(response => response.json())
      .then(data => {
        this.isConnected = data.mqtt_connected;
        if (this.isConnected) {
          console.log("Backend MQTT jest połączony");
          window.dispatchEvent(new Event("mqtt-connected"));
        } else {
          console.log("Backend MQTT nie jest połączony");
          window.dispatchEvent(new Event("mqtt-disconnected"));
        }
      })
      .catch(error => {
        console.error("Błąd sprawdzania statusu API:", error);
        this.isConnected = false;
        window.dispatchEvent(new Event("mqtt-disconnected"));
      });
    
    // Rozpocznij pobieranie statusów urządzeń co 5 sekund
    this._startStatusPolling();
    
    return true;
  }

  disconnect() {
    this.isConnected = false;
    console.log("Rozłączono z symulowanym MQTT");
    this._stopStatusPolling();
    window.dispatchEvent(new Event("mqtt-disconnected"));
  }

  subscribe(topic, callback) {
    console.log(`Symulacja subskrypcji tematu: ${topic}`);
    this.subscriptions[topic] = callback;
  }

  unsubscribe(topic) {
    console.log(`Symulacja anulowania subskrypcji tematu: ${topic}`);
    if (this.subscriptions[topic]) {
      delete this.subscriptions[topic];
    }
  }

  publish(topic, message) {
    console.log(`Publikacja przez API: ${topic}, wartość: ${message}`);
    
    // Wyodrębnij device_id z tematu
    const parts = topic.split('/');
    if (parts.length >= 3) {
      const deviceId = parts[2];
      
      // Publikuj przez API
      return fetch(`/api/device/${deviceId}/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command: message }),
      })
      .then(response => response.json())
      .then(data => {
        console.log("Odpowiedź API:", data);
        return true;
      })
      .catch(error => {
        console.error("Błąd API:", error);
        return false;
      });
    }
    
    console.error("Nieprawidłowy format tematu:", topic);
    return false;
  }

  // Prywatne metody do symulacji zachowania MQTT przez polling API
  _startStatusPolling() {
    this._stopStatusPolling(); // Upewnij się, że nie mamy dwóch interwałów
    
    this._pollingInterval = setInterval(() => {
      if (this.isConnected) {
        fetch("/api/devices/status")
          .then(response => response.json())
          .then(statuses => {
            // Emuluj wiadomości MQTT dla wszystkich urządzeń
            this._processDevicesStatus(statuses);
          })
          .catch(error => {
            console.error("Błąd pobierania statusów:", error);
          });
      }
    }, 5000); // Co 5 sekund
  }

  _stopStatusPolling() {
    if (this._pollingInterval) {
      clearInterval(this._pollingInterval);
      this._pollingInterval = null;
    }
  }

  _processDevicesStatus(statuses) {
    // Dla każdego urządzenia, symuluj wiadomości MQTT dla subskrybowanych tematów
    Object.entries(statuses).forEach(([deviceId, status]) => {
      // Podstawowy temat statusu
      const statusTopic = `iot/device/${deviceId}/status`;
      
      if (this.subscriptions[statusTopic] && status.status !== null) {
        this.subscriptions[statusTopic](status.status, statusTopic);
      }
      
      // Wartości urządzenia
      if (status.values) {
        Object.entries(status.values).forEach(([valueName, value]) => {
          const valueTopic = `iot/device/${deviceId}/value/${valueName}`;
          if (this.subscriptions[valueTopic]) {
            this.subscriptions[valueTopic](value, valueTopic);
          }
        });
      }
    });
  }
}


