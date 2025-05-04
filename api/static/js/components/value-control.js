// value-control.js - Panel sterowania wartością liczbową
class ValueControl extends Panel {
  constructor(config) {
    super(config);
    this.panelType = config.panelType || "slider"; // slider, input, selector
    this.min = config.min || 0;
    this.max = config.max || 100;
    this.step = config.step || 1;
    this.value = config.defaultValue || this.min;
    this.unit = config.unit || "";
    this.commandTopic = `${this.topic}/command`;
    this.valueTopic = config.valueTopic || `${this.topic}/value`;
  }

  createPanel() {
    const panel = super.createPanel();

    // Dodaj klasę typu panelu
    panel.classList.add("value-control", this.panelType);

    // Stwórz odpowiedni element kontrolny w zależności od typu
    switch (this.panelType) {
      case "slider":
        this.createSlider();
        break;
      case "toggle-slider": // Nowy typ - suwak z przełącznikiem ON/OFF
        this.createToggleSlider();
        break;
      case "input":
        this.createInput();
        break;
      case "selector":
        this.createSelector();
        break;
    }

    return panel;
  }

  createSlider() {
    const sliderContainer = document.createElement("div");
    sliderContainer.className = "slider-container";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = this.min;
    slider.max = this.max;
    slider.step = this.step;
    slider.value = this.value;
    slider.addEventListener("input", (e) => this.handleSliderChange(e));
    slider.addEventListener("change", (e) => this.handleSliderSet(e));

    const valueDisplay = document.createElement("div");
    valueDisplay.className = "slider-value";
    valueDisplay.textContent = `${this.value}${this.unit}`;

    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(valueDisplay);

    this.contentElement.appendChild(sliderContainer);
    this.controlElement = slider;
    this.valueDisplay = valueDisplay;
  }

  createToggleSlider() {
    const toggleSliderContainer = document.createElement("div");
    toggleSliderContainer.className = "toggle-slider-container";

    // Przełącznik ON/OFF
    const toggleContainer = document.createElement("div");
    toggleContainer.className = "toggle-container";

    const toggleLabel = document.createElement("label");
    toggleLabel.className = "switch";

    const toggleInput = document.createElement("input");
    toggleInput.type = "checkbox";
    toggleInput.checked = this.value > 0;
    toggleInput.addEventListener("change", (e) => this.handleToggle(e));

    const toggleSlider = document.createElement("span");
    toggleSlider.className = "slider";

    toggleLabel.appendChild(toggleInput);
    toggleLabel.appendChild(toggleSlider);
    toggleContainer.appendChild(toggleLabel);

    // Suwak wartości
    const sliderContainer = document.createElement("div");
    sliderContainer.className = "slider-container";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = this.min;
    slider.max = this.max;
    slider.step = this.step;
    slider.value = this.value;
    slider.disabled = !toggleInput.checked;
    slider.addEventListener("input", (e) => this.handleSliderChange(e));
    slider.addEventListener("change", (e) => this.handleSliderSet(e));

    const valueDisplay = document.createElement("div");
    valueDisplay.className = "slider-value";
    valueDisplay.textContent = toggleInput.checked
      ? `${this.value}${this.unit}`
      : "OFF";

    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(valueDisplay);

    toggleSliderContainer.appendChild(toggleContainer);
    toggleSliderContainer.appendChild(sliderContainer);

    this.contentElement.appendChild(toggleSliderContainer);
    this.controlElement = slider;
    this.toggleElement = toggleInput;
    this.valueDisplay = valueDisplay;
  }

  createInput() {
    const inputContainer = document.createElement("div");
    inputContainer.className = "input-container";

    const input = document.createElement("input");
    input.type = "number";
    input.min = this.min;
    input.max = this.max;
    input.step = this.step;
    input.value = this.value;
    input.addEventListener("change", (e) => this.handleInputChange(e));

    const unitLabel = document.createElement("span");
    unitLabel.className = "input-unit";
    unitLabel.textContent = this.unit;

    const setButton = document.createElement("button");
    setButton.className = "action-button";
    setButton.textContent = "Ustaw";
    setButton.addEventListener("click", () => this.handleButtonClick());

    inputContainer.appendChild(input);
    if (this.unit) inputContainer.appendChild(unitLabel);
    inputContainer.appendChild(setButton);

    this.contentElement.appendChild(inputContainer);
    this.controlElement = input;
  }

  createSelector() {
    const selectorContainer = document.createElement("div");
    selectorContainer.className = "selector-container";

    const select = document.createElement("select");
    if (this.options) {
      this.options.forEach((option) => {
        const optionElement = document.createElement("option");
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        select.appendChild(optionElement);
      });
    }
    select.value = this.value;
    select.addEventListener("change", (e) => this.handleSelectorChange(e));

    selectorContainer.appendChild(select);

    this.contentElement.appendChild(selectorContainer);
    this.controlElement = select;
  }

  // Obsługa zdarzeń
  handleSliderChange(event) {
    const value = parseFloat(event.target.value);
    this.value = value;

    if (this.valueDisplay) {
      if (this.panelType === "toggle-slider" && !this.toggleElement.checked) {
        this.valueDisplay.textContent = "OFF";
      } else {
        this.valueDisplay.textContent = `${value}${this.unit}`;
      }
    }
  }

  handleSliderSet(event) {
    const value = parseFloat(event.target.value);
    this.sendCommand(value.toString());
  }

  handleToggle(event) {
    const isChecked = event.target.checked;

    if (this.controlElement) {
      this.controlElement.disabled = !isChecked;
    }

    if (this.valueDisplay) {
      this.valueDisplay.textContent = isChecked
        ? `${this.value}${this.unit}`
        : "OFF";
    }

    this.sendCommand(isChecked ? this.value.toString() : "0");
  }

  handleInputChange(event) {
    this.value = parseFloat(event.target.value);
  }

  handleButtonClick() {
    this.sendCommand(this.value.toString());
  }

  handleSelectorChange(event) {
    this.value = event.target.value;
    this.sendCommand(this.value);
  }

  // Wysyłanie komendy
  sendCommand(command) {
    if (window.mqttClient && this.isConnected) {
      window.mqttClient.publish(this.commandTopic, command);
      console.log(`Sent command to ${this.commandTopic}: ${command}`);
    } else {
      console.log(`Device ${this.id} is offline or MQTT not connected`);
      // Alternatywnie można wysłać przez API
      fetch(`/api/device/${this.id}/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command }),
      });
    }
  }

  // Aktualizacja stanu
  updateContent(data, topic) {
    if (data) {
      // Obsługa danych przychodzących z MQTT
      let value;
      try {
        value = parseFloat(data);
        if (isNaN(value)) {
          value = data === "on" ? this.max : data === "off" ? 0 : this.value;
        }
      } catch (e) {
        value = this.value;
      }

      this.value = value;

      if (this.panelType === "toggle-slider") {
        const isOn = value > 0;
        if (this.toggleElement) {
          this.toggleElement.checked = isOn;
        }
        if (this.controlElement) {
          this.controlElement.disabled = !isOn;
          this.controlElement.value = value;
        }
        if (this.valueDisplay) {
          this.valueDisplay.textContent = isOn ? `${value}${this.unit}` : "OFF";
        }
      } else {
        if (this.controlElement) {
          this.controlElement.value = value;
        }
        if (this.valueDisplay) {
          this.valueDisplay.textContent = `${value}${this.unit}`;
        }
      }
    }
  }
}
