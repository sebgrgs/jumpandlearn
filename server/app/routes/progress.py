from app.services import facade
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request
from app.models.progress import Progress
from app import db
from app.persistence.repository import SQLAlchemyRepository

api = Namespace('progress', description='Progress operations')

#----------------------------------------------progress_model for input------------------------------------------------

progress_model = api.model('Progress', {
    'level': fields.Integer(required=True, description='Level of the user'),
    'completion_time': fields.Float(required=False, description='Completion time in milliseconds')
})

#----------------------------------------------get user progress------------------------------------------------

@api.route('/')
class UserProgress(Resource):

    @jwt_required()
    def get(self):
        """Get the progress of the current user"""
        user_id = get_jwt_identity()  # Now returns string directly
        
        # Retrieve all progress records for the user
        progress_records = db.session.query(Progress).filter_by(user_id=user_id).all()
        
        if not progress_records:
            return {'message': 'No progress found for this user'}, 404
        
        # Return the highest level reached and all completion times
        max_level = max(record.level for record in progress_records)
        completion_times = {record.level: record.completion_time for record in progress_records}
        
        return {
            'user_id': user_id,
            'max_level': max_level,
            'completion_times': completion_times
        }, 200

#----------------------------------------------update user progress------------------------------------------------

    @jwt_required()
    @api.expect(progress_model)
    def post(self):
        """Update the progress of the current user"""
        user_id = get_jwt_identity()  # Now returns string directly
        data = api.payload
        level = data.get('level')
        completion_time = data.get('completion_time')

        # Find existing progress for this specific level
        progress = db.session.query(Progress).filter_by(user_id=user_id, level=level).first()
        
        if not progress:
            # Create new progress entry for this level
            progress = Progress(user_id=user_id, level=level, completion_time=completion_time)
            db.session.add(progress)
            completion_time_updated = True
            response_message = f'Progress created for level {level}'
        else:
            # Update completion time only if it's better (lower) than the current record
            if completion_time is not None:
                if progress.completion_time is None or completion_time < progress.completion_time:
                    progress.completion_time = completion_time
                    completion_time_updated = True
                    response_message = f'New best time for level {level}!'
                else:
                    completion_time_updated = False
                    response_message = f'Time not improved for level {level}'
            else:
                completion_time_updated = False
                response_message = f'Progress updated for level {level}'
        
        db.session.commit()
        
        return {
            'message': response_message, 
            'level': progress.level,
            'completion_time': progress.completion_time,
            'time_improved': completion_time_updated
        }, 200

#----------------------------------------------get leaderboard------------------------------------------------

@api.route('/leaderboard')
class Leaderboard(Resource):
    
    def get(self):
        """Get leaderboard with best completion times per level"""
        # Get all progress records with completion times, grouped by level
        progress_records = db.session.query(Progress).filter(
            Progress.completion_time.isnot(None)
        ).order_by(Progress.level.asc(), Progress.completion_time.asc()).all()
        
        # Group by level
        levels = {}
        for progress in progress_records:
            if progress.level not in levels:
                levels[progress.level] = []
            
            user = facade.get_user(progress.user_id)
            levels[progress.level].append({
                'username': user.username if user else 'Unknown',
                'level': progress.level,
                'completion_time': progress.completion_time
            })
        
        # Sort each level's records by completion time and limit to top 10
        leaderboard = {}
        for level, records in levels.items():
            leaderboard[level] = sorted(records, key=lambda x: x['completion_time'])[:10]
        
        return {'leaderboard': leaderboard}, 200

#----------------------------------------------get leaderboard for specific level------------------------------------------------

@api.route('/leaderboard/<int:level>')
class LevelLeaderboard(Resource):
    
    def get(self, level):
        """Get leaderboard for a specific level"""
        progress_records = db.session.query(Progress).filter(
            Progress.level == level,
            Progress.completion_time.isnot(None)
        ).order_by(Progress.completion_time.asc()).limit(10).all()
        
        leaderboard = []
        for progress in progress_records:
            user = facade.get_user(progress.user_id)
            leaderboard.append({
                'username': user.username if user else 'Unknown',
                'level': progress.level,
                'completion_time': progress.completion_time
            })
        
        return {'leaderboard': leaderboard}, 200
