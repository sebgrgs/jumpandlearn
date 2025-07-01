import os
import argparse

# Gestion optionnelle de la chaîne de connexion
parser = argparse.ArgumentParser(
    description="Vérifier le contenu de la base PostgreSQL sur Render"
)
parser.add_argument(
    '--db-url',
    help="URL de la base PostgreSQL (ex: postgresql://user:pass@host.render.com:port/db)",
    default=None
)
parser.add_argument(
    '--show-data',
    action='store_true',
    help="Afficher le contenu détaillé des tables"
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
    print("  - Sur Render: python3 check_db.py")
    print("  - En local: python3 check_db.py --db-url 'postgresql://user:pass@host.render.com:port/db'")
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
        print("\n" + "="*60)
        print("📊 ÉTAT DE LA BASE DE DONNÉES")
        print("="*60)
        
        # 1. Lister toutes les tables
        print("\n🔍 Tables disponibles :")
        result = db.session.execute(db.text("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        """))
        tables = [row[0] for row in result.fetchall()]
        
        if not tables:
            print("   ❌ Aucune table trouvée")
            exit(0)
        
        total_rows = 0
        for table in tables:
            try:
                result = db.session.execute(db.text(f"SELECT COUNT(*) FROM {table}"))
                count = result.fetchone()[0]
                total_rows += count
                status = "✅" if count > 0 else "⚪"
                print(f"   {status} {table}: {count} lignes")
            except Exception as e:
                print(f"   ❌ {table}: erreur ({e})")
        
        print(f"\n📈 Total: {len(tables)} tables, {total_rows} lignes")
        
        # 2. Détail des questions si demandé ou si c'est la seule table
        if args.show_data or (len(tables) == 1 and 'questions' in tables):
            print("\n" + "-"*60)
            print("📋 CONTENU DES QUESTIONS")
            print("-"*60)
            
            questions = Question.query.all()
            if not questions:
                print("   ❌ Aucune question trouvée")
            else:
                for i, q in enumerate(questions, 1):
                    print(f"\n{i}. [ID: {q.id}] {q.text}")
                    print(f"   A) {q.choice1}")
                    print(f"   B) {q.choice2}")  
                    print(f"   C) {q.choice3}")
                    correct_letter = ['A', 'B', 'C'][q.correct]
                    print(f"   ✅ Réponse correcte: {correct_letter}")
        
        # 3. Informations sur la base
        print("\n" + "-"*60)
        print("🔧 INFORMATIONS TECHNIQUES")
        print("-"*60)
        
        # Taille de la base
        result = db.session.execute(db.text("""
            SELECT pg_size_pretty(pg_database_size(current_database())) as size
        """))
        db_size = result.fetchone()[0]
        print(f"   💾 Taille de la base: {db_size}")
        
        # Version PostgreSQL
        result = db.session.execute(db.text("SELECT version()"))
        version = result.fetchone()[0].split(',')[0]
        print(f"   🐘 {version}")
        
        # Connexions actives
        result = db.session.execute(db.text("""
            SELECT count(*) 
            FROM pg_stat_activity 
            WHERE state = 'active'
        """))
        active_connections = result.fetchone()[0]
        print(f"   🔗 Connexions actives: {active_connections}")
        
        print("\n" + "="*60)
        
        # Résumé final
        if total_rows == 0:
            print("🟡 La base est vide mais les tables existent")
        elif total_rows > 0:
            print("🟢 La base contient des données")
        else:
            print("🔴 État inconnu de la base")
            
    except Exception as e:
        print(f"❌ ERREUR lors de la vérification: {e}")
        print("Vérifiez que l'URL de la base est correcte et accessible.")
        exit(1)