from app.models.base import BaseModel
from app import db
from datetime import datetime

class UserAchievement(BaseModel):
    """Association table between users and achievements"""
    __tablename__ = 'user_achievements'
    
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    achievement_id = db.Column(db.String(36), db.ForeignKey('achievements.id'), nullable=False)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    user = db.relationship('User', back_populates='user_achievements')
    achievement = db.relationship('Achievement', back_populates='user_achievements')
    
    # Create a unique constraint to prevent duplicate achievements for a user
    __table_args__ = (db.UniqueConstraint('user_id', 'achievement_id', name='unique_user_achievement'),)
