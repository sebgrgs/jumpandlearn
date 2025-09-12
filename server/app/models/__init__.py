# Import base first
from app.models.base import BaseModel

# Import main models first (without relationships that depend on association tables)
from app.models.user import User
from app.models.progress import Progress
from app.models.question import Question
from app.models.review import Review
from app.models.achievement import Achievement

# Import association table after main models
from app.models.user_achievement import UserAchievement

# Ensure all models are available
__all__ = [
    'BaseModel',
    'User', 
    'Progress', 
    'Question', 
    'Review', 
    'Achievement',
    'UserAchievement'
]