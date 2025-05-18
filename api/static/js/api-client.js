// api-client.js - Klient API do komunikacji z backendem
class APIClient {
  constructor() {
    this.baseUrl = "/api";
  }

  async checkStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/status`);
      if (!response.ok) {
        throw new Error(`Status HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Błąd sprawdzania statusu API:", error);
      throw error;
    }
  }

  async getDevices() {
    try {
      const response = await fetch(`${this.baseUrl}/devices`);
      if (!response.ok) {
        throw new Error(`Status HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Błąd pobierania listy urządzeń:", error);
      throw error;
    }
  }

  async getRooms() {
    try {
      const response = await fetch(`${this.baseUrl}/rooms`);
      if (!response.ok) {
        throw new Error(`Status HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Błąd pobierania listy pomieszczeń:", error);
      throw error;
    }
  }

  // async getDeviceStatus(deviceId) {
  //   try {
  //     const response = await fetch(`${this.baseUrl}/device/${deviceId}/status`);
  //     if (!response.ok) {
  //       throw new Error(`Status HTTP: ${response.status}`);
  //     }
  //     return await response.json();
  //   } catch (error) {
  //     console.error(`Błąd pobierania statusu urządzenia ${deviceId}:`, error);
  //     throw error;
  //   }
  // }

    async getDevicesStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/devices/status`);
      if (!response.ok) {
        throw new Error(`Status HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Błąd pobierania statusu urządzeń:", error);
      throw error;
    }
  }




  async controlDevice(deviceId, command) {
    try {
      const response = await fetch(
        `${this.baseUrl}/device/${deviceId}/control`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ command }),
        }
      );
      if (!response.ok) {
        throw new Error(`Status HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Błąd sterowania urządzeniem ${deviceId}:`, error);
      throw error;
    }
  }

  async addDevice(deviceData) {
    try {
      const response = await fetch(`${this.baseUrl}/devices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deviceData),
      });
      if (!response.ok) {
        throw new Error(`Status HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Błąd dodawania urządzenia:", error);
      throw error;
    }
  }

  async updateDevice(deviceId, deviceData) {
    try {
      const response = await fetch(`${this.baseUrl}/device/${deviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deviceData),
      });
      if (!response.ok) {
        throw new Error(`Status HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Błąd aktualizacji urządzenia ${deviceId}:`, error);
      throw error;
    }
  }

  async deleteDevice(deviceId) {
    try {
      const response = await fetch(`${this.baseUrl}/device/${deviceId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Status HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Błąd usuwania urządzenia ${deviceId}:`, error);
      throw error;
    }
  }
}
