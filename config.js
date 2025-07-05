
const config = {
  url: 'HEDEF_URL', // yenilenicek url'yi yazınız.
  refreshInterval: 50, // yenileme süresi
  browserCount: 6, // Varsayılan tarayıcı sayısı (manuel ayar)
  timeout: 10000, // Normali 10000 ama eğer çok hata alıyorsanız 30000 yapınız. 
  headless: true, // tarayıcıları gizli yapmak için true görünür yapmak için false yapınız (performans açısından true olarak kullanınız.)
  ping_kontrol: false, // true yaparsanız pingi kontrol eder, false yaparsanız etmez. (öneri false olmasıdır.)
  pingHost: 'google.com' // Ping atılacak host (pingi ölçmek için kullanılıcak site adresi)
};

module.exports = config