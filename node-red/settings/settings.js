module.exports = {
    // Nazwa projektu
    flowFile: 'flows/flows.json',
    
    // Konfiguracja uwierzytelniania
    adminAuth: {
        type: "credentials",
        users: [{
            username: "admin",
            password: "$2b$08$4CUtC/Vl0VH1Ucdp0x9sK.LjuvBaBp9vXjU5Cttv0nfo6t1vgr7/K", // Zastąp wygenerowanym hashem
            permissions: "*"
        }]
    },
    
    // Ścieżka do przechowywania ustawień
    userDir: '/home/kichnu/Home_App/node-red',
    
    // Konfiguracja HTTPS
//    https: {
  //      key: require("fs").readFileSync('/home/kichnu/Home_App/ssl/private/privkey.pem'),
    //    cert: require("fs").readFileSync('/home/kichnu/Home_App/ssl/certs/fullchain.pem')
   // },
    
    // Bezpieczeństwo
    requireHttps: false,
    editorTheme: {
        projects: {
            enabled: true
        }
    },
    
    // Logowanie
    logging: {
        console: {
            level: "info",
            metrics: false,
            audit: false
        },
        file: {
            level: "info",
            metrics: false,
            audit: false,
            filename: '/home/kichnu/Home_App/node-red/logs/node-red.log'
        }
    }
};
