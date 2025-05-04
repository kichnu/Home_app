// indicator-display.js - Panel wskaźników stanu
class IndicatorDisplay extends Panel {
  constructor(config) {
    super(config);
    this.indicators = config.indicators || [
      { id: "main", label: "Status", state: false },
    ];
    this.stateTopic = `${this.topic}/status`;
    this.stateValues = config.stateValues || {
      on: true,
      off: false,
      1: true,
      0: false,
    };
  }

  createPanel() {
    const panel = super.createPanel();
    panel.classList.add("indicator-display");

    this.createIndicators();

    return panel;
  }

  createIndicators() {
    const indicatorsContainer = document.createElement("div");
    indicatorsContainer.className = "indicators-container";

    this.indicatorElements = {};

    this.indicators.forEach((indicator) => {
      const indicatorWrapper = document.createElement("div");
      indicatorWrapper.className = "indicator-wrapper";

      const indicatorElement = document.createElement("div");
      indicatorElement.className = "indicator";

      const indicatorLight = document.createElement("div");
      indicatorLight.className = `indicator-light ${
        indicator.state ? "on" : "off"
      }`;
      indicatorLight.setAttribute("data-indicator-id", indicator.id);

      const indicatorLabel = document.createElement("span");
      indicatorLabel.className = "indicator-text";
      indicatorLabel.textContent = indicator.label;

      const indicatorStatus = document.createElement("span");
      indicatorStatus.className = "indicator-status";
      indicatorStatus.textContent = indicator.state ? "ON" : "OFF";

      indicatorElement.appendChild(indicatorLight);
      indicatorElement.appendChild(indicatorLabel);
      indicatorElement.appendChild(indicatorStatus);

      // Dodajemy tooltip z informacją o stanie
      indicatorWrapper.appendChild(indicatorElement);

      const tooltip = document.createElement("div");
      tooltip.className = "indicator-tooltip";
      tooltip.textContent = indicator.state ? "Aktywny" : "Nieaktywny";
      indicatorWrapper.appendChild(tooltip);

      indicatorsContainer.appendChild(indicatorWrapper);

      // Zapisujemy referencje do elementów
      this.indicatorElements[indicator.id] = {
        light: indicatorLight,
        status: indicatorStatus,
        tooltip: tooltip,
      };
    });

    this.contentElement.appendChild(indicatorsContainer);
  }

  // Aktualizacja stanu wskaźników
  updateIndicator(indicatorId, state) {
    if (this.indicatorElements[indicatorId]) {
      const indicator = this.indicatorElements[indicatorId];
      const isActive = Boolean(state);

      indicator.light.className = `indicator-light ${isActive ? "on" : "off"}`;
      indicator.status.textContent = isActive ? "ON" : "OFF";
      indicator.tooltip.textContent = isActive ? "Aktywny" : "Nieaktywny";
    }
  }

  // Aktualizacja wszystkich wskaźników
  updateContent(data, topic) {
    if (data) {
      if (topic === this.stateTopic) {
        // Aktualizacja głównego wskaźnika
        const state =
          this.stateValues[data] !== undefined ? this.stateValues[data] : false;
        this.updateIndicator("main", state);
      } else {
        // Sprawdź czy to temat szczegółowy dla konkretnego wskaźnika
        const topicParts = topic.split("/");
        const lastPart = topicParts[topicParts.length - 1];

        // Znajdź wskaźnik po ID lub etykiecie
        const matchingIndicator = this.indicators.find(
          (ind) =>
            ind.id === lastPart ||
            ind.label.toLowerCase().replace(/\s+/g, "_") === lastPart
        );

        if (matchingIndicator) {
          const state =
            this.stateValues[data] !== undefined
              ? this.stateValues[data]
              : false;
          this.updateIndicator(matchingIndicator.id, state);
        }
      }
    }
  }
}
