// Importamos las librerías necesarias
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Creamos la aplicación Express
const app = express();
const port = 4000;

// Middleware para permitir CORS y parsear el cuerpo de las solicitudes JSON
app.use(cors());
app.use(bodyParser.json());

// Definimos la ruta de la API para la finalización del chat
app.post('/api/completion', (req, res) => {
    // Extraemos los datos enviados desde la aplicación de React
    const { input, params } = req.body;

    // Imprimimos los parámetros recibidos en la consola para depuración
    console.log('Mensaje recibido:', input);
    console.log('Parámetros de configuración:', params);

    // Simulamos una respuesta del asistente.
    // El mensaje de respuesta incluye los parámetros recibidos para confirmar que la conexión funciona.
    const responseMessage = "Esta es una respuesta simulada del servidor. Los parámetros recibidos fueron: " + JSON.stringify(params, null, 2);

    // Enviamos una respuesta JSON al cliente
    res.json({ message: responseMessage });
});

// Iniciamos el servidor
app.listen(port, () => {
    console.log(`Servidor de backend de chat corriendo en http://localhost:${port}`);
    console.log('Ahora puedes ejecutar tu aplicación de React y funcionará correctamente.');
});
