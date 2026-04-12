import os

archivos_final = "contexto_completo_jaiko.txt"

carpetas_ignorar = {
    '.git',
    'node_modules',
    'venv',
    '.venv',          # ← faltaba este (tu entorno virtual de Python)
    '__pycache__',
    'dist',
    'build',
    '.next',
    '.expo',
    'obj',
    'bin',
    'migrations',     # ← opcional: archivos generados automáticamente por Alembic
}

extensiones_validas = {
    '.js', '.jsx', '.ts', '.tsx',
    '.py', '.html', '.css',
    '.json',
    '.env.example',   # .env real se excluye a propósito (tiene tus secretos)
    '.sql', '.prisma',
    '.go', '.java', '.cs',
}

# Archivos individuales a excluir aunque tengan extensión válida
archivos_ignorar = {
    'unificar.py',
    'package-lock.json',   # ← solo ruido, no aporta contexto útil
}

with open(archivos_final, 'w', encoding='utf-8') as outfile:
    # 1. Árbol del proyecto
    outfile.write("ESTRUCTURA DEL PROYECTO:\n")
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in carpetas_ignorar]
        level = root.replace('.', '').count(os.sep)
        indent = ' ' * 4 * level
        outfile.write(f"{indent}{os.path.basename(root)}/\n")
        subindent = ' ' * 4 * (level + 1)
        for f in files:
            if any(f.endswith(ext) for ext in extensiones_validas) and f not in archivos_ignorar:
                outfile.write(f"{subindent}{f}\n")

    outfile.write("\n" + "=" * 50 + "\nCONTENIDO DE LOS ARCHIVOS\n" + "=" * 50 + "\n")

    # 2. Contenido de cada archivo
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in carpetas_ignorar]
        for file in files:
            if any(file.endswith(ext) for ext in extensiones_validas) and file not in archivos_ignorar:
                filepath = os.path.join(root, file)
                outfile.write(f"\n\nFILE_PATH: {filepath}\n" + "-" * 40 + "\n")
                try:
                    with open(filepath, 'r', encoding='utf-8') as infile:
                        outfile.write(infile.read())
                except Exception as e:
                    outfile.write(f"Error leyendo archivo: {e}")
                outfile.write("\n" + "-" * 40)

print(f"¡Listo! Se ha creado '{archivos_final}'.")