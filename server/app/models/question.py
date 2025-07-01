from app.models.base import BaseModel
from app import db

class Question(db.Model):
    __tablename__ = 'questions'
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(255), nullable=False)
    choice1 = db.Column(db.String(128), nullable=False)
    choice2 = db.Column(db.String(128), nullable=False)
    choice3 = db.Column(db.String(128), nullable=False)
    correct = db.Column(db.Integer, nullable=False)
