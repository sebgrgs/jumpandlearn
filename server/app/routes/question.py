from flask_restx import Namespace, Resource, fields
from app.services import facade

api = Namespace('questions', description='Questions operations')

question_model = api.model('Question', {
    'id': fields.String(readonly=True, description='Question ID'),
    'text': fields.String(required=True, description='Question text'),
    'choices': fields.List(fields.String, description='Choices'),
    'correct': fields.Integer(description='Index of the correct answer')
})

@api.route('/<string:question_id>')
class QuestionResource(Resource):
    @api.marshal_with(question_model)
    def get(self, question_id):
        question = facade.get_question_by_id(question_id)
        if not question:
            api.abort(404, "Question not found")
        return {
            'id': question.id,
            'text': question.text,
            'choices': [question.choice1, question.choice2, question.choice3],
            'correct': question.correct
        }

@api.route('/')
class QuestionListResource(Resource):
    @api.marshal_list_with(question_model)
    def get(self):
        questions = facade.get_all_questions()
        return [{
            'id': q.id,
            'text': q.text,
            'choices': [q.choice1, q.choice2, q.choice3],
            'correct': q.correct
        } for q in questions]