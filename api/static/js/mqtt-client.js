// // mqtt-client.js - Klient MQTT do komunikacji z brokerem
// class MQTTClient {
//   constructor() {
//     this.client = null;
//     this.isConnected = false;
//     this.subscriptions = {}; // Słownik: temat => callback

//     // Pobierz dane konfiguracyjne z API lub użyj domyślnych
//     this.broker = window.location.hostname;
//     this.port = 9001; // Port WebSocket domyślnie 9001 lub 8883 dla SSL
//     this.clientId = "web_" + Math.random().toString(16).substring(2, 10);
//   }

//   connect() {
//     if (this.isConnected) {
//       console.log("MQTT już połączony");
//       return;
//     }

//     const protocol = window.location.protocol === "https:" ? "wss" : "ws";
//     const url = `${protocol}://${this.broker}:${this.port}`;

//     console.log("Łączenie z MQTT:", url);

//     this.connectTimeout = setTimeout(() => {
//     console.log("Timeout połączenia MQTT - przełączam na API");
//     this.isConnected = false;
//     window.dispatchEvent(new Event("mqtt-timeout"));
//     }, 5000);

//     try {
//       this.client = mqtt.connect(url, {
//         clientId: this.clientId,
//         clean: true,
//         username: "iot_devices", // Dodaj nazwę użytkownika
//         password: "QNzNMsUFLpcG2qTc", // Dodaj hasło (to które ustawiłeś wcześniej)
//         reconnectPeriod: 5000,
//         connectTimeout: 30000,
//       });

//       this.client.on("connect", () => {
//         console.log("Połączono z MQTT");
//         this.isConnected = true;
//         window.dispatchEvent(new Event("mqtt-connected"));

//         // Odnów subskrypcje
//         Object.keys(this.subscriptions).forEach((topic) => {
//           this._internalSubscribe(topic);
//         });
//       });

//       this.client.on("reconnect", () => {
//         console.log("Ponowne łączenie z MQTT");
//         window.dispatchEvent(new Event("mqtt-reconnecting"));
//       });

//       this.client.on("message", (topic, message) => {
//         const messageStr = message.toString();
//         console.log(`Otrzymano wiadomość z ${topic}:`, messageStr);

//         // Wywołaj callback dla tego tematu jeśli istnieje
//         if (this.subscriptions[topic]) {
//           this.subscriptions[topic](messageStr, topic);
//         }
//       });

//       this.client.on("error", (error) => {
//         console.error("Błąd MQTT:", error);
//         window.dispatchEvent(
//           new CustomEvent("mqtt-error", { detail: error.message })
//         );
//       });

//       this.client.on("offline", () => {
//         console.log("MQTT offline");
//         this.isConnected = false;
//         window.dispatchEvent(new Event("mqtt-disconnected"));
//       });

//       this.client.on("close", () => {
//         console.log("Połączenie MQTT zamknięte");
//         this.isConnected = false;
//         window.dispatchEvent(new Event("mqtt-disconnected"));
//       });
//     } catch (error) {
//       console.error("Błąd inicjalizacji MQTT:", error);
//       window.dispatchEvent(
//         new CustomEvent("mqtt-error", { detail: error.message })
//       );
//     }
//   }

//   disconnect() {
//     if (this.client && this.isConnected) {
//       this.client.end();
//       this.isConnected = false;
//       console.log("Rozłączono z MQTT");
//     }
//   }

//   subscribe(topic, callback) {
//     this.subscriptions[topic] = callback;

//     if (this.isConnected) {
//       this._internalSubscribe(topic);
//     }
//   }

//   _internalSubscribe(topic) {
//     this.client.subscribe(topic, (err) => {
//       if (err) {
//         console.error(`Błąd subskrypcji ${topic}:`, err);
//         window.dispatchEvent(
//           new CustomEvent("mqtt-error", {
//             detail: `Błąd subskrypcji ${topic}: ${err.message}`,
//           })
//         );
//       } else {
//         console.log(`Zasubskrybowano temat: ${topic}`);
//       }
//     });
//   }

//   unsubscribe(topic) {
//     if (this.subscriptions[topic]) {
//       delete this.subscriptions[topic];

//       if (this.isConnected) {
//         this.client.unsubscribe(topic, (err) => {
//           if (err) {
//             console.error(`Błąd anulowania subskrypcji ${topic}:`, err);
//           } else {
//             console.log(`Anulowano subskrypcję tematu: ${topic}`);
//           }
//         });
//       }
//     }
//   }

//   publish(topic, message) {
//     if (!this.isConnected) {
//       console.error("Nie można opublikować wiadomości - brak połączenia MQTT");
//       return false;
//     }

//     try {
//       this.client.publish(topic, message.toString());
//       console.log(`Opublikowano wiadomość do ${topic}:`, message);
//       return true;
//     } catch (error) {
//       console.error(`Błąd publikacji do ${topic}:`, error);
//       return false;
//     }
//   }
// }

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


