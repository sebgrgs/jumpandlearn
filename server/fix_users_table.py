import os
import argparse

parser = argparse.ArgumentParser(description="Fix users table - Add is_admin column")
parser.add_argument('--db-url', help="PostgreSQL URL", default=None)
args = parser.parse_args()

if args.db_url:
    os.environ['DATABASE_URL'] = args.db_url

database_url = os.getenv('DATABASE_URL')
if not database_url:
    print("❌ DATABASE_URL not defined!")
    exit(1)

os.environ['FLASK_ENV'] = 'production'

from app import create_app, db

app = create_app('config.ProductionConfig')

with app.app_context():
    try:
        # Ajouter la colonne is_admin si elle n'existe pas
        db.session.execute(db.text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE
        """))
        
        db.session.commit()
        print("✅ Colonne is_admin ajoutée avec succès!")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        db.session.rollback()