import basicSsl from '@vitejs/plugin-basic-ssl'

export default {
  plugins: [
    basicSsl()
  ],
  server: {
    host: true // Expone la IP local (ej. 192.168.1.X)
  }
}