#!/usr/bin/env node
/**
 * Lanceur « tout-en-un » pour AI-Think-Thank (version locale NVIDIA).
 * Pensé pour les non-développeurs : il vérifie l'environnement, installe les
 * dépendances, configure la clé NVIDIA, démarre la base locale (si possible) et
 * l'application, puis ouvre le navigateur. Aucune commande à connaître.
 *
 * Lancement : `node scripts/launch.mjs` (ou via les fichiers lancer.* fournis).
 */
import { spawn, spawnSync, execSync } from 'node:child_process';
import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout, platform } from 'node:process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEV_URL = 'http://localhost:9002';
const ENV_FILE = join(ROOT, '.env.local');
const ENV_EXAMPLE = join(ROOT, '.env.local.example');

const c = {
  g: (s) => `\x1b[32m${s}\x1b[0m`,
  y: (s) => `\x1b[33m${s}\x1b[0m`,
  r: (s) => `\x1b[31m${s}\x1b[0m`,
  b: (s) => `\x1b[1m${s}\x1b[0m`,
};
const log = (s = '') => console.log(s);

function fail(msg) {
  log('\n' + c.r('✖ ' + msg) + '\n');
  process.exit(1);
}

// --- 1. Vérifier Node -------------------------------------------------------
function checkNode() {
  const major = parseInt(process.versions.node.split('.')[0], 10);
  if (major < 20) {
    fail(
      `Node.js 20+ est requis (vous avez ${process.versions.node}).\n` +
        `Installez-le depuis https://nodejs.org puis relancez ce fichier.`
    );
  }
  log(c.g(`✔ Node.js ${process.versions.node}`));
}

// --- 2. Installer les dépendances si besoin ---------------------------------
function ensureDeps() {
  if (existsSync(join(ROOT, 'node_modules', '.package-lock.json')) ||
      existsSync(join(ROOT, 'node_modules', 'next'))) {
    log(c.g('✔ Dépendances déjà installées'));
    return;
  }
  log(c.y('… Première installation des dépendances (quelques minutes)…'));
  const r = spawnSync('npm', ['install', '--no-audit', '--no-fund'], {
    cwd: ROOT, stdio: 'inherit', shell: platform === 'win32',
  });
  if (r.status !== 0) fail('Échec de l\'installation des dépendances (npm install).');
  log(c.g('✔ Dépendances installées'));
}

// --- 3. Configurer la clé NVIDIA -------------------------------------------
function setEnvVar(content, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  return re.test(content) ? content.replace(re, line) : content + `\n${line}\n`;
}

async function ensureEnv() {
  if (!existsSync(ENV_FILE)) {
    copyFileSync(ENV_EXAMPLE, ENV_FILE);
    log(c.y('… Fichier .env.local créé'));
  }
  let content = readFileSync(ENV_FILE, 'utf8');
  const m = content.match(/^NVIDIA_API_KEY=(.*)$/m);
  const current = m ? m[1].trim() : '';
  const isPlaceholder = !current || /REMPLACEZ|VOTRE_CLE/i.test(current);

  if (isPlaceholder) {
    log('\n' + c.b('Clé API NVIDIA requise.'));
    log('  Obtenez-la gratuitement sur ' + c.b('https://build.nvidia.com'));
    const rl = createInterface({ input: stdin, output: stdout });
    let key = '';
    while (!key.startsWith('nvapi-')) {
      key = (await rl.question('  Collez votre clé (nvapi-…) puis Entrée : ')).trim();
      if (!key.startsWith('nvapi-')) log(c.r('  ⚠ Une clé NVIDIA commence par "nvapi-". Réessayez.'));
    }
    rl.close();
    content = setEnvVar(content, 'NVIDIA_API_KEY', key);
    writeFileSync(ENV_FILE, content);
    log(c.g('✔ Clé enregistrée dans .env.local'));
  } else {
    log(c.g('✔ Clé NVIDIA déjà configurée'));
  }
  return content;
}

// --- 4. Détecter Java (pour l'émulateur Firestore) --------------------------
function hasJava() {
  try {
    execSync('java -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// --- 5. Ouvrir le navigateur quand le serveur est prêt ----------------------
async function openBrowserWhenReady() {
  const start = Date.now();
  while (Date.now() - start < 120000) {
    try {
      const res = await fetch(DEV_URL, { method: 'HEAD' });
      if (res.ok || res.status < 500) break;
    } catch { /* pas encore prêt */ }
    await new Promise((r) => setTimeout(r, 1500));
  }
  const cmd = platform === 'win32' ? 'start' : platform === 'darwin' ? 'open' : 'xdg-open';
  try {
    spawn(cmd, [DEV_URL], { stdio: 'ignore', detached: true, shell: platform === 'win32' }).unref();
  } catch { /* l'utilisateur ouvrira manuellement */ }
  log('\n' + c.b(c.g(`➜ Application prête : ${DEV_URL}`)));
}

// --- Main -------------------------------------------------------------------
async function main() {
  log(c.b('\n=== AI-Think-Thank — Lanceur local (NVIDIA) ===\n'));
  checkNode();
  ensureDeps();
  let content = await ensureEnv();

  const useEmulator = hasJava();
  content = setEnvVar(content, 'NEXT_PUBLIC_USE_FIREBASE_EMULATOR', String(useEmulator));
  writeFileSync(ENV_FILE, content);

  const children = [];
  if (useEmulator) {
    log(c.g('✔ Java détecté → base de données locale (émulateur Firestore)'));
    log(c.y('… Démarrage de l\'émulateur Firestore…'));
    children.push(spawn('npx', ['-y', 'firebase-tools', 'emulators:start', '--only', 'firestore'],
      { cwd: ROOT, stdio: 'inherit', shell: platform === 'win32' }));
    await new Promise((r) => setTimeout(r, 6000));
  } else {
    log(c.y('ℹ Java non détecté → mode sans base locale (persistance via le cloud du projet d\'origine).'));
    log(c.y('  Pour une base 100% locale, installez Java (https://adoptium.net) puis relancez.'));
  }

  log(c.y('… Démarrage de l\'application…\n'));
  children.push(spawn('npm', ['run', 'dev'], { cwd: ROOT, stdio: 'inherit', shell: platform === 'win32' }));

  openBrowserWhenReady();

  const shutdown = () => { children.forEach((ch) => { try { ch.kill(); } catch {} }); process.exit(0); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((e) => fail(e?.message || String(e)));
