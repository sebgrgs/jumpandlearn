from app.models.base import BaseModel
from app import db

class Question(BaseModel):
    __tablename__ = 'questions'
    text = db.Column(db.String(255), nullable=False)
    choice1 = db.Column(db.String(128), nullable=False)
    choice2 = db.Column(db.String(128), nullable=False)
    choice3 = db.Column(db.String(128), nullable=False)
    correct = db.Column(db.Integer, nullable=False)
