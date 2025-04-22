# app.py - Główny plik API
import logging
import os
import json
from logging.handlers import RotatingFileHandler
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from modules.mqtt_client import MQTTClient
from modules.device_manager import DeviceManager
from config import get_config

# Inicjalizacja aplikacji Flask
app = Flask(__name__, static_folder='static')
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

# Inicjalizacja menedżera urządzeń
device_manager = DeviceManager(app.config)

# Inicjalizacja klienta MQTT
mqtt_client = MQTTClient(
    app.config['MQTT_BROKER'],
    app.config['MQTT_PORT'],
    app.config['MQTT_USER'],
    app.config['MQTT_PASSWORD'],
    app.config['MQTT_KEEPALIVE'],
    app.logger
)
mqtt_client.set_device_manager(device_manager)

# ===================== Endpointy WEB =====================

# Endpoint dla strony głównej (serwowanie pliku HTML)
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

# Endpoint dla plików statycznych
@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('static', path)

# ===================== Endpointy API =====================

# Endpoint dla statusu API
@app.route('/api/status', methods=['GET'])
def status():
    """Zwraca status API i połączenia MQTT."""
    mqtt_status = mqtt_client.is_connected()
    return jsonify({
        'status': 'ok',
        'mqtt_connected': mqtt_status
    })

# Endpoint do sterowania urządzeniami
@app.route('/api/device/<device_id>/control', methods=['POST'])
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
    
    success = device_manager.send_command(device_id, command, mqtt_client)
    
    if success:
        return jsonify({'status': 'ok', 'message': f'Komenda wysłana do {device_id}'})
    else:
        return jsonify({'error': 'Błąd wysyłania komendy'}), 500

# Endpoint do pobierania listy urządzeń
@app.route('/api/devices', methods=['GET'])
def get_devices():
    """
    Zwraca listę wszystkich urządzeń.
    """
    devices = device_manager.get_all_devices()
    return jsonify(devices)

# Endpoint do pobierania listy pomieszczeń
@app.route('/api/rooms', methods=['GET'])
def get_rooms():
    """
    Zwraca listę wszystkich pomieszczeń.
    """
    rooms = device_manager.get_all_rooms()
    return jsonify(rooms)

# Endpoint do zwracania aktualnego stanu urządzeń
@app.route('/api/devices/status', methods=['GET'])
def devices_status():
    """
    Zwraca aktualny stan wszystkich urządzeń.
    """
    status = device_manager.get_all_devices_status()
    return jsonify(status)

# Endpoint do rejestracji nowego urządzenia
@app.route('/api/devices', methods=['POST'])
def register_device():
    """
    Rejestruje nowe urządzenie.
    """
    if not request.json:
        return jsonify({'error': 'Brak danych JSON'}), 400
    
    device_data = request.json
    if not device_data.get('id') or not device_data.get('name') or not device_data.get('type'):
        return jsonify({'error': 'Brakujące wymagane pola'}), 400
    
    success, message = device_manager.add_device(device_data)
    
    if success:
        return jsonify({'status': 'ok', 'message': message})
    else:
        return jsonify({'error': message}), 400

# Endpoint do aktualizacji urządzenia
@app.route('/api/device/<device_id>', methods=['PUT'])
def update_device(device_id):
    """
    Aktualizuje istniejące urządzenie.
    """
    if not request.json:
        return jsonify({'error': 'Brak danych JSON'}), 400
    
    device_data = request.json
    device_data['id'] = device_id  # Upewnij się, że ID jest zgodne z URL
    
    success, message = device_manager.update_device(device_id, device_data)
    
    if success:
        return jsonify({'status': 'ok', 'message': message})
    else:
        return jsonify({'error': message}), 400

# Endpoint do usuwania urządzenia
@app.route('/api/device/<device_id>', methods=['DELETE'])
def delete_device(device_id):
    """
    Usuwa urządzenie.
    """
    success, message = device_manager.delete_device(device_id)
    
    if success:
        return jsonify({'status': 'ok', 'message': message})
    else:
        return jsonify({'error': message}), 400

