# modules/mqtt_client.py
import paho.mqtt.client as mqtt
import json
import time
import threading


class MQTTClient:
    def __init__(self, broker, port, username, password, keepalive, logger):
        """
        Inicjalizacja klienta MQTT.
        """
        self.broker = broker
        self.port = port
        self.username = username
        self.password = password
        self.keepalive = keepalive
        self.logger = logger
        self.client = mqtt.Client()
        self.client.username_pw_set(username, password)
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect
        self._connected = False
        self.device_manager = None
        self.topics = {}  # Słownik tematów i ich callbacków

    def set_device_manager(self, device_manager):
        """
        Ustawia referencję do menedżera urządzeń.
        """
        self.device_manager = device_manager

    def connect(self):
        """
        Nawiązuje połączenie z brokerem MQTT.
        """
        try:
            self.client.connect(self.broker, self.port, self.keepalive)
            self.client.loop_start()
            self.logger.info("Próba połączenia z brokerem MQTT")

            # Poczekaj na połączenie
            timeout = 5  # sekundy
            start_time = time.time()
            while not self._connected and time.time() - start_time < timeout:
                time.sleep(0.1)

            if self._connected:
                self.logger.info("Połączono z brokerem MQTT")
                # Subskrybuj tematy dla wszystkich urządzeń
                if self.device_manager:
                    self._subscribe_to_all_devices()
                return True
            else:
                self.logger.error(
                    "Nie udało się połączyć z brokerem MQTT w określonym czasie"
                )
                return False
        except Exception as e:
            self.logger.error(f"Błąd połączenia MQTT: {str(e)}")
            return False

    def disconnect(self):
        """
        Zamyka połączenie z brokerem MQTT.
        """
        self.client.loop_stop()
        self.client.disconnect()
        self._connected = False
        self.logger.info("Rozłączono z brokerem MQTT")

    def is_connected(self):
        """
        Sprawdza, czy połączenie z brokerem MQTT jest aktywne.
        """
        return self._connected

    def publish(self, topic, message):
        """
        Publikuje wiadomość MQTT.

        Args:
            topic (str): Temat MQTT
            message (str): Wiadomość do wysłania

        Returns:
            bool: Status operacji
        """
        try:
            self.client.publish(topic, message)
            self.logger.info(f"Wysłano wiadomość do {topic}: {message}")
            return True
        except Exception as e:
            self.logger.error(f"Błąd publikacji MQTT: {str(e)}")
            return False

    def subscribe(self, topic, callback=None):
        """
        Subskrybuje temat MQTT.

        Args:
            topic (str): Temat do subskrypcji
            callback (function, optional): Funkcja wywoływana po otrzymaniu wiadomości

        Returns:
            bool: Status operacji
        """
        try:
            self.client.subscribe(topic)
            if callback:
                self.topics[topic] = callback
            self.logger.info(f"Zasubskrybowano temat: {topic}")
            return True
        except Exception as e:
            self.logger.error(f"Błąd subskrypcji MQTT: {str(e)}")
            return False

    def unsubscribe(self, topic):
        """
        Anuluje subskrypcję tematu MQTT.

        Args:
            topic (str): Temat do anulowania subskrypcji

        Returns:
            bool: Status operacji
        """
        try:
            self.client.unsubscribe(topic)
            if topic in self.topics:
                del self.topics[topic]
            self.logger.info(f"Anulowano subskrypcję tematu: {topic}")
            return True
        except Exception as e:
            self.logger.error(f"Błąd anulowania subskrypcji MQTT: {str(e)}")
            return False

    def _on_connect(self, client, userdata, flags, rc):
        """
        Callback wywoływany po nawiązaniu połączenia.
        """
        if rc == 0:
            self._connected = True
            self.logger.info("Połączono z brokerem MQTT")
            # Subskrybuj wszystkie tematy
            for topic in self.topics:
                client.subscribe(topic)
                self.logger.info(f"Ponownie zasubskrybowano temat: {topic}")
        else:
            self._connected = False
            self.logger.error(f"Błąd połączenia MQTT, kod: {rc}")

    def _on_message(self, client, userdata, msg):
        """
        Callback wywoływany po otrzymaniu wiadomości.
        """
        try:
            topic = msg.topic
            payload = msg.payload.decode("utf-8")
            self.logger.info(f"Otrzymano wiadomość z {topic}: {payload}")

            # Wywołaj callback dla tego tematu jeśli istnieje
            if topic in self.topics and self.topics[topic]:
                self.topics[topic](payload, topic)

            # Aktualizuj stan urządzenia w menedżerze urządzeń
            if self.device_manager:
                self.device_manager.update_device_status_from_mqtt(topic, payload)
        except Exception as e:
            self.logger.error(f"Błąd przetwarzania wiadomości MQTT: {str(e)}")

    def _on_disconnect(self, client, userdata, rc):
        """
        Callback wywoływany po rozłączeniu.
        """
        self._connected = False
        if rc != 0:
            self.logger.warning(f"Nieoczekiwane rozłączenie MQTT, kod: {rc}")
            # Próba ponownego połączenia
            threading.Timer(5.0, self.connect).start()
        else:
            self.logger.info("Rozłączono z brokerem MQTT")

    def _subscribe_to_all_devices(self):
        """
        Subskrybuje tematy dla wszystkich urządzeń.
        """
        if not self.device_manager:
            return

        devices = self.device_manager.get_all_devices()
        for device in devices:
            # Subskrybuj status urządzenia
            status_topic = f"{device['topic']}/status"
            self.subscribe(status_topic)

            # Subskrybuj tematy wartości jeśli są zdefiniowane
            if "valueTopics" in device:
                for value_name, topic_suffix in device["valueTopics"].items():
                    value_topic = f"{device['topic']}/{topic_suffix}"
                    self.subscribe(value_topic)
