require('dotenv').config({ quiet: true });
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb'); 
const cors = require('cors');
const appointmentRoutes = require('./src/routes/appointmentRoutes');

const app = express();
const allowedOrigins = [
    'http://localhost:5173', // Para desarrollo local
    'http://localhost:8080'  // Para el frontend en Docker
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir peticiones sin origen (como las de Postman/Insomnia)
        if (!origin) return callback(null, true);
        
        // Si el origen de la petición está en nuestra lista de confianza, permitirlo
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));


app.use(express.json());

const port = process.env.PORT || 5000; 
const uri = process.env.MONGO_URI;
const DB_NAME = 'dbAppMed'; // nombre de la base de datos
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let dbInstance; // instancia de la base de datos

async function conectarDB() {
  try {
    await client.connect();
    dbInstance = client.db(DB_NAME); // se almacena la instancia de la base de datos aquí
    console.log('✅ Conectado a MongoDB Atlas. Base de datos: dbAppMed');

    // Middleware para inyectar la instancia de la BD en req
    app.use((req, res, next) => {
        req.db = dbInstance; // BD accesible en todos los controladores
        next();
    });

    // Rutas de la API - USANDO EL NOMBRE DE RUTA CORRECTO
    app.use('/api/appointments', appointmentRoutes);

    // Endpoint raíz (para verificar que el servidor está vivo)
    app.get('/', (req, res) => {
        res.send('Hello World from Backend with MongoDB!');
    });

    // Manejo de rutas no encontradas (después de todas las rutas definidas)
    app.use((req, res, next) => {
        console.log(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
        res.status(404).send('Ruta no encontrada.');
    });

    // Manejo global de errores
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).send('Algo salió mal en el servidor!');
    });


    // iniciar el servidor solo después de conectar a MongoDB
    app.listen(port, () => {
      console.log(`Servidor backend escuchando en http://localhost:${port}`);
    });

  } catch (err) {
    console.error('❌ Error al conectar con MongoDB:', err.message);
    process.exit(1); // si la conexión a la BD falla
  }
}

// Conexión a Mongo y prender el servidor
conectarDB();