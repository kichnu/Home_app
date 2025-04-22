// panel.js - Bazowa klasa panelu
class Panel {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.topic = config.topic;
    this.room = config.room;
    this.element = null;
    this.isConnected = false;
  }

  // Tworzenie elementu DOM panelu
  createPanel() {
    const panel = document.createElement("div");
    panel.id = `panel-${this.id}`;
    panel.className = "panel";
    panel.dataset.deviceId = this.id;
    panel.dataset.room = this.room;

    const header = document.createElement("div");
    header.className = "panel-header";
    header.innerHTML = `<h3>${this.name}</h3>`;

    const content = document.createElement("div");
    content.className = "panel-content";

    const footer = document.createElement("div");
    footer.className = "panel-footer";
    footer.innerHTML = `<span class="status-indicator" id="status-${this.id}">Offline</span>`;

    panel.appendChild(header);
    panel.appendChild(content);
    panel.appendChild(footer);

    this.element = panel;
    this.contentElement = content;
    this.statusElement = footer.querySelector(".status-indicator");

    return panel;
  }

  // Metoda do aktualizacji statusu połączenia
  updateConnectionStatus(isConnected) {
    this.isConnected = isConnected;
    if (this.statusElement) {
      this.statusElement.textContent = isConnected ? "Online" : "Offline";
      this.statusElement.className = `status-indicator ${
        isConnected ? "connected" : "disconnected"
      }`;
    }
  }

  // Metoda do aktualizacji zawartości panelu - do nadpisania w klasach pochodnych
  updateContent(data) {
    console.log(`Updating content for ${this.id}:`, data);
  }

  // Metoda do obsługi zdarzeń - do nadpisania w klasach pochodnych
  handleEvent(event) {
    console.log(`Handling event for ${this.id}:`, event);
  }
}
