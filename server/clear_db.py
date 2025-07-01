import os
import argparse
import time

# Gestion optionnelle de la chaîne de connexion
parser = argparse.ArgumentParser(
    description="Vider TOUTES les tables PostgreSQL sur Render"
)
parser.add_argument(
    '--db-url',
    help="Override DATABASE_URL (ex: postgresql://user:pass@host:port/db)",
    default=None
)
parser.add_argument(
    '--method',
    choices=['delete', 'truncate', 'drop'],
    default='truncate',
    help="Méthode de suppression (delete=rapide, truncate=très rapide, drop=lent mais recrée)"
)
args = parser.parse_args()

# Définir DATABASE_URL si fournie en argument
if args.db_url:
    os.environ['DATABASE_URL'] = args.db_url

# Vérifier que DATABASE_URL est définie
if not os.getenv('DATABASE_URL'):
    print("❌ ERREUR: DATABASE_URL n'est pas définie!")
    print("Usage:")
    print("  - Sur Render: python3 clear_db.py")
    print("  - En local: python3 clear_db.py --db-url 'postgresql://user:pass@host:port/db'")
    exit(1)

# Forcer l'exécution en mode production
os.environ['FLASK_ENV'] = 'production'

from app import create_app, db

# Forcer l'utilisation de la config production
app = create_app('config.ProductionConfig')

with app.app_context():
    print("→ Base utilisée :", str(db.engine.url).replace(str(db.engine.url).split('@')[0].split('//')[-1], '***'))
    
    # Vérifier qu'on utilise bien PostgreSQL
    if 'postgresql' not in str(db.engine.url):
        print("❌ ERREUR: Base SQLite détectée au lieu de PostgreSQL!")
        exit(1)
    
    try:
        # Lister toutes les tables utilisateur
        print("🔍 Recherche des tables...")
        result = db.session.execute(db.text("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        """))
        tables = [row[0] for row in result.fetchall()]
        
        if not tables:
            print("✅ Aucune table trouvée - la base est déjà vide !")
            exit(0)
        
        print(f"→ Tables trouvées : {', '.join(tables)}")
        
        print(f"🗑️  Suppression avec méthode '{args.method}'...")
        start_time = time.time()
        
        if args.method == 'delete':
            # Méthode DELETE pour chaque table
            print("   Utilisation de DELETE sur toutes les tables...")
            for table in tables:
                print(f"     - Vidage de {table}...")
                db.session.execute(db.text(f"DELETE FROM {table}"))
            db.session.commit()
            
        elif args.method == 'truncate':
            # Méthode TRUNCATE (très rapide)
            print("   Utilisation de TRUNCATE sur toutes les tables...")
            if tables:
                # TRUNCATE toutes les tables en une seule commande
                tables_str = ', '.join(tables)
                db.session.execute(db.text(f"TRUNCATE TABLE {tables_str} RESTART IDENTITY CASCADE"))
                db.session.commit()
            
        elif args.method == 'drop':
            # Méthode DROP/CREATE (recrée complètement le schéma)
            print("   Utilisation de DROP/CREATE...")
            print("     - Suppression de toutes les tables...")
            db.drop_all()
            print("     - Recréation du schéma...")
            db.create_all()
        
        end_time = time.time()
        duration = end_time - start_time
        print(f"⏱️  Temps d'exécution : {duration:.2f} secondes")
        
        # Vérifier que toutes les tables sont vides
        print("🔍 Vérification finale...")
        if args.method == 'drop':
            # Après DROP/CREATE, vérifier que les tables existent mais sont vides
            result = db.session.execute(db.text("""
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public'
            """))
            new_tables = [row[0] for row in result.fetchall()]
            print(f"→ Tables recréées : {', '.join(new_tables) if new_tables else 'Aucune'}")
            
            if new_tables:
                total_rows = 0
                for table in new_tables:
                    result = db.session.execute(db.text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.fetchone()[0]
                    total_rows += count
                    print(f"     - {table}: {count} lignes")
                
                if total_rows == 0:
                    print("✅ Toutes les tables ont été recréées et sont vides !")
                else:
                    print(f"❌ ERREUR: {total_rows} lignes restantes")
            else:
                print("✅ Base complètement vidée !")
        else:
            # Pour DELETE et TRUNCATE, vérifier que les tables existent mais sont vides
            total_rows = 0
            for table in tables:
                try:
                    result = db.session.execute(db.text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.fetchone()[0]
                    total_rows += count
                    print(f"     - {table}: {count} lignes")
                except Exception as e:
                    print(f"     - {table}: erreur ({e})")
            
            if total_rows == 0:
                print("✅ Toutes les tables ont été vidées avec succès !")
            else:
                print(f"❌ ERREUR: {total_rows} lignes restantes au total")
            
    except Exception as e:
        print(f"❌ ERREUR: {e}")
        print("\n💡 Essayez avec une méthode différente :")
        print("  python3 clear_db.py --method delete")
        print("  python3 clear_db.py --method truncate")
        print("  python3 clear_db.py --method drop")
        exit(1)