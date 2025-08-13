import os
import argparse

# Gestion optionnelle de la chaîne de connexion
parser = argparse.ArgumentParser(
    description="Intégrer les questions dans la base PostgreSQL sur Render"
)
parser.add_argument(
    '--db-url',
    help="URL de la base PostgreSQL (ex: postgresql://user:pass@host.render.com:port/db)",
    default=None
)
args = parser.parse_args()

# Définir DATABASE_URL si fournie en argument
if args.db_url:
    os.environ['DATABASE_URL'] = args.db_url

# Vérifier que DATABASE_URL est définie
database_url = os.getenv('DATABASE_URL')
if not database_url:
    print("❌ ERREUR: DATABASE_URL n'est pas définie!")
    print("Usage:")
    print("  - Sur Render: python3 seed_questions_prod.py")
    print("  - En local: python3 seed_questions_prod.py --db-url 'postgresql://user:pass@host.render.com:port/db'")
    print("\n💡 Récupérez l'URL externe sur Render Dashboard > PostgreSQL > Info > External Database URL")
    exit(1)

# Vérification de l'URL
if 'dpg-' in database_url and '.render.com' not in database_url:
    print("❌ ERREUR: Vous utilisez l'URL interne de Render!")
    print("Utilisez l'URL externe qui contient '.render.com'")
    print("Exemple: postgresql://user:pass@dpg-xxxxx-a.oregon-postgres.render.com/db")
    exit(1)

# Forcer l'exécution en mode production
os.environ['FLASK_ENV'] = 'production'

from app import create_app, db
from app.models.question import Question

# Forcer l'utilisation de la config production
app = create_app('config.ProductionConfig')

with app.app_context():
    print("→ Base utilisée :", str(db.engine.url).replace(str(db.engine.url).split('@')[0].split('//')[-1], '***'))
    
    # Vérifier qu'on utilise bien PostgreSQL
    if 'postgresql' not in str(db.engine.url):
        print("❌ ERREUR: Base SQLite détectée au lieu de PostgreSQL!")
        exit(1)
    
    try:
        # Vérifier si des questions existent déjà
        existing_count = Question.query.count()
        print(f"→ Questions existantes : {existing_count}")
        
        if existing_count > 0:
            print("⚠️  Des questions existent déjà. Continuer ? (y/N)")
            response = input().lower()
            if response != 'y':
                print("→ Opération annulée")
                exit(0)
        
        # Définition des questions (mêmes que seed_questions.py)
        questions = [
            Question(
                text="In Python3, wich keyword is used to define a class?",
                choice1="class",
                choice2="self",
                choice3="cls",
                correct=0
            ),
            Question(
                text="What will be the value of the variable d at the end of this program? a=3 b=a-5 c=b-3 d=c-4",
                choice1="0",
                choice2="-9",
                choice3="-3",
                correct=1
            ),
            Question(
                text="How to print an integer in C ?",
                choice1="printf(\"%d\")",
                choice2="printf(\"%c\")",
                choice3="printf(\"%s\")",
                correct=0
            )
        ]
        
        # Ajouter les questions
        print(f"→ Ajout de {len(questions)} questions...")
        db.session.add_all(questions)
        db.session.commit()
        
        # Vérification finale
        final_count = Question.query.count()
        print(f"→ Questions totales après ajout : {final_count}")
        print("✅ Questions intégrées avec succès dans PostgreSQL !")
        
    except Exception as e:
        print(f"❌ ERREUR lors de l'opération: {e}")
        print("Vérifiez que l'URL de la base est correcte et accessible.")
        exit(1)