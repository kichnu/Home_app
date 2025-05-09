// mqtt-client.js - Klient MQTT do komunikacji z brokerem
class MQTTClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.subscriptions = {}; // Słownik: temat => callback

    // Pobierz dane konfiguracyjne z API lub użyj domyślnych
    this.broker = window.location.hostname;
    this.port = 9001; // Port WebSocket domyślnie 9001 lub 8883 dla SSL
    this.clientId = "web_" + Math.random().toString(16).substring(2, 10);
  }

  connect() {
    if (this.isConnected) {
      console.log("MQTT już połączony");
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${protocol}://${this.broker}:${this.port}`;

    console.log("Łączenie z MQTT:", url);

    try {
      this.client = mqtt.connect(url, {
        clientId: this.clientId,
        clean: true,
        username: "admin", // Dodaj nazwę użytkownika
        password: "QNzNMsUFLpcG2qTc", // Dodaj hasło (to które ustawiłeś wcześniej)
        reconnectPeriod: 5000,
        connectTimeout: 30000,
      });

      this.client.on("connect", () => {
        console.log("Połączono z MQTT");
        this.isConnected = true;
        window.dispatchEvent(new Event("mqtt-connected"));

        // Odnów subskrypcje
        Object.keys(this.subscriptions).forEach((topic) => {
          this._internalSubscribe(topic);
        });
      });

      this.client.on("reconnect", () => {
        console.log("Ponowne łączenie z MQTT");
        window.dispatchEvent(new Event("mqtt-reconnecting"));
      });

      this.client.on("message", (topic, message) => {
        const messageStr = message.toString();
        console.log(`Otrzymano wiadomość z ${topic}:`, messageStr);

        // Wywołaj callback dla tego tematu jeśli istnieje
        if (this.subscriptions[topic]) {
          this.subscriptions[topic](messageStr, topic);
        }
      });

      this.client.on("error", (error) => {
        console.error("Błąd MQTT:", error);
        window.dispatchEvent(
          new CustomEvent("mqtt-error", { detail: error.message })
        );
      });

      this.client.on("offline", () => {
        console.log("MQTT offline");
        this.isConnected = false;
        window.dispatchEvent(new Event("mqtt-disconnected"));
      });

      this.client.on("close", () => {
        console.log("Połączenie MQTT zamknięte");
        this.isConnected = false;
        window.dispatchEvent(new Event("mqtt-disconnected"));
      });
    } catch (error) {
      console.error("Błąd inicjalizacji MQTT:", error);
      window.dispatchEvent(
        new CustomEvent("mqtt-error", { detail: error.message })
      );
    }
  }

  disconnect() {
    if (this.client && this.isConnected) {
      this.client.end();
      this.isConnected = false;
      console.log("Rozłączono z MQTT");
    }
  }

  subscribe(topic, callback) {
    this.subscriptions[topic] = callback;

    if (this.isConnected) {
      this._internalSubscribe(topic);
    }
  }

  _internalSubscribe(topic) {
    this.client.subscribe(topic, (err) => {
      if (err) {
        console.error(`Błąd subskrypcji ${topic}:`, err);
        window.dispatchEvent(
          new CustomEvent("mqtt-error", {
            detail: `Błąd subskrypcji ${topic}: ${err.message}`,
          })
        );
      } else {
        console.log(`Zasubskrybowano temat: ${topic}`);
      }
    });
  }

  unsubscribe(topic) {
    if (this.subscriptions[topic]) {
      delete this.subscriptions[topic];

      if (this.isConnected) {
        this.client.unsubscribe(topic, (err) => {
          if (err) {
            console.error(`Błąd anulowania subskrypcji ${topic}:`, err);
          } else {
            console.log(`Anulowano subskrypcję tematu: ${topic}`);
          }
        });
      }
    }
  }

  publish(topic, message) {
    if (!this.isConnected) {
      console.error("Nie można opublikować wiadomości - brak połączenia MQTT");
      return false;
    }

    try {
      this.client.publish(topic, message.toString());
      console.log(`Opublikowano wiadomość do ${topic}:`, message);
      return true;
    } catch (error) {
      console.error(`Błąd publikacji do ${topic}:`, error);
      return false;
    }
  }
}
