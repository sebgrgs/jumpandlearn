from app.services import facade
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request

api = Namespace('achievements', description='Achievement operations')

# Model for achievement representation
achievement_model = api.model('Achievement', {
    'name': fields.String(required=True, description='Name of the achievement'),
    'description': fields.String(required=True, description='Description of the achievement'),
    'image_url': fields.String(required=False, description='URL to the achievement image'),
    'condition': fields.String(required=False, description='Condition to earn the achievement')
})

# Model for achievement assignment
achievement_assign_model = api.model('AchievementAssign', {
    'user_id': fields.String(required=True, description='ID of the user'),
    'achievement_id': fields.String(required=True, description='ID of the achievement')
})

@api.route('/')
class AchievementsList(Resource):
    @api.response(200, 'Success')
    def get(self):
        """List all achievements"""
        achievements = facade.get_all_achievements()
        return [{
            'id': achievement.id,
            'name': achievement.name,
            'description': achievement.description,
            'image_url': achievement.image_url,
            'condition': achievement.condition
        } for achievement in achievements], 200
    
    @api.expect(achievement_model, validate=True)
    @api.response(201, 'Achievement successfully created')
    @api.response(400, 'Validation error')
    @api.response(403, 'Admin privileges required')
    @jwt_required()
    def post(self):
        """Create a new achievement (admin only)"""
        current_user_id = get_jwt_identity()
        current_user = facade.get_user(current_user_id)
        
        if not current_user:
            return {'error': 'User not found'}, 401
            
        if not hasattr(current_user, 'is_admin') or not current_user.is_admin:
            return {'error': 'Admin privileges required'}, 403
        
        achievement_data = request.json
        print(f"Creating achievement with data: {achievement_data}")  # Debug log
        
        try:
            new_achievement = facade.create_achievement(achievement_data)
            print(f"Created achievement: {new_achievement}")  # Debug log
            
            if not new_achievement:
                return {'error': 'Failed to create achievement'}, 500
                
            return {
                'id': new_achievement.id,
                'name': new_achievement.name,
                'description': new_achievement.description,
                'image_url': new_achievement.image_url,
                'condition': new_achievement.condition
            }, 201
        except ValueError as e:
            print(f"ValueError: {e}")  # Debug log
            return {'error': str(e)}, 400
        except Exception as e:
            print(f"Unexpected error: {e}")  # Debug log
            return {'error': 'Internal server error'}, 500

@api.route('/<achievement_id>')
class AchievementResource(Resource):
    @api.response(200, 'Success')
    @api.response(404, 'Achievement not found')
    def get(self, achievement_id):
        """Get a specific achievement by ID"""
        achievement = facade.get_achievement(achievement_id)
        if not achievement:
            return {'error': 'Achievement not found'}, 404
        
        return {
            'id': achievement.id,
            'name': achievement.name,
            'description': achievement.description,
            'image_url': achievement.image_url,
            'condition': achievement.condition
        }, 200

@api.route('/user/<user_id>')
class UserAchievements(Resource):
    @api.response(200, 'Success')
    @api.response(404, 'User not found')
    def get(self, user_id):
        """Get all achievements for a specific user"""
        user = facade.get_user(user_id)
        if not user:
            return {'error': 'User not found'}, 404
        
        return [{
            'id': ua.achievement.id,
            'name': ua.achievement.name,
            'description': ua.achievement.description,
            'image_url': ua.achievement.image_url,
            'earned_at': ua.earned_at.isoformat()
        } for ua in user.user_achievements], 200

@api.route('/assign')
class AssignAchievement(Resource):
    @api.expect(achievement_assign_model, validate=True)
    @api.response(201, 'Achievement successfully assigned')
    @api.response(400, 'Validation error')
    @api.response(403, 'Admin privileges required')
    @api.response(404, 'User or achievement not found')
    @jwt_required()
    def post(self):
        """Assign an achievement to a user (admin only)"""
        current_user_id = get_jwt_identity()
        current_user = facade.get_user(current_user_id)
        
        if not current_user or not hasattr(current_user, 'is_admin') or not current_user.is_admin:
            return {'error': 'Admin privileges required'}, 403
        
        data = request.json
        user_id = data.get('user_id')
        achievement_id = data.get('achievement_id')
        
        user = facade.get_user(user_id)
        if not user:
            return {'error': 'User not found'}, 404
        
        achievement = facade.get_achievement(achievement_id)
        if not achievement:
            return {'error': 'Achievement not found'}, 404
        
        try:
            facade.assign_achievement_to_user(user_id, achievement_id)
            return {'message': 'Achievement successfully assigned'}, 201
        except ValueError as e:
            return {'error': str(e)}, 400

@api.route('/unlock')
class UnlockAchievement(Resource):
    @api.expect(achievement_assign_model, validate=True)
    @api.response(201, 'Achievement successfully unlocked')
    @api.response(400, 'Validation error')
    @api.response(404, 'User or achievement not found')
    @jwt_required()
    def post(self):
        """Allow a user to unlock their own achievement"""
        current_user_id = get_jwt_identity()
        data = request.json
        user_id = data.get('user_id')
        achievement_id = data.get('achievement_id')
        
        # Users can only unlock achievements for themselves
        if current_user_id != user_id:
            return {'error': 'You can only unlock achievements for yourself'}, 403
        
        user = facade.get_user(user_id)
        if not user:
            return {'error': 'User not found'}, 404
        
        achievement = facade.get_achievement(achievement_id)
        if not achievement:
            return {'error': 'Achievement not found'}, 404
        
        try:
            facade.assign_achievement_to_user(user_id, achievement_id)
            return {'message': 'Achievement successfully unlocked'}, 201
        except ValueError as e:
            return {'error': str(e)}, 400