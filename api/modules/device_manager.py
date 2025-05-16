# modules/device_manager.py
import os
import json
import time


class DeviceManager:
    def __init__(self, config):
        """
        Inicjalizacja menedżera urządzeń.
        """
        self.config = config
        self.devices_file = os.path.join(
            config.get("STATIC_DIR", "static"), "config", "devices.json"
        )
        self.devices = []
        self.rooms = []
        self.devices_status = {}
        self._load_configuration()

    def _load_configuration(self):
        """
        Ładuje konfigurację urządzeń z pliku.
        """
        try:
            # Upewnij się, że katalog istnieje
            os.makedirs(os.path.dirname(self.devices_file), exist_ok=True)

            # Jeśli plik nie istnieje, utwórz go z pustą konfiguracją
            if not os.path.exists(self.devices_file):
                default_config = {"devices": [], "rooms": []}
                with open(self.devices_file, "w", encoding="utf-8") as f:
                    json.dump(default_config, f, indent=2, ensure_ascii=False)

            # Załaduj konfigurację
            with open(self.devices_file, "r", encoding="utf-8") as f:
                config = json.load(f)
                self.devices = config.get("devices", [])
                self.rooms = config.get("rooms", [])

            # Inicjalizuj status urządzeń
            for device in self.devices:
                self.devices_status[device["id"]] = {
                    "online": False,
                    "last_seen": None,
                    "status": None,
                    "values": {},
                }
        except Exception as e:
            print(f"Błąd ładowania konfiguracji: {str(e)}")
            # Inicjalizuj z pustymi listami w przypadku błędu
            self.devices = []
            self.rooms = []

    def _save_configuration(self):
        """
        Zapisuje konfigurację urządzeń do pliku.
        """
        try:
            config = {"devices": self.devices, "rooms": self.rooms}
            with open(self.devices_file, "w", encoding="utf-8") as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Błąd zapisywania konfiguracji: {str(e)}")
            return False

    def get_all_devices(self):
        """
        Zwraca listę wszystkich urządzeń.
        """
        return self.devices

    def get_all_rooms(self):
        """
        Zwraca listę wszystkich pomieszczeń.
        """
        return self.rooms

    def get_device(self, device_id):
        """
        Zwraca dane urządzenia o podanym ID.
        """
        for device in self.devices:
            if device["id"] == device_id:
                return device
        return None

    def get_device_status(self, device_id):
        """
        Zwraca status urządzenia o podanym ID.
        """
        if device_id in self.devices_status:
            return self.devices_status[device_id]
        return None

    def get_all_devices_status(self):
        """
        Zwraca status wszystkich urządzeń.
        """
        return self.devices_status

    def add_device(self, device_data):
        """
        Dodaje nowe urządzenie.
        """
        # Sprawdź, czy urządzenie o takim ID już istnieje
        for device in self.devices:
            if device["id"] == device_data["id"]:
                return False, "Urządzenie o takim ID już istnieje"

        # Dodaj urządzenie
        self.devices.append(device_data)

        # Inicjalizuj status urządzenia
        self.devices_status[device_data["id"]] = {
            "online": False,
            "last_seen": None,
            "status": None,
            "values": {},
        }

        # Zapisz konfigurację
        if self._save_configuration():
            return True, "Urządzenie dodane pomyślnie"
        else:
            # Usuń urządzenie, jeśli zapis się nie powiedzie
            self.devices.pop()
            if device_data["id"] in self.devices_status:
                del self.devices_status[device_data["id"]]
            return False, "Błąd zapisywania konfiguracji"

    def update_device(self, device_id, device_data):
        """
        Aktualizuje istniejące urządzenie.
        """
        # Znajdź urządzenie o podanym ID
        for i, device in enumerate(self.devices):
            if device["id"] == device_id:
                # Zaktualizuj urządzenie
                self.devices[i] = device_data

                # Zapisz konfigurację
                if self._save_configuration():
                    return True, "Urządzenie zaktualizowane pomyślnie"
                else:
                    # Przywróć poprzednie dane, jeśli zapis się nie powiedzie
                    self.devices[i] = device
                    return False, "Błąd zapisywania konfiguracji"

        return False, "Urządzenie o podanym ID nie istnieje"

    def delete_device(self, device_id):
        """
        Usuwa urządzenie.
        """
        # Znajdź urządzenie o podanym ID
        for i, device in enumerate(self.devices):
            if device["id"] == device_id:
                # Usuń urządzenie
                removed_device = self.devices.pop(i)

                # Usuń status urządzenia
                if device_id in self.devices_status:
                    del self.devices_status[device_id]

                # Zapisz konfigurację
                if self._save_configuration():
                    return True, "Urządzenie usunięte pomyślnie"
                else:
                    # Przywróć urządzenie, jeśli zapis się nie powiedzie
                    self.devices.insert(i, removed_device)
                    self.devices_status[device_id] = {
                        "online": False,
                        "last_seen": None,
                        "status": None,
                        "values": {},
                    }
                    return False, "Błąd zapisywania konfiguracji"

        return False, "Urządzenie o podanym ID nie istnieje"

    def add_room(self, room_data):
        """
        Dodaje nowe pomieszczenie.
        """
        # Sprawdź, czy pomieszczenie o takim ID już istnieje
        for room in self.rooms:
            if room["id"] == room_data["id"]:
                return False, "Pomieszczenie o takim ID już istnieje"

        # Dodaj pomieszczenie
        self.rooms.append(room_data)

        # Zapisz konfigurację
        if self._save_configuration():
            return True, "Pomieszczenie dodane pomyślnie"
        else:
            # Usuń pomieszczenie, jeśli zapis się nie powiedzie
            self.rooms.pop()
            return False, "Błąd zapisywania konfiguracji"

    def update_room(self, room_id, room_data):
        """
        Aktualizuje istniejące pomieszczenie.
        """
        # Znajdź pomieszczenie o podanym ID
        for i, room in enumerate(self.rooms):
            if room["id"] == room_id:
                # Zaktualizuj pomieszczenie
                self.rooms[i] = room_data

                # Zapisz konfigurację
                if self._save_configuration():
                    return True, "Pomieszczenie zaktualizowane pomyślnie"
                else:
                    # Przywróć poprzednie dane, jeśli zapis się nie powiedzie
                    self.rooms[i] = room
                    return False, "Błąd zapisywania konfiguracji"

        return False, "Pomieszczenie o podanym ID nie istnieje"

    def delete_room(self, room_id):
        """
        Usuwa pomieszczenie.
        """
        # Znajdź pomieszczenie o podanym ID
        for i, room in enumerate(self.rooms):
            if room["id"] == room_id:
                # Usuń pomieszczenie
                removed_room = self.rooms.pop(i)

                # Zapisz konfigurację
                if self._save_configuration():
                    return True, "Pomieszczenie usunięte pomyślnie"
                else:
                    # Przywróć pomieszczenie, jeśli zapis się nie powiedzie
                    self.rooms.insert(i, removed_room)
                    return False, "Błąd zapisywania konfiguracji"

        return False, "Pomieszczenie o podanym ID nie istnieje"

    def update_device_status_from_mqtt(self, topic, payload):
        """
        Aktualizuje status urządzenia na podstawie wiadomości MQTT.
        """
        # Przykład tematu: iot/device/kitchen_light/status
        # lub: iot/device/living_room_temp/value/temperature
        parts = topic.split("/")

        if len(parts) < 3:
            return False

        # Sprawdź format tematu
        if parts[0] == "iot" and parts[1] == "device":
            device_id = parts[2]

            # Znajdź urządzenie o podanym ID
            device = self.get_device(device_id)
            if not device:
                return False

            # Aktualizuj status urządzenia
            if device_id not in self.devices_status:
                self.devices_status[device_id] = {
                    "online": True,
                    "last_seen": time.time(),
                    "status": None,
                    "values": {},
                }

            # Oznacz urządzenie jako online i zaktualizuj czas ostatniego kontaktu
            self.devices_status[device_id]["online"] = True
            self.devices_status[device_id]["last_seen"] = time.time()

            # Jeśli to wiadomość statusu
            if len(parts) >= 4 and parts[3] == "status":
                self.devices_status[device_id]["status"] = payload

            # Jeśli to wiadomość wartości
            elif len(parts) >= 5 and parts[3] == "value":
                value_name = parts[4]
                self.devices_status[device_id]["values"][value_name] = payload

            return True

        return False

    def send_command(self, device_id, command, mqtt_client):
        """
        Wysyła komendę do urządzenia przez MQTT.

        Args:
            device_id (str): ID urządzenia
            command (str or dict): Komenda do wysłania - może być stringiem lub słownikiem dla złożonych komend
            mqtt_client: Klient MQTT

        Returns:
            bool: Status operacji
        """
        # Znajdź urządzenie o podanym ID
        device = self.get_device(device_id)
        if not device:
            return False

        # Ustaw temat komendy
        command_topic = f"{device['topic']}/command"
        
        # Konwertuj komendę do JSON jeśli to słownik
        command_str = command
        if isinstance(command, dict):
            import json
            command_str = json.dumps(command)
        
        # Wyślij komendę
        return mqtt_client.publish(command_topic, command_str)

    def handle_toggle_slider_command(self, device_id, command_str, mqtt_client):
        """
        Obsługuje komendę dla przełącznika ze sliderem.
        
        Args:
            device_id (str): ID urządzenia
            command_str (str): Komenda do przetworzenia
            mqtt_client: Klient MQTT
            
        Returns:
            bool: Status operacji
        """
        # Analizuj komendę
        try:
            value = float(command_str)
            # Logika dla przełącznika ze sliderem - wartość 0 to OFF, wszystko inne to wartość ON
            if value == 0:
                # Urządzenie wyłączone
                status = "off"
            else:
                # Urządzenie włączone z określoną wartością
                status = "on"
                
            device = self.get_device(device_id)
            if not device:
                return False
                
            # Aktualizuj status urządzenia
            status_topic = f"{device['topic']}/status"
            mqtt_client.publish(status_topic, status)
            
            # Aktualizuj wartość urządzenia
            value_topic = f"{device['topic']}/value"
            mqtt_client.publish(value_topic, str(value))
            
            return True
        except (ValueError, TypeError):
            return False
