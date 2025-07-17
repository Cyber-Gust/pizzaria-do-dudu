/** @type {import('next').NextConfig} */
module.exports = {
  // A mágica acontece aqui, dentro da configuração de 'images'
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // Este é o hostname que o Next.js precisa autorizar.
        // Ele foi pego diretamente da sua mensagem de erro.
        hostname: 'qjhfmghkxaddvgfyzadm.supabase.co',
        port: '',
        // Este é o caminho para o seu bucket de imagens públicas.
        // O '**' no final significa "qualquer arquivo dentro desta pasta".
        pathname: '/storage/v1/object/public/produtos/**',
      },
    ],
  },
}
