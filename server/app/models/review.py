from app.models.base import BaseModel
from app import db

class Review(BaseModel):
    """Model class representing a user review"""
    __tablename__ = 'reviews'
    
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    
    # Foreign key to link to the user who created the review
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Relationship with User model
    user = db.relationship('User', back_populates='reviews')
    
    def __init__(self, title, content, rating, user_id):
        self.title = title
        self.content = content
        self.rating = rating
        self.user_id = user_id
        
    def to_dict(self):
        """Convert review to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'rating': self.rating,
            'user_id': self.user_id,
			'username': self.user.username if self.user else None,
			'created_at': self.created_at.isoformat() if self.created_at else None,
			'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }