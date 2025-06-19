from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_restx import Api
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS

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
    app.config.from_object(config_class)
    app.url_map.strict_slashes = False
    CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]}})
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
        db.create_all()

#-----------------------------------returning the application-----------------------------------

    return app