from app import create_app, db
from app.models.achievement import Achievement

app = create_app()

with app.app_context():
    achievements = [
        {
            'name': 'First Death',
            'description': 'Die for the first time',
            'condition': 'Player must die once'
        },
        {
            'name': 'Speed Runner',
            'description': 'Complete level 1 in under 2 minutes',
            'condition': 'Complete level in under 120 seconds'
        },
        {
            'name': 'Wall Jumper',
            'description': 'Perform 5 wall jumps in a single level',
            'condition': 'Perform 5 wall jumps'
        },
        {
            'name': 'Question Master',
            'description': 'Answer all questions correctly',
            'condition': 'Answer all 3 questions correctly'
        }
    ]
    
    for achievement_data in achievements:
        existing = Achievement.query.filter_by(name=achievement_data['name']).first()
        if not existing:
            achievement = Achievement(**achievement_data)
            db.session.add(achievement)
            print(f"Created achievement: {achievement_data['name']}")
        else:
            print(f"Achievement already exists: {achievement_data['name']}")
    
    db.session.commit()
    print("Achievements setup complete!")