// panel-factory.js - Fabryka paneli
class PanelFactory {
  static createPanel(deviceConfig) {
    if (!deviceConfig || !deviceConfig.panel) {
      console.error("Nieprawidłowa konfiguracja urządzenia:", deviceConfig);
      return null;
    }

    let panel;

    switch (deviceConfig.panel) {
      case "BinaryControl":
        panel = new BinaryControl(deviceConfig);
        break;
      case "ValueDisplay":
        panel = new ValueDisplay(deviceConfig);
        break;
      case "ValueControl":
        panel = new ValueControl(deviceConfig);
        break;
      case "IndicatorDisplay":
        panel = new IndicatorDisplay(deviceConfig);
        break;
      default:
        console.error(`Nieznany typ panelu: ${deviceConfig.panel}`);
        return null;
    }

    return panel;
  }
}
