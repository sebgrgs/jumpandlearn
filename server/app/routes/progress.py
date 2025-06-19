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
	'level': fields.Integer(required=True, description='Level of the user')
})

#----------------------------------------------get user progress------------------------------------------------

@api.route('/')
class UserProgress(Resource):

	@jwt_required()
	def get(self):
		"""Get the progress of the current user"""
		current_user = get_jwt_identity()
		user_id = current_user['id']
		
		# Retrieve the user's progress
		progress = facade.get_progress_by_user_id(user_id)
		
		if not progress:
			return {'message': 'No progress found for this user'}, 404
		
		return {
			'user_id': progress.user_id,
			'level': progress.level
		}, 200
#----------------------------------------------update user progress------------------------------------------------

	@jwt_required()
	@api.expect(progress_model)
	def post(self):
		"""Update the progress of the current user"""
		current_user = get_jwt_identity()
		user_id = current_user['id']
		data = api.payload
		level = data.get('level')

		progress = facade.get_progress_by_user_id(user_id)
		if not progress:
			# Crée une nouvelle entrée si elle n'existe pas
			progress = Progress(user_id=user_id, level=level)
			db.session.add(progress)
		else:
			progress.level = level
		db.session.commit()
		return {'message': 'Progress updated', 'level': progress.level}, 200
