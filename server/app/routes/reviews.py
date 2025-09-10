from app.services import facade
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request
from app.models.review import Review
from app import db

api = Namespace('reviews', description='Review operations')

# Modèle pour l'entrée des reviews
review_model = api.model('Review', {
    'title': fields.String(required=True, description='Title of the review', min_length=1, max_length=100),
    'content': fields.String(required=True, description='Content of the review', min_length=1, max_length=500),
    'rating': fields.Integer(required=True, description='Rating (1-5)', min=1, max=5)
})

# Endpoint pour les opérations sur toutes les reviews
@api.route('/')
class ReviewList(Resource):
    @api.response(200, 'Success')
    def get(self):
        """List all reviews"""
        reviews = Review.query.all()
        return [review.to_dict() for review in reviews], 200
    
    @api.expect(review_model, validate=True)
    @api.response(201, 'Review successfully created')
    @api.response(400, 'Invalid input data')
    @jwt_required()
    def post(self):
        """Create a new review"""
        user_id = get_jwt_identity()
        data = request.json
        
        try:
            review = Review(
                title=data['title'],
                content=data['content'],
                rating=data['rating'],
                user_id=user_id
            )
            
            db.session.add(review)
            db.session.commit()
            
            return review.to_dict(), 201
        except ValueError as e:
            return {'error': str(e)}, 400

# Endpoint pour les opérations sur une review spécifique
@api.route('/<review_id>')
class ReviewResource(Resource):
    @api.response(200, 'Review details retrieved successfully')
    @api.response(404, 'Review not found')
    def get(self, review_id):
        """Get review details by ID"""
        review = Review.query.get(review_id)
        if not review:
            return {'error': 'Review not found'}, 404
        return review.to_dict(), 200
    
    @api.expect(review_model, validate=True)
    @api.response(200, 'Review successfully updated')
    @api.response(404, 'Review not found')
    @api.response(403, 'Unauthorized action')
    @jwt_required()
    def put(self, review_id):
        """Update review by ID"""
        current_user_id = get_jwt_identity()
        review = Review.query.get(review_id)
        
        if not review:
            return {'error': 'Review not found'}, 404
        
        if review.user_id != current_user_id:
            return {'error': 'Unauthorized action'}, 403
        
        data = request.json
        try:
            if 'title' in data:
                review.title = data['title']
            if 'content' in data:
                review.content = data['content']
            if 'rating' in data:
                review.rating = data['rating']
                
            db.session.commit()
            return review.to_dict(), 200
        except ValueError as e:
            return {'error': str(e)}, 400
    
    @api.response(204, 'Review successfully deleted')
    @api.response(404, 'Review not found')
    @api.response(403, 'Unauthorized action')
    @jwt_required()
    def delete(self, review_id):
        """Delete review by ID"""
        current_user_id = get_jwt_identity()
        review = Review.query.get(review_id)
        
        if not review:
            return {'error': 'Review not found'}, 404
        
        if review.user_id != current_user_id:
            return {'error': 'Unauthorized action'}, 403
        
        db.session.delete(review)
        db.session.commit()
        return '', 204

# Endpoint pour récupérer les reviews d'un utilisateur spécifique
@api.route('/user/<user_id>')
class UserReviews(Resource):
    @api.response(200, 'Success')
    def get(self, user_id):
        """Get all reviews by a specific user"""
        reviews = Review.query.filter_by(user_id=user_id).all()
        return [review.to_dict() for review in reviews], 200
