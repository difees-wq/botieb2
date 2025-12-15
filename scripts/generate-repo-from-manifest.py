
import os
import re

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(BASE_PATH, ".."))
MANIFEST_PATH = os.path.join(ROOT, "manifest.txt")
OUTPUT_DIR = os.path.join(ROOT, "repo_out")

FILE_PATTERN = r"--- FILE: (.*?) ---\s*CONTENT\n```(?:[a-zA-Z]*)?\n(.*?)```"

def ensure_dir(path):
    d = os.path.dirname(path)
    if not os.path.exists(d):
        os.makedirs(d)

def write_file(path, content):
    ensure_dir(path)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.replace("\r", "") + "\n")

def main():
    print("📦 Generador de repo desde MANIFEST\n")

    if not os.path.exists(MANIFEST_PATH):
        print("❌ No existe manifest.txt")
        return

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = f.read()

    matches = re.findall(FILE_PATTERN, manifest, re.DOTALL)
    print(f"Archivos detectados: {len(matches)}")

    for file_path, content in matches:
        file_path = file_path.strip()
        dest = os.path.join(OUTPUT_DIR, file_path)

        write_file(dest, content)
        print(f"✓ {dest}")

    print("\n🎉 Proyecto regenerado correctamente en repo_out/\n")

if __name__ == "__main__":
    main()


