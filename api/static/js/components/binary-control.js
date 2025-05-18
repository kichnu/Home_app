// binary-control.js - Panel sterowania wartością binarną
class BinaryControl extends Panel {
  constructor(config) {
    super(config);
    this.panelType = config.panelType || "toggle"; // toggle, button, indicator
    this.state = false;
    this.commandTopic = `${this.topic}/command`;
    this.statusTopic = `${this.topic}/status`;
  }

  createPanel() {
    const panel = super.createPanel();

    // Dodaj klasę typu panelu
    panel.classList.add("binary-control", this.panelType);

    // Stwórz odpowiedni element kontrolny w zależności od typu
    switch (this.panelType) {
      case "toggle":
        this.createToggle();
        break;
      case "button":
        this.createButton();
        break;
      case "indicator":
        this.createIndicator();
        break;
    }

    return panel;
  }

  createToggle() {
    const toggleContainer = document.createElement("div");
    toggleContainer.className = "toggle-container";

    const label = document.createElement("label");
    label.className = "switch";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = this.state;
    input.addEventListener("change", (e) => this.handleToggle(e));

    const slider = document.createElement("span");
    slider.className = "slider";

    label.appendChild(input);
    label.appendChild(slider);
    toggleContainer.appendChild(label);

    this.contentElement.appendChild(toggleContainer);
    this.controlElement = input;
  }

  createButton() {
    const button = document.createElement("button");
    button.className = "action-button";
    button.textContent = config.buttonText || "Wykonaj";
    button.addEventListener("click", (e) => this.handleButton(e));

    this.contentElement.appendChild(button);
    this.controlElement = button;
  }

  createIndicator() {
    const indicator = document.createElement("div");
    indicator.className = "indicator";
    indicator.innerHTML = `<div class="indicator-light ${
      this.state ? "on" : "off"
    }"></div>
                           <span class="indicator-text">${
                             this.state ? "Włączony" : "Wyłączony"
                           }</span>`;

    this.contentElement.appendChild(indicator);
    this.controlElement = indicator;
  }

  // Obsługa zdarzeń
  handleToggle(event) {
    const newState = event.target.checked;
    this.sendCommand(newState ? "on" : "off");
  }

  handleButton(event) {
    this.sendCommand("trigger");
  }


sendCommand(command) {
  console.log(`Wysyłanie komendy dla ${this.id}: ${command}`);
  
  fetch(`/api/device/${this.id}/control`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ command }),
  })
  .then(response => response.json())
  .then(data => {
    console.log("Odpowiedź API:", data);
    // Opcjonalnie: automatyczna aktualizacja UI po potwierdzeniu
    if (data.status === "ok") {
      // Aktualizuj UI w zależności od typu kontrolki
      if (this.panelType === "toggle-slider") {
        // Kod aktualizacji dla toggle-slider
      } else if (this.panelType === "toggle") {
        // Kod aktualizacji dla toggle
      }
    }
  })
  .catch(error => {
    console.error("Błąd API:", error);
  });
}




  // Aktualizacja stanu
  updateContent(data) {
    if (data && typeof data === "string") {
      const newState = data === "on";
      this.state = newState;

      if (this.panelType === "toggle" && this.controlElement) {
        this.controlElement.checked = newState;
      } else if (this.panelType === "indicator" && this.controlElement) {
        const light = this.controlElement.querySelector(".indicator-light");
        const text = this.controlElement.querySelector(".indicator-text");

        if (light)
          light.className = `indicator-light ${newState ? "on" : "off"}`;
        if (text) text.textContent = newState ? "Włączony" : "Wyłączony";
      }
    }
  }
}
