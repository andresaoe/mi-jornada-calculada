# Instrucciones para generar el APK de Control de Nómina

## ✅ Configuración Completa

Tu aplicación ya está configurada con:
- **Capacitor**: Para funcionar como app nativa
- **Almacenamiento local**: Los registros se guardan permanentemente en el celular usando Capacitor Preferences
- **Funciona offline**: No necesita internet, todo se guarda localmente

## 📱 Pasos para generar el APK

### 1. Transferir el proyecto a GitHub
1. Haz clic en el botón "Export to Github" en Lovable
2. Clona el repositorio en tu computadora:
   ```bash
   git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   cd TU_REPOSITORIO
   ```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Inicializar Capacitor
```bash
npx cap init
```
Cuando te pregunte, usa estos valores:
- **App name**: Control de Nómina
- **App ID**: app.lovable.4661867795914bb189c837eb949e046e

### 4. Agregar plataforma Android
```bash
npx cap add android
```

### 5. Actualizar dependencias nativas
```bash
npx cap update android
```

### 6. Compilar el proyecto web
```bash
npm run build
```

### 7. Sincronizar con Android
```bash
npx cap sync android
```

### 8. Abrir el proyecto en Android Studio
```bash
npx cap open android
```

### 9. Generar el APK en Android Studio
1. En Android Studio, ve a **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Espera a que termine la compilación
3. Haz clic en **locate** cuando aparezca la notificación
4. Encontrarás el APK en: `android/app/build/outputs/apk/debug/app-debug.apk`

### 10. Instalar en tu celular
1. Conecta tu celular por USB y activa la depuración USB en opciones de desarrollador
2. O copia el archivo APK a tu celular y ábrelo para instalarlo
3. Es posible que necesites permitir instalación de fuentes desconocidas

## 📋 Requisitos previos

- **Android Studio** instalado en tu computadora
- **Java Development Kit (JDK)** 11 o superior
- Al menos 8GB de RAM recomendados
- Espacio en disco: ~10GB para Android Studio y SDKs

## 🔧 Solución de problemas comunes

### Error: "Android SDK not found"
- Abre Android Studio → Tools → SDK Manager
- Asegúrate de tener instalado Android SDK Platform 33 o superior

### Error: "Gradle build failed"
- En Android Studio: File → Invalidate Caches / Restart

### El APK no se instala
- Verifica que tienes activada la instalación de apps desconocidas
- Configuración → Seguridad → Fuentes desconocidas

## 🎯 Características de la app

- ✅ Almacenamiento local permanente en el celular
- ✅ Funciona 100% offline
- ✅ Puedes agregar, editar y eliminar registros cuando quieras
- ✅ Los datos nunca se pierden, incluso si cierras la app
- ✅ No requiere conexión a internet

## 📞 ¿Necesitas ayuda?

Si tienes problemas generando el APK, puedes:
1. Leer la documentación completa de Capacitor: https://capacitorjs.com/docs/android
2. Consultar los tutoriales en video de Lovable sobre apps móviles
