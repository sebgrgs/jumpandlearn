import os
from app import create_app

# Determine environment
env = os.getenv('FLASK_ENV', 'development')
config_class = f"config.{env.title()}Config" if env != 'development' else "config.DevelopmentConfig"

app = create_app(config_class)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=(env == 'development'))