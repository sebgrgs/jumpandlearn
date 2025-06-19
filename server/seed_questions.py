from app import create_app, db
from app.models.question import Question

app = create_app()

with app.app_context():
    q1 = Question(
        text="Quelle est la capitale de la France ?",
        choice1="Paris",
        choice2="Lyon",
        choice3="Marseille",
        correct=0
    )
    q2 = Question(
        text="Combien font 2 + 2 ?",
        choice1="3",
        choice2="4",
        choice3="5",
        correct=1
    )
    db.session.add_all([q1, q2])
    db.session.commit()
    print("Questions ajoutées !")