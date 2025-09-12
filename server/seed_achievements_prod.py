import os
import argparse

# Gestion optionnelle de la chaîne de connexion
parser = argparse.ArgumentParser(
    description="Intégrer les achievements dans la base PostgreSQL sur Render"
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
    print("  - Sur Render: python3 seed_achievements_prod.py")
    print("  - En local: python3 seed_achievements_prod.py --db-url 'postgresql://user:pass@host.render.com:port/db'")
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
from app.models.achievement import Achievement

# Forcer l'utilisation de la config production
app = create_app('config.ProductionConfig')

with app.app_context():
    print("→ Base utilisée :", str(db.engine.url).replace(str(db.engine.url).split('@')[0].split('//')[-1], '***'))
    
    # Vérifier qu'on utilise bien PostgreSQL
    if 'postgresql' not in str(db.engine.url):
        print("❌ ERREUR: Base SQLite détectée au lieu de PostgreSQL!")
        exit(1)
    
    try:
        # Vérifier si des achievements existent déjà
        existing_count = Achievement.query.count()
        print(f"→ Achievements existants : {existing_count}")
        
        if existing_count > 0:
            print("⚠️  Des achievements existent déjà. Continuer ? (y/N)")
            response = input().lower()
            if response != 'y':
                print("→ Opération annulée")
                exit(0)
        
        # Définition des achievements (mêmes que create_achievements.py)
        achievements = [
            Achievement(
                name='First Death',
                description='Die for the first time',
                condition='Player must die once'
            ),
            Achievement(
                name='Speed Runner',
                description='Complete level 1 in under 2 minutes',
                condition='Complete level in under 120 seconds'
            ),
            Achievement(
                name='Wall Jumper',
                description='Perform 5 wall jumps in a single level',
                condition='Perform 5 wall jumps'
            ),
            Achievement(
                name='Question Master',
                description='Answer all questions correctly',
                condition='Answer all 3 questions correctly'
            )
        ]
        
        # Ajouter les achievements
        print(f"→ Ajout de {len(achievements)} achievements...")
        db.session.add_all(achievements)
        db.session.commit()
        
        # Vérification finale
        final_count = Achievement.query.count()
        print(f"→ Achievements totaux après ajout : {final_count}")
        print("✅ Achievements intégrés avec succès dans PostgreSQL !")
        
    except Exception as e:
        print(f"❌ ERREUR lors de l'opération: {e}")
        print("Vérifiez que l'URL de la base est correcte et accessible.")
        exit(1)