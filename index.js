const puppeteer = require('puppeteer');
const colors = require("colors");
const os = require('os');
const fs = require('fs');
const ping = require('ping');

const config = require("./config")

let recommendedBrowserCount = Math.max(1, os.cpus().length - 1) || 0

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
];

let totalRefreshes = 0;
let successCount = 0;
let errorCount = 0;
const browserRefreshes = Array(config.browserCount).fill(0);
let dynamicInterval = config.refreshInterval;
let currentPing = 0;

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function logError(error) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync('errors.log', `${timestamp}: ${error}\n`);
}

async function checkPing() {
  try {// github.com/LWEAXO
    const res = await ping.promise.probe(config.pingHost);
    currentPing = res.time;
  } catch (error) {
    currentPing = -1; // Ping hatası
    logError(`Ping hatası: ${error}`);
  }
}

function adjustSpeed() {
  if (totalRefreshes % 100 === 0 && dynamicInterval > 10) {
    dynamicInterval = Math.max(10, dynamicInterval - 5);
    console.log(`Hız artırıldı! Yeni yenileme aralığı: ${dynamicInterval}ms`.yellow.bold);
  }
}

async function updateDisplay() {
  await checkPing();
  
  console.clear();
  
  const successRate = totalRefreshes > 0 
    ? ((successCount / totalRefreshes) * 100).toFixed(2) 
    : '0.00';
  
  console.log('╔══════════════════════════════════════════════════════════╗'.cyan.bold);// github.com/LWEAXO
  console.log('║'.cyan.bold + ' 🚀                URL YENİLEYİCİ '.white.bold + 'v2.0'.grey.bold + '                 🚀 ║'.cyan.bold);
  console.log('╠══════════════════════════════════════════════════════════╣'.cyan.bold);
  console.log(`║`.cyan.bold + ` 🔗  URL:`.white.bold + ` ${config.url.substring(0, 42)}...`.blue.bold + `   ║`.cyan.bold);
  console.log('╠──────────────────────────────────────────────────────────╣'.cyan.bold);
  console.log(`║`.cyan.bold + ` 🧠  Kullanılan Tarayıcı:`.white.bold + ` ${config.browserCount}`.yellow.bold + ` (Önerilen: ${recommendedBrowserCount})`.grey + `                 ║`.cyan.bold);
  console.log('╠──────────────────────────────────────────────────────────╣'.cyan.bold);
  console.log(`║`.cyan.bold + ` 🔁  Toplam Yenileme:`.white.bold + ` ${totalRefreshes.toString().padEnd(24)}`.green.bold + `            ║`.cyan.bold);
  console.log(`║`.cyan.bold + ` ✅  Başarılı:`.white.bold + ` ${successCount.toString().padEnd(28)}`.green.bold + `               ║`.cyan.bold);
  console.log(`║`.cyan.bold + ` ❌  Hatalı:`.white.bold + ` ${errorCount.toString().padEnd(30)}`.red.bold + `               ║`.cyan.bold);
  console.log(`║`.cyan.bold + ` 📊  Başarı Oranı:`.white.bold + ` ${successRate}%`.padEnd(28).cyan.bold + `            ║`.cyan.bold);
  console.log(`║`.cyan.bold + ` ⏱️   Yenileme Aralığı:`.white.bold + ` ${dynamicInterval}ms`.padEnd(24).magenta.bold + `            ║`.cyan.bold);
  config.ping_kontrol === true ? console.log(`║`.cyan.bold + ` 🏓  Ping:`.white.bold + ` ${currentPing === -1 ? 'HATA' : currentPing + 'ms'}`.padEnd(30).blue.bold + `                  ║`.cyan.bold) : null
  console.log('╠──────────────────────────────────────────────────────────╣'.cyan.bold);
  
  for (let i = 0; i < config.browserCount; i++) {
    console.log(`║`.cyan.bold + ` 🌎  Tarayıcı ${(i+1).toString().padEnd(2)}:`.white.bold + ` ${browserRefreshes[i].toString().padEnd(24)}`.magenta.bold + `                ║`.cyan.bold);
  }
  
  console.log('╠──────────────────────────────────────────────────────────╣'.cyan.bold);
  console.log('║ '.cyan.bold + '⛔  Durdurmak için: '.white.bold + 'CTRL + C'.red.bold + '                             ║'.cyan.bold);
  console.log('╚══════════════════════════════════════════════════════════╝'.cyan.bold);
}

async function createBrowserInstance(index) {
  const browser = await puppeteer.launch({ 
    headless: config.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  });
  
  const page = await browser.newPage();
  await page.setUserAgent(getRandomUserAgent());
  
  const refreshLoop = async () => {
    try {
      await page.goto(config.url, { 
        waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'],
        timeout: config.timeout
      });
      
      browserRefreshes[index]++;
      totalRefreshes++;
      successCount++;
      // github.com/LWEAXO
      adjustSpeed();
      await updateDisplay();
      setTimeout(refreshLoop, dynamicInterval);
    } catch (error) {
      errorCount++;
      logError(error);
      await updateDisplay();
      setTimeout(refreshLoop, dynamicInterval);
    }
  };
  
  refreshLoop();
  return browser;
}

async function main() {
  // Ping modülünü kontrol et
  try {
    await ping.promise.probe(config.pingHost);
  } catch (error) {
    console.log('╔═══════════════════════════════════════════════════╗'.red.bold);
    console.log('║'.red.bold + ' ⚠️  Ping modülü çalışmıyor, ping bilgisi gösterilemeyecek'.white.bold + ' ║'.red.bold);
    console.log('╚═══════════════════════════════════════════════════╝'.red.bold);
    currentPing = -1;
  }
// github.com/LWEAXO
  console.log('╔═══════════════════════════════════════════════════╗'.cyan.bold);
  console.log('║'.cyan.bold + ' 🚀  Tarayıcılar başlatılıyor...'.white.bold + '                   ║'.cyan.bold);
  console.log('║'.cyan.bold + ` 💻  ${config.browserCount} tarayıcı örneği oluşturuluyor...`.white.bold + `            ║`.cyan.bold);
  console.log('║'.cyan.bold + ` 💡  Sistem önerisi: ${recommendedBrowserCount} tarayıcı`.grey.bold + `                    ║`.cyan.bold);
  console.log('╚═══════════════════════════════════════════════════╝'.cyan.bold);
  
  const browsers = await Promise.all(
    Array.from({ length: config.browserCount }, (_, i) => createBrowserInstance(i))
  );
  // github.com/LWEAXO
  process.on('SIGINT', async () => {
    console.log('\n╔═══════════════════════════════════════════════════╗'.cyan.bold);
    console.log('║'.cyan.bold + ' 🛑  Tarayıcılar kapatılıyor...'.white.bold + '                 ║'.cyan.bold);
    console.log('╚═══════════════════════════════════════════════════╝'.cyan.bold);
    
    await Promise.all(browsers.map(b => b.close()));
    process.exit();
  });
}

main().catch(err => {
  console.error('Hata oluştu:'.red.bold, err);
  logError(err);// github.com/LWEAXO
  process.exit(1);
});