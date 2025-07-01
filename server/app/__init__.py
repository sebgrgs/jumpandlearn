from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_restx import Api
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os

db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()

#-----------------------------------importing namespaces-----------------------------------

from app.routes.users import api as users_ns
from app.routes.auth import api as auth_ns
from app.routes.protected import api as protected_ns
from app.routes.progress import api as progress_ns
from app.routes.question import api as question_ns

#-----------------------------------create_app function (to create application)-----------------------------------

def create_app(config_class="config.DevelopmentConfig"):
    app = Flask(__name__)
    
    # Load configuration
    if isinstance(config_class, str):
        app.config.from_object(config_class)
    else:
        app.config.from_object(config_class)
    
    app.url_map.strict_slashes = False
    
    # Update CORS to allow your Netlify domain
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:5500",
        "http://localhost:5000",
        "http://localhost:5500",
        "http://127.0.0.1:5000",
        "http://localhost:8080",
        "https://jumpandlearn.netlify.app",  # Replace with your actual Netlify URL
        "https://*.netlify.app"  # Allow all Netlify preview deployments
    ]
    
    CORS(app, resources={
        r"/api/*": {
            "origins": allowed_origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    api = Api(app, version='1.0', title='Jump and Learn API', description='Jump and Learn Application API',
              security='Bearer', authorizations={
                  'Bearer': {
                      'type': 'apiKey',
                      'in': 'header',
                      'name': 'Authorization',
                      'description': 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
                  }
              })

#-----------------------------------adding namespaces to the application-----------------------------------

    api.add_namespace(users_ns, path='/api/v1/users')
    api.add_namespace(auth_ns, path='/api/v1/auth')
    api.add_namespace(protected_ns, path='/api/v1/protected')
    api.add_namespace(progress_ns, path='/api/v1/progress')
    api.add_namespace(question_ns, path='/api/v1/questions')

#-----------------------------------initializing the application-----------------------------------

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

#-----------------------------------creating all tables-----------------------------------

    with app.app_context():
        try:
            db.create_all()
            print("Database tables created successfully")
        except Exception as e:
            print(f"Error creating database tables: {e}")

#-----------------------------------returning the application-----------------------------------

    return app