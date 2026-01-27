# Configuración de Emails en Producción

## ⚠️ Problema Común

Si los emails no se envían en producción pero funcionan en desarrollo local, es porque **las variables de entorno no están configuradas en el servidor**.

## 📋 Solución: Configurar Variables de Entorno en el Servidor

### Paso 1: Verificar que las variables estén en tu `.env` local

Tu archivo `.env` debe tener:

```env
GMAIL_USER=iscovr3@gmail.com
GMAIL_APP_PASSWORD=xoncstmhpnprekar
```

### Paso 2: Configurar en el Servidor de Producción

Dependiendo del tipo de servidor que uses:

#### Opción A: Servidor Linux/Ubuntu (SSH)

1. Conéctate al servidor por SSH
2. Navega al directorio del proyecto
3. Edita el archivo `.env`:
   ```bash
   nano .env
   ```
4. Añade las variables:
   ```env
   GMAIL_USER=iscovr3@gmail.com
   GMAIL_APP_PASSWORD=xoncstmhpnprekar
   ```
5. Guarda (Ctrl+O) y cierra (Ctrl+X)
6. Reinicia la aplicación:
   ```bash
   pm2 restart all
   # o
   npm run build && npm run preview
   ```

#### Opción B: Vercel/Netlify

1. Ve al panel de control del proyecto
2. Busca "Environment Variables" o "Variables de Entorno"
3. Añade:
   - `GMAIL_USER` = `iscovr3@gmail.com`
   - `GMAIL_APP_PASSWORD` = `xoncstmhpnprekar`
4. Haz un nuevo deploy

#### Opción C: Panel de Control (cPanel/Plesk)

1. Accede al panel de control
2. Busca la sección de variables de entorno
3. Añade las variables
4. Guarda y reinicia el servicio Node.js

### Paso 3: Verificar en Producción

Después de configurar las variables:

1. Regístrate con un nuevo usuario en la web en producción
2. **Revisa los logs del servidor** - ahora verás mensajes detallados:
   ```
   🔧 [EMAIL] Inicializando transporter de email...
   ✓ [EMAIL] Variables de entorno verificadas
   ✓ [EMAIL] Nodemailer importado correctamente
   ✅ [EMAIL] Transporter creado correctamente
   📧 [EMAIL] Intentando enviar email de bienvenida
   ✅ [EMAIL] Email de bienvenida enviado exitosamente
   ```

3. Si ves errores, identifícalos:
   - `❌ Variables de entorno no configuradas` → No has configurado las variables en el servidor
   - `❌ Error al inicializar nodemailer` → nodemailer no está instalado (ejecuta `npm install` en el servidor)
   - `❌ Invalid login` → La contraseña de Gmail es incorrecta

## 🔍 Cómo Ver los Logs en el Servidor

### PM2 (más común)
```bash
pm2 logs
# o para un proceso específico
pm2 logs fashionstore
```

### Logs del sistema
```bash
# Ubuntu/Debian
sudo journalctl -u fashionstore -f

# Logs de Node directos
tail -f /var/log/fashionstore.log
```

### Docker
```bash
docker logs -f nombre_contenedor
```

## ✅ Checklist Final

- [ ] Variables de entorno configuradas en el servidor
- [ ] nodemailer instalado (`npm install` ejecutado)
- [ ] Servidor reiniciado después de los cambios
- [ ] Logs del servidor accesibles
- [ ] Prueba de registro realizada
- [ ] Logs revisados para ver mensajes de email

## 🆘 Solución de Problemas

### Problema: "Variables de entorno no configuradas"
**Solución:** Las variables no están en el servidor. Sigue el Paso 2 de arriba.

### Problema: "Error al importar módulo de email"
**Solución:** Ejecuta `npm install` en el servidor para instalar todas las dependencias.

### Problema: "Invalid login"
**Solución:** 
1. Ve a https://myaccount.google.com/security
2. Activa "Verificación en 2 pasos"
3. Genera una nueva "Contraseña de aplicación" para Gmail
4. Actualiza `GMAIL_APP_PASSWORD` con la nueva contraseña

### Problema: Email se envía pero no llega
**Solución:**
- Revisa la carpeta de spam
- Verifica que el email del destinatario sea correcto
- Espera 5-10 minutos (a veces hay retraso)

## 📞 Ayuda Adicional

Si sigues teniendo problemas:

1. **Comparte los logs del servidor** (los mensajes que empiezan con [EMAIL])
2. **Verifica que `npm list nodemailer` muestre el paquete instalado**
3. **Ejecuta el script de prueba en el servidor**:
   ```bash
   node scripts/test-email.js
   ```

## 🔐 Seguridad

**IMPORTANTE:** Nunca subas el archivo `.env` a Git. Asegúrate de que está en `.gitignore`.

Las variables de entorno deben configurarse directamente en el servidor, no en el código.
