import os
from dotenv import load_dotenv

# Ładowanie zmiennych środowiskowych
load_dotenv()

class Config:
    """Klasa konfiguracyjna aplikacji Flask."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'trudny-do-zgadniecia-klucz'
    DEBUG = False
    TESTING = False
    
    # Konfiguracja MQTT
    MQTT_BROKER = 'localhost'
    MQTT_PORT = 1883
    MQTT_USER = os.environ.get('MQTT_USER') or 'admin'
    MQTT_PASSWORD = os.environ.get('MQTT_PASSWORD') or 'silne_haslo_admin'
    MQTT_KEEPALIVE = 60
    
    # Konfiguracja logowania
    LOG_FILE = '/home/kichnu/app/logs/api.log'
    LOG_LEVEL = 'INFO'

class DevelopmentConfig(Config):
    """Konfiguracja dla środowiska rozwojowego."""
    DEBUG = True

class ProductionConfig(Config):
    """Konfiguracja dla środowiska produkcyjnego."""
    DEBUG = False

# Wybór konfiguracji na podstawie zmiennej środowiskowej
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': ProductionConfig
}

def get_config():
    """Pobiera odpowiednią konfigurację na podstawie środowiska."""
    env = os.environ.get('FLASK_ENV') or 'default'
    return config[env]