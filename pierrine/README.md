# Périnea

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the backend (accessible depuis le téléphone / simulateur)

   ```bash
   cd ../backend
   source venv/bin/activate
   python manage.py runserver 0.0.0.0:8000
   ```

3. Start the app

   ```bash
   npm start
   ```

   Au démarrage, l’IP locale de ton Mac est détectée automatiquement et injectée
   dans `EXPO_PUBLIC_API_BASE_URL` (ex. `http://192.168.1.12:8000`).

   Afficher l’URL sans lancer Expo :

   ```bash
   npm run env:api
   ```

   Surcharger manuellement (copier `.env.example` vers `.env` ou en ligne de commande) :

   ```bash
   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.12:8000 npm start
   ```

   Variables disponibles :

   | Variable | Rôle |
   | --- | --- |
   | `EXPO_PUBLIC_API_BASE_URL` | URL complète (prioritaire) |
   | `EXPO_PUBLIC_API_HOST` | IP ou hostname seul |
   | `EXPO_PUBLIC_API_PORT` | Port Django (défaut `8000`) |

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
