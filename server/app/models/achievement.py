from app.models.base import BaseModel
from app import db

class Achievement(BaseModel):
    """Model class representing an achievement that users can earn"""
    __tablename__ = 'achievements'
    
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.String(255), nullable=False)
    image_url = db.Column(db.String(255), nullable=True)
    condition = db.Column(db.String(255), nullable=True)  # Description of how to earn it
    
    # Update relationships
    user_achievements = db.relationship('UserAchievement', back_populates='achievement', cascade='all, delete-orphan')
    users = db.relationship('User', 
                           secondary='user_achievements',
                           viewonly=True)
