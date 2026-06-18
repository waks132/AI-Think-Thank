#!/bin/bash
# Lancez ce fichier pour démarrer AI-Think-Thank (Linux) : ./Lancer-Linux.sh
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo
  echo "  Node.js n'est pas installé. Installez-le depuis https://nodejs.org"
  echo "  (ou via votre gestionnaire de paquets) puis relancez ce script."
  echo
  exit 1
fi
node scripts/launch.mjs
