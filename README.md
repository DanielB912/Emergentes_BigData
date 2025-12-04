README — Sistema Big Data en Tiempo Real (GAMC)

Este proyecto implementa una arquitectura Big Data completa para el procesamiento en tiempo real de datos provenientes de sensores ambientales del GAMC (aire, sonido y soterrado).
Incluye ingestión mediante Kafka, procesamiento con Spark Streaming, almacenamiento híbrido con PostgreSQL y MongoDB, backend en Node.js, productores de datos simulados en Python, y visualización mediante un frontend en React.

1. Requisitos Previos

    Antes de ejecutar el proyecto en cualquier máquina NUEVA, se debe tener instalado:

        Docker Desktop

    Es obligatorio. Todo el backend, Kafka, Spark y las bases de datos funcionan dentro de contenedores.

    Descargar: https://www.docker.com/products/docker-desktop/

        Git

    Para clonar el repositorio.

        Node.js (solo para el frontend)

    El frontend no está dockerizado, se ejecuta localmente con npm.

2. Clonar el Repositorio

    git clone https://github.com/DanielB912/Emergentes_BigData.git
    cd Emergentes_BigData

3. Levantar toda la infraestructura (Backend, Kafka, Spark, BD)

    Asegúrate de que Docker Desktop esté abierto y corriendo antes de ejecutar los siguientes comandos.

    Ejecutar:

        docker compose up -d --build

    La primera vez puede tardar de 5 a 20 minutos.
    Después, arranca en menos de 10 segundos.

    Las siguientes ejecuciones serán rápidas ejecutando:

        docker compose up -d

4. Verificar que los Servicios Están Corriendo

    docker ps

5. Ejecutar el Frontend (React)

    El frontend NO está en Docker.
    Ejecutarlo así:

        cd FrontEnd_Equipo3
        npm install
        npm start

    Se abrirá en:

        http://localhost:3000

    Asegúrate de que socket.js tenga la IP correcta del backend (por defecto: http://localhost:4000).

6. Detener todos los servicios

    docker compose down

    Esto detiene los contenedores pero mantiene los datos porque usas volúmenes.

7. Notas Importantes

    Spark NO se ejecuta manualmente, ya está automatizado.

    --build solo es necesario la primera vez (o si haces cambios en Dockerfiles).

    El frontend debe correr por separado.

    Asegúrate de tener Docker Desktop abierto antes de correr cualquier comando.