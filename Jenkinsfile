pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 45, unit: 'MINUTES')
        // Le stage 'Checkout' ci-dessous fait déjà le checkout : on évite de le faire 2 fois
        skipDefaultCheckout(true)
    }

    triggers {
        // Build automatique à chaque push GitHub (webhook : <jenkins>/github-webhook/)
        githubPush()
        // Filet de sécurité : si le webhook n'arrive pas, Git est vérifié toutes les 2 minutes
        pollSCM('H/2 * * * *')
    }

    environment {
        NETWORK_NAME             = 'app-network'

        // Indispensable pour les caches du Dockerfile (npm + webpack)
        DOCKER_BUILDKIT          = '1'

        FRONTEND_CONTAINER_NAME  = 'web_map_frontend'
        FRONTEND_IMAGE           = 'web-map-frontend'
        // Port d'écoute sur l'hôte (nginx global -> 127.0.0.1:3032)
        FRONTEND_HOST_PORT       = '3032'

        // L'API est appelée en relatif ; nginx du conteneur proxy /api -> nestjs_backend:4000
        REACT_APP_API_URL        = '/api'
        PUBLIC_URL_CHECK         = 'https://web-map.duckdns.org'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Reseau') {
            steps {
                sh '''
                    docker network inspect ${NETWORK_NAME} >/dev/null 2>&1 \
                        || docker network create ${NETWORK_NAME}
                '''
            }
        }

        stage('Build Image Frontend') {
            steps {
                sh '''
                    echo "Construction de l'image Frontend..."
                    docker build \
                        --build-arg REACT_APP_API_URL=${REACT_APP_API_URL} \
                        -t ${FRONTEND_IMAGE}:${BUILD_NUMBER} \
                        -t ${FRONTEND_IMAGE}:latest .
                '''
            }
        }

        stage('Stop Old Container') {
            steps {
                sh '''
                    if [ "$(docker ps -aq -f name=^/${FRONTEND_CONTAINER_NAME}$)" ]; then
                        echo "Arrêt de l'ancien conteneur ${FRONTEND_CONTAINER_NAME}..."
                        docker stop ${FRONTEND_CONTAINER_NAME} || true
                        docker rm ${FRONTEND_CONTAINER_NAME} || true
                    fi
                '''
            }
        }

        stage('Deploy Frontend') {
            steps {
                sh '''
                    docker run -d \
                        --name ${FRONTEND_CONTAINER_NAME} \
                        --network ${NETWORK_NAME} \
                        --restart always \
                        -p 127.0.0.1:${FRONTEND_HOST_PORT}:80 \
                        ${FRONTEND_IMAGE}:latest >/dev/null
                    echo "Frontend déployé."
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    echo "--- Attente du frontend ---"
                    for i in $(seq 1 15); do
                        if curl -fsS http://127.0.0.1:${FRONTEND_HOST_PORT}/healthz >/dev/null 2>&1; then
                            echo "Frontend OK (tentative $i)"
                            break
                        fi
                        if [ "$i" = "15" ]; then
                            echo "Le frontend ne répond pas"
                            exit 1
                        fi
                        sleep 2
                    done

                    echo "--- Statut des conteneurs ---"
                    docker ps --filter "network=${NETWORK_NAME}"

                    echo "--- Logs Frontend ---"
                    docker logs --tail=20 ${FRONTEND_CONTAINER_NAME}
                '''
            }
        }

        stage('Nettoyage images') {
            steps {
                sh '''
                    # Supprime uniquement les anciennes images taguées (garde latest + 3 derniers builds)
                    docker images ${FRONTEND_IMAGE} --format '{{.Tag}}' \
                        | grep -E '^[0-9]+$' | sort -rn | tail -n +4 \
                        | xargs -r -I{} docker rmi ${FRONTEND_IMAGE}:{} || true

                    # NE PAS faire 'docker image prune' ni 'docker builder prune' complet :
                    # on garde le cache de build (npm + webpack). On ne purge que le cache de plus de 7 jours.
                    docker builder prune -f --filter "until=168h" || true
                '''
            }
        }
    }

    post {
        success {
            echo "Pipeline exécuté avec succès ! -> ${PUBLIC_URL_CHECK}"
        }
        failure {
            sh '''
                echo "--- Logs ${FRONTEND_CONTAINER_NAME} ---"
                docker logs --tail=100 ${FRONTEND_CONTAINER_NAME} 2>&1 || echo "Conteneur introuvable"
            '''
        }
        always {
            cleanWs()
        }
    }
}