# Główna funkcja do uruchomienia aplikacji
if __name__ == '__main__':
    # Nawiąż połączenie MQTT
    mqtt_client.connect()
    
    # Dodano 0.0.0.0 aby API było dostępne z sieci lokalnej
    app.run(host='0.0.0.0', port=5000, debug=app.config['DEBUG'])














# modules/__init__.py
# Plik inicjalizacyjny pakietu



# import logging
# import os
# from logging.handlers import RotatingFileHandler
# from flask import Flask, jsonify, request
# from flask_cors import CORS
# import paho.mqtt.client as mqtt
# from config import get_config
# # Inicjalizacja aplikacji Flask
# app = Flask(__name__)
# app.config.from_object(get_config())
# CORS(app)  # Zabezpieczenia CORS

# # Konfiguracja logowania
# if not os.path.exists(os.path.dirname(app.config['LOG_FILE'])):
#     os.makedirs(os.path.dirname(app.config['LOG_FILE']))

# handler = RotatingFileHandler(app.config['LOG_FILE'], maxBytes=10000000, backupCount=5)
# handler.setFormatter(logging.Formatter(
#     '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
# ))
# handler.setLevel(logging.INFO)
# app.logger.addHandler(handler)
# app.logger.setLevel(logging.INFO)
# app.logger.info('Uruchomienie API IoT')

# # Konfiguracja klienta MQTT
# mqtt_client = mqtt.Client()
# mqtt_client.username_pw_set(app.config['MQTT_USER'], app.config['MQTT_PASSWORD'])

# def mqtt_connect():
#     """Nawiązuje połączenie z brokerem MQTT."""
#     try:
#         mqtt_client.connect(app.config['MQTT_BROKER'], app.config['MQTT_PORT'], app.config['MQTT_KEEPALIVE'])
#         mqtt_client.loop_start()
#         app.logger.info('Połączono z brokerem MQTT')
#         return True
#     except Exception as e:
#         app.logger.error(f'Błąd połączenia MQTT: {str(e)}')
#         return False

# # Funkcja pomocnicza do publikowania wiadomości MQTT
# def publish_message(topic, message):
#     """
#     Publikuje wiadomość MQTT.
    
#     Args:
#         topic (str): Temat MQTT
#         message (str): Wiadomość do wysłania
    
#     Returns:
#         bool: Status operacji
#     """
#     try:
#         mqtt_client.publish(topic, message)
#         app.logger.info(f'Wysłano wiadomość do {topic}: {message}')
#         return True
#     except Exception as e:
#         app.logger.error(f'Błąd publikacji MQTT: {str(e)}')
#         return False

# # Endpoint dla statusu API
# @app.route('/status', methods=['GET'])
# def status():
#     """Zwraca status API i połączenia MQTT."""
#     mqtt_status = mqtt_connect()
#     return jsonify({
#         'status': 'ok',
#         'mqtt_connected': mqtt_status
#     })

# # Endpoint do sterowania urządzeniami
# @app.route('/device/<device_id>/control', methods=['POST'])
# def control_device(device_id):
#     """
#     Endpoint do sterowania urządzeniami IoT.
    
#     Args:
#         device_id (str): Identyfikator urządzenia
    
#     Returns:
#         JSON: Status operacji
#     """
#     if not request.json:
#         return jsonify({'error': 'Brak danych JSON'}), 400
    
#     command = request.json.get('command')
#     if not command:
#         return jsonify({'error': 'Brak komendy'}), 400
    
#     topic = f'iot/device/{device_id}/command'
#     success = publish_message(topic, command)
    
#     if success:
#         return jsonify({'status': 'ok', 'message': f'Komenda wysłana do {device_id}'})
#     else:
#         return jsonify({'error': 'Błąd wysyłania komendy'}), 500

# # Główna funkcja do uruchomienia aplikacji
# if __name__ == '__main__':
#     mqtt_connect()
#     app.run(host='localhost', port=5000)