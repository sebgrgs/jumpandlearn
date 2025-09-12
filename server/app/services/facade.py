from app.persistence.repository import InMemoryRepository, SQLAlchemyRepository, UserRepository
from app.models.user import User
from app.models.progress import Progress
from app.models.question import Question
from app import db
from app.models.achievement import Achievement  # Import Achievement model
from app.models.user_achievement import UserAchievement


#-----------------------------------JumpAndLearnFacade-----------------------------------

class JumpAndLearnFacade:
    def __init__(self):
        self.user_repo = UserRepository()

#-----------------------------------create_user-----------------------------------
    
    def create_user(self, user_data):
        user = User(**user_data)
        user.hash_password(user_data['password'])
        self.user_repo.add(user)
        return user

#-----------------------------------get_user-----------------------------------

    def get_user(self, user_id):
        return self.user_repo.get(user_id)

#-----------------------------------get_user_by_email-----------------------------------

    def get_user_by_email(self, email):
        return self.user_repo.get_by_attribute('email', email)

#-----------------------------------get_user_by_username-----------------------------------

    def get_user_by_username(self, username):
        return self.user_repo.get_by_attribute('username', username)

#-----------------------------------get_all_users-----------------------------------

    def get_all_users(self):
        return self.user_repo.get_all()

#-----------------------------------update_user-----------------------------------

    def update_user(self, user_id, **user_data):
        """Update user in repository"""
        user = self.get_user(user_id)
        if not user:
            raise ValueError("User not found")

        updates = {}
        for field, value in user_data.items():
            if hasattr(user, field):
                updates[field] = value

        updated_user = self.user_repo.update(user_id, updates)

        if updated_user is None:
            updated_user = self.get_user(user_id)

        return updated_user
    
    def get_progress_by_user_id(self, user_id):
        """Get all progress records by user ID"""
        return db.session.query(Progress).filter_by(user_id=user_id).all()
    
    def get_progress_by_user_and_level(self, user_id, level):
        """Get progress for a specific user and level"""
        return db.session.query(Progress).filter_by(user_id=user_id, level=level).first()
    
    def get_max_level_for_user(self, user_id):
        """Get the highest level reached by a user"""
        max_level = db.session.query(db.func.max(Progress.level)).filter_by(user_id=user_id).scalar()
        return max_level or 1
    
    def update_progress(self, user_id, level, completion_time=None):
        """Update or create progress for a user at a specific level"""
        progress = self.get_progress_by_user_and_level(user_id, level)
        if not progress:
            progress = Progress(user_id=user_id, level=level, completion_time=completion_time)
            db.session.add(progress)
        else:
            # Only update completion time if it's better
            if completion_time is not None:
                if progress.completion_time is None or completion_time < progress.completion_time:
                    progress.completion_time = completion_time
        db.session.commit()
        return progress

#-----------------------------------get_question_by_id-----------------------------------

    def get_question_by_id(self, question_id):
        return db.session.query(Question).get(question_id)
    
    def get_all_questions(self):
        return db.session.query(Question).all()

#-----------------------------------achievements-----------------------------------

    def get_all_achievements(self):
        """Get all achievements"""
        from app.models.achievement import Achievement
        return Achievement.query.all()

    def get_achievement(self, achievement_id):
        """Get an achievement by ID"""
        from app.models.achievement import Achievement
        return Achievement.query.get(achievement_id)

    def create_achievement(self, achievement_data):
        """Create a new achievement"""
        from app.models.achievement import Achievement
        from app.persistence.repository import SQLAlchemyRepository
        from app import db
        
        # Check if achievement with this name already exists
        existing_achievement = Achievement.query.filter_by(name=achievement_data.get('name')).first()
        if existing_achievement:
            raise ValueError("Achievement with this name already exists")
        
        # Create the achievement
        achievement = Achievement(
            name=achievement_data.get('name'),
            description=achievement_data.get('description'),
            image_url=achievement_data.get('image_url'),
            condition=achievement_data.get('condition')
        )
        
        # Add to database
        db.session.add(achievement)
        db.session.commit()
        
        return achievement

    def assign_achievement_to_user(self, user_id, achievement_id):
        """Assign an achievement to a user"""
        from app.models.user_achievement import UserAchievement
        from app import db
        
        # Check if the user already has this achievement
        existing_ua = UserAchievement.query.filter_by(
            user_id=user_id, 
            achievement_id=achievement_id
        ).first()
        
        if existing_ua:
            raise ValueError("User already has this achievement")
        
        # Create the association
        user_achievement = UserAchievement(
            user_id=user_id,
            achievement_id=achievement_id
        )
        
        db.session.add(user_achievement)
        db.session.commit()
        
        return user_achievement
