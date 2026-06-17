#!/bin/bash
# Double-cliquez ce fichier pour lancer AI-Think-Thank (macOS).
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo
  echo "  Node.js n'est pas installé. Installez-le depuis https://nodejs.org"
  echo "  puis double-cliquez à nouveau sur ce fichier."
  echo
  read -r -p "Appuyez sur Entrée pour fermer."
  exit 1
fi
node scripts/launch.mjs
