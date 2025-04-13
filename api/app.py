import logging
import os
from logging.handlers import RotatingFileHandler
from flask import Flask, jsonify, request
from flask_cors import CORS
import paho.mqtt.client as mqtt
from config import get_config
# Inicjalizacja aplikacji Flask
app = Flask(__name__)
app.config.from_object(get_config())
CORS(app)  # Zabezpieczenia CORS

# Konfiguracja logowania
if not os.path.exists(os.path.dirname(app.config['LOG_FILE'])):
    os.makedirs(os.path.dirname(app.config['LOG_FILE']))

handler = RotatingFileHandler(app.config['LOG_FILE'], maxBytes=10000000, backupCount=5)
handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
handler.setLevel(logging.INFO)
app.logger.addHandler(handler)
app.logger.setLevel(logging.INFO)
app.logger.info('Uruchomienie API IoT')

# Konfiguracja klienta MQTT
mqtt_client = mqtt.Client()
mqtt_client.username_pw_set(app.config['MQTT_USER'], app.config['MQTT_PASSWORD'])

def mqtt_connect():
    """Nawiązuje połączenie z brokerem MQTT."""
    try:
        mqtt_client.connect(app.config['MQTT_BROKER'], app.config['MQTT_PORT'], app.config['MQTT_KEEPALIVE'])
        mqtt_client.loop_start()
        app.logger.info('Połączono z brokerem MQTT')
        return True
    except Exception as e:
        app.logger.error(f'Błąd połączenia MQTT: {str(e)}')
        return False

# Funkcja pomocnicza do publikowania wiadomości MQTT
def publish_message(topic, message):
    """
    Publikuje wiadomość MQTT.
    
    Args:
        topic (str): Temat MQTT
        message (str): Wiadomość do wysłania
    
    Returns:
        bool: Status operacji
    """
    try:
        mqtt_client.publish(topic, message)
        app.logger.info(f'Wysłano wiadomość do {topic}: {message}')
        return True
    except Exception as e:
        app.logger.error(f'Błąd publikacji MQTT: {str(e)}')
        return False

# Endpoint dla statusu API
@app.route('/status', methods=['GET'])
def status():
    """Zwraca status API i połączenia MQTT."""
    mqtt_status = mqtt_connect()
    return jsonify({
        'status': 'ok',
        'mqtt_connected': mqtt_status
    })

# Endpoint do sterowania urządzeniami
@app.route('/device/<device_id>/control', methods=['POST'])
def control_device(device_id):
    """
    Endpoint do sterowania urządzeniami IoT.
    
    Args:
        device_id (str): Identyfikator urządzenia
    
    Returns:
        JSON: Status operacji
    """
    if not request.json:
        return jsonify({'error': 'Brak danych JSON'}), 400
    
    command = request.json.get('command')
    if not command:
        return jsonify({'error': 'Brak komendy'}), 400
    
    topic = f'iot/device/{device_id}/command'
    success = publish_message(topic, command)
    
    if success:
        return jsonify({'status': 'ok', 'message': f'Komenda wysłana do {device_id}'})
    else:
        return jsonify({'error': 'Błąd wysyłania komendy'}), 500

# Główna funkcja do uruchomienia aplikacji
if __name__ == '__main__':
    mqtt_connect()
    app.run(host='localhost', port=5000